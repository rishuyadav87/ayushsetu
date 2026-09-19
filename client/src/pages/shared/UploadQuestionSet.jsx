import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload, FileText, Plus, Trash2, Download, CheckCircle, AlertCircle, Loader2, ShieldCheck, ArrowLeft,
  Sparkles, PenLine, Wand2, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { parseQuestionFile, downloadSampleCSV } from '../../utils/questionFileParser';

const NSQF_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
const emptyQuestion = () => ({ question: '', options: ['', '', '', ''], answer: -1, explanation: '' });

const UploadQuestionSet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileRef = useRef(null);
  const isStudent = user?.role === 'student';

  const [mode, setMode] = useState(params.get('mode') === 'ai' ? 'ai' : 'manual'); // manual | ai
  const [taxonomy, setTaxonomy] = useState([]);
  const [topics, setTopics] = useState([]);
  const [aiProvider, setAiProvider] = useState('question-bank');
  const [form, setForm] = useState({
    title: '', description: '', qpCode: '', nsqfLevel: Number(params.get('level')) || 4, category: '',
    duration: 15, totalMarks: '', passingPercent: 60, proctored: true,
  });
  const [ai, setAi] = useState({ topic: '', customTopic: '', count: 10, difficulty: 'medium', language: 'en' });
  const [generating, setGenerating] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [source, setSource] = useState('MANUAL');
  const [questions, setQuestions] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    assessmentAPI.getTaxonomy().then(res => {
      setTaxonomy(res.data?.taxonomy || []);
      setTopics(res.data?.topics || []);
      setAiProvider(res.data?.aiProvider || 'question-bank');
    }).catch(() => {});
  }, []);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const onQpChange = (qpCode) => {
    const tax = taxonomy.find(t => t.qpCode === qpCode);
    setForm(f => ({ ...f, qpCode, nsqfLevel: tax ? tax.nsqfLevel : f.nsqfLevel, category: tax && !f.category ? tax.roleName : f.category }));
  };

  // ---------- AI generation ----------
  const handleGenerate = async () => {
    const topic = ai.topic === '__custom' ? ai.customTopic.trim() : ai.topic;
    try {
      setGenerating(true);
      setAiNote('');
      const { data } = await assessmentAPI.generate({
        nsqfLevel: Number(form.nsqfLevel), qpCode: form.qpCode || undefined, topic,
        count: Number(ai.count), difficulty: ai.difficulty, language: ai.language,
      });
      if (isStudent) {
        toast.success(`AI practice test ready (${data.questionCount} questions)`);
        navigate(`/student/assessments/take/${data.assessmentId}`);
        return;
      }
      setQuestions(data.questions.map(q => ({ question: q.question, options: q.options, answer: q.correctIndex, explanation: q.explanation || '' })));
      setSource('AI');
      setAiNote(`${data.source === 'question-bank' ? 'Question bank' : `AI (${data.source})`}: ${data.note || 'Review every question before publishing.'}`);
      setForm(f => ({
        ...f,
        title: f.title || `${topic || taxonomy.find(t => t.qpCode === f.qpCode)?.roleName || 'AYUSH Skills'} — AI Level Test (Level ${data.nsqfLevel})`,
        category: f.category || topic || taxonomy.find(t => t.qpCode === f.qpCode)?.roleName || '',
        duration: Math.max(5, data.questions.length),
        nsqfLevel: data.nsqfLevel,
      }));
      toast.success(`Generated ${data.questions.length} questions — review and publish`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate questions');
    } finally {
      setGenerating(false);
    }
  };

  // ---------- file upload ----------
  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('File is too large (max 2 MB)');
    setFileName(file.name);
    const { questions: parsed, errors, meta } = await parseQuestionFile(file);
    setFileErrors(errors);
    if (parsed.length) {
      setQuestions(parsed.map(q => ({ ...q, options: q.options.length ? q.options : ['', ''] })));
      setSource('UPLOAD');
      toast.success(`Loaded ${parsed.length} question(s) from ${file.name}`);
    }
    if (meta) {
      setForm(f => ({ ...f, title: f.title || meta.title || '', description: f.description || meta.description || '', duration: meta.duration || f.duration, nsqfLevel: meta.nsqfLevel || f.nsqfLevel }));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  // ---------- editor ----------
  const updateQuestion = (idx, patch) => setQuestions(qs => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  const updateOption = (qIdx, oIdx, value) => setQuestions(qs => qs.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q)));
  const addOption = (qIdx) => setQuestions(qs => qs.map((q, i) => (i === qIdx && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q)));
  const removeOption = (qIdx, oIdx) => setQuestions(qs => qs.map((q, i) => {
    if (i !== qIdx || q.options.length <= 2) return q;
    return { ...q, options: q.options.filter((_, j) => j !== oIdx), answer: q.answer === oIdx ? -1 : q.answer > oIdx ? q.answer - 1 : q.answer };
  }));

  const questionProblems = (q) => {
    const problems = [];
    if (!q.question.trim()) problems.push('question text');
    if (q.options.filter(o => o.trim()).length < 2) problems.push('at least 2 options');
    if (q.answer < 0 || !q.options[q.answer]?.trim()) problems.push('correct answer');
    return problems;
  };
  const invalidCount = questions.filter(q => questionProblems(q).length).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter a title');
    if (!questions.length) return toast.error('Add, upload or generate at least one question');
    if (invalidCount) return toast.error(`${invalidCount} question(s) are incomplete`);

    const payloadQuestions = questions.map(q => {
      const kept = q.options.map((o, i) => ({ o: o.trim(), i })).filter(x => x.o);
      return { question: q.question.trim(), options: kept.map(x => x.o), correctIndex: kept.findIndex(x => x.i === q.answer), explanation: q.explanation?.trim() || undefined };
    });

    try {
      setSaving(true);
      await assessmentAPI.create({
        ...form,
        qpCode: form.qpCode || null,
        nsqfLevel: Number(form.nsqfLevel),
        duration: Number(form.duration),
        totalMarks: form.totalMarks ? Number(form.totalMarks) : payloadQuestions.length,
        passingPercent: Number(form.passingPercent),
        questions: payloadQuestions,
        source,
      });
      toast.success(isStudent ? 'Practice set created!' : 'Question set published!');
      navigate(isStudent ? '/student/assessments' : `/${user.role}/question-sets`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save the question set');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm';
  const modeCard = (active) => `text-left p-5 rounded-xl border-2 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-primary/40'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-dark">Create Question Set</h1>
          <p className="text-sm text-gray-500">
            {isStudent ? 'Create a private practice test — write your own questions or let AI generate a level-wise test.'
              : 'Publish an NSQF level-wise assessment — upload/write questions yourself or generate them with AI and review.'}
          </p>
        </div>
      </div>

      {/* Two options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button type="button" onClick={() => setMode('manual')} className={modeCard(mode === 'manual')}>
          <div className="flex items-center gap-2 font-bold text-dark"><PenLine size={20} className="text-primary" /> Upload / create myself</div>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV/JSON question file or type questions manually.</p>
        </button>
        <button type="button" onClick={() => setMode('ai')} className={modeCard(mode === 'ai')}>
          <div className="flex items-center gap-2 font-bold text-dark"><Sparkles size={20} className="text-purple-600" /> AI-generated level-wise test</div>
          <p className="text-sm text-gray-500 mt-1">Pick an NSQF level and topic — AI drafts the questions{isStudent ? ' and your practice test starts right away' : ', you review and publish'}.</p>
        </button>
      </div>

      {/* Level + QP (shared by both modes) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Pack (optional)</label>
          <select className={input} value={form.qpCode} onChange={e => onQpChange(e.target.value)}>
            <option value="">— Not linked —</option>
            {taxonomy.map(t => <option key={t.qpCode} value={t.qpCode}>{t.qpCode} · {t.roleName} (L{t.nsqfLevel})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NSQF Level *</label>
          <select className={input} value={form.nsqfLevel} onChange={e => setField('nsqfLevel', Number(e.target.value))} disabled={Boolean(form.qpCode)}>
            {NSQF_LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
          </select>
        </div>
      </div>

      {mode === 'ai' && (
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-dark flex items-center gap-2"><Wand2 size={18} className="text-purple-600" /> Generate with AI</h2>
            <span className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded-full">
              Engine: {aiProvider === 'question-bank' ? 'Reviewed AYUSH question bank (offline)' : aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI-compatible LLM'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic / skill area</label>
              <select className={input} value={ai.topic} onChange={e => setAi(a => ({ ...a, topic: e.target.value }))}>
                <option value="">{form.qpCode ? 'Use the qualification pack' : 'Mixed topics for this level'}</option>
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__custom">Custom topic…</option>
              </select>
              {ai.topic === '__custom' && <input className={`${input} mt-2`} placeholder="e.g. Unani pharmacology basics" value={ai.customTopic} onChange={e => setAi(a => ({ ...a, customTopic: e.target.value }))} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
              <select className={input} value={ai.count} onChange={e => setAi(a => ({ ...a, count: Number(e.target.value) }))}>
                {[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select className={input} value={ai.difficulty} onChange={e => setAi(a => ({ ...a, difficulty: e.target.value }))}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select className={input} value={ai.language} onChange={e => setAi(a => ({ ...a, language: e.target.value }))}>
                <option value="en">English</option><option value="hi">Hindi</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={handleGenerate} disabled={generating} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isStudent ? 'Generate & start practice test' : 'Generate questions'}
          </button>
          {aiNote && <div className="text-xs text-purple-900 bg-white border border-purple-200 rounded-lg p-3 flex gap-2"><Info size={14} className="flex-shrink-0 mt-0.5" /> {aiNote}</div>}
          <p className="text-xs text-gray-500">AI can make mistakes — every generated question is shown below for review and editing before it is published.</p>
        </div>
      )}

      {(mode === 'manual' || questions.length > 0) && !(isStudent && mode === 'ai') && (
        <>
          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input className={input} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Yoga Instructor Fundamentals (Level 4)" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className={input} rows={2} value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill category</label>
              <input className={input} value={form.category} onChange={e => setField('category', e.target.value)} placeholder="e.g. Panchakarma Therapy" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minutes *</label>
                <input type="number" min={1} max={300} className={input} value={form.duration} onChange={e => setField('duration', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                <input type="number" min={1} className={input} value={form.totalMarks} onChange={e => setField('totalMarks', e.target.value)} placeholder={String(questions.length || '')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pass %</label>
                <input type="number" min={1} max={100} className={input} value={form.passingPercent} onChange={e => setField('passingPercent', e.target.value)} />
              </div>
            </div>
            <label className="md:col-span-2 flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={form.proctored} onChange={e => setField('proctored', e.target.checked)} className="w-4 h-4" />
              <ShieldCheck size={18} className="text-blue-700" />
              <span className="text-sm text-blue-900">Enable AI proctoring (camera, microphone, entire-screen share, full-screen lock, anti-remote-access checks)</span>
            </label>
          </div>

          {mode === 'manual' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-dark">Upload a question file</h2>
                  <p className="text-xs text-gray-500">CSV columns: question, option1…option6, correct (A–F, 1–6 or the option text), explanation (optional)</p>
                </div>
                <button type="button" onClick={downloadSampleCSV} className="flex items-center gap-2 text-sm text-primary font-medium"><Download size={16} /> Download CSV template</button>
              </div>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-primary rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <div className="font-medium text-gray-700">Drop a .csv or .json file here, or click to browse</div>
                {fileName && <div className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1"><FileText size={14} /> {fileName}</div>}
                <input ref={fileRef} type="file" accept=".csv,.json,.txt" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
              </div>
              {fileErrors.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  <div className="font-semibold flex items-center gap-2 mb-1"><AlertCircle size={16} /> {fileErrors.length} issue(s) found — fix them below</div>
                  <ul className="list-disc pl-5 max-h-32 overflow-y-auto">{fileErrors.slice(0, 20).map((er, i) => <li key={i}>{er}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Editable question list */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const problems = questionProblems(q);
              return (
                <div key={idx} className={`bg-white rounded-xl border shadow-sm p-5 ${problems.length ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                      Question {idx + 1}
                      {source === 'AI' && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">AI draft</span>}
                      {problems.length ? <span className="text-xs text-red-600 font-normal">Missing: {problems.join(', ')}</span> : <CheckCircle size={14} className="text-blue-600" />}
                    </span>
                    <button type="button" onClick={() => setQuestions(qs => qs.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                  <textarea className={input} rows={2} placeholder="Question text" value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })} />
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${idx}`} checked={q.answer === oIdx} onChange={() => updateQuestion(idx, { answer: oIdx })} className="w-4 h-4 text-primary" title="Mark as correct answer" />
                        <span className="text-xs font-bold text-gray-400 w-4">{String.fromCharCode(65 + oIdx)}</span>
                        <input className={input} placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} />
                        {q.options.length > 2 && <button type="button" onClick={() => removeOption(idx, oIdx)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <p className="text-xs text-gray-500 mt-2">Explanation: {q.explanation}</p>}
                  <div className="flex justify-between items-center mt-3">
                    {q.options.length < 6 ? <button type="button" onClick={() => addOption(idx)} className="text-sm text-primary font-medium flex items-center gap-1"><Plus size={14} /> Add option</button> : <span />}
                    <span className="text-xs text-gray-400">Select the radio button next to the correct answer</span>
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={() => setQuestions(qs => [...qs, emptyQuestion()])} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary hover:text-primary font-medium flex items-center justify-center gap-2">
              <Plus size={18} /> Add question manually
            </button>
          </div>

          <div className="sticky bottom-0 bg-light/95 backdrop-blur py-4 flex items-center justify-between border-t border-gray-200">
            <span className="text-sm text-gray-600">{questions.length} question(s){invalidCount ? ` · ${invalidCount} incomplete` : ''}{source === 'AI' ? ' · AI draft' : ''}</span>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {isStudent ? 'Create Practice Set' : 'Publish Question Set'}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default UploadQuestionSet;

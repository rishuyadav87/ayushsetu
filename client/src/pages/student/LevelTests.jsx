import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, PlayCircle, Sparkles, Loader2, Clock, Award, ShieldCheck, Flag, AlertCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { assessmentAPI } from '../../services/api';

// NSQF roadmap: every level with its descriptor, status, tests and an AI practice generator
const LevelTests = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState(null);
  const [topics, setTopics] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gen, setGen] = useState({ level: null, topic: '', busy: false });

  useEffect(() => {
    const load = async () => {
      try {
        const [levelRes, listRes] = await Promise.all([assessmentAPI.getLevels(), assessmentAPI.getAll()]);
        setLevels(levelRes.data.levels || []);
        setProgress(levelRes.data.progress);
        setTopics(levelRes.data.aiTopics || []);
        setTests(listRes.data || []);
      } catch (_) {
        setError('Could not load the level roadmap.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const generatePractice = async (level) => {
    try {
      setGen(g => ({ ...g, level, busy: true }));
      const { data } = await assessmentAPI.generate({ nsqfLevel: level, topic: gen.level === level ? gen.topic : '', count: 10, difficulty: 'medium' });
      toast.success('AI practice test ready');
      navigate(`/student/assessments/take/${data.assessmentId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate a practice test');
      setGen(g => ({ ...g, busy: false }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={36} /></div>;

  const current = progress?.unlockedUpTo;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dark">Level-wise Tests</h1>
        <p className="text-sm text-gray-500">Your NSQF roadmap (Levels 1–8, NCVET 2023). Pass a test at your level to unlock the next one.</p>
      </div>

      {error && <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

      {progress && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="font-semibold text-dark">Progress</span>
            <span className="text-gray-500">Passed {progress.passedLevels.length ? `Level ${progress.passedLevels.join(', ')}` : 'none yet'} · Current Level {current}</span>
          </div>
          <div className="flex items-center">
            {levels.map((l, i) => (
              <React.Fragment key={l.level}>
                <div title={l.title} className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${l.passed ? 'bg-primary text-white' : l.level === current ? 'bg-accent text-white ring-4 ring-accent/30' : l.unlocked ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                  {l.passed ? <CheckCircle size={16} /> : l.unlocked ? l.level : <Lock size={13} />}
                </div>
                {i < levels.length - 1 && <div className={`flex-1 h-1 ${l.passed ? 'bg-primary' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
        {levels.map(l => {
          const levelTests = tests.filter(t => t.nsqfLevel === l.level && !t.isPractice);
          const practice = tests.filter(t => t.nsqfLevel === l.level && t.isPractice);
          const isCurrent = l.level === current;
          return (
            <section key={l.level} className="relative">
              <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border-2 border-white ${l.passed ? 'bg-primary' : isCurrent ? 'bg-accent' : l.unlocked ? 'bg-primary/40' : 'bg-gray-300'}`} />
              <div className={`bg-white rounded-xl border shadow-sm p-5 ${isCurrent ? 'border-accent' : 'border-gray-100'} ${!l.unlocked ? 'opacity-70' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-dark">{l.title}</h2>
                      {l.passed && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Passed</span>}
                      {isCurrent && !l.passed && <span className="text-xs bg-accent/15 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Flag size={12} /> Your level</span>}
                      {!l.unlocked && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={12} /> Locked</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{l.descriptor}</p>
                  </div>
                  {l.unlocked && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select value={gen.level === l.level ? gen.topic : ''} onChange={e => setGen({ level: l.level, topic: e.target.value, busy: false })} className="text-xs border border-gray-300 rounded-lg px-2 py-2 max-w-[160px]">
                        <option value="">Mixed topics</option>
                        {topics.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => generatePractice(l.level)} disabled={gen.busy} className="text-xs font-semibold px-3 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-1 disabled:opacity-50 whitespace-nowrap">
                        {gen.busy && gen.level === l.level ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI practice test
                      </button>
                    </div>
                  )}
                </div>

                {levelTests.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {levelTests.map(t => {
                      const passed = t.bestPercentage !== null && t.bestPercentage >= t.passingPercent;
                      return (
                        <div key={t.id} className="border border-gray-100 rounded-lg p-4 flex flex-col">
                          <div className="text-xs text-secondary font-semibold uppercase">{t.category}</div>
                          <div className="font-semibold text-dark mt-1">{t.title}</div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><Clock size={12} /> {t.duration} min</span>
                            <span className="flex items-center gap-1"><Award size={12} /> {t.questionCount} Qs</span>
                            {t.proctored && <span className="flex items-center gap-1 text-blue-600"><ShieldCheck size={12} /> Proctored</span>}
                            {t.source === 'AI' && <span className="flex items-center gap-1 text-purple-600"><Sparkles size={12} /> AI</span>}
                          </div>
                          {t.attempts > 0 && <div className={`text-xs mt-2 ${passed ? 'text-blue-700' : 'text-orange-700'}`}>Best {t.bestPercentage}% · {t.attempts} attempt(s)</div>}
                          <button
                            disabled={t.locked}
                            onClick={() => navigate(`/student/assessments/take/${t.id}`)}
                            className="mt-3 self-start text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-white disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {t.locked ? <><Lock size={14} /> Locked</> : t.attempts ? <><RotateCcw size={14} /> Retake</> : <><PlayCircle size={14} /> Start</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-3">No official tests published for this level yet{l.unlocked ? ' — try an AI practice test.' : '.'}</p>
                )}

                {practice.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    Your practice tests: {practice.map(p => (
                      <button key={p.id} onClick={() => navigate(`/student/assessments/take/${p.id}`)} className="text-primary underline mr-2">{p.title}</button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default LevelTests;

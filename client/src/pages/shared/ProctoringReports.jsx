import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Loader2, AlertCircle, Camera } from 'lucide-react';
import { assessmentAPI } from '../../services/api';

const REASON = {
  MANUAL: 'Submitted',
  TIME_UP: 'Time up',
  MAX_VIOLATIONS: 'Auto: max violations',
  PAGE_CLOSED: 'Auto: window closed',
  ABANDONED: 'Abandoned',
  TERMINATED: 'Terminated by proctor',
};

const fmtDuration = (sec) => (sec == null ? '—' : `${Math.floor(sec / 60)}m ${sec % 60}s`);

// Shows attempts for one assessment (/:id/reports) or all flagged attempts (no id).
const ProctoringReports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (id) {
          const { data } = await assessmentAPI.getReports(id);
          setAssessment(data.assessment);
          setRows(data.results);
        } else {
          const { data } = await assessmentAPI.getProctoringReports();
          setRows(data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-dark">{id ? 'Attempt Reports' : 'Flagged Attempts'}</h1>
          <p className="text-sm text-gray-500">{assessment ? `${assessment.title} · NSQF Level ${assessment.nsqfLevel}` : 'Attempts with AI proctoring violations across the platform'}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">No attempts to show yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className={`bg-white rounded-xl border shadow-sm ${r.flagged ? 'border-red-200' : 'border-gray-100'}`}>
              <button onClick={() => setOpen(open === r.id ? null : r.id)} className="w-full p-4 flex flex-wrap items-center gap-4 text-left">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.flagged ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {r.flagged ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold text-dark">{r.studentName || 'Student'}</div>
                  <div className="text-xs text-gray-500">{r.studentEmail}{!id && r.assessment ? ` · ${r.assessment.title}` : ''}</div>
                </div>
                <div className="text-sm"><span className="font-bold">{r.percentage}%</span> <span className="text-gray-500">({r.score}/{r.maxScore})</span></div>
                <div className={`text-sm font-semibold ${r.violationCount ? 'text-red-600' : 'text-gray-500'}`}>{r.violationCount} violation(s)</div>
                <div className="text-xs text-gray-500">{REASON[r.submitReason] || r.submitReason} · {fmtDuration(r.timeTakenSec)}</div>
                <div className="text-xs text-gray-400">{new Date(r.completedAt).toLocaleString('en-IN')}</div>
                {open === r.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {open === r.id && (
                <div className="border-t border-gray-100 p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Event timeline</h3>
                    {r.events.length === 0 ? <p className="text-sm text-gray-500">No events recorded.</p> : (
                      <ul className="space-y-1 max-h-64 overflow-y-auto text-sm">
                        {r.events.map((e, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-gray-400 font-mono w-14 flex-shrink-0">{fmtDuration(e.elapsedSec)}</span>
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.severity === 'high' ? 'bg-red-500' : 'bg-yellow-400'}`}></span>
                            <span className="text-gray-700">{e.message}{e.detail ? <span className="text-gray-400"> ({e.detail})</span> : null}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Camera size={14} /> Evidence (webcam & screen)</h3>
                      {r.snapshots.length === 0 ? <p className="text-sm text-gray-500">No snapshots captured.</p> : (
                        <div className="grid grid-cols-3 gap-2">
                          {r.snapshots.map((s, i) => (
                            <figure key={i}>
                              <img src={s.image} alt={s.type} className="rounded border border-gray-200 w-full" />
                              <figcaption className="text-[10px] text-gray-500 mt-0.5">{s.type.replace(/_/g, ' ').toLowerCase()}</figcaption>
                            </figure>
                          ))}
                        </div>
                      )}
                    </div>
                    {r.roomScan.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Room scan</h3>
                        <div className="grid grid-cols-5 gap-1">
                          {r.roomScan.map((s, i) => <img key={i} src={s.image} alt={`room ${i + 1}`} title={(s.objects || []).join(', ')} className="rounded border border-gray-200 w-full" />)}
                        </div>
                      </div>
                    )}
                    {r.environment && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        <b>Device:</b> {r.environment.platform} · GPU {r.environment.gpuRenderer} · {r.environment.screen?.width}×{r.environment.screen?.height}{r.environment.webdriver ? ' · automation' : ''}{r.resumeCount ? ` · resumed ${r.resumeCount}×` : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProctoringReports;

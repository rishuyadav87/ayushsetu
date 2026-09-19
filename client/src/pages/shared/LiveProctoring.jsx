import React, { useCallback, useEffect, useState } from 'react';
import { Radio, Wifi, WifiOff, Ban, Loader2, AlertTriangle, RefreshCw, CameraOff, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { attemptAPI } from '../../services/api';

const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// Real-time view of every proctored test in progress, fed by attempt heartbeats
const LiveProctoring = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await attemptAPI.live();
      setRows(data);
      setUpdatedAt(new Date());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load live attempts', { id: 'live-err' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const terminate = async () => {
    try {
      await attemptAPI.terminate(confirm.id, reason || 'Terminated by proctor after live review');
      toast.success('Attempt terminated');
      setConfirm(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not terminate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2"><Radio size={24} className="text-red-500 animate-pulse" /> Live Proctoring</h1>
          <p className="text-sm text-gray-500">Tests in progress right now · auto-refreshes every 10 s{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString('en-IN')}` : ''}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"><RefreshCw size={16} /> Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">No proctored tests are in progress.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map(r => (
            <div key={r.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${r.violationCount >= 3 ? 'border-red-300' : r.violationCount ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="relative bg-gray-900 aspect-video">
                {r.snapshot ? <img src={r.snapshot} alt={`${r.studentName} webcam`} className="w-full h-full object-cover -scale-x-100" /> : <div className="w-full h-full flex items-center justify-center text-white/60 text-xs gap-1"><CameraOff size={14} /> Waiting for camera frame</div>}
                <div className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${r.online ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-white'}`}>
                  {r.online ? <Wifi size={10} /> : <WifiOff size={10} />} {r.online ? 'ONLINE' : 'NO HEARTBEAT'}
                </div>
                {r.faceCount !== null && r.faceCount !== 1 && (
                  <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white flex items-center gap-1"><Users size={10} /> {r.faceCount} faces</div>
                )}
                <div className="absolute bottom-2 right-2 text-xs font-mono bg-black/60 text-white px-1.5 py-0.5 rounded">{fmt(r.remainingSec)}</div>
              </div>
              <div className="p-4">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-dark truncate">{r.studentName}</div>
                    <div className="text-xs text-gray-500 truncate">{r.assessment.title} · L{r.assessment.nsqfLevel}</div>
                  </div>
                  <div className={`text-sm font-bold whitespace-nowrap ${r.violationCount ? 'text-red-600' : 'text-indigo-600'}`}>{r.violationCount} ⚠</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{r.answeredCount} answered{r.resumeCount ? ` · resumed ${r.resumeCount}×` : ''}</div>
                <ul className="mt-3 space-y-1 text-xs max-h-24 overflow-y-auto">
                  {r.recentEvents.length === 0 ? <li className="text-gray-400">No events</li> : r.recentEvents.map((e, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${e.severity === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <span className="text-gray-700">{e.message}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setConfirm(r)} className="mt-3 w-full py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"><Ban size={14} /> Terminate attempt</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Terminate {confirm.studentName}'s attempt?</h2>
            <p className="text-sm text-gray-600 mb-3">The test ends immediately, the saved answers are scored and the result is flagged.</p>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4" placeholder="Reason (e.g. phone clearly visible)" value={reason} onChange={e => setReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={terminate} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold">Terminate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveProctoring;

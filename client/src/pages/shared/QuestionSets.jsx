import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, BarChart2, ShieldAlert, Clock, Award, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QuestionSets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const base = `/${user.role}`;
  const canReviewAll = ['admin', 'institution'].includes(user.role);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await assessmentAPI.getMine();
      setSets(data || []);
    } catch (err) {
      setError('Could not load question sets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assessmentAPI.remove(confirmId);
      toast.success('Question set deleted');
      setSets(s => s.filter(x => x.id !== confirmId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">{user.role === 'admin' ? 'All Question Sets' : 'My Question Sets'}</h1>
          <p className="text-sm text-gray-500">Upload NSQF level-wise tests and review AI proctoring reports.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(`${base}/live-proctoring`)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            Live Proctoring
          </button>
          {canReviewAll && (
            <button onClick={() => navigate(`${base}/proctoring-reports`)} className="flex items-center gap-2 px-4 py-2 border border-secondary text-secondary rounded-lg text-sm font-medium hover:bg-secondary/5">
              <ShieldAlert size={16} /> Flagged Attempts
            </button>
          )}
          <button onClick={() => navigate(`${base}/question-sets/upload`)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            <Upload size={16} /> Create Question Set
          </button>
        </div>
      </div>

      {error && <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : sets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Upload size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-4">You haven't uploaded any question sets yet.</p>
          <button onClick={() => navigate(`${base}/question-sets/upload`)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Upload your first set</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Flagged</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sets.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-dark">{s.title}</div>
                    <div className="text-xs text-gray-500 flex gap-2 items-center">
                      {s.category}
                      {s.isPractice && <span className="bg-indigo-50 text-indigo-700 px-1.5 rounded">Practice</span>}
                      {s.source === 'AI' && <span className="bg-purple-50 text-purple-700 px-1.5 rounded">AI</span>}
                      {s.proctored && <span className="flex items-center gap-0.5 text-indigo-600"><ShieldCheck size={12} /> Proctored</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="bg-primary/10 text-primary font-semibold px-2 py-1 rounded text-xs">L{s.nsqfLevel}</span></td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1"><Award size={14} /> {s.questionCount} Qs · {s.totalMarks} marks</div>
                    <div className="flex items-center gap-1"><Clock size={14} /> {s.duration} min · pass {s.passingPercent}%</div>
                  </td>
                  <td className="px-4 py-3">{s.attemptCount}{s.averagePercentage !== null && <span className="text-xs text-gray-500"> · avg {s.averagePercentage}%</span>}</td>
                  <td className="px-4 py-3">{s.flaggedCount > 0 ? <span className="text-red-600 font-semibold">{s.flaggedCount}</span> : <span className="text-gray-400">0</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`${base}/question-sets/${s.id}/reports`)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100">
                        <BarChart2 size={14} /> Reports
                      </button>
                      <button onClick={() => setConfirmId(s.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="font-bold text-lg mb-2">Delete question set?</h2>
            <p className="text-sm text-gray-600 mb-6">All attempts and proctoring reports for this set will also be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionSets;

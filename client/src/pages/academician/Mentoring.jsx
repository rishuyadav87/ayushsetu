import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, X, Loader2 } from 'lucide-react';
import { academicianAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Mentoring = () => {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const res = await academicianAPI.getMentees();
      setMentees(res.data);
    } catch (err) {
      toast.error('Failed to load mentees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const handleSaveFeedback = async () => {
    try {
      await academicianAPI.addFeedback({ studentId: selectedMentee.id, feedback });
      toast.success('Feedback saved successfully!');
      setSelectedMentee(null);
      fetchMentees();
    } catch (err) {
      toast.error('Failed to save feedback');
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Mentoring Hub</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search mentees..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentees.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {m.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-dark">{m.name}</h3>
                <p className="text-sm text-gray-500">{m.year}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Readiness:</span>
                <span className="font-bold text-indigo-600">{m.readiness}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: m.readiness }}></div>
              </div>
              
              {m.feedbacks && m.feedbacks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Recent Feedback</p>
                  {m.feedbacks.slice(0,2).map(f => (
                    <div key={f.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                      &quot;{f.feedback}&quot;
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link to={`/admin/users`} className="flex-1 text-center bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">View Profiles</Link>
              <button onClick={() => { setSelectedMentee(m); setFeedback(''); }} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90">Add Feedback</button>
            </div>
          </div>
        ))}
      </div>

      {selectedMentee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark">Add Feedback for {selectedMentee.name}</h2>
              <button onClick={() => setSelectedMentee(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
              rows={4}
              placeholder="Write feedback, advice or next steps..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedMentee(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSaveFeedback} className="px-4 py-2 bg-primary text-white rounded-lg">Save Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentoring;

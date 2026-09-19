import React, { useState, useEffect } from 'react';
import { Edit2, Eye, Trash2, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { opportunityAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManageOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        setLoading(true);
        const response = await opportunityAPI.getAll();
        setOpportunities(response.data || []);
      } catch (err) {
        setError('Could not load opportunities. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOpps();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      setOpportunities(prev => prev.filter(o => o.id !== id));
      toast.success('Opportunity deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Manage Opportunities</h1>
        <Link to="/industry/post-opportunity" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          + Post New
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-12 text-center">
          <p className="text-gray-500 mb-4">No opportunities posted yet.</p>
          <Link to="/industry/post-opportunity" className="text-primary font-medium hover:underline">Post your first opportunity →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicants</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-dark">{job.title}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 capitalize">{job.type?.toLowerCase()}</div>
                      <div className="text-xs text-gray-500 mt-1">Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                        job.status === 'OPEN' || job.status === 'open' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status?.toLowerCase() || 'open'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-700">{job._count?.applications ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link to={`/industry/applications/${job.id}`} className="text-primary hover:text-primary/80" title="View Applications">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOpportunities;

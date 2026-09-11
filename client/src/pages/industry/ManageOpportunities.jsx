import React, { useState, useEffect } from 'react';
import { Edit2, Eye, Trash2, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { opportunityAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fallbackJobs = [
    { id: 1, title: 'Clinical Research Intern', type: 'Internship', createdAt: '2023-10-15', status: 'active', applicationCount: 45 },
    { id: 2, title: 'Data Analyst (Ayush)', type: 'Full-time', createdAt: '2023-11-01', status: 'active', applicationCount: 32 },
    { id: 3, title: 'Ayurvedic Consultant', type: 'Contract', createdAt: '2023-11-10', status: 'draft', applicationCount: 0 },
  ];

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        setLoading(true);
        const response = await opportunityAPI.getAll(); // The backend will filter by postedBy
        setOpportunities(response.data?.length ? response.data : fallbackJobs);
      } catch (err) {
        console.error("Failed to load opportunities", err);
        setError("Could not load real opportunities. Showing fallback data.");
        setOpportunities(fallbackJobs);
      } finally {
        setLoading(false);
      }
    };
    fetchOpps();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Manage Opportunities</h1>

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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <tr key={job.id || job._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-dark">{job.title}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 capitalize">{job.type}</div>
                      <div className="text-xs text-gray-500 mt-1">Posted: {new Date(job.createdAt || job.posted).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${job.status === 'open' || job.status === 'active' || job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.status || 'open'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-700">{job.applicationCount || job.applicants || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link to={`/industry/applications`} className="text-primary hover:text-primary/80" title="View Applications">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="text-blue-600 hover:text-blue-800" title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No opportunities posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOpportunities;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';
import { Download, CheckCircle, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { applicationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ViewApplications = () => {
  const { id } = useParams(); // Opportunity ID (optional, but handled)
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationAPI.getAll();
        let filteredApps = response.data || [];
        if (id) {
          filteredApps = filteredApps.filter(app =>
            app.opportunity?.id === id || app.opportunityId === id
          );
        }
        setApplications(filteredApps);
      } catch (err) {
        setError('Could not load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [id]);

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await applicationAPI.updateStatus(appId, newStatus);
      setApplications(prev =>
        prev.map(app => (app.id === appId ? { ...app, status: newStatus } : app))
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/industry/opportunities" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark">{id ? 'Applications for Opportunity' : 'All Applications'}</h1>
          <p className="text-sm text-gray-500">{applications.length} Total Applications</p>
        </div>
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map(app => {
                  const appId = app._id || app.id;
                  return (
                    <tr key={appId} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-dark">{app.student?.name || app.name || 'Unknown Candidate'}</div>
                        <div className="text-xs text-gray-500">{app.inst || 'Institution not provided'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{app.opportunity?.title || 'Unknown Role'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.createdAt || app.appliedOn).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <ApplicationStatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(appId, 'shortlisted')}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" 
                            title="Shortlist"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(appId, 'rejected')}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" 
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No applications found.
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

export default ViewApplications;

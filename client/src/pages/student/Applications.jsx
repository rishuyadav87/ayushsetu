import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';
import { Building, MapPin, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { applicationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fallbackApplications = [
    { id: 1, role: 'Clinical Research Intern', company: 'Dabur Research Foundation', location: 'Delhi, NCR', appliedDate: '2023-11-15', status: 'shortlisted' },
    { id: 2, role: 'Ayurvedic Consultant (Part-time)', company: 'Patanjali Wellness', location: 'Remote', appliedDate: '2023-11-10', status: 'applied' },
    { id: 3, role: 'Summer Trainee - Pharmacology', company: 'Himalaya Wellness', location: 'Bengaluru, KA', appliedDate: '2023-10-25', status: 'rejected' },
    { id: 4, role: 'Data Entry - Clinical Trials', company: 'Ayush Ministry Projects', location: 'Delhi', appliedDate: '2023-09-01', status: 'selected' },
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationAPI.getAll();
        setApplications(response.data?.length ? response.data : fallbackApplications);
      } catch (err) {
        setError("Could not load your applications. Showing fallback data.");
        setApplications(fallbackApplications);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Application Tracker</h1>

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
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const title = app.opportunity?.title || app.role;
                  const company = app.opportunity?.company || app.company;
                  const location = app.opportunity?.location || app.location;
                  
                  return (
                    <tr key={app.id || app._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-dark">{title}</div>
                        <div className="flex items-center text-xs text-gray-500 mt-1 gap-3">
                          <span className="flex items-center"><Building size={12} className="mr-1" /> {company}</span>
                          <span className="flex items-center"><MapPin size={12} className="mr-1" /> {location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-gray-400" />
                          {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ApplicationStatusBadge status={app.status || 'applied'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={'/student/opportunities'} className="text-primary hover:text-primary/80 font-medium text-sm inline-flex items-center">
                          View Details <ArrowRight size={16} className="ml-1" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                      You haven't applied to any opportunities yet.
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

export default Applications;

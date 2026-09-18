import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { Briefcase, Users, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';

const IndustryDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await analyticsAPI.getDashboard();
        setStats(res.data);
      } catch (err) {
        setError("Failed to load dashboard data. Showing empty state.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Industry Dashboard</h1>
        <Link to="/industry/post-opportunity" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <FileText size={16} /> Post New Opportunity
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center mb-6">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Postings" value={stats?.opportunities || 5} icon={<Briefcase size={24} />} colorClass="text-blue-600 bg-blue-100" />
            <StatCard title="Total Applications" value={stats?.totalApplications || 142} icon={<FileText size={24} />} colorClass="text-purple-600 bg-purple-100" trend="up" trendValue="12%" />
            <StatCard title="Shortlisted" value={stats?.shortlisted || 28} icon={<Users size={24} />} colorClass="text-orange-600 bg-orange-100" />
            <StatCard title="Selected" value={stats?.selected || 6} icon={<CheckCircle size={24} />} colorClass="text-green-600 bg-green-100" />
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Recent Postings</h2>
          <div className="space-y-4">
            {(stats?.oppChart && stats.oppChart.length > 0) ? stats.oppChart.map((job, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                <div>
                  <h3 className="font-semibold text-gray-800">{job.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{job.applications} Applications received</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded bg-green-100 text-green-800`}>
                  Active
                </span>
              </div>
            )) : [
              { title: 'Clinical Research Intern', apps: 45, status: 'Active' },
              { title: 'Data Analyst (Ayush)', apps: 32, status: 'Active' },
              { title: 'Ayurvedic Consultant', apps: 12, status: 'Draft' }
            ].map((job, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                <div>
                  <h3 className="font-semibold text-gray-800">{job.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{job.apps} Applications received</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
          <Link to="/industry/manage-opportunities" className="block text-center text-sm font-medium text-primary mt-4 hover:underline">
            View All Postings
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4">AI Recommended Candidates</h2>
          <div className="space-y-4">
            {[
              { name: 'Aarav Sharma', score: '95%', match: 'Clinical Research Intern' },
              { name: 'Priya Patel', score: '92%', match: 'Data Analyst (Ayush)' },
              { name: 'Rohan Gupta', score: '88%', match: 'Clinical Research Intern' }
            ].map((cand, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {cand.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{cand.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Matched: {cand.match}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">{cand.score}</div>
                  <div className="text-xs text-gray-400">Match Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default IndustryDashboard;

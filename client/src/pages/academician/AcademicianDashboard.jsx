import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, BookOpen, GraduationCap, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsAPI } from '../../services/api';

const AcademicianDashboard = () => {
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
      <h1 className="text-2xl font-bold text-dark mb-6">Academician Dashboard</h1>

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
            <StatCard title="Active Mentees" value={stats?.menteesCount || 0} icon={<Users size={24} />} colorClass="text-indigo-600 bg-indigo-100" />
            <StatCard title="Research Projects" value={stats?.researchProjects || 0} icon={<BookOpen size={24} />} colorClass="text-purple-600 bg-purple-100" />
            <StatCard title="FDPs Completed" value={stats?.fdpsCompleted || 0} icon={<GraduationCap size={24} />} colorClass="text-indigo-600 bg-indigo-100" />
            <StatCard title="Endorsements Given" value={stats?.endorsementsGiven || 0} icon={<FileText size={24} />} colorClass="text-orange-600 bg-orange-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-dark mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        {item.type === 'endorsement' ? <FileText size={18} /> : item.type === 'mentee' ? <Users size={18} /> : <GraduationCap size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <FileText size={20} className="text-gray-400" />
                    </div>
                    <p>No recent activity found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-dark mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button onClick={() => window.location.href='/academician/mentoring'} className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors flex items-center justify-between">
                  Review Mentees <ChevronRight size={18} />
                </button>
                <button onClick={() => window.location.href='/academician/research-hub'} className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors flex items-center justify-between">
                  Propose Research <ChevronRight size={18} />
                </button>
                <button onClick={() => window.location.href='/academician/fdp'} className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium transition-colors flex items-center justify-between">
                  Browse FDPs <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AcademicianDashboard;

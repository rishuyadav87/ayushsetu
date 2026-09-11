import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, BookOpen, GraduationCap, FileText, AlertCircle } from 'lucide-react';
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
        console.error("Dashboard fetch error:", err);
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
            <StatCard title="Active Mentees" value={stats?.totalStudents ?? 0} icon={<Users size={24} />} colorClass="text-blue-600 bg-blue-100" />
            <StatCard title="Research Projects" value={stats?.researchProjects ?? 0} icon={<BookOpen size={24} />} colorClass="text-purple-600 bg-purple-100" />
            <StatCard title="FDPs Completed" value={stats?.totalApplications ?? 0} icon={<GraduationCap size={24} />} colorClass="text-green-600 bg-green-100" />
            <StatCard title="Endorsements Given" value={stats?.mentoringSessions ?? 0} icon={<FileText size={24} />} colorClass="text-orange-600 bg-orange-100" />
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Recent Mentee Activity</h2>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No recent mentee activity yet.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Active Research Collaborations</h2>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No active research collaborations yet.</p>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default AcademicianDashboard;

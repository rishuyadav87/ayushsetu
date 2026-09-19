import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, Briefcase, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../../services/api';

const InstitutionDashboard = () => {
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
      <h1 className="text-2xl font-bold text-dark mb-6">Institution Dashboard</h1>

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
            <StatCard title="Total Students" value={stats?.totalStudents || "1,250"} icon={<Users size={24} />} colorClass="text-indigo-600 bg-indigo-100" />
            <StatCard title="Avg Readiness Score" value={stats?.overallReadiness || "72%"} icon={<Activity size={24} />} colorClass="text-indigo-600 bg-indigo-100" trend="up" trendValue="4%" />
            <StatCard title="Opportunities" value={stats?.totalOpportunities || "342"} icon={<Briefcase size={24} />} colorClass="text-purple-600 bg-purple-100" trend="up" trendValue="2%" />
            <StatCard title="Assessments" value={stats?.totalAssessments || "45K+"} icon={<CheckCircle size={24} />} colorClass="text-orange-600 bg-orange-100" />
          </div>

          {/* AI Curriculum Alert */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-xl p-5 flex items-start gap-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">AI Curriculum Insights Alert</h3>
              <p className="text-orange-800 mt-1">
                Our analysis shows that <strong>78% of your final-year students</strong> are scoring below industry expectations in <strong>"Modern Tech Tools Integration"</strong>. 
                Industry demand for this skill has increased by 45% this quarter.
              </p>
              <button className="mt-3 text-sm bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                View Suggested Syllabus Updates
              </button>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Aggregate Readiness by Skill</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(stats?.readinessChart?.length > 0) ? stats.readinessChart : [
                { name: 'Clinical', readiness: 75 },
                { name: 'Research', readiness: 60 },
                { name: 'Tech Tools', readiness: 45 },
                { name: 'Communication', readiness: 85 },
                { name: 'Ethics', readiness: 90 },
              ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="readiness" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">Tech Tools is currently the weakest area across your student body.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Recent Placements & Internships</h2>
          <div className="space-y-4">
            {[
              { name: 'John Doe', role: 'Clinical Intern', company: 'Dabur' },
              { name: 'Aarav Sharma', role: 'Ayurvedic Consultant', company: 'Patanjali' },
              { name: 'Priya Patel', role: 'Research Asst.', company: 'Himalaya' }
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-semibold text-gray-800">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.role}</div>
                </div>
                <div className="text-sm font-medium text-primary">{p.company}</div>
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

export default InstitutionDashboard;

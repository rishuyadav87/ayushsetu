import React from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, Briefcase, Activity, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const InstitutionDashboard = () => {
  const readinessData = [
    { name: 'Clinical', score: 75 },
    { name: 'Research', score: 60 },
    { name: 'Tech Tools', score: 45 },
    { name: 'Communication', score: 85 },
    { name: 'Ethics', score: 90 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Institution Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value="1,250" icon={<Users size={24} />} colorClass="text-blue-600 bg-blue-100" />
        <StatCard title="Avg Readiness Score" value="72%" icon={<Activity size={24} />} colorClass="text-green-600 bg-green-100" trend="up" trendValue="4%" />
        <StatCard title="Placement Rate" value="85%" icon={<Briefcase size={24} />} colorClass="text-purple-600 bg-purple-100" trend="up" trendValue="2%" />
        <StatCard title="Industry Partners" value="12" icon={<CheckCircle size={24} />} colorClass="text-orange-600 bg-orange-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Aggregate Readiness by Skill</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="score" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">Tech Tools is currently the weakest area across your student body.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
    </div>
  );
};

export default InstitutionDashboard;

import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, Building, Briefcase, Activity, AlertCircle } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mockRoleData = [
    { name: 'Students', value: 12500 },
    { name: 'Institutions', value: 200 },
    { name: 'Industry', value: 850 },
    { name: 'Academicians', value: 450 },
  ];

  const mockTrendData = [
    { name: 'Jan', users: 4000, opportunities: 240 },
    { name: 'Feb', users: 5000, opportunities: 139 },
    { name: 'Mar', users: 8000, opportunities: 980 },
    { name: 'Apr', users: 11000, opportunities: 390 },
    { name: 'May', users: 15420, opportunities: 480 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await analyticsAPI.getDashboard();
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
        setError("Failed to load live data. Showing fallback metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Platform Administration</h1>

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={<Users size={24} />} colorClass="text-blue-600 bg-blue-100" />
            <StatCard title="Assessments Taken" value={stats?.assessmentsCompleted ?? 0} icon={<Activity size={24} />} colorClass="text-purple-600 bg-purple-100" />
            <StatCard title="Active Opportunities" value={stats?.activeOpportunities ?? 0} icon={<Briefcase size={24} />} colorClass="text-green-600 bg-green-100" />
            <StatCard title="Registered Institutions" value={stats?.totalInstitutions ?? 0} icon={<Building size={24} />} colorClass="text-orange-600 bg-orange-100" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
              <h2 className="text-lg font-bold text-dark mb-4">Users by Role</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.roleData ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.roleData ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-dark mb-4">Platform Growth</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.trendData ?? []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Users" />
                    <Line yAxisId="right" type="monotone" dataKey="opportunities" stroke="#82ca9d" name="Opportunities" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

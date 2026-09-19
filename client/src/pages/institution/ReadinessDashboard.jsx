import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

const ReadinessDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await analyticsAPI.getDashboard();
        if (res.data?.readinessChart && res.data.readinessChart.length > 0) {
          setData(res.data.readinessChart.map(item => ({ name: item.name, score: item.readiness, benchmark: item.benchmark || 70 })));
        } else {
          setData([]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load readiness data. Please try again.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Readiness Analytics</h1>
      
      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center mb-6">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-8">
        <p className="text-gray-500 mb-6">Aggregate skill readiness across all students based on assessment performance.</p>
        
        {data.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="Avg Readiness %" fill="#2D6A4F" />
                <Bar dataKey="benchmark" name="Benchmark %" fill="#94D2BD" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No readiness data available yet</p>
            <p className="text-sm">Readiness scores appear once students complete assessments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadinessDashboard;

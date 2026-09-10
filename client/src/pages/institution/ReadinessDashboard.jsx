import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

const ReadinessDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mockData = [
    { name: 'Clinical', score: 85 },
    { name: 'Research', score: 65 },
    { name: 'Tech Tools', score: 50 },
    { name: 'Communication', score: 90 },
    { name: 'Ethics', score: 95 },
    { name: 'Management', score: 60 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await analyticsAPI.getDashboard();
        if (res.data?.skillsData) {
          setData(res.data.skillsData);
        } else {
          setData(mockData);
          setError("Displaying mock analytics data");
        }
      } catch (err) {
        console.error("Failed to load readiness data", err);
        setError("Failed to load real data. Using fallback data.");
        setData(mockData);
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-500 mb-6">Aggregate skill readiness across all students in your institution.</p>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" name="Average Score %" fill="#2D6A4F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
           <div className="p-4 border rounded-lg bg-gray-50">
             <h3 className="font-bold mb-2">B.A.M.S 4th Year Cohort</h3>
             <div className="w-full bg-gray-200 rounded-full h-2 mb-1"><div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div></div>
             <span className="text-xs text-gray-500 font-medium">85% Average Readiness Score</span>
           </div>
           <div className="p-4 border rounded-lg bg-gray-50">
             <h3 className="font-bold mb-2">B.A.M.S 3rd Year Cohort</h3>
             <div className="w-full bg-gray-200 rounded-full h-2 mb-1"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div></div>
             <span className="text-xs text-gray-500 font-medium">65% Average Readiness Score</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReadinessDashboard;

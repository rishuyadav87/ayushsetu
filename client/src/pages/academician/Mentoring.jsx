import React from 'react';
import { Search, ChevronRight } from 'lucide-react';

const Mentoring = () => {
  const mentees = [
    { id: 1, name: 'John Doe', year: '3rd Year', readiness: '78%', lastActive: '2 days ago' },
    { id: 2, name: 'Aarav Sharma', year: '4th Year', readiness: '92%', lastActive: 'Today' },
    { id: 3, name: 'Priya Patel', year: '2nd Year', readiness: '65%', lastActive: '1 week ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Mentoring Hub</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search mentees..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentees.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {m.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-dark">{m.name}</h3>
                <p className="text-sm text-gray-500">{m.year}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Readiness:</span>
                <span className="font-bold text-green-600">{m.readiness}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: m.readiness }}></div>
              </div>
              <div className="text-xs text-gray-400 mt-2">Last active: {m.lastActive}</div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">View Profile</button>
              <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90">Add Feedback</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mentoring;

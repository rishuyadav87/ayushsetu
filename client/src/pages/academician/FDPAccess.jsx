import React from 'react';
import { PlayCircle, Clock, Calendar } from 'lucide-react';

const FDPAccess = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Faculty Development Programs (FDP)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Integrating Modern Tech in Ayurveda', org: 'Ministry of Ayush', duration: '2 Weeks', date: 'Upcoming: Dec 1, 2023' },
          { title: 'Advanced Research Methodology', org: 'ICMR & AYUSH', duration: '4 Weeks', date: 'Self-paced' },
          { title: 'Digital Pedagogy for AYUSH Educators', org: 'UGC', duration: '1 Week', date: 'Completed' },
        ].map((fdp, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-dark mb-2">{fdp.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{fdp.org}</p>
            <div className="flex flex-col gap-2 text-sm text-gray-600 mb-5">
              <div className="flex items-center"><Clock size={16} className="mr-2 text-gray-400" /> Duration: {fdp.duration}</div>
              <div className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> {fdp.date}</div>
            </div>
            <button className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <PlayCircle size={18} /> {fdp.date === 'Completed' ? 'View Certificate' : 'Enroll / Start'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FDPAccess;

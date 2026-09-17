import React, { useState } from 'react';
import { PlayCircle, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const FDPAccess = () => {
  const [fdps, setFdps] = useState([
    { id: 1, title: 'Integrating Modern Tech in Ayurveda', org: 'Ministry of Ayush', duration: '2 Weeks', date: 'Upcoming', status: 'not_enrolled' },
    { id: 2, title: 'Advanced Research Methodology', org: 'ICMR & AYUSH', duration: '4 Weeks', date: 'Self-paced', status: 'not_enrolled' },
    { id: 3, title: 'Digital Pedagogy for AYUSH Educators', org: 'UGC', duration: '1 Week', date: 'Completed', status: 'completed' },
  ]);

  const handleAction = (id, currentStatus) => {
    if (currentStatus === 'completed') {
      toast.success('Certificate downloaded!');
      return;
    }
    if (currentStatus === 'enrolled') {
      toast.success('Resuming course material...');
      return;
    }
    
    // Enroll
    setFdps(fdps.map(f => f.id === id ? { ...f, status: 'enrolled' } : f));
    toast.success('Successfully enrolled! You can now start the course.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Faculty Development Programs (FDP)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fdps.map((fdp) => (
          <div key={fdp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-dark mb-2">{fdp.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{fdp.org}</p>
            <div className="flex flex-col gap-2 text-sm text-gray-600 mb-5">
              <div className="flex items-center"><Clock size={16} className="mr-2 text-gray-400" /> Duration: {fdp.duration}</div>
              <div className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> {fdp.date}</div>
            </div>
            <button 
              onClick={() => handleAction(fdp.id, fdp.status)} 
              className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${fdp.status === 'enrolled' ? 'bg-primary text-white' : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'}`}
            >
              <PlayCircle size={18} /> 
              {fdp.status === 'completed' ? 'View Certificate' : fdp.status === 'enrolled' ? 'Resume Course' : 'Enroll Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FDPAccess;

import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, Calendar } from 'lucide-react';
import { academicianAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FDPAccess = () => {
  const [fdps, setFdps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFDPs = async () => {
    try {
      setLoading(true);
      const res = await academicianAPI.getOpportunities();
      setFdps(res.data.filter(o => o.type === 'FDP').map(o => ({
        id: o.id,
        title: o.title,
        org: o.postedBy?.name || 'Institution',
        duration: o.stipend || '4 Weeks',
        date: new Date(o.createdAt).toLocaleDateString(),
        status: 'not_enrolled' // For demo, we just simulate status locally
      })));
    } catch (err) {
      toast.error('Failed to load FDPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFDPs();
  }, []);

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
        {fdps.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No Faculty Development Programs currently available.
          </div>
        )}
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

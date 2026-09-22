import React, { useState, useEffect } from 'react';
import SearchBar from '../../components/common/SearchBar';
import SkillBadge from '../../components/common/SkillBadge';
import { MapPin, GraduationCap, Award, Loader2 } from 'lucide-react';
import { profileAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CandidateSearch = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const res = await profileAPI.searchProfiles('STUDENT', query);
        const mapped = res.data.map(p => ({
          id: p.id,
          name: p.user?.name || 'Anonymous Student',
          inst: p.institution || 'Independent',
          location: p.city ? `${p.city}` : 'Remote',
          skills: p.skills ? (typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills).slice(0, 3) : ['General'],
          score: 'N/A'
        }));
        setCandidates(mapped);
      } catch (err) {
        toast.error('Failed to load candidates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchCandidates, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Candidate Search</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
            <SearchBar placeholder="e.g. Aarav Sharma..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
            <select className="w-full border border-gray-300 rounded-lg py-2 px-3">
              <option>All</option>
              <option>Ayurveda</option>
              <option>Yoga</option>
              <option>Unani</option>
              <option>Siddha</option>
              <option>Homeopathy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg py-2 px-3" placeholder="City or State" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : candidates.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No candidates found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-dark">{c.name}</h3>
                  <div className="flex items-center text-xs text-indigo-600 font-medium">
                    <Award size={12} className="mr-1" /> NSQF Level 5
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded text-sm">
                {c.score}
              </div>
            </div>
            
            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <div className="flex items-center"><GraduationCap size={16} className="mr-2 text-gray-400" /> {c.inst}</div>
              <div className="flex items-center"><MapPin size={16} className="mr-2 text-gray-400" /> {c.location}</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {c.skills.map((s, i) => (
                <SkillBadge key={i} skill={s} level="intermediate" />
              ))}
            </div>

          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;

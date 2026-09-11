import React, { useState } from 'react';
import SearchBar from '../../components/common/SearchBar';
import SkillBadge from '../../components/common/SkillBadge';
import { MapPin, GraduationCap, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const CandidateSearch = () => {
  const candidates = [
    { id: 1, name: 'Aarav Sharma', inst: 'All India Institute of Ayurveda', location: 'Delhi', skills: ['Clinical', 'Research'], score: '95%' },
    { id: 2, name: 'Priya Patel', inst: 'Gujarat Ayurved University', location: 'Gujarat', skills: ['Data Analysis', 'Tech Tools'], score: '92%' },
    { id: 3, name: 'Rohan Gupta', inst: 'National Institute of Ayurveda', location: 'Jaipur', skills: ['Communication', 'Clinical'], score: '88%' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Candidate Search</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Skill or Name</label>
            <SearchBar placeholder="e.g. Clinical Research..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
            <select className="w-full border border-gray-300 rounded-lg py-2 px-3">
              <option>All</option>
              <option>Ayurveda</option>
              <option>Yoga</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg py-2 px-3" placeholder="City or State" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-dark">{c.name}</h3>
                  <div className="flex items-center text-xs text-green-600 font-medium">
                    <Award size={12} className="mr-1" /> NSQF Level 5
                  </div>
                </div>
              </div>
              <div className="bg-green-50 text-green-700 font-bold px-2 py-1 rounded text-sm">
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

            <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="w-full border border-primary text-primary hover:bg-primary hover:text-white py-2 rounded-lg font-medium transition-colors">
              View Full Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateSearch;

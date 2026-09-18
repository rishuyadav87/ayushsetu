import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AssessmentCard from '../../components/common/AssessmentCard';
import SearchBar from '../../components/common/SearchBar';
import { assessmentAPI } from '../../services/api';
import { AlertCircle, Upload, Lock, CheckCircle, Layers } from 'lucide-react';

const Assessments = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [listRes, levelRes] = await Promise.all([assessmentAPI.getAll(), assessmentAPI.getLevels()]);
        setAssessments(listRes.data || []);
        setLevels(levelRes.data?.levels || []);
        setProgress(levelRes.data?.progress || null);
      } catch (err) {
        setError('Could not load assessments from the server. Please check that the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const official = assessments.filter(a => !a.isPractice);
  const practice = assessments.filter(a => a.isPractice);

  // Only show level tabs that actually have assessments
  const levelTabs = levels.filter(l => l.assessmentCount > 0);
  const categories = useMemo(() => [...new Set(official.map(a => a.category).filter(Boolean))], [official]);

  const filtered = official.filter(a =>
    (activeLevel === 'all' || a.nsqfLevel === activeLevel) &&
    (activeCategory === 'all' || a.category === activeCategory) &&
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group visible assessments by NSQF level
  const grouped = filtered.reduce((acc, a) => {
    (acc[a.nsqfLevel] = acc[a.nsqfLevel] || []).push(a);
    return acc;
  }, {});
  const levelInfo = (n) => levels.find(l => l.level === n);

  const chip = (active) =>
    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Assessments</h1>
          <p className="text-gray-500 text-sm mt-1">NSQF level-wise, AI-proctored tests to validate your skills</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <SearchBar placeholder="Search assessments..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button
            onClick={() => navigate('/student/question-sets/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 whitespace-nowrap"
          >
            <Upload size={16} /> Create Practice Set
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {progress && (
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Layers size={28} />
            <div>
              <div className="font-bold text-lg">Your NSQF progression</div>
              <div className="text-sm text-white/80">
                Unlocked up to Level {progress.unlockedUpTo}
                {progress.passedLevels.length > 0 ? ` · Passed: Level ${progress.passedLevels.join(', ')}` : ' · Pass a test to unlock the next level'}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {levelTabs.map(l => (
              <div key={l.level} title={l.title} className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${l.passed ? 'bg-white text-primary' : l.unlocked ? 'bg-white/20' : 'bg-black/20 text-white/60'}`}>
                {l.passed ? <CheckCircle size={16} /> : l.unlocked ? l.level : <Lock size={14} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveLevel('all')} className={chip(activeLevel === 'all')}>All Levels</button>
        {levelTabs.map(l => (
          <button key={l.level} onClick={() => setActiveLevel(l.level)} className={`${chip(activeLevel === l.level)} flex items-center gap-1`}>
            {!l.unlocked && <Lock size={12} />} NSQF Level {l.level}
          </button>
        ))}
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveCategory('all')} className={chip(activeCategory === 'all')}>All Categories</button>
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={chip(activeCategory === c)}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">No assessments match your filters.</div>
          )}

          {Object.keys(grouped).map(Number).sort((a, b) => a - b).map(level => {
            const info = levelInfo(level);
            return (
              <section key={level} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${info?.unlocked === false ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}`}>
                    {info?.unlocked === false ? <Lock size={16} /> : level}
                  </div>
                  <div>
                    <h2 className="font-bold text-dark">{info?.title || `NSQF Level ${level}`}</h2>
                    <p className="text-sm text-gray-500">{info?.descriptor}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped[level].map(a => <AssessmentCard key={a.id} {...a} />)}
                </div>
              </section>
            );
          })}

          {practice.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-gray-200">
              <div>
                <h2 className="font-bold text-dark">My Practice Sets</h2>
                <p className="text-sm text-gray-500">Question sets you uploaded. Visible only to you and not counted towards NSQF progression.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {practice.map(a => <AssessmentCard key={a.id} {...a} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Assessments;

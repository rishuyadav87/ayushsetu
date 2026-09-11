import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import SkillRadarChart from '../../components/common/SkillRadarChart';
import OpportunityCard from '../../components/common/OpportunityCard';
import { Award, Briefcase, BookOpen, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, opportunityAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendedOpps, setRecommendedOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, oppsRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          opportunityAPI.getRecommended()
        ]);
        setStats(statsRes.data);
        setRecommendedOpps(oppsRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Showing default data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const skillData = [
    { subject: 'Clinical', score: 85, fullMark: 100 },
    { subject: 'Research', score: 65, fullMark: 100 },
    { subject: 'Tech Tools', score: 50, fullMark: 100 },
    { subject: 'Communication', score: 90, fullMark: 100 },
    { subject: 'Ethics', score: 95, fullMark: 100 },
    { subject: 'Management', score: 60, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Welcome back, {user?.name || 'Student'}!</h1>
        <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          Take Assessment
        </button>
      </div>

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
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Overall Readiness" value={`${stats?.overallReadiness ?? 0}%`} icon={<Award size={24} />} colorClass="text-green-600 bg-green-100" trend={stats?.overallReadiness > 0 ? "up" : null} trendValue={stats?.overallReadiness > 0 ? "5%" : null} />
            <StatCard title="Assessments Completed" value={stats?.assessmentsTaken ?? 0} icon={<BookOpen size={24} />} colorClass="text-blue-600 bg-blue-100" />
            <StatCard title="Applications Active" value={stats?.applications ?? 0} icon={<Briefcase size={24} />} colorClass="text-orange-600 bg-orange-100" />
            <StatCard title="Available Opportunities" value={stats?.openOpportunities ?? 0} icon={<Star size={24} />} colorClass="text-purple-600 bg-purple-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Skills & Gap Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-dark mb-4">Skill Radar</h2>
                {(stats?.assessmentsTaken ?? 0) > 0 ? (
                  <>
                    <SkillRadarChart data={skillData} />
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <h3 className="font-semibold text-orange-800 mb-1">Gap Identified</h3>
                      <p className="text-sm text-orange-700">Your Technical Tools score (50%) is below industry average for your discipline. We recommend taking the "Modern Tech in Ayush" assessment.</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>Take your first assessment to unlock your skill radar!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Matched Opportunities & Notifications */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-dark mb-4">AI Matched Opportunities</h2>
                <div className="space-y-4">
                  {recommendedOpps && recommendedOpps.length > 0 ? (
                    recommendedOpps.map(opp => (
                      <OpportunityCard 
                        key={opp.id || opp._id}
                        title={opp.title}
                        company={opp.company}
                        location={opp.location}
                        type={opp.type}
                        tags={opp.skills || opp.tags || []}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">No matched opportunities yet.</p>
                      <p className="text-xs mt-1">Complete your profile to get matches.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;

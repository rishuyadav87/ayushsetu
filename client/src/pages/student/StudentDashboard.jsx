import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import SkillBarChart from '../../components/common/SkillBarChart';
import OpportunityCard from '../../components/common/OpportunityCard';
import { Award, Briefcase, BookOpen, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, opportunityAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          opportunityAPI.getRecommended().catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setRecommendedOpps(oppsRes.data);
      } catch (err) {
        setError("Failed to load dashboard data. Showing default data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Latest score per skill area for the bar chart
  const skillData = Object.values((stats?.scoreHistory || []).reduce((acc, s) => {
    if (!acc[s.name]) acc[s.name] = { subject: s.name, score: s.score, fullMark: 100 };
    return acc;
  }, {}));
  const weakest = skillData.length ? skillData.reduce((a, b) => (a.score <= b.score ? a : b)) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Welcome back, {user?.name || 'Student'}!</h1>
        <button onClick={() => navigate('/student/assessments')} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
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
            <StatCard title="Overall Readiness" value={`${stats?.overallReadiness ?? 0}%`} icon={<Award size={24} />} colorClass="text-emerald-600 bg-emerald-100" trend={stats?.overallReadiness ? "up" : null} trendValue={stats?.overallReadiness ? "5%" : null} gradient="bg-gradient-to-r from-emerald-500 to-teal-500" />
            <StatCard title="Assessments Completed" value={stats?.assessmentsTaken ?? 0} icon={<BookOpen size={24} />} colorClass="text-indigo-600 bg-indigo-100" gradient="bg-gradient-to-r from-indigo-500 to-purple-500" />
            <StatCard title="Applications Active" value={stats?.applications ?? 0} icon={<Briefcase size={24} />} colorClass="text-orange-600 bg-orange-100" gradient="bg-gradient-to-r from-orange-400 to-red-500" />
            <StatCard title="Available Opportunities" value={stats?.openOpportunities ?? 0} icon={<Star size={24} />} colorClass="text-purple-600 bg-purple-100" gradient="bg-gradient-to-r from-purple-500 to-pink-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Skills & Gap Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
                <h2 className="text-lg font-bold text-dark mb-4">Skill Scores</h2>
                {skillData.length > 0 ? (
                  <>
                    <SkillBarChart data={skillData} />
                    {weakest && weakest.score < 70 && (
                      <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <h3 className="font-semibold text-orange-800 mb-1">Gap Identified</h3>
                        <p className="text-sm text-orange-700">
                          Your score in "{weakest.subject}" ({weakest.score}%) is below the 70% industry benchmark. Retake a level-appropriate NSQF assessment to close the gap.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="mb-4">Take your first assessment to unlock your skill scores!</p>
                    <button onClick={() => navigate('/student/assessments')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Start an Assessment</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Matched Opportunities & Notifications */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
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
                    <>
                      <OpportunityCard 
                        title="Clinical Research Intern"
                        company="Dabur Research Foundation"
                        location="Delhi, NCR"
                        type="internship"
                        tags={['Clinical', 'Research']}
                      />
                      <OpportunityCard 
                        title="Ayurvedic Consultant"
                        company="Patanjali Wellness"
                        location="Remote"
                        type="job"
                        tags={['Consultation', 'Communication']}
                      />
                    </>
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

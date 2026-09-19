import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillBarChart from '../../components/common/SkillBarChart';
import SkillBadge from '../../components/common/SkillBadge';
import { skillProfileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { generateSkillGapReport } from '../../utils/pdfGenerator';
import { Download, AlertCircle, AlertTriangle, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const levelFromPercent = (p) => (p >= 85 ? 'advanced' : p >= 60 ? 'intermediate' : 'beginner');

const SkillProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, gapRes] = await Promise.all([
          skillProfileAPI.get(),
          skillProfileAPI.getGapAnalysis()
        ]);
        setProfile(profileRes.data);
        setGapData(gapRes.data);
      } catch (err) {
        setError('Could not load your skill profile from the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = profile?.categories || [];
  const chartData = categories.map(c => ({ subject: c.name, score: Math.round(c.percentage), fullMark: 100 }));
  const gaps = gapData?.gaps || [];

  const handleDownloadPDF = () => {
    try {
      generateSkillGapReport(user?.name || 'Student', gapData, profile);
    } catch (e) {
      toast.error('Could not generate the PDF report');
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertCircle size={20} className="text-red-500" />;
      case 'medium': return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'low': return <TrendingUp size={20} className="text-blue-600" />;
      default: return <CheckCircle size={20} className="text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Skill Profile & Intelligence</h1>
        <button
          onClick={handleDownloadPDF}
          disabled={!profile}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} />
          Download PDF Report
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center text-sm">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-dark">NSQF Skill Scores</h2>
            {profile && (
              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Overall {Math.round(profile.overallScore || 0)}%
              </span>
            )}
          </div>
          {chartData.length > 0 ? (
            <SkillBarChart data={chartData} />
          ) : (
            <div className="text-center py-16 text-gray-500">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="mb-4">Take an assessment to see your skill scores.</p>
              <button onClick={() => navigate('/student/assessments')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                Go to Assessments
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Verified Skills</h2>
            <div className="flex flex-wrap gap-2">
              {categories.length > 0 ? categories.map((c, idx) => (
                <SkillBadge key={idx} skill={c.name} level={levelFromPercent(c.percentage)} />
              )) : (
                <p className="text-sm text-gray-500">Skills are verified automatically when you complete proctored assessments.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 card-hover p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Gap Analysis & Recommendations</h2>
            <div className="space-y-3">
              {gaps.length > 0 ? gaps.map((gap, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getSeverityStyles(gap.severity)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(gap.severity)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <h3 className="font-bold">{gap.category}</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-white/60 rounded whitespace-nowrap">
                          {Math.round(gap.studentScore)}% / Target {gap.benchmark}%
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{gap.recommendation}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-gray-500 text-center py-4">No critical skill gaps identified!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillProfile;

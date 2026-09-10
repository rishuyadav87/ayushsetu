import React, { useState, useEffect } from 'react';
import SkillRadarChart from '../../components/common/SkillRadarChart';
import SkillBadge from '../../components/common/SkillBadge';
import { skillProfileAPI } from '../../services/api';
import { Download, AlertCircle, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const SkillProfile = () => {
  const [skillData, setSkillData] = useState([]);
  const [gapAnalysis, setGapAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mockSkillData = [
    { subject: 'Clinical', score: 85, fullMark: 100 },
    { subject: 'Research', score: 65, fullMark: 100 },
    { subject: 'Tech Tools', score: 50, fullMark: 100 },
    { subject: 'Communication', score: 90, fullMark: 100 },
    { subject: 'Ethics', score: 95, fullMark: 100 },
    { subject: 'Management', score: 60, fullMark: 100 },
  ];

  const mockGapAnalysis = [
    { category: 'Tech Tools', studentScore: 50, benchmark: 70, severity: 'red', recommendation: 'Complete the "Data Analysis for Healthcare" certification.' },
    { category: 'Management', studentScore: 60, benchmark: 70, severity: 'yellow', recommendation: 'Take the "Healthcare Management Fundamentals" course.' },
    { category: 'Research', studentScore: 65, benchmark: 70, severity: 'yellow', recommendation: 'Participate in a minor research project.' },
  ];

  const verifiedSkills = [
    { name: 'Patient Diagnosis', level: 'advanced' },
    { name: 'Herbal Formulations', level: 'intermediate' },
    { name: 'Clinical Communication', level: 'advanced' },
    { name: 'Data Analysis', level: 'beginner' },
    { name: 'Ayurvedic Dietetics', level: 'intermediate' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try fetching real data
        const [profileRes, gapRes] = await Promise.all([
          skillProfileAPI.get().catch(() => null),
          skillProfileAPI.getGapAnalysis().catch(() => null)
        ]);

        if (profileRes?.data?.skills) {
          setSkillData(profileRes.data.skills);
        } else {
          setSkillData(mockSkillData);
          if(!error) setError("Displaying mock skill data");
        }

        if (gapRes?.data) {
          setGapAnalysis(gapRes.data);
        } else {
          setGapAnalysis(mockGapAnalysis);
        }
      } catch (err) {
        console.error("Failed to load skill profile", err);
        setSkillData(mockSkillData);
        setGapAnalysis(mockGapAnalysis);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleDownloadPDF = () => {
    // Placeholder for PDF generation
    alert("Downloading PDF Report...");
  };

  const getSeverityStyles = (severity) => {
    switch(severity) {
      case 'red': return 'bg-red-50 border-red-200 text-red-800';
      case 'yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'green': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'red': return <AlertCircle size={20} className="text-red-500" />;
      case 'yellow': return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'green': return <CheckCircle size={20} className="text-green-500" />;
      default: return <TrendingUp size={20} className="text-gray-500" />;
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
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium"
        >
          <Download size={16} />
          Download PDF Report
        </button>
      </div>

      {error && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-center text-sm">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          Note: Real API not connected, showing mock analytics data.
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4">NSQF Alignment Radar</h2>
          <SkillRadarChart data={skillData} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Verified Skills</h2>
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map((s, idx) => (
                <SkillBadge key={idx} skill={s.name} level={s.level} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-dark mb-4">Gap Analysis & Recommendations</h2>
            <div className="space-y-3">
              {gapAnalysis.length > 0 ? gapAnalysis.map((gap, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getSeverityStyles(gap.severity)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(gap.severity)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold">{gap.category} Gap</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-white/60 rounded">
                          Score: {gap.studentScore}% / Target: {gap.benchmark}%
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

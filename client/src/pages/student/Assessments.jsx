import React, { useState, useEffect } from 'react';
import AssessmentCard from '../../components/common/AssessmentCard';
import SearchBar from '../../components/common/SearchBar';
import { assessmentAPI } from '../../services/api';
import { AlertCircle } from 'lucide-react';

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fallbackAssessments = [
    { id: 1, title: 'Advanced Clinical Diagnosis in Ayurveda', category: 'Clinical', duration: 45, questions: 50, level: 'advanced' },
    { id: 2, title: 'Basics of Research Methodology', category: 'Research', duration: 30, questions: 30, level: 'beginner' },
    { id: 3, title: 'Pharmacovigilance in AYUSH', category: 'Ethics', duration: 60, questions: 60, level: 'intermediate' },
    { id: 4, title: 'Modern Diagnostic Tools Integration', category: 'Tech Tools', duration: 40, questions: 40, level: 'intermediate' },
    { id: 5, title: 'Healthcare Communication Skills', category: 'Communication', duration: 25, questions: 25, level: 'beginner' },
  ];

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        const response = await assessmentAPI.getAll();
        setAssessments(response.data?.length ? response.data : fallbackAssessments);
      } catch (err) {
        console.error("Failed to fetch assessments", err);
        setError("Could not load assessments from server. Showing fallback data.");
        setAssessments(fallbackAssessments);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Assessments</h1>
          <p className="text-gray-500 text-sm mt-1">Take NSQF-aligned tests to validate your skills</p>
        </div>
        <SearchBar placeholder="Search assessments..." />
      </div>

      {error && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium whitespace-nowrap">All Categories</button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-sm font-medium whitespace-nowrap">Clinical</button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-sm font-medium whitespace-nowrap">Research</button>
        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-sm font-medium whitespace-nowrap">Tech Tools</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {assessments.map(a => (
            <AssessmentCard key={a.id || a._id} {...a} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Assessments;

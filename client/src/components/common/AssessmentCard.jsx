import React from 'react';
import { Clock, Award, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AssessmentCard = ({ id, title, category, duration, questions, level }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{category}</span>
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded capitalize">{level}</span>
      </div>
      <h3 className="text-lg font-bold text-dark mb-3">{title}</h3>
      
      <div className="flex gap-4 text-sm text-gray-500 mb-5">
        <div className="flex items-center">
          <Clock size={16} className="mr-1" />
          {duration} mins
        </div>
        <div className="flex items-center">
          <Award size={16} className="mr-1" />
          {questions} Qs
        </div>
      </div>
      
      <button 
        onClick={() => navigate(`/student/assessments/take/${id}`)}
        className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white py-2 rounded-lg font-medium transition-colors"
      >
        <PlayCircle size={18} />
        Start Assessment
      </button>
    </div>
  );
};

export default AssessmentCard;

import React from 'react';
import { Clock, Award, PlayCircle, Lock, ShieldCheck, RotateCcw, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AssessmentCard = ({
  id, title, category, duration, questionCount, nsqfLevel, locked,
  proctored, isPractice, attempts, bestPercentage, passingPercent = 60, source,
}) => {
  const navigate = useNavigate();
  const passed = bestPercentage !== null && bestPercentage !== undefined && bestPercentage >= passingPercent;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 transition-colors flex flex-col ${locked ? 'border-gray-100 opacity-75' : 'border-gray-100 hover:border-primary/50'}`}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider line-clamp-1">{category}</span>
        <div className="flex gap-1 flex-shrink-0">
          {source === 'AI' && (
            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded flex items-center gap-1"><Sparkles size={12} /> AI</span>
          )}
          {isPractice && (
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1"><User size={12} /> Practice</span>
          )}
          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">NSQF L{nsqfLevel}</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-dark mb-3">{title}</h3>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
        <div className="flex items-center"><Clock size={16} className="mr-1" />{duration} mins</div>
        <div className="flex items-center"><Award size={16} className="mr-1" />{questionCount ?? 0} Qs</div>
        {proctored && <div className="flex items-center text-blue-600"><ShieldCheck size={16} className="mr-1" />AI proctored</div>}
      </div>

      {attempts > 0 && (
        <div className={`text-xs mb-4 px-3 py-2 rounded-lg ${passed ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
          Best score {bestPercentage}% · {attempts} attempt{attempts > 1 ? 's' : ''} · {passed ? 'Passed' : `Pass mark ${passingPercent}%`}
        </div>
      )}

      <div className="mt-auto">
        {locked ? (
          <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2 rounded-lg font-medium text-sm">
            <Lock size={16} />
            Pass Level {nsqfLevel - 1} to unlock
          </div>
        ) : (
          <button
            onClick={() => navigate(`/student/assessments/take/${id}`)}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white py-2 rounded-lg font-medium transition-colors"
          >
            {attempts > 0 ? <RotateCcw size={18} /> : <PlayCircle size={18} />}
            {attempts > 0 ? 'Retake Assessment' : 'Start Assessment'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AssessmentCard;

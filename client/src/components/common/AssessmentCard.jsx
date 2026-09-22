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
    <div className={`group relative bg-white rounded-2xl border p-5 transition-all duration-300 flex flex-col overflow-hidden ${locked ? 'border-gray-100 opacity-75' : 'border-gray-100 hover:border-indigo-200 hover:shadow-card hover:-translate-y-1'}`}>
      
      {!locked && <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/40 group-hover:to-purple-50/20 transition-all duration-500 rounded-2xl pointer-events-none" />}

      <div className="relative">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider line-clamp-1">{category}</span>
          <div className="flex gap-1 flex-shrink-0">
            {source === 'AI' && (
              <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded flex items-center gap-1"><Sparkles size={12} /> AI</span>
            )}
            {isPractice && (
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded flex items-center gap-1"><User size={12} /> Practice</span>
            )}
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-1 rounded">NSQF L{nsqfLevel}</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-dark mb-3 leading-tight">{title}</h3>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-4 font-medium">
          <div className="flex items-center gap-1"><Clock size={14} className="text-indigo-400" />{duration} mins</div>
          <div className="flex items-center gap-1"><Award size={14} className="text-indigo-400" />{questionCount ?? 0} Qs</div>
          {proctored && <div className="flex items-center gap-1 text-emerald-600"><ShieldCheck size={14} />AI Proctored</div>}
        </div>

        {attempts > 0 && (
          <div className={`text-xs mb-4 px-3 py-2.5 rounded-xl font-medium border ${passed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
            <span className="font-bold">Best Score: {bestPercentage}%</span> • {attempts} attempt{attempts > 1 ? 's' : ''} • {passed ? 'Passed' : `Pass Mark: ${passingPercent}%`}
          </div>
        )}

        <div className="mt-auto">
          {locked ? (
            <div className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-500 py-2.5 rounded-xl font-medium text-sm">
              <Lock size={16} />
              Pass Level {nsqfLevel - 1} to unlock
            </div>
          ) : (
            <button
              onClick={() => navigate(`/student/assessments/take/${id}`)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all group/btn ${
                passed || attempts > 0
                  ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 shadow-sm'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-glow active:scale-95'
              }`}
            >
              {passed || attempts > 0 ? (
                <><RotateCcw size={16} className="group-hover/btn:-rotate-180 transition-transform duration-500" /> Retake Assessment</>
              ) : (
                <><PlayCircle size={16} className="group-hover/btn:scale-110 transition-transform" /> Start Assessment</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentCard;

import React from 'react';
import { MapPin, Clock, Building, ArrowRight } from 'lucide-react';

const TYPE_STYLES = {
  internship: 'bg-violet-100 text-violet-700 border-violet-200',
  job: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  research: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  fdp: 'bg-orange-100 text-orange-700 border-orange-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

const OpportunityCard = ({ title, company, location, type, stipend, tags, onApply }) => {
  const typeLower = (type || '').toLowerCase();
  const typeStyle = TYPE_STYLES[typeLower] || TYPE_STYLES.default;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-card hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/50 group-hover:to-purple-50/30 transition-all duration-500 rounded-2xl pointer-events-none" />
      
      <div className="relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">{title}</h3>
            <div className="flex items-center text-gray-500 mt-1 text-sm">
              <Building size={13} className="mr-1.5 text-indigo-400" />
              <span>{company}</span>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize shrink-0 ml-2 ${typeStyle}`}>
            {type}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
          {location && (
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-indigo-400" />
              {location}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-indigo-400" />
            2 days ago
          </div>
          {stipend && <span className="text-indigo-600 font-semibold">{stipend}</span>}
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => (
              <span key={tag} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {onApply && (
          <button
            onClick={onApply}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all hover:shadow-glow active:scale-95 group/btn"
          >
            Apply Now <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;

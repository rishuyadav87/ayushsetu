import React from 'react';
import { MapPin, Clock, DollarSign, Building } from 'lucide-react';

const OpportunityCard = ({ title, company, location, type, stipend, tags, onApply }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-dark">{title}</h3>
          <div className="flex items-center text-gray-600 mt-1">
            <Building size={16} className="mr-1" />
            <span className="text-sm font-medium">{company}</span>
          </div>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium capitalize">
          {type}
        </span>
      </div>
      
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        <div className="flex items-center">
          <MapPin size={16} className="mr-1 text-gray-400" />
          {location}
        </div>
        {stipend && (
          <div className="flex items-center">
            <DollarSign size={16} className="mr-1 text-gray-400" />
            {stipend}
          </div>
        )}
        <div className="flex items-center">
          <Clock size={16} className="mr-1 text-gray-400" />
          2 days ago
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags && tags.map(tag => (
          <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button 
          onClick={onApply}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default OpportunityCard;

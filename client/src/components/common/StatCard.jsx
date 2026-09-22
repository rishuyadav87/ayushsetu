import React from 'react';

const StatCard = ({ title, value, icon, trend, trendValue, colorClass = "text-primary bg-primary/10", gradient }) => {
  return (
    <div className="relative group bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 cursor-default">
      {/* Gradient top strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${gradient || 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} />
      
      <div className="p-6 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-auto flex items-center text-xs">
            <span className={`font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
            <span className="text-gray-400 ml-2">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

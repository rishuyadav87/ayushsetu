import React from 'react';

const SkillBadge = ({ skill, level }) => {
  // level could be 'beginner', 'intermediate', 'advanced'
  const getLevelColor = () => {
    switch(level) {
      case 'advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'beginner': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center border rounded-full px-3 py-1 text-sm font-medium ${getLevelColor()}`}>
      {skill}
    </div>
  );
};

export default SkillBadge;

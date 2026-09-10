import React from 'react';
import { getStatusColor } from '../../utils/helpers';

const ApplicationStatusBadge = ({ status }) => {
  const colorClass = getStatusColor(status);
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {status}
    </span>
  );
};

export default ApplicationStatusBadge;

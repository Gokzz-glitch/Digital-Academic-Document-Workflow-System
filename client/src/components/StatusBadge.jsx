import React from 'react';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'unknown';
  
  const statusConfig = {
    draft: { color: 'bg-slate-100 text-slate-800', label: 'Draft' },
    submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    in_review: { color: 'bg-amber-100 text-amber-800', label: 'In Review' },
    approved: { color: 'bg-emerald-100 text-emerald-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    revision_requested: { color: 'bg-orange-100 text-orange-800', label: 'Revision Requested' },
    completed: { color: 'bg-teal-100 text-teal-800', label: 'Completed' },
    unknown: { color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
  };

  const config = statusConfig[normalizedStatus] || statusConfig.unknown;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;

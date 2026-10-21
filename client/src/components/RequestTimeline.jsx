import React from 'react';
import { format } from 'date-fns';
import { FiCheckCircle, FiXCircle, FiClock, FiEdit2 } from 'react-icons/fi';

const RequestTimeline = ({ history = [] }) => {
  const getIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'approved': return <FiCheckCircle className="text-emerald-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      case 'submitted': return <FiClock className="text-blue-500" />;
      case 'revision_requested': return <FiEdit2 className="text-orange-500" />;
      default: return <FiClock className="text-slate-400" />;
    }
  };

  return (
    <div className="relative border-l border-slate-200 ml-3 py-2 space-y-6">
      {history.map((item, idx) => (
        <div key={idx} className="relative pl-6">
          <span className="absolute -left-3 top-1 bg-white p-1 rounded-full border border-slate-200">
            {getIcon(item.action)}
          </span>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {item.action.charAt(0).toUpperCase() + item.action.slice(1).replace('_', ' ')} by {item.performerName || 'System'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Stage: {item.stageName}</p>
              {item.comments && (
                <div className="mt-2 bg-slate-50 p-3 rounded-md text-sm text-slate-700 border border-slate-100">
                  <span className="font-medium">Comments:</span> {item.comments}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {item.timestamp ? format(new Date(item.timestamp), 'MMM d, yyyy h:mm a') : 'N/A'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestTimeline;

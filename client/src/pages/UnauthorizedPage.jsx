import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl mb-6">
        <span className="font-bold">!</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Access Denied</h1>
      <p className="text-slate-500 mt-2 mb-8 text-center max-w-md">
        You don't have permission to view this page. Please contact an administrator if you believe this is a mistake.
      </p>
      <Link 
        to="/dashboard" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;

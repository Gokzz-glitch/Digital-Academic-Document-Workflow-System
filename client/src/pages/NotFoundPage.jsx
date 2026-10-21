import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <h1 className="text-9xl font-black text-slate-200">404</h1>
      <p className="text-2xl font-bold text-slate-800 mt-4">Page Not Found</p>
      <p className="text-slate-500 mt-2 mb-8 text-center max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;

import React, { useEffect, useState } from 'react';
import { getDashboardStats, getSystemHealth } from '../../api/admin.api';
import StatsCard from '../../components/StatsCard';
import { FiUsers, FiFileText, FiClock, FiLayers, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [res, healthRes] = await Promise.all([getDashboardStats(), getSystemHealth().catch(() => null)]);
        setStats(res.data.data);
        setHealth(healthRes?.data?.status === 'ready' ? 'online' : 'offline');
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">System overview and analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard icon={FiUsers} label="Total Users" count={stats?.totalUsers || 0} colorClass="text-blue-600 bg-blue-50" />
        <StatsCard icon={FiFileText} label="Total Requests" count={stats?.totalRequests || 0} colorClass="text-indigo-600 bg-indigo-50" />
        <StatsCard icon={FiClock} label="Pending Requests" count={stats?.pendingRequests || 0} colorClass="text-amber-600 bg-amber-50" />
        <StatsCard icon={FiLayers} label="Active Doc Types" count={stats?.activeDocTypes || 0} colorClass="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-semibold text-slate-900">Academic workflow setup</h2>
        <p className="mt-1 text-sm text-slate-600">Add active advisors, HODs, and Academic Office staff for the departments in your institution. Requests pause safely when a workflow stage has no assigned approver.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {user?.role === 'super_admin' && <a href="/admin/users" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Create staff accounts</a>}
          <a href="/admin/document-types" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100">Review request forms and stages</a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/users" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center">
              <FiUsers className="w-6 h-6 text-blue-600 mb-2" />
              <span className="font-medium text-slate-700">Manage Users</span>
            </a>
            <a href="/admin/document-types" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center">
              <FiLayers className="w-6 h-6 text-emerald-600 mb-2" />
              <span className="font-medium text-slate-700">Document Types</span>
            </a>
            <a href="/requests/all" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center col-span-2">
              <FiFileText className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="font-medium text-slate-700">View All Requests</span>
            </a>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Database Connection</span>
              <span className={`flex items-center gap-2 text-sm font-medium ${health === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>{health === 'online' ? <FiCheckCircle /> : <FiAlertCircle />}{health === 'online' ? 'Online' : 'Unavailable'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">API Status</span>
              <span className={`flex items-center gap-2 text-sm font-medium ${health === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>{health === 'online' ? <FiCheckCircle /> : <FiAlertCircle />}{health === 'online' ? 'Online' : 'Unavailable'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Storage System</span>
              <span className="text-sm font-medium text-slate-600">Local server storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

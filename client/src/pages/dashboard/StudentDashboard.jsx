import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests, getRequestStats } from '../../api/request.api';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reqRes] = await Promise.all([
          getRequestStats(),
          getMyRequests({ limit: 5 })
        ]);
        setStats(statsRes.data.data);
        setRecentRequests(reqRes.data.data.requests || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { header: 'Doc ID', accessor: 'documentId' },
    { header: 'Type', cell: (row) => row.documentType?.name || 'Unknown' },
    { header: 'Submitted', cell: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Current Stage', cell: (row) => row.status === 'completed' ? 'Completed' : row.status === 'in_review' ? 'In review' : row.status === 'revision_requested' ? 'Needs revision' : row.status === 'rejected' ? 'Closed' : 'Submitted' },
    { 
      header: 'Action', 
      cell: (row) => (
        <button 
          onClick={() => navigate(`/requests/${row._id}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Here's an overview of your document requests.</p>
        </div>
        <Link 
          to="/requests/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <FiPlus /> New Request
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard icon={FiFileText} label="Total Requests" count={stats.total} colorClass="text-blue-600 bg-blue-50" />
        <StatsCard icon={FiClock} label="Pending" count={stats.pending} colorClass="text-amber-600 bg-amber-50" />
        <StatsCard icon={FiCheckCircle} label="Completed" count={stats.completed} colorClass="text-emerald-600 bg-emerald-50" />
        <StatsCard icon={FiXCircle} label="Rejected" count={stats.rejected} colorClass="text-red-600 bg-red-50" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Recent Requests</h2>
          <Link to="/requests/my" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all
          </Link>
        </div>
        <DataTable 
          columns={columns} 
          data={recentRequests} 
          loading={loading} 
          emptyTitle="No requests yet"
          emptyDesc="You haven't submitted any document requests."
        />
      </div>
    </div>
  );
};

export default StudentDashboard;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingApprovals, getRequestStats } from '../../api/request.api';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { FiCheckSquare, FiCheckCircle, FiXCircle, FiLayers } from 'react-icons/fi';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const ApproverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0, totalProcessed: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reqRes] = await Promise.all([
          getRequestStats(),
          getPendingApprovals({ limit: 5 })
        ]);
        setStats(statsRes.data.data);
        setPendingRequests(reqRes.data.data.requests || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { header: 'Student', cell: (row) => <div><p className="font-medium">{row.student?.name}</p><p className="text-xs text-slate-500">{row.student?.rollNumber}</p></div> },
    { header: 'Type', cell: (row) => row.documentType?.name || 'Unknown' },
    { header: 'Department', cell: (row) => row.student?.department || 'N/A' },
    { header: 'Submitted', cell: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
    { header: 'Priority', cell: (row) => <span className={`px-2 py-1 text-xs font-medium rounded ${row.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{row.priority?.toUpperCase() || 'NORMAL'}</span> },
    { 
      header: 'Action', 
      cell: (row) => (
        <button 
          onClick={() => navigate(`/requests/${row._id}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-3 py-1 rounded-md transition-colors"
        >
          Review
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approvals Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Manage and review student document requests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard icon={FiCheckSquare} label="Pending Review" count={stats.pending || 0} colorClass="text-amber-600 bg-amber-50" />
        <StatsCard icon={FiCheckCircle} label="Approved" count={stats.approved || 0} colorClass="text-emerald-600 bg-emerald-50" />
        <StatsCard icon={FiXCircle} label="Rejected" count={stats.rejected || 0} colorClass="text-red-600 bg-red-50" />
        <StatsCard icon={FiLayers} label="Total Processed" count={stats.totalProcessed || 0} colorClass="text-blue-600 bg-blue-50" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Action Required</h2>
          <Link to="/requests/pending" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all pending
          </Link>
        </div>
        <DataTable 
          columns={columns} 
          data={pendingRequests} 
          loading={loading} 
          emptyTitle="All caught up!"
          emptyDesc="There are no pending requests for your review at the moment."
        />
      </div>
    </div>
  );
};

export default ApproverDashboard;

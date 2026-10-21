import React, { useEffect, useState } from 'react';
import { getPendingApprovals } from '../../api/request.api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';

const PendingApprovalsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingApprovals(filters);
      setRequests(res.data.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch pending approvals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const columns = [
    { header: 'Student', cell: (row) => <div><p className="font-medium text-slate-800">{row.student?.name}</p><p className="text-xs text-slate-500">{row.student?.rollNumber}</p></div> },
    { header: 'Doc ID', accessor: 'documentId' },
    { header: 'Type', cell: (row) => row.documentType?.name || 'Unknown' },
    { header: 'Department', cell: (row) => row.student?.department || 'N/A' },
    { header: 'Submitted', cell: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
    { header: 'Priority', cell: (row) => <span className={`px-2 py-1 text-[10px] font-bold rounded tracking-wider ${row.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{row.priority?.toUpperCase()}</span> },
    { 
      header: 'Action', 
      cell: (row) => (
        <button 
          onClick={() => navigate(`/requests/${row._id}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
        >
          Review Request
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">Requests waiting for your review and action.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FiFilter className="text-slate-400" />
          <span>Filters can be applied here</span>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={requests} 
        loading={loading} 
        emptyTitle="No pending approvals"
        emptyDesc="You have processed all requests assigned to you."
      />
    </div>
  );
};

export default PendingApprovalsPage;

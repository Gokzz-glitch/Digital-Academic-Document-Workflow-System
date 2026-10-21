import React, { useEffect, useState } from 'react';
import { getMyRequests } from '../../api/request.api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import { FiPlus, FiFilter } from 'react-icons/fi';

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getMyRequests(filters);
      setRequests(res.data.data.requests || []);
      setTotalPages(res.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const columns = [
    { header: 'Doc ID', accessor: 'documentId' },
    { header: 'Document Type', cell: (row) => row.documentType?.name || 'Unknown' },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Submitted', cell: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
    { header: 'Current Stage', cell: (row) => row.status === 'completed' ? 'Completed' : row.status === 'in_review' ? 'In review' : row.status === 'revision_requested' ? 'Needs revision' : row.status === 'rejected' ? 'Closed' : 'Submitted' },
    { 
      header: 'Action', 
      cell: (row) => (
        <button 
          onClick={() => navigate(`/requests/${row._id}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Requests</h1>
          <p className="text-slate-500 text-sm mt-1">View and track all your document requests.</p>
        </div>
        <Link 
          to="/requests/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <FiPlus /> New Request
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FiFilter className="text-slate-400" />
          <select 
            className="form-input text-sm py-1.5"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        {/* Basic Pagination Controls */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <button 
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {filters.page} of {totalPages || 1}</span>
          <button 
            disabled={filters.page === totalPages || totalPages === 0}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={requests} 
        loading={loading} 
        emptyTitle="No requests found"
        emptyDesc="You haven't made any requests matching the current filters."
      />
    </div>
  );
};

export default MyRequestsPage;

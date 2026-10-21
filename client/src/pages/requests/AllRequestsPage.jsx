import React, { useEffect, useState } from 'react';
import { getAllRequests } from '../../api/request.api';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';

const AllRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 15 });
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAllRequests(filters);
      setRequests(res.data.data.requests || []);
      setTotalPages(res.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch all requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const columns = [
    { header: 'Doc ID', accessor: 'documentId' },
    { header: 'Student', cell: (row) => <div><p className="font-medium text-slate-800">{row.student?.name}</p><p className="text-xs text-slate-500">{row.student?.rollNumber}</p></div> },
    { header: 'Type', cell: (row) => row.documentType?.name || 'Unknown' },
    { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Submitted', cell: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy') },
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Requests</h1>
        <p className="text-slate-500 text-sm mt-1">System-wide document request history.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10 w-full"
            placeholder="Search Doc ID or Student..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        
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
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={requests} 
        loading={loading} 
        emptyTitle="No requests found"
        emptyDesc="No requests match your current search and filter criteria."
      />
      <div className="flex items-center justify-end gap-3 text-sm text-slate-600">
        <button disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))} className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
        <span>Page {filters.page} of {totalPages}</span>
        <button disabled={filters.page >= totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))} className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};

export default AllRequestsPage;

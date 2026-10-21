import React, { useEffect, useState } from 'react';
import { getDocumentTypes, toggleDocumentTypeStatus } from '../../api/admin.api';
import DataTable from '../../components/DataTable';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiPower } from 'react-icons/fi';

const DocumentTypesPage = () => {
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDocTypes = async () => {
    setLoading(true);
    try {
      const res = await getDocumentTypes();
      setDocTypes(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      toast.error('Failed to fetch document types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleDocumentTypeStatus(id);
      toast.success(`Document type ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchDocTypes();
    } catch (error) {
      toast.error('Failed to change document type status');
    }
  };

  const columns = [
    { header: 'Name', cell: (row) => <div className="font-medium text-slate-800">{row.name}</div> },
    { header: 'Category', cell: (row) => <span className="capitalize">{row.category}</span> },
    { header: 'Fields', cell: (row) => `${row.customFields?.length || 0} fields` },
    { header: 'Approval Stages', cell: (row) => `${row.approvalChain?.length || 0} stages` },
    { 
      header: 'Status', 
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ) 
    },
    { 
      header: 'Actions', 
      cell: (row) => (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/admin/document-types/${row._id}/edit`)}
            className="text-slate-400 hover:text-blue-600 transition-colors"
            title="Edit Document Type"
          >
            <FiEdit />
          </button>
          <button 
            onClick={() => handleToggleStatus(row._id, row.isActive)}
            className={`${row.isActive ? 'text-red-400 hover:text-red-600' : 'text-emerald-400 hover:text-emerald-600'} transition-colors`}
            title={row.isActive ? "Deactivate" : "Activate"}
          >
            <FiPower />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Document Types</h1>
          <p className="text-slate-500 text-sm mt-1">Manage document templates and their approval workflows.</p>
        </div>
        <Link 
          to="/admin/document-types/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <FiPlus /> Create New Type
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={docTypes} 
        loading={loading} 
        emptyTitle="No document types found"
        emptyDesc="Create your first document type to get started."
      />
    </div>
  );
};

export default DocumentTypesPage;

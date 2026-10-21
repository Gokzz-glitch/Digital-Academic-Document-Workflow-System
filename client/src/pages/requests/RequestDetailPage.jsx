import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById } from '../../api/request.api';
import { approveRequest, rejectRequest, requestRevision, resubmitRequest } from '../../api/approval.api';
import { downloadDocument } from '../../api/document.api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import RequestTimeline from '../../components/RequestTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FiDownload, FiCheck, FiX, FiEdit2, FiRefreshCw } from 'react-icons/fi';

const RequestDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ show: false, type: '', comments: '' });
  const [submittingAction, setSubmittingAction] = useState(false);
  const [resubmitData, setResubmitData] = useState({});
  const [isResubmitting, setIsResubmitting] = useState(false);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await getRequestById(id);
      setRequest(res.data.data);
      if (res.data.data.status === 'revision_requested') {
        setResubmitData(res.data.data.formData);
      }
    } catch (error) {
      toast.error('Failed to load request details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleAction = async () => {
    if (!actionModal.comments && actionModal.type !== 'approve') {
      return toast.error('Comments are required for this action');
    }
    
    setSubmittingAction(true);
    try {
      if (actionModal.type === 'approve') await approveRequest(id, actionModal.comments);
      else if (actionModal.type === 'reject') await rejectRequest(id, actionModal.comments);
      else if (actionModal.type === 'revise') await requestRevision(id, actionModal.comments);
      
      toast.success(`Request ${actionModal.type}d successfully`);
      setActionModal({ show: false, type: '', comments: '' });
      fetchRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${actionModal.type} request`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResubmit = async () => {
    setIsResubmitting(true);
    try {
      await resubmitRequest(id, { formData: resubmitData });
      toast.success('Request resubmitted successfully');
      fetchRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resubmit request');
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${request.documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;
  if (!request) return null;

  const canApprove = request.currentStageRole === user.role && 
                     ['submitted', 'in_review'].includes(request.status) &&
                     (!request.currentStageDepartment || request.currentStageDepartment === user.department);

  const isStudentOwner = user.role === 'student' && request.student._id === user.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">{request.documentType?.name}</h1>
            <StatusBadge status={request.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>ID: <span className="font-medium text-slate-700">{request.documentId}</span></span>
            <span>•</span>
            <span>Submitted: <span className="font-medium text-slate-700">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span></span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${request.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
              {request.priority?.toUpperCase()} PRIORITY
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {request.status === 'completed' && (
            <button 
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <FiDownload /> Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Form Data */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">Submitted Information</h2>
            </div>
            <div className="p-6">
              {isStudentOwner && request.status === 'revision_requested' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 mb-6">
                    <p className="font-medium flex items-center gap-2"><FiEdit2 /> Revision Requested</p>
                    <p className="mt-1">Please update your information below and resubmit.</p>
                  </div>
                  
                  {Object.entries(request.formData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input 
                        type="text" 
                        value={resubmitData[key] || ''} 
                        onChange={(e) => setResubmitData({...resubmitData, [key]: e.target.value})}
                        className="form-input w-full"
                      />
                    </div>
                  ))}
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleResubmit}
                      disabled={isResubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isResubmitting ? <LoadingSpinner size="sm" /> : <><FiRefreshCw /> Resubmit Request</>}
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {Object.entries(request.formData).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </dt>
                      <dd className="text-sm font-medium text-slate-800 break-words">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          {/* Approver Actions */}
          {canApprove && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800">Your Action Required</h2>
              </div>
              <div className="p-6 flex flex-wrap gap-3">
                <button 
                  onClick={() => setActionModal({ show: true, type: 'approve', comments: '' })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <FiCheck /> Approve Request
                </button>
                <button 
                  onClick={() => setActionModal({ show: true, type: 'revise', comments: '' })}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <FiEdit2 /> Request Revision
                </button>
                <button 
                  onClick={() => setActionModal({ show: true, type: 'reject', comments: '' })}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <FiX /> Reject Request
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Applicant Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">Applicant Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Name</p>
                <p className="text-sm font-medium text-slate-800">{request.student?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Roll Number</p>
                <p className="text-sm font-medium text-slate-800">{request.student?.rollNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Department</p>
                <p className="text-sm font-medium text-slate-800">{request.student?.department} (Year {request.student?.year})</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-sm font-medium text-slate-800">{request.student?.email}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">Approval History</h2>
            </div>
            <div className="p-6">
              <RequestTimeline history={request.history} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 capitalize">{actionModal.type} Request</h3>
              <button onClick={() => setActionModal({ show: false, type: '', comments: '' })} className="text-slate-400 hover:text-slate-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comments {actionModal.type !== 'approve' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows="4"
                className="form-input w-full"
                placeholder={`Enter reason for ${actionModal.type}...`}
                value={actionModal.comments}
                onChange={(e) => setActionModal({ ...actionModal, comments: e.target.value })}
              ></textarea>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setActionModal({ show: false, type: '', comments: '' })}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={submittingAction}
                className={`px-6 py-2 rounded-lg text-sm font-medium text-white shadow-sm flex items-center gap-2 ${
                  actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-500 hover:bg-orange-600'
                } disabled:opacity-50`}
              >
                {submittingAction ? <LoadingSpinner size="sm" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailPage;

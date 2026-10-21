import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyDocument } from '../../api/document.api';
import { FiCheckCircle, FiXCircle, FiSearch, FiFileText } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';

const VerifyDocumentPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(uid || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (uidToVerify) => {
    if (!uidToVerify) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await verifyDocument(uidToVerify);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or unauthorized document UID');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uid) {
      handleVerify(uid);
    }
  }, [uid]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (searchInput) {
      navigate(`/verify/${searchInput}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mb-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl mb-6">
          DW
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Document Verification</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the unique document ID or scan the QR code on the document to verify its authenticity.
        </p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50"
                placeholder="Enter Document UID e.g. DOC-123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              Verify
            </button>
          </form>

          <div className="mt-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-slate-500 mt-4">Verifying digital signature...</p>
              </div>
            ) : result ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                <div className="bg-emerald-500 px-4 py-3 flex items-center justify-center gap-2 text-white">
                  <FiCheckCircle className="w-6 h-6" />
                  <span className="font-bold text-lg tracking-wide">AUTHENTIC DOCUMENT</span>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Document Type</p>
                    <p className="text-slate-800 font-medium flex items-center gap-2">
                      <FiFileText className="text-emerald-500" /> {result.documentType?.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Student Name</p>
                      <p className="text-slate-800 font-medium">{result.student?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Roll Number</p>
                      <p className="text-slate-800 font-medium">{result.student?.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Department</p>
                      <p className="text-slate-800 font-medium">{result.student?.department}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Issue Date</p>
                      <p className="text-slate-800 font-medium">{format(new Date(result.updatedAt || result.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <FiXCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-800 mb-1">Verification Failed</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Enter a document UID above to verify its authenticity.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Digital Academic Document Workflow System
      </div>
    </div>
  );
};

export default VerifyDocumentPage;

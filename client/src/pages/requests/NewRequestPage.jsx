import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableDocumentTypes, createRequest } from '../../api/request.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiFileText, FiArrowRight, FiArrowLeft, FiUploadCloud } from 'react-icons/fi';

const NewRequestPage = () => {
  const [step, setStep] = useState(1);
  const [docTypes, setDocTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchDocTypes = async () => {
    setLoading(true);
    try {
      setLoadError('');
      const res = await getAvailableDocumentTypes();
      setDocTypes(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Document types could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocTypes(); }, []);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    const initialData = {};
    (type.customFields || []).forEach(field => {
      initialData[field.fieldName || field.name] = '';
    });
    setFormData(initialData);
    setStep(2);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        documentTypeId: selectedType._id,
        formData: formData
      };
      
      const res = await createRequest(payload);
      toast.success('Request submitted successfully');
      navigate(`/requests/${res.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">New Document Request</h1>
        <p className="text-slate-500 text-sm mt-1">Follow the steps to submit a new request.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative" aria-label={`Step ${step} of 3`}>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-300 -z-10" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>1</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>2</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>3</div>
      </div>

      {step === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Step 1: Select Document Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadError && (
              <div className="col-span-full rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={fetchDocTypes} className="mt-2 font-semibold underline">Try again</button>
              </div>
            )}
            {docTypes.map(type => (
              <button
                type="button"
                key={type._id} 
                onClick={() => handleTypeSelect(type)}
                className="w-full text-left border border-slate-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-md transition-all bg-slate-50 hover:bg-blue-50/30 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm group-hover:text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">{type.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
            {!loadError && docTypes.length === 0 && (
              <div className="col-span-full text-center p-8 text-slate-500">
                <p className="font-medium text-slate-700">No request forms are currently available.</p>
                <p className="mt-1 text-sm">Please contact the Academic Office if you think this is a mistake.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && selectedType && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Step 2: Fill Details</h2>
              <p className="text-sm text-slate-500">{selectedType.name}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <FiArrowLeft /> Back
            </button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-5">
            {(selectedType.customFields || []).map((field, idx) => {
              const fieldName = field.fieldName || field.name;
              const fieldType = field.fieldType || field.type || 'text';
              return (
              <div key={idx}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label || fieldName} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {fieldType === 'text' || fieldType === 'number' || fieldType === 'date' ? (
                  <input
                    type={fieldType}
                    name={fieldName}
                    required={field.required}
                    value={formData[fieldName] || ''}
                    onChange={handleInputChange}
                    className="form-input w-full"
                  />
                ) : fieldType === 'textarea' ? (
                  <textarea
                    name={fieldName}
                    required={field.required}
                    value={formData[fieldName] || ''}
                    onChange={handleInputChange}
                    rows="4"
                    className="form-input w-full"
                  ></textarea>
                ) : fieldType === 'select' ? (
                  <select
                    name={fieldName}
                    required={field.required}
                    value={formData[fieldName] || ''}
                    onChange={handleInputChange}
                    className="form-input w-full"
                  >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : fieldType === 'file' ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                    <FiUploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="mt-2 text-sm text-slate-600">
                      <p>File uploads are not enabled for this form yet. Contact the Academic Office for an alternate submission method.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )})}
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                Continue to Review <FiArrowRight />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && selectedType && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Step 3: Review & Submit</h2>
              <p className="text-sm text-slate-500">Please verify your details before submitting.</p>
            </div>
            <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <FiArrowLeft /> Back
            </button>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4 mb-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Document Type</h4>
              <p className="text-slate-800 font-medium">{selectedType.name}</p>
            </div>
            <div className="h-px bg-slate-200"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              {(selectedType.customFields || []).map((field, idx) => {
                const fieldName = field.fieldName || field.name;
                const fieldType = field.fieldType || field.type;
                return (
                <div key={idx}>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field.label || fieldName}</h4>
                  <p className="text-slate-800">{formData[fieldName] || '-'}</p>
                </div>
              )})}
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit Details
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {submitting ? <LoadingSpinner size="sm" /> : 'Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRequestPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createDocumentType, getDocumentTypeById, updateDocumentType } from '../../api/admin.api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';

const CreateDocumentTypePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'academic',
    customFields: [],
    approvalChain: []
  });

  useEffect(() => {
    if (isEdit) {
      const fetchDocType = async () => {
        try {
          const res = await getDocumentTypeById(id);
          const documentType = res.data.data;
          setFormData({
            ...documentType,
            customFields: (documentType.customFields || []).map((field) => ({
              ...field,
              name: field.fieldName || field.name,
              type: field.fieldType || field.type || 'text',
            })),
            approvalChain: (documentType.approvalChain || []).map((stage) => ({
              ...stage,
            })),
          });
        } catch (error) {
          toast.error('Failed to load document type');
          navigate('/admin/document-types');
        } finally {
          setLoading(false);
        }
      };
      fetchDocType();
    }
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Custom Fields Logic
  const addField = () => {
    setFormData({
      ...formData,
      customFields: [...formData.customFields, { name: '', label: '', type: 'text', required: true, options: [] }]
    });
  };

  const updateField = (index, key, value) => {
    const updated = [...formData.customFields];
    updated[index][key] = value;
    
    // Auto-generate name from label if name is empty
    if (key === 'label' && !updated[index].name) {
      updated[index].name = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    setFormData({ ...formData, customFields: updated });
  };

  const removeField = (index) => {
    const updated = [...formData.customFields];
    updated.splice(index, 1);
    setFormData({ ...formData, customFields: updated });
  };

  // Approval Chain Logic
  const addStage = () => {
    setFormData({
      ...formData,
      approvalChain: [...formData.approvalChain, { stageName: '', role: 'class_advisor' }]
    });
  };

  const updateStage = (index, key, value) => {
    const updated = [...formData.approvalChain];
    updated[index][key] = value;
    setFormData({ ...formData, approvalChain: updated });
  };

  const removeStage = (index) => {
    const updated = [...formData.approvalChain];
    updated.splice(index, 1);
    // update sequence numbers implicitly based on index
    setFormData({ ...formData, approvalChain: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.approvalChain.length === 0) {
      return toast.error('Please add at least one approval stage');
    }
    
    // Add sequence numbers to approval chain
    const payload = {
      ...formData,
      customFields: formData.customFields.map(({ name, fieldName, type, fieldType, ...field }) => ({
        ...field,
        fieldName: fieldName || name || field.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        fieldType: fieldType || type || 'text',
      })),
      approvalChain: formData.approvalChain.map((stage, idx) => ({
        stage: idx + 1,
        stageName: stage.stageName,
        role: stage.role,
        ...(['class_advisor', 'hod'].includes(stage.role) ? { department: 'student' } : stage.department ? { department: stage.department } : {}),
      })),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateDocumentType(id, payload);
        toast.success('Document type updated successfully');
      } else {
        await createDocumentType(payload);
        toast.success('Document type created successfully');
      }
      navigate('/admin/document-types');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save document type');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/document-types')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <FiArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Document Type' : 'Create Document Type'}</h1>
          <p className="text-slate-500 text-sm mt-1">Configure form fields and approval workflow.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input required name="name" value={formData.name} onChange={handleInputChange} className="form-input w-full" placeholder="e.g. Bonafide Certificate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="form-input w-full">
                <option value="academic">Academic</option>
                <option value="administrative">Administrative</option>
                <option value="financial">Financial</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="2" className="form-input w-full" placeholder="Brief description of what this document is for..."></textarea>
            </div>
          </div>
        </div>

        {/* Custom Fields Builder */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
            <h2 className="font-semibold text-slate-800">Form Fields</h2>
            <button type="button" onClick={addField} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-800">
              <FiPlus /> Add Field
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.customFields.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No fields added. The form will be empty.</p>
            ) : (
              formData.customFields.map((field, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-start bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Field Label *</label>
                    <input required type="text" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)} className="form-input w-full py-1.5 text-sm" placeholder="e.g. Purpose of Visit" />
                  </div>
                  <div className="w-full sm:w-1/4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select value={field.type} onChange={(e) => updateField(idx, 'type', e.target.value)} className="form-input w-full py-1.5 text-sm">
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                  <div className="w-full sm:w-auto flex items-center gap-4 mt-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, 'required', e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      Required
                    </label>
                  </div>
                  {field.type === 'select' && (
                    <div className="w-full mt-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Options (comma separated)</label>
                      <input type="text" value={field.options?.join(', ') || ''} onChange={(e) => updateField(idx, 'options', e.target.value.split(',').map(s=>s.trim()))} className="form-input w-full py-1.5 text-sm" placeholder="Option 1, Option 2" />
                    </div>
                  )}
                  <button type="button" onClick={() => removeField(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Approval Chain Builder */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
            <h2 className="font-semibold text-slate-800">Approval Workflow</h2>
            <button type="button" onClick={addStage} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-800">
              <FiPlus /> Add Stage
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.approvalChain.length === 0 ? (
              <p className="text-sm text-red-500 text-center py-4">You must add at least one approval stage.</p>
            ) : (
              formData.approvalChain.map((stage, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Stage Name *</label>
                    <input required type="text" value={stage.stageName} onChange={(e) => updateStage(idx, 'stageName', e.target.value)} className="form-input w-full py-1.5 text-sm" placeholder="e.g. Faculty Approval" />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Approver Role</label>
                    <select value={stage.role} onChange={(e) => updateStage(idx, 'role', e.target.value)} className="form-input w-full py-1.5 text-sm">
                      <option value="class_advisor">Class Advisor</option>
                      <option value="hod">HOD</option>
                      <option value="dean">Dean</option>
                      <option value="admin_staff">Admin Staff</option>
                    </select>
                  </div>
                  <div className="w-full sm:w-auto text-xs text-slate-500">
                    {['class_advisor', 'hod'].includes(stage.role) ? 'Routes to the student’s department' : 'Routes to any active approver with this role'}
                  </div>
                  <button type="button" onClick={() => removeStage(idx)} className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <LoadingSpinner size="sm" /> : <><FiSave /> Save Document Type</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDocumentTypePage;

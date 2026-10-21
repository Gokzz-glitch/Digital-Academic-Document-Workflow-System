import api from './axios';

export const getAllUsers = (params) => api.get('/admin/users', { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const createUser = (data) => api.post('/admin/users', data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const toggleUserStatus = (id) => api.put(`/admin/users/${id}/toggle-status`);

export const getDocumentTypes = (params) => api.get('/admin/document-types', { params });
export const getDocumentTypeById = (id) => api.get(`/admin/document-types/${id}`);
export const createDocumentType = (data) => api.post('/admin/document-types', data);
export const updateDocumentType = (id, data) => api.put(`/admin/document-types/${id}`, data);
export const toggleDocumentTypeStatus = (id) => api.put(`/admin/document-types/${id}/toggle-status`);

export const getDashboardStats = () => api.get('/admin/dashboard-stats');
export const getSystemHealth = () => api.get('/health');

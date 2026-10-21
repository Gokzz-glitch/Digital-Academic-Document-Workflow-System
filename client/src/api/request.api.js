import api from './axios';

export const createRequest = (data) => api.post('/requests', data);
export const getAvailableDocumentTypes = () => api.get('/requests/document-types');
export const getMyRequests = (params) => api.get('/requests/my', { params });
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const getPendingApprovals = (params) => api.get('/requests/pending', { params });
export const getRequestStats = () => api.get('/requests/stats');
export const getAllRequests = (params) => api.get('/requests/all', { params });

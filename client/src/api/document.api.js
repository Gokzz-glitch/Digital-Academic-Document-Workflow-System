import api from './axios';

export const downloadDocument = (requestId) => api.get(`/documents/download/${requestId}`, { responseType: 'blob' });
export const verifyDocument = (uid) => api.get(`/documents/verify/${uid}`);

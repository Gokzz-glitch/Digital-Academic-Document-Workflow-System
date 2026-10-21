import api from './axios';

export const approveRequest = (id, comments) => api.post(`/approvals/${id}/approve`, { comments });
export const rejectRequest = (id, reason) => api.post(`/approvals/${id}/reject`, { reason });
export const requestRevision = (id, comments) => api.post(`/approvals/${id}/revise`, { comments });
export const resubmitRequest = (id, data) => api.post(`/approvals/${id}/resubmit`, data);

import api from '../api/axios';

export const getEstimations = (params) => api.get('/estimations', { params });
export const getEstimationStats = () => api.get('/estimations/stats');
export const getEstimationById = (id) => api.get(`/estimations/${id}`);
export const createEstimation = (data) => api.post('/estimations', data);
export const updateEstimation = (id, data) => api.put(`/estimations/${id}`, data);
export const updateEstimationStatus = (id, status) => api.patch(`/estimations/${id}/status`, { status });
export const duplicateEstimation = (id) => api.post(`/estimations/${id}/duplicate`);
export const deleteEstimation = (id) => api.delete(`/estimations/${id}`);
export const getEstimationHtml = (id) => api.get(`/estimations/${id}/render-html`);
export const uploadArchImage = (id, formData) => api.post(`/estimations/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteArchImage = (id, index) => api.delete(`/estimations/${id}/images/${index}`);
export const getCatalog = () => api.get('/estimations/catalog');
export const updateCatalog = (data) => api.put('/estimations/catalog', data);
export const importCatalog = (data) => api.post('/estimations/catalog/import', data);

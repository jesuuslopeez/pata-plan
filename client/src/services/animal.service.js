import api from './api';

export const getAnimals = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.groupId) params.append('groupId', filters.groupId);
  if (filters.species) params.append('species', filters.species);
  if (filters.search) params.append('search', filters.search);
  const query = params.toString();
  return api.get(`/animals${query ? `?${query}` : ''}`);
};

export const getAnimal = (id) => api.get(`/animals/${id}`);

export const createAnimal = (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== '' && value != null) {
      formData.append(key, value);
    }
  });
  return api.post('/animals', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateAnimal = (id, data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== '' && value != null) {
      formData.append(key, value);
    }
  });
  return api.put(`/animals/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAnimal = (id) => api.delete(`/animals/${id}`);

export const getAnimalEvents = (id) => api.get(`/animals/${id}/events`);

export const completeEvent = (id, data = {}) => api.patch(`/events/${id}/complete`, data);

export const createAnimalEvent = (animalId, data) => api.post(`/animals/${animalId}/events`, data);

export const getAnimalWeights = (id) => api.get(`/animals/${id}/weights`);

export const createAnimalWeight = (animalId, data) => api.post(`/animals/${animalId}/weights`, data);

export const updateWeight = (weightId, data) => api.put(`/weights/${weightId}`, data);

export const deleteWeight = (weightId) => api.delete(`/weights/${weightId}`);

export const getAnimalVisits = (id) => api.get(`/animals/${id}/visits`);

export const createAnimalVisit = (animalId, data) => api.post(`/animals/${animalId}/visits`, data);

export const updateVisit = (visitId, data) => api.put(`/visits/${visitId}`, data);

export const deleteVisit = (visitId) => api.delete(`/visits/${visitId}`);

export const getAnimalDocuments = (id) => api.get(`/animals/${id}/documents`);

export const uploadDocument = (id, formData) =>
  api.post(`/animals/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export const updateDocument = (id, data) => api.patch(`/documents/${id}`, data);

export const downloadAnimalReport = (id) =>
  api.get(`/animals/${id}/report`, { responseType: 'blob' });

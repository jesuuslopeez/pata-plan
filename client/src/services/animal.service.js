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

export const deleteAnimal = (id) => api.delete(`/animals/${id}`);

export const getAnimalEvents = (id) => api.get(`/animals/${id}/events`);

export const completeEvent = (id, data = {}) => api.patch(`/events/${id}/complete`, data);

export const getAnimalWeights = (id) => api.get(`/animals/${id}/weights`);

export const getAnimalVisits = (id) => api.get(`/animals/${id}/visits`);

export const getAnimalDocuments = (id) => api.get(`/animals/${id}/documents`);

export const uploadDocument = (id, formData) =>
  api.post(`/animals/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteDocument = (id) => api.delete(`/documents/${id}`);

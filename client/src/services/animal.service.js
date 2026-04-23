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

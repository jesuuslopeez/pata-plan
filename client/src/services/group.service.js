import api from './api';

export const getGroups = () => api.get('/groups');

export const createGroup = (name) => api.post('/groups', { name });

export const updateGroup = (id, name) => api.put(`/groups/${id}`, { name });

export const deleteGroup = (id) => api.delete(`/groups/${id}`);

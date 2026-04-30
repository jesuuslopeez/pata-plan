import api from './api';

export const getCollaborators = () => api.get('/collaborators');

export const inviteCollaborator = (email) => api.post('/collaborators', { email });

export const removeCollaborator = (id) => api.delete(`/collaborators/${id}`);

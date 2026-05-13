import api from './api';

export const getProtocols = () => api.get('/protocols');

export const getProtocol = (id) => api.get(`/protocols/${id}`);

export const createProtocol = (data) => api.post('/protocols', data);

export const updateProtocol = (id, data) => api.put(`/protocols/${id}`, data);

export const deleteProtocol = (id) => api.delete(`/protocols/${id}`);

export const reorderProtocolSteps = (protocolId, stepIds) =>
  api.put(`/protocols/${protocolId}/steps/reorder`, { stepIds });

export const getEventTypes = () => api.get('/event-types');

export const createEventType = (data) => api.post('/event-types', data);

export const assignProtocolToAnimal = (animalId, payload) =>
  api.post(`/animals/${animalId}/assign-protocol`, payload);

export const getAnimalAssignments = (animalId) =>
  api.get(`/animals/${animalId}/assignments`);

export const cancelAssignment = (assignmentId) =>
  api.patch(`/assignments/${assignmentId}/cancel`);

import api from './api';

export const getInviteCode = (groupId) => api.get(`/groups/${groupId}/invite-code`);

export const regenerateInviteCode = (groupId) => api.post(`/groups/${groupId}/invite-code`);

export const revokeInviteCode = (groupId) => api.delete(`/groups/${groupId}/invite-code`);

export const joinByCode = (code) => api.post('/join', { code });

export const listGroupCollaborators = (groupId) => api.get(`/groups/${groupId}/collaborators`);

export const updateCollaboratorRole = (groupId, membershipId, role) =>
  api.patch(`/groups/${groupId}/collaborators/${membershipId}`, { role });

export const removeGroupCollaborator = (groupId, membershipId) =>
  api.delete(`/groups/${groupId}/collaborators/${membershipId}`);

export const getMyMemberships = () => api.get('/me/memberships');

export const leaveMembership = (membershipId) => api.delete(`/me/memberships/${membershipId}`);

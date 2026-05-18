import api from './api';

export const getDashboard = () => api.get('/dashboard');

export const getAlerts = (limit = 20) => api.get(`/dashboard/alerts?limit=${limit}`);

export const getUpcoming = (days = 7) => api.get(`/dashboard/upcoming?days=${days}`);

export const getGroups = () => api.get('/groups');

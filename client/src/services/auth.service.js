import api from './api';

let authToken = null;

export const setToken = (token) => {
  authToken = token;
};

export const getToken = () => authToken;

export const clearToken = () => {
  authToken = null;
};

// Interceptor: attach token to every request
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const loginRequest = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const registerRequest = (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const getMeRequest = () => {
  return api.get('/auth/me');
};

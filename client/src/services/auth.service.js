import api from './api';

const TOKEN_KEY = 'pataplan.token';

const safeGet = (storage) => {
  try {
    return storage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const safeSet = (storage, value) => {
  try {
    storage.setItem(TOKEN_KEY, value);
  } catch {
    // ignore
  }
};

const safeRemove = (storage) => {
  try {
    storage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

let authToken = safeGet(localStorage) || safeGet(sessionStorage);

export const setToken = (token, { persist = false } = {}) => {
  authToken = token;
  if (!token) {
    safeRemove(localStorage);
    safeRemove(sessionStorage);
    return;
  }
  if (persist) {
    safeSet(localStorage, token);
    safeRemove(sessionStorage);
  } else {
    safeSet(sessionStorage, token);
    safeRemove(localStorage);
  }
};

export const getToken = () => authToken;

export const clearToken = () => {
  authToken = null;
  safeRemove(localStorage);
  safeRemove(sessionStorage);
};

// Interceptor: attach token to every request
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const loginRequest = (email, password, rememberMe = false) => {
  return api.post('/auth/login', { email, password, rememberMe });
};

export const registerRequest = (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const getMeRequest = () => {
  return api.get('/auth/me');
};

export const updateMeRequest = (name, email) => {
  return api.put('/auth/me', { name, email });
};

export const changePasswordRequest = (currentPassword, newPassword) => {
  return api.put('/auth/password', { currentPassword, newPassword });
};

export const verifyEmailRequest = (token) => {
  return api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
};

export const resendVerificationRequest = (email) => {
  return api.post('/auth/resend-verification', { email });
};

export const forgotPasswordRequest = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPasswordRequest = (token, password) => {
  return api.post('/auth/reset-password', { token, password });
};

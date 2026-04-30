import api from './api';

export const getExpenses = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.animalId) params.append('animalId', filters.animalId);
  if (filters.category) params.append('category', filters.category);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.limit !== undefined) params.append('limit', filters.limit);
  if (filters.offset !== undefined) params.append('offset', filters.offset);
  if (filters.sort) params.append('sort', filters.sort);
  const query = params.toString();
  return api.get(`/expenses${query ? `?${query}` : ''}`);
};

export const getExpenseStats = (year) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  const query = params.toString();
  return api.get(`/expenses/stats${query ? `?${query}` : ''}`);
};

export const createExpense = (data) => api.post('/expenses', data);

export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);

export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

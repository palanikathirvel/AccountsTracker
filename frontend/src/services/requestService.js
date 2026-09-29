import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const requestService = {
  // Authentication
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getEmployees: async () => {
    const response = await api.get('/auth/employees');
    return response.data;
  },

  // Requests with role-based filtering
  getRequests: async (email, role) => {
    const params = {};
    if (email) params.email = email;
    if (role) params.role = role;
    const response = await api.get('/requests', { params });
    return response.data;
  },

  getRequestById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  createRequest: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/requests/${id}/status`, { status });
    return response.data;
  },

  getSortedRequests: async () => {
    const response = await api.get('/requests/sorted');
    return response.data;
  },

  getOverdueRequests: async () => {
    const response = await api.get('/requests/overdue');
    return response.data;
  },

  getReminders: async () => {
    const response = await api.get('/reminders');
    return response.data;
  },

  triggerScheduler: async () => {
    const response = await api.post('/scheduler/trigger');
    return response.data;
  },

  // Delete task (Accountant only)
  deleteRequest: async (id) => {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
  },
};

export default requestService;

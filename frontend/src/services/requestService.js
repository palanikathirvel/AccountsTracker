import axios from 'axios';

// Base API URL (proxied by Vite or direct to port 8080)
const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const requestService = {
  // Fetch all requests
  getAllRequests: async () => {
    const response = await api.get('/requests');
    return response.data;
  },

  // Fetch request by ID
  getRequestById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  // Create a new request
  createRequest: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  // Update status of a request (OPEN, IN_PROGRESS, COMPLETED)
  updateStatus: async (id, status) => {
    const response = await api.put(`/requests/${id}/status`, { status });
    return response.data;
  },

  // Get requests sorted by due date ascending
  getSortedRequests: async () => {
    const response = await api.get('/requests/sorted');
    return response.data;
  },

  // Get overdue requests (status = OPEN and due date < today)
  getOverdueRequests: async () => {
    const response = await api.get('/requests/overdue');
    return response.data;
  },

  // Get generated reminders
  getReminders: async () => {
    const response = await api.get('/reminders');
    return response.data;
  },

  // Manually trigger overdue scheduler check
  triggerScheduler: async () => {
    const response = await api.post('/scheduler/trigger');
    return response.data;
  },

  // Seed sample demo data
  seedSampleData: async () => {
    const response = await api.post('/requests/seed');
    return response.data;
  },
};

export default requestService;

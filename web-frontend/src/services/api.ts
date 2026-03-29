import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const pythonApi = axios.create({
  baseURL: import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;

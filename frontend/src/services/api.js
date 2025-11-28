import axios from 'axios';

// En desarrollo recomendamos usar rutas relativas para aprovechar el `proxy`
// configurado en `frontend/package.json` (evita problemas CORS). En producción
// puedes establecer `REACT_APP_API_URL` a la URL completa del backend.
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Configuración de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};

export const verifyToken = () => {
  return api.get('/auth/verify');
};

// Services
export const getAllServices = () => {
  return api.get('/services');
};

export const getActiveServices = () => {
  return api.get('/services/active');
};

export const getInactiveServices = () => {
  return api.get('/services/inactive');
};

export const getServiceStatus = (serviceName) => {
  return api.get(`/services/${serviceName}/status`);
};

export const startService = (serviceName) => {
  return api.post(`/services/${serviceName}/start`);
};

export const stopService = (serviceName) => {
  return api.post(`/services/${serviceName}/stop`);
};

export const restartService = (serviceName) => {
  return api.post(`/services/${serviceName}/restart`);
};

export const getServiceLogs = (serviceName, lines = 100) => {
  return api.get(`/services/${serviceName}/logs?lines=${lines}`);
};

export const enableService = (serviceName) => {
  return api.post(`/services/${serviceName}/enable`);
};

export const disableService = (serviceName) => {
  return api.post(`/services/${serviceName}/disable`);
};

export default api;

import axios from 'axios';

// Use Create React App environment variables (REACT_APP_*) so
// `npm start` (react-scripts) reads them correctly.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// Backend exposes WebSocket on the same port as HTTP by default (8080)
// align default to ws://localhost:8080; override with REACT_APP_WS_URL if needed.
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

// Crear instancia de axios
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Simple retry logic for 429 responses (exponential backoff).
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config || {};

  if (!config || !config.url) return Promise.reject(error);

  const status = error.response ? error.response.status : null;

  if (status === 429) {
    config._retryCount = config._retryCount || 0;

    if (config._retryCount >= 5) {
      return Promise.reject(error);
    }

    config._retryCount += 1;

    // Exponential backoff: 500ms * 2^(retryCount-1)
    const delay = 500 * Math.pow(2, config._retryCount - 1);

    await new Promise((res) => setTimeout(res, delay));

    return api(config);
  }

  return Promise.reject(error);
});

// ============================================
// Servicios
// ============================================

export const getServices = async () => {
  const response = await api.get('/services');
  return response.data;
};

export const getActiveServices = async () => {
  const response = await api.get('/services/active');
  return response.data;
};

export const getInactiveServices = async () => {
  const response = await api.get('/services/inactive');
  return response.data;
};

export const getServiceStatus = async (serviceName) => {
  const response = await api.get(`/services/${serviceName}/status`);
  return response.data;
};

export const getServiceLogs = async (serviceName, lines = 100) => {
  const response = await api.get(`/services/${serviceName}/logs`, {
    params: { lines }
  });
  return response.data;
};

export const startService = async (serviceName) => {
  const response = await api.post(`/services/${serviceName}/start`);
  return response.data;
};

export const stopService = async (serviceName) => {
  const response = await api.post(`/services/${serviceName}/stop`);
  return response.data;
};

export const restartService = async (serviceName) => {
  const response = await api.post(`/services/${serviceName}/restart`);
  return response.data;
};

export const enableService = async (serviceName) => {
  const response = await api.post(`/services/${serviceName}/enable`);
  return response.data;
};

export const disableService = async (serviceName) => {
  const response = await api.post(`/services/${serviceName}/disable`);
  return response.data;
};

export const isServiceActive = async (serviceName) => {
  const response = await api.get(`/services/${serviceName}/is-active`);
  return response.data;
};

// ============================================
// WebSocket para logs en tiempo real
// ============================================

export class LogsWebSocket {
  constructor() {
    this.ws = null;
    this.onMessageCallback = null;
    this.onErrorCallback = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL);
        
        this.ws.onopen = () => {
          console.log('WebSocket conectado');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (this.onMessageCallback) {
              this.onMessageCallback(data);
            }
          } catch (error) {
            console.error('Error al parsear mensaje WebSocket:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('Error en WebSocket:', error);
          
          if (this.onErrorCallback) {
            this.onErrorCallback(error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket cerrado');
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
          }
        };
      } catch (error) {
        console.error('Error al conectar WebSocket:', error);
        reject(error);
      }
    });
  }
  
  subscribe(serviceName) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        service: serviceName
      }));
    }
  }
  
  unsubscribe() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe'
      }));
    }
  }
  
  onMessage(callback) {
    this.onMessageCallback = callback;
  }
  
  onError(callback) {
    this.onErrorCallback = callback;
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default api;
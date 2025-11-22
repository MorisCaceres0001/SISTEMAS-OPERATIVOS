import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';

// Crear instancia de axios
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
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
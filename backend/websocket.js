const WebSocket = require('ws');
const { spawn } = require('child_process');
const { verifyToken } = require('./auth');
const { validateServiceName } = require('./systemctl');

class LogsWebSocketServer {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.activeStreams = new Map();
    
    this.wss.on('connection', (ws, req) => {
      console.log('Nueva conexión WebSocket');
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });
      
      ws.on('close', () => {
        this.cleanup(ws);
      });
      
      ws.on('error', (error) => {
        console.error('Error en WebSocket:', error);
        this.cleanup(ws);
      });
    });
    
    console.log(`WebSocket server iniciado en puerto ${port}`);
  }
  
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'auth':
          this.handleAuth(ws, data);
          break;
        case 'subscribe':
          this.handleSubscribe(ws, data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, data);
          break;
        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Tipo de mensaje no reconocido' 
          }));
      }
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Error al procesar mensaje' 
      }));
    }
  }
  
  handleAuth(ws, data) {
    const { token } = data;
    
    if (!token) {
      ws.send(JSON.stringify({ 
        type: 'auth', 
        success: false, 
        message: 'Token no proporcionado' 
      }));
      ws.close();
      return;
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      ws.send(JSON.stringify({ 
        type: 'auth', 
        success: false, 
        message: 'Token inválido' 
      }));
      ws.close();
      return;
    }
    
    ws.authenticated = true;
    ws.user = decoded;
    
    ws.send(JSON.stringify({ 
      type: 'auth', 
      success: true, 
      message: 'Autenticado correctamente' 
    }));
  }
  
  handleSubscribe(ws, data) {
    if (!ws.authenticated) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'No autenticado' 
      }));
      return;
    }
    
    const { service } = data;
    
    try {
      const validService = validateServiceName(service);
      
      // Si ya hay una suscripción activa, limpiarla
      if (ws.currentStream) {
        this.stopStream(ws);
      }
      
      // Iniciar streaming de logs
      this.startLogStream(ws, validService);
      
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  }
  
  handleUnsubscribe(ws, data) {
    this.stopStream(ws);
    ws.send(JSON.stringify({ 
      type: 'unsubscribed', 
      message: 'Desuscrito correctamente' 
    }));
  }
  
  startLogStream(ws, serviceName) {
    // Usar journalctl con -f para seguimiento en tiempo real
    const journalctl = spawn('journalctl', [
      '-u', serviceName,
      '-f',
      '--no-pager',
      '-n', '50' // Últimas 50 líneas
    ]);
    
    ws.currentStream = {
      process: journalctl,
      service: serviceName
    };
    
    this.activeStreams.set(ws, journalctl);
    
    journalctl.stdout.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'log',
          service: serviceName,
          data: data.toString()
        }));
      }
    });
    
    journalctl.stderr.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          service: serviceName,
          message: data.toString()
        }));
      }
    });
    
    journalctl.on('close', (code) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'stream_ended',
          service: serviceName,
          code
        }));
      }
      this.activeStreams.delete(ws);
    });
    
    journalctl.on('error', (error) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          service: serviceName,
          message: error.message
        }));
      }
    });
    
    ws.send(JSON.stringify({
      type: 'subscribed',
      service: serviceName,
      message: 'Suscrito a logs en tiempo real'
    }));
  }
  
  stopStream(ws) {
    if (ws.currentStream && ws.currentStream.process) {
      ws.currentStream.process.kill();
      ws.currentStream = null;
    }
    
    if (this.activeStreams.has(ws)) {
      const process = this.activeStreams.get(ws);
      process.kill();
      this.activeStreams.delete(ws);
    }
  }
  
  cleanup(ws) {
    this.stopStream(ws);
  }
}

module.exports = LogsWebSocketServer;

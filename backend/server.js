require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const http = require('http');
const servicesRoutes = require('./routes/services');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'http://localhost:8080'] 
    : '*'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Parseo de JSON
app.use(express.json());

// Rutas de servicios (sin autenticación)
app.use('/api/services', servicesRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket para logs en tiempo real
wss.on('connection', (ws, req) => {
  console.log('Nueva conexión WebSocket establecida');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe' && data.service) {
        const { exec } = require('child_process');
        const serviceName = data.service.replace(/[^a-zA-Z0-9._-]/g, '');
        
        const logProcess = exec(`journalctl -u ${serviceName} -f --no-pager`);
        
        logProcess.stdout.on('data', (data) => {
          ws.send(JSON.stringify({ 
            type: 'log', 
            service: serviceName,
            data: data.toString() 
          }));
        });
        
        logProcess.stderr.on('data', (data) => {
          ws.send(JSON.stringify({ 
            type: 'error', 
            data: data.toString() 
          }));
        });
        
        ws.on('close', () => {
          logProcess.kill();
          console.log('Conexión WebSocket cerrada');
        });
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Error procesando mensaje' }));
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`WebSocket disponible en ws://localhost:${PORT}`);
});
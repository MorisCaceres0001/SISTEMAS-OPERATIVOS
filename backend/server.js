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

// Configuración de CORS:
// - Si se define `CORS_ORIGINS` (coma-separado) la lista se usa como whitelist.
// - En producción, por defecto permitimos localhost:3000 y localhost:8080 (puedes ajustar).
// - En desarrollo permitimos todos los orígenes.
let corsOptions;
if (process.env.CORS_ORIGINS) {
  const origins = process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
  corsOptions = { origin: origins };
} else if (process.env.NODE_ENV === 'production') {
  corsOptions = { origin: ['http://localhost:3000', 'http://localhost:8080'] };
} else {
  corsOptions = { origin: '*' };
}

app.use(cors(corsOptions));

// Parse JSON temprano para que el middleware de logging pueda acceder a req.body
app.use(express.json());

// Middleware temporal de logging para solicitudes POST a /api/services
// Habilitar en desarrollo por defecto o mediante `ENABLE_SERVICE_REQUEST_LOG=true`.
if (process.env.ENABLE_SERVICE_REQUEST_LOG === 'true' || process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    try {
      if (req.method === 'POST' && req.originalUrl.startsWith('/api/services')) {
        console.log(`[SERVICE-LOG] Incoming ${req.method} ${req.originalUrl} - headers:`, {
          authorization: req.headers.authorization,
          contentType: req.headers['content-type']
        });
        console.log('[SERVICE-LOG] Body:', req.body);

        // Interceptar res.send para loguear la respuesta
        const originalSend = res.send.bind(res);
        res.send = function (body) {
          try {
            const bodyToLog = typeof body === 'object' ? JSON.stringify(body) : body;
            console.log(`[SERVICE-LOG] Response ${req.method} ${req.originalUrl} - status ${res.statusCode} - body:`, bodyToLog);
          } catch (e) {
            console.log('[SERVICE-LOG] Error serializing response body', e);
          }
          return originalSend(body);
        };
      }
    } catch (e) {
      console.error('[SERVICE-LOG] Logger middleware error', e);
    }
    next();
  });
}

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = process.env.NODE_ENV === 'production' ? 100 : 1000;

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  // In production keep a stricter limit; in development relax it so local dev tooling
  // (hot reload, frequent polls) don't trigger 429s.
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler: return JSON with retry info and proper Retry-After header.
  handler: (req, res) => {
    const retryAfterSec = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    res.set('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: retryAfterSec,
      message: 'Ha alcanzado el límite de peticiones. Intente de nuevo más tarde.'
    });
  }
});
// If requested, allow services routes to bypass the global rate limiter in development.
// Use environment variable `DISABLE_RATE_LIMIT_FOR_DEV=true` together with
// `NODE_ENV!=production` to enable.
if (process.env.DISABLE_RATE_LIMIT_FOR_DEV === 'true' && process.env.NODE_ENV !== 'production') {
  // Mount services before the limiter so they are not rate-limited.
  app.use('/api/services', servicesRoutes);
  app.use('/api/', limiter);
} else {
  app.use('/api/', limiter);
  // Parse JSON
  app.use(express.json());
  // Rutas de servicios (sin autenticación)
  app.use('/api/services', servicesRoutes);
}

// If we mounted services before the limiter, ensure JSON parsing middleware
// is still applied for the rest of the API routes.
if (process.env.DISABLE_RATE_LIMIT_FOR_DEV === 'true' && process.env.NODE_ENV !== 'production') {
  app.use(express.json());
}

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket para logs en tiempo real
wss.on('connection', (ws, req) => {
  console.log('Nueva conexión WebSocket establecida');
  
  ws.on('message', (message) => {
    try {
      console.log('WS message received:', typeof message === 'string' ? message : '<binary>');
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
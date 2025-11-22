#!/bin/bash

# Script para remover autenticación de SystemD Manager
# Uso: sudo bash remove-auth.sh

set -e

echo "================================================"
echo "SystemD Manager - Remover Autenticación"
echo "================================================"
echo ""

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# Directorio de instalación
INSTALL_DIR="/opt/systemd-manager"

# Verificar que el directorio existe
if [ ! -d "$INSTALL_DIR" ]; then
    echo "❌ Error: No se encontró el directorio $INSTALL_DIR"
    echo "   Asegúrate de que SystemD Manager esté instalado"
    exit 1
fi

echo "📂 Directorio de instalación: $INSTALL_DIR"
echo ""

# Confirmación
read -p "⚠️  ¿Remover autenticación? Esto NO se puede deshacer. (s/N): " confirm
if [[ ! $confirm =~ ^[sS]$ ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "🗑️  PASO 1: Eliminando archivos de autenticación..."

# Backend
echo "  → Eliminando backend/auth.js"
rm -f "$INSTALL_DIR/backend/auth.js"

echo "  → Eliminando backend/middleware/auth.js"
rm -f "$INSTALL_DIR/backend/middleware/auth.js"

echo "  → Eliminando backend/routes/auth.js"
rm -f "$INSTALL_DIR/backend/routes/auth.js"

# Frontend
echo "  → Eliminando frontend/src/components/Login.jsx"
rm -f "$INSTALL_DIR/frontend/src/components/Login.jsx"

echo "  → Eliminando frontend/src/components/Login.js"
rm -f "$INSTALL_DIR/frontend/src/components/Login.js"

echo "  → Eliminando frontend/src/components/ProtectedRoute.jsx"
rm -f "$INSTALL_DIR/frontend/src/components/ProtectedRoute.jsx"

echo "  → Eliminando frontend/src/components/PrivateRoute.js"
rm -f "$INSTALL_DIR/frontend/src/components/PrivateRoute.js"

echo "✅ Archivos eliminados"
echo ""

echo "📝 PASO 2: Actualizando backend/server.js..."

# Crear backup
cp "$INSTALL_DIR/backend/server.js" "$INSTALL_DIR/backend/server.js.backup"

# Actualizar server.js
cat > "$INSTALL_DIR/backend/server.js" << 'EOF'
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
EOF

echo "✅ Backend actualizado"
echo ""

echo "📝 PASO 3: Actualizando frontend..."

# Actualizar App.jsx
cat > "$INSTALL_DIR/frontend/src/App.jsx" << 'EOF'
import Dashboard from './components/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;
EOF

echo "✅ Frontend App.jsx actualizado"
echo ""

echo "🔄 PASO 4: Reiniciando servicios..."

# Reiniciar backend
echo "  → Reiniciando systemd-manager..."
systemctl restart systemd-manager

# Esperar un momento
sleep 2

# Verificar estado
if systemctl is-active --quiet systemd-manager; then
    echo "  ✅ Backend reiniciado correctamente"
else
    echo "  ⚠️  Backend no está activo, verifica los logs"
    echo "     Comando: journalctl -u systemd-manager -n 50"
fi

echo ""
echo "🧪 PASO 5: Probando..."

# Test básico
echo "  → Probando health endpoint..."
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "  ✅ Health check OK"
else
    echo "  ⚠️  Health check falló"
fi

# Test servicios
echo "  → Probando servicios endpoint..."
if curl -s http://localhost:8080/api/services > /dev/null; then
    echo "  ✅ Servicios endpoint OK"
else
    echo "  ⚠️  Servicios endpoint falló"
fi

echo ""
echo "================================================"
echo "✅ Autenticación removida exitosamente"
echo "================================================"
echo ""
echo "📋 Pasos siguientes:"
echo ""
echo "1. Recompilar frontend:"
echo "   cd $INSTALL_DIR/frontend"
echo "   npm run build"
echo ""
echo "2. Si usas Nginx, actualizar archivos:"
echo "   sudo rm -rf /var/www/systemd-manager/*"
echo "   sudo cp -r $INSTALL_DIR/frontend/dist/* /var/www/systemd-manager/"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. Verificar estado:"
echo "   systemctl status systemd-manager"
echo "   journalctl -u systemd-manager -f"
echo ""
echo "4. Acceder sin login:"
echo "   http://localhost (con Nginx)"
echo "   http://localhost:8080 (backend directo)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - El sistema ahora NO requiere autenticación"
echo "   - Considera implementar seguridad a nivel de firewall"
echo "   - Backup creado en: $INSTALL_DIR/backend/server.js.backup"
echo ""

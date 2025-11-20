# Estructura del Proyecto SystemD Manager

```
systemd-manager/
│
├── backend/                      # Backend Node.js + Express
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación JWT
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   └── services.js          # Rutas de servicios systemd
│   ├── .env.example             # Variables de entorno de ejemplo
│   ├── Dockerfile               # Dockerfile para backend
│   ├── package.json             # Dependencias backend
│   └── server.js                # Servidor principal Express
│
├── frontend/                     # Frontend React + Tailwind
│   ├── public/
│   │   └── index.html           # HTML base
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js     # Dashboard principal
│   │   │   ├── Login.js         # Componente de login
│   │   │   ├── Modal.js         # Modal reutilizable
│   │   │   ├── PrivateRoute.js  # Protección de rutas
│   │   │   └── ServiceDetail.js # Detalle de servicio + logs
│   │   ├── services/
│   │   │   └── api.js           # Cliente API
│   │   ├── App.js               # Componente principal
│   │   ├── index.css            # Estilos Tailwind
│   │   └── index.js             # Punto de entrada
│   ├── .env.example             # Variables de entorno frontend
│   ├── Dockerfile               # Dockerfile para frontend
│   ├── nginx.conf               # Configuración Nginx para Docker
│   ├── package.json             # Dependencias frontend
│   ├── postcss.config.js        # Configuración PostCSS
│   └── tailwind.config.js       # Configuración Tailwind
│
├── .gitignore                   # Archivos ignorados por Git
├── CHANGELOG.md                 # Historial de cambios
├── LICENSE                      # Licencia MIT
├── QUICKSTART.md                # Guía de inicio rápido
├── README.md                    # Documentación principal
├── deploy.sh                    # Script de deployment
├── docker-compose.yml           # Orquestación Docker
├── install.sh                   # Script de instalación automática
├── nginx-production.conf        # Configuración Nginx producción
├── systemd-manager.service      # Servicio systemd
└── uninstall.sh                 # Script de desinstalación
```

## Archivos Clave

### Backend
- **server.js**: Servidor Express con WebSocket para logs en tiempo real
- **routes/services.js**: Endpoints para manipular servicios systemd
- **routes/auth.js**: Sistema de autenticación con JWT
- **middleware/auth.js**: Verificación de tokens

### Frontend
- **Dashboard.js**: Vista principal con tabla de servicios
- **ServiceDetail.js**: Vista detallada con logs en tiempo real
- **api.js**: Cliente Axios configurado con interceptores

### Deployment
- **install.sh**: Instalación automática en Debian/Ubuntu
- **deploy.sh**: Actualización y deployment
- **systemd-manager.service**: Servicio systemd para auto-start

### Docker
- **docker-compose.yml**: Orquestación completa
- **Dockerfile** (backend): Imagen Node.js con systemd
- **Dockerfile** (frontend): Build multi-stage con Nginx

## Flujo de Datos

```
Usuario → Frontend (React)
    ↓
    ├─→ REST API (Express) → systemctl commands
    └─→ WebSocket → journalctl -f (logs en tiempo real)
```

## Puertos

- **8080**: Backend API + WebSocket
- **3000**: Frontend (desarrollo)
- **80**: Frontend (producción con Nginx)

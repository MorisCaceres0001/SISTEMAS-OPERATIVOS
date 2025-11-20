# 📦 SystemD Manager - Resumen del Proyecto

## 🎯 Descripción General

**SystemD Manager** es una aplicación web completa para administrar servicios y daemons en servidores Debian/Ubuntu mediante systemctl. Ofrece una interfaz moderna estilo Cockpit con capacidades de tiempo real para monitoreo y control de servicios del sistema.

## ✨ Características Principales

### Backend (Node.js + Express)
- ✅ **API REST completa** - 15+ endpoints para gestión de servicios
- ✅ **Autenticación JWT** - Login seguro con tokens
- ✅ **Ejecución segura de comandos** - Validación estricta, prevención de inyección
- ✅ **WebSocket Server** - Logs en tiempo real con `journalctl -f`
- ✅ **Manejo robusto de errores** - Logging y respuestas consistentes

### Frontend (React + Tailwind CSS)
- ✅ **Dashboard moderno** - Diseño limpio y profesional
- ✅ **Búsqueda y filtros** - Encuentra servicios rápidamente
- ✅ **Control completo** - Start, Stop, Restart, Enable, Disable
- ✅ **Vista detallada** - Estado, logs históricos y en tiempo real
- ✅ **Interfaz responsiva** - Funciona en desktop, tablet y móvil
- ✅ **Modales de confirmación** - Prevención de acciones accidentales

### Seguridad
- ✅ **Lista blanca de comandos** - Solo comandos permitidos
- ✅ **Sanitización de entrada** - Validación estricta de nombres de servicios
- ✅ **Headers de seguridad** - X-Frame-Options, X-Content-Type-Options, etc.
- ✅ **CORS configurado** - Control de origen cruzado
- ✅ **Tokens con expiración** - JWT con tiempo de vida limitado

### Infraestructura
- ✅ **Docker ready** - Compose file incluido
- ✅ **Servicio systemd** - Unit file para gestión nativa
- ✅ **Script de instalación** - Automatización completa
- ✅ **Configuración Nginx** - Proxy reverso y servidor estático
- ✅ **Documentación exhaustiva** - README, QUICKSTART, API_EXAMPLES, etc.

## 📊 Estadísticas del Proyecto

```
Total de archivos:           35
Líneas de código:            ~2,100
Componentes React:           5
Endpoints API:               15+
Archivos de documentación:   6
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Login    │  │  Dashboard   │  │   ServiceModal      │ │
│  │   (JWT)    │  │  (Control)   │  │  (Logs en vivo)    │ │
│  └────────────┘  └──────────────┘  └─────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │   HTTP/WebSocket  │
                   └─────────┬─────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Express API  │  │  WebSocket     │  │  Systemctl     │ │
│  │ (REST)       │  │  (Real-time)   │  │  (Commands)    │ │
│  └──────────────┘  └────────────────┘  └────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │   child_process   │
                   └─────────┬─────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                 DEBIAN SERVER (systemd)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  nginx.service │ ssh.service │ mysql.service │ ...   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Estructura de Archivos

```
systemd-manager/
├── backend/                     # Servidor Node.js
│   ├── server.js               # ⭐ Servidor principal (300+ líneas)
│   ├── systemctl.js            # ⭐ Comandos systemd (450+ líneas)
│   ├── auth.js                 # 🔐 Autenticación JWT (150+ líneas)
│   ├── websocket.js            # 🔌 Logs en tiempo real (200+ líneas)
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx   # ⭐ Vista principal (400+ líneas)
│   │   │   ├── ServiceModal.jsx # 📊 Detalles y logs (250+ líneas)
│   │   │   ├── Login.jsx       # 🔐 Pantalla de login (100+ líneas)
│   │   │   ├── ConfirmModal.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── api.js              # 🌐 Cliente API (200+ líneas)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
│
├── 📄 README.md                 # Documentación completa (800+ líneas)
├── 📄 QUICKSTART.md             # Inicio rápido
├── 📄 STRUCTURE.md              # Estructura del proyecto
├── 📄 API_EXAMPLES.md           # Ejemplos de uso de API
├── 📄 DESIGN.md                 # Mockups de diseño
├── 📄 LICENSE                   # MIT License
├── 📄 .gitignore
├── 📄 .env.example
├── 🐳 docker-compose.yml
├── ⚙️ systemd-manager.service
└── 🔧 install.sh                # Script de instalación (200+ líneas)
```

## 🚀 Métodos de Instalación

### 1. Script Automatizado (Recomendado)
```bash
sudo ./install.sh
```
- ✅ Verifica dependencias
- ✅ Instala Node.js si no existe
- ✅ Configura backend y frontend
- ✅ Instala servicio systemd
- ✅ Opcionalmente configura Nginx y firewall

### 2. Manual
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install && npm run build

# Servicio
sudo cp systemd-manager.service /etc/systemd/system/
sudo systemctl enable systemd-manager
sudo systemctl start systemd-manager
```

### 3. Docker
```bash
docker-compose up -d
```

## 🔌 API REST Endpoints

### Autenticación
- `POST /api/auth/login` - Login con JWT
- `GET /api/auth/verify` - Verificar token

### Servicios
- `GET /api/services` - Listar todos
- `GET /api/services/active` - Solo activos
- `GET /api/services/inactive` - Solo inactivos
- `GET /api/services/:name/status` - Estado detallado
- `GET /api/services/:name/logs` - Logs históricos
- `GET /api/services/:name/is-active` - Verificar si está activo
- `POST /api/services/:name/start` - Iniciar
- `POST /api/services/:name/stop` - Detener
- `POST /api/services/:name/restart` - Reiniciar
- `POST /api/services/:name/enable` - Habilitar (autostart)
- `POST /api/services/:name/disable` - Deshabilitar (autostart)

### WebSocket
- Conexión: `ws://localhost:8081`
- Mensajes: `auth`, `subscribe`, `unsubscribe`, `log`, `error`

## 💡 Casos de Uso

1. **Administración remota** - Gestionar servicios desde cualquier navegador
2. **Monitoreo en tiempo real** - Ver logs mientras suceden
3. **Troubleshooting** - Diagnosticar problemas de servicios
4. **Automatización** - API REST para scripts y herramientas
5. **DevOps** - Reiniciar servicios después de deploys
6. **Educación** - Aprender sobre systemd de forma visual

## 🛡️ Seguridad

### Implementado
- ✅ Autenticación JWT
- ✅ Hash de contraseñas (bcrypt)
- ✅ Validación estricta de entrada
- ✅ Lista blanca de comandos
- ✅ Prevención de inyección de comandos
- ✅ Headers de seguridad HTTP
- ✅ CORS configurado
- ✅ Timeouts en comandos

### Recomendaciones Adicionales
- 🔐 Cambiar credenciales por defecto
- 🔑 Usar JWT_SECRET fuerte
- 🌐 Implementar HTTPS (SSL/TLS)
- 🚧 Configurar firewall
- 👥 Principio de mínimo privilegio
- 📝 Auditoría de logs
- 🔄 Mantener dependencias actualizadas

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Listar servicios
curl http://localhost:8080/api/services \
  -H "Authorization: Bearer <token>"
```

### Automated Testing (Futuro)
- Unit tests con Jest
- Integration tests con Supertest
- E2E tests con Playwright/Cypress

## 📈 Roadmap de Mejoras Futuras

### Corto Plazo
- [ ] Multi-usuario con roles (admin, viewer)
- [ ] Base de datos para auditoría
- [ ] Rate limiting en API
- [ ] Refresh token para JWT

### Mediano Plazo
- [ ] Notificaciones por email/webhook
- [ ] Dashboard de métricas con gráficos
- [ ] Soporte para timers systemd
- [ ] Editor de archivos .service
- [ ] Backup/restauración de configuraciones

### Largo Plazo
- [ ] API GraphQL
- [ ] Autenticación LDAP/Active Directory
- [ ] Multi-servidor (gestión remota)
- [ ] Plugin system
- [ ] Mobile app nativa

## 📦 Dependencias Principales

### Backend
```json
{
  "express": "^4.18.2",      // Framework web
  "jsonwebtoken": "^9.0.2",  // JWT auth
  "bcryptjs": "^2.4.3",      // Password hashing
  "ws": "^8.14.2",           // WebSocket
  "cors": "^2.8.5",          // CORS
  "dotenv": "^16.3.1"        // Environment vars
}
```

### Frontend
```json
{
  "react": "^18.2.0",             // UI library
  "react-router-dom": "^6.18.0",  // Routing
  "axios": "^1.6.0",              // HTTP client
  "tailwindcss": "^3.3.5",        // CSS framework
  "vite": "^4.5.0"                // Build tool
}
```

## 🎓 Recursos de Aprendizaje

### Documentación Incluida
- `README.md` - Guía completa (800+ líneas)
- `QUICKSTART.md` - Inicio rápido (5 minutos)
- `API_EXAMPLES.md` - Ejemplos de uso de API
- `STRUCTURE.md` - Arquitectura detallada
- `DESIGN.md` - Mockups de interfaz

### Comentarios en Código
- Todas las funciones documentadas
- Ejemplos de uso inline
- Explicación de decisiones de diseño

### Enlaces Útiles
- systemd documentation: https://www.freedesktop.org/software/systemd/man/
- React documentation: https://react.dev/
- Express documentation: https://expressjs.com/
- Tailwind CSS: https://tailwindcss.com/

## 🤝 Contribuciones

El proyecto está abierto a contribuciones:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

### Áreas donde puedes contribuir
- 🐛 Reportar bugs
- ✨ Sugerir features
- 📝 Mejorar documentación
- 🧪 Escribir tests
- 🔒 Mejorar seguridad
- 🎨 Diseño UI/UX
- 🌍 Traducciones (i18n)

## 📞 Soporte

- **GitHub Issues**: Para bugs y feature requests
- **Email**: Para consultas privadas
- **Documentación**: README completo incluido

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 🎉 Agradecimientos

Desarrollado por **Moris** como proyecto académico de administración de sistemas.

Tecnologías utilizadas:
- Node.js y Express (Backend)
- React y Tailwind CSS (Frontend)
- systemd (Sistema base)
- Docker (Containerización)
- Nginx (Proxy y hosting)

---

## 📥 Descarga e Instalación

### Requisitos Mínimos
- Debian 10+ o Ubuntu 20.04+
- Node.js 18+
- 512 MB RAM
- 100 MB espacio en disco

### Instalación Rápida
```bash
# 1. Descargar
git clone https://github.com/tu-usuario/systemd-manager.git
cd systemd-manager

# 2. Instalar
sudo chmod +x install.sh
sudo ./install.sh

# 3. Acceder
# http://tu-servidor-ip
# Usuario: admin
# Contraseña: admin123
```

### Acceso después de instalación
- **URL**: http://tu-servidor-ip (con Nginx) o http://tu-servidor-ip:8080
- **Usuario por defecto**: admin
- **Contraseña por defecto**: admin123

⚠️ **IMPORTANTE**: Cambiar credenciales inmediatamente en producción

---

**Versión**: 1.0.0  
**Fecha**: Noviembre 2024  
**Estado**: Producción Ready ✅  
**Mantenimiento**: Activo

🌟 **¡Dale una estrella en GitHub si te fue útil!** 🌟

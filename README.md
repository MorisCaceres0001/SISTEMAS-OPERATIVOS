# SystemD Manager

Sistema web completo para administrar servicios y daemons en Debian Server usando `systemctl`. Interfaz moderna estilo Cockpit, construida con React y Node.js.

![SystemD Manager](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Características

- ✅ **Gestión completa de servicios**: Listar, iniciar, detener, reiniciar servicios
- 📊 **Dashboard intuitivo**: Vista general con estadísticas en tiempo real
- 🔍 **Búsqueda y filtros**: Encuentra servicios rápidamente
- 📝 **Logs en tiempo real**: Visualización de logs con WebSocket
- 🔐 **Autenticación JWT**: Sistema de login seguro
- 🎨 **Interfaz moderna**: Diseño responsivo con Tailwind CSS
- ⚡ **Alto rendimiento**: API REST optimizada
- 🐳 **Docker ready**: Incluye Docker Compose

## 📋 Requisitos Previos

### Para instalación manual:
- Debian 10+ / Ubuntu 20.04+
- Node.js 18.x o superior
- npm 8.x o superior
- Acceso root o sudo
- systemd instalado

### Para instalación con Docker:
- Docker 20.10+
- Docker Compose 2.0+

## 📦 Instalación

### Opción 1: Instalación Automática en Debian (Recomendada)

```bash
# Clonar el repositorio
git clone https://github.com/yourusername/systemd-manager.git
cd systemd-manager

# Dar permisos de ejecución al script
chmod +x install.sh

# Ejecutar el instalador (requiere sudo)
sudo ./install.sh
```

El script automáticamente:
- Instala Node.js 18.x
- Configura las dependencias
- Genera un JWT secret seguro
- Crea el servicio systemd
- Inicia el backend en el puerto 8080

### Opción 2: Instalación Manual

#### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar configuración

# Iniciar servidor
npm start

# O en modo desarrollo
npm run dev
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar URL del backend

# Iniciar en modo desarrollo
npm start

# O compilar para producción
npm run build
```

### Opción 3: Instalación con Docker

```bash
# Construir e iniciar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener contenedores
docker-compose down
```

## ⚙️ Configuración

### Variables de Entorno - Backend

Editar `/opt/systemd-manager/backend/.env` (o `backend/.env`):

```env
PORT=8080
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
NODE_ENV=production

# Credenciales por defecto (¡CAMBIAR EN PRODUCCIÓN!)
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=admin123

# WebSocket
WS_PORT=8081
```

### Variables de Entorno - Frontend

Editar `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080
```

## 🔧 Comandos del Servicio SystemD

```bash
# Ver estado
systemctl status systemd-manager

# Iniciar servicio
systemctl start systemd-manager

# Detener servicio
systemctl stop systemd-manager

# Reiniciar servicio
systemctl restart systemd-manager

# Ver logs en tiempo real
journalctl -u systemd-manager -f

# Habilitar inicio automático
systemctl enable systemd-manager

# Deshabilitar inicio automático
systemctl disable systemd-manager
```

## 🌐 Acceso a la Aplicación

### Desarrollo:
- **Backend API**: http://localhost:8080
- **Frontend**: http://localhost:3000

### Producción:
- **Backend API**: http://tu-servidor:8080
- **Frontend**: http://tu-servidor:80 (después de compilar)

### Credenciales por Defecto:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción.

## 📚 API Endpoints

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Servicios

```http
# Listar todos los servicios
GET /api/services
Authorization: Bearer {token}

# Listar servicios activos
GET /api/services/active
Authorization: Bearer {token}

# Listar servicios inactivos
GET /api/services/inactive
Authorization: Bearer {token}

# Obtener estado de un servicio
GET /api/services/{nombre}/status
Authorization: Bearer {token}

# Iniciar servicio
POST /api/services/{nombre}/start
Authorization: Bearer {token}

# Detener servicio
POST /api/services/{nombre}/stop
Authorization: Bearer {token}

# Reiniciar servicio
POST /api/services/{nombre}/restart
Authorization: Bearer {token}

# Obtener logs
GET /api/services/{nombre}/logs?lines=100
Authorization: Bearer {token}

# Habilitar servicio
POST /api/services/{nombre}/enable
Authorization: Bearer {token}

# Deshabilitar servicio
POST /api/services/{nombre}/disable
Authorization: Bearer {token}
```

### WebSocket (Logs en Tiempo Real)

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    service: 'nombre-servicio',
    token: 'tu-jwt-token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.data); // Log line
};
```

## 🏗️ Estructura del Proyecto

```
systemd-manager/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── routes/
│   │   ├── auth.js           # Rutas de autenticación
│   │   └── services.js       # Rutas de servicios
│   ├── middleware/
│   │   └── auth.js           # Middleware JWT
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js      # Componente de login
│   │   │   ├── Dashboard.js  # Dashboard principal
│   │   │   ├── ServiceDetail.js  # Detalle de servicio
│   │   │   ├── Modal.js      # Modal reutilizable
│   │   │   └── PrivateRoute.js   # Protección de rutas
│   │   ├── services/
│   │   │   └── api.js        # Cliente API
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── systemd-manager.service    # Archivo de servicio systemd
├── install.sh                 # Script de instalación
├── .gitignore
└── README.md
```

## 🔒 Seguridad

### Medidas Implementadas:

1. **Autenticación JWT**: Tokens seguros con expiración
2. **Rate Limiting**: Prevención de ataques de fuerza bruta
3. **Sanitización de Inputs**: Validación de nombres de servicios
4. **Helmet.js**: Headers de seguridad HTTP
5. **CORS Configurado**: Control de acceso entre orígenes
6. **Timeouts**: Límites de tiempo en comandos

### Recomendaciones de Producción:

```bash
# 1. Cambiar credenciales por defecto
nano /opt/systemd-manager/backend/.env

# 2. Generar JWT secret seguro
openssl rand -hex 32

# 3. Configurar firewall
ufw allow 8080/tcp
ufw enable

# 4. Usar HTTPS con proxy reverso (Nginx)
apt install nginx certbot python3-certbot-nginx
```

## 🔄 Actualización

```bash
cd /opt/systemd-manager
git pull origin main

# Actualizar dependencias backend
cd backend
npm install

# Reiniciar servicio
systemctl restart systemd-manager

# Si actualizaste el frontend
cd ../frontend
npm install
npm run build
```

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"
```bash
# Verificar que el backend esté corriendo
systemctl status systemd-manager

# Ver logs
journalctl -u systemd-manager -n 50
```

### Error: "Permission denied"
```bash
# El servicio necesita ejecutarse como root para acceder a systemctl
# Verifica el archivo de servicio: User=root
```

### WebSocket no conecta
```bash
# Verificar que el puerto 8080 esté abierto
netstat -tulpn | grep 8080

# Verificar firewall
ufw status
```

### Servicio no inicia
```bash
# Ver logs detallados
journalctl -xe -u systemd-manager

# Verificar permisos
ls -la /opt/systemd-manager/backend/

# Verificar Node.js
node --version
```

## 📊 Compilación para Producción

### Frontend

```bash
cd frontend

# Compilar aplicación
npm run build

# El resultado estará en frontend/build/
# Servir con Nginx u otro servidor web

# Ejemplo con Nginx:
cp -r build/* /var/www/html/
```

### Configuración Nginx para Frontend

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Tu Nombre - [@tuusuario](https://github.com/tuusuario)

## 🙏 Agradecimientos

- Inspirado por [Cockpit Project](https://cockpit-project.org/)
- Construido con [React](https://reactjs.org/)
- Powered by [Express](https://expressjs.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un [Issue](https://github.com/tuusuario/systemd-manager/issues)
- Envía un correo a: tu@email.com

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!

# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2024-11-20

### Agregado
- Sistema completo de administración de servicios SystemD
- Backend API REST con Node.js y Express
- Frontend moderno con React y Tailwind CSS
- Autenticación JWT con sistema de login
- Dashboard con estadísticas en tiempo real
- Tabla de servicios con búsqueda y filtros
- Vista detallada de servicios individuales
- Sistema de logs en tiempo real con WebSocket
- Endpoints para listar, iniciar, detener y reiniciar servicios
- Soporte para habilitar/deshabilitar servicios
- Modal de confirmación para acciones críticas
- Rate limiting para prevenir ataques
- Headers de seguridad con Helmet.js
- Sanitización de inputs para prevenir inyección de comandos
- Soporte para Docker con docker-compose
- Script de instalación automática para Debian/Ubuntu
- Script de desinstalación
- Script de deployment automatizado
- Servicio systemd para el backend
- Configuración de Nginx para producción
- Documentación completa en README.md
- Guía de inicio rápido
- Ejemplos de configuración
- Archivo de licencia MIT

### Seguridad
- Implementado sistema de autenticación JWT
- Rate limiting en endpoints de API
- Validación y sanitización de nombres de servicios
- Headers de seguridad HTTP con Helmet.js
- Configuración CORS
- Timeouts en comandos del sistema
- Variables de entorno para credenciales

### Características
- Interfaz responsiva y moderna
- Diseño estilo Cockpit
- Logs en tiempo real mediante WebSocket
- Búsqueda y filtrado de servicios
- Estadísticas del sistema
- Indicadores visuales de estado
- Animaciones y transiciones suaves
- Soporte para modo oscuro en terminal de logs
- Manejo robusto de errores

## [Unreleased]

### Por Agregar
- Soporte para múltiples usuarios
- Base de datos para persistencia
- Sistema de roles y permisos
- Notificaciones push
- Histórico de acciones
- Gráficas de rendimiento
- Exportación de logs
- API de métricas
- Tests unitarios y de integración
- CI/CD pipeline
- Soporte para i18n (internacionalización)
- Modo oscuro completo
- PWA (Progressive Web App)

[1.0.0]: https://github.com/yourusername/systemd-manager/releases/tag/v1.0.0

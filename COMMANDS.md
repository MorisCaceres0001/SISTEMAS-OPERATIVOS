# 🔧 Comandos Útiles - SystemD Manager

## Gestión del Servicio

### Estado y Control
```bash
# Ver estado del servicio
sudo systemctl status systemd-manager

# Iniciar servicio
sudo systemctl start systemd-manager

# Detener servicio
sudo systemctl stop systemd-manager

# Reiniciar servicio
sudo systemctl restart systemd-manager

# Recargar configuración sin reiniciar
sudo systemctl reload systemd-manager

# Habilitar inicio automático
sudo systemctl enable systemd-manager

# Deshabilitar inicio automático
sudo systemctl disable systemd-manager

# Ver si está habilitado
sudo systemctl is-enabled systemd-manager

# Ver si está activo
sudo systemctl is-active systemd-manager
```

## Logs y Debugging

### Ver Logs
```bash
# Logs en tiempo real
sudo journalctl -u systemd-manager -f

# Últimas 50 líneas
sudo journalctl -u systemd-manager -n 50

# Últimas 24 horas
sudo journalctl -u systemd-manager --since "24 hours ago"

# Logs de hoy
sudo journalctl -u systemd-manager --since today

# Logs con fecha específica
sudo journalctl -u systemd-manager --since "2024-01-15" --until "2024-01-16"

# Logs con prioridad error
sudo journalctl -u systemd-manager -p err

# Exportar logs a archivo
sudo journalctl -u systemd-manager > systemd-manager.log
```

### Debugging
```bash
# Ver configuración del servicio
sudo systemctl cat systemd-manager

# Ver dependencias
sudo systemctl list-dependencies systemd-manager

# Ver propiedades
sudo systemctl show systemd-manager

# Verificar sintaxis del unit file
sudo systemd-analyze verify /etc/systemd/system/systemd-manager.service
```

## Gestión de Archivos

### Backend
```bash
# Ir al directorio
cd /opt/systemd-manager/backend

# Editar variables de entorno
sudo nano .env

# Ver configuración actual
cat .env

# Instalar/actualizar dependencias
sudo npm install

# Ver procesos Node.js
ps aux | grep node

# Matar proceso manualmente (si es necesario)
sudo pkill -f systemd-manager
```

### Frontend
```bash
# Ir al directorio
cd /opt/systemd-manager/frontend

# Recompilar
sudo npm run build

# Ver archivos compilados
ls -lh dist/

# Limpiar y recompilar
sudo rm -rf dist/ && sudo npm run build
```

## Permisos y Seguridad

### Permisos
```bash
# Ver permisos actuales
ls -la /opt/systemd-manager/

# Establecer permisos correctos
sudo chown -R www-data:www-data /opt/systemd-manager/
sudo chmod -R 755 /opt/systemd-manager/

# Ver qué usuario ejecuta el servicio
ps aux | grep systemd-manager | grep -v grep
```

### Seguridad
```bash
# Cambiar contraseña de admin
# Editar .env y cambiar ADMIN_PASSWORD
sudo nano /opt/systemd-manager/backend/.env
sudo systemctl restart systemd-manager

# Generar JWT_SECRET seguro
openssl rand -base64 32

# Ver puertos abiertos
sudo ss -tulpn | grep -E '8080|8081'
sudo netstat -tulpn | grep -E '8080|8081'
```

## Nginx

### Control
```bash
# Estado
sudo systemctl status nginx

# Iniciar/detener/reiniciar
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Recargar configuración
sudo systemctl reload nginx

# Verificar sintaxis
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Configuración
```bash
# Editar configuración del sitio
sudo nano /etc/nginx/sites-available/systemd-manager

# Verificar configuración
sudo nginx -t

# Recargar después de cambios
sudo systemctl reload nginx

# Ver configuración activa
cat /etc/nginx/sites-enabled/systemd-manager
```

## Firewall (UFW)

```bash
# Ver estado
sudo ufw status

# Ver reglas numeradas
sudo ufw status numbered

# Permitir puertos
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp

# Denegar puerto
sudo ufw deny 8080/tcp

# Eliminar regla
sudo ufw delete allow 8080/tcp

# Habilitar/deshabilitar firewall
sudo ufw enable
sudo ufw disable
```

## Monitoreo de Recursos

### CPU y Memoria
```bash
# Ver uso de recursos del proceso
ps aux | grep systemd-manager

# Monitor en tiempo real
top -p $(pgrep -f systemd-manager)

# Uso detallado
sudo systemctl status systemd-manager

# Memoria del proceso
ps -o pid,user,%mem,command -p $(pgrep -f systemd-manager)
```

### Disco
```bash
# Espacio usado por el proyecto
du -sh /opt/systemd-manager/

# Espacio detallado
du -h /opt/systemd-manager/ | sort -h

# Espacio en disco general
df -h
```

### Red
```bash
# Conexiones activas
sudo ss -tulpn | grep -E '8080|8081'

# Ver quién está conectado
sudo netstat -an | grep -E '8080|8081' | grep ESTABLISHED

# Monitorear tráfico
sudo iftop -i eth0

# Estadísticas de red
ss -s
```

## Base de Datos y Respaldos

### Respaldo
```bash
# Crear backup del proyecto
sudo tar -czf systemd-manager-backup-$(date +%Y%m%d).tar.gz /opt/systemd-manager/

# Backup solo de configuración
sudo cp /opt/systemd-manager/backend/.env /opt/systemd-manager/backend/.env.backup.$(date +%Y%m%d)

# Backup del servicio systemd
sudo cp /etc/systemd/system/systemd-manager.service /tmp/systemd-manager.service.backup
```

### Restauración
```bash
# Restaurar desde backup
sudo tar -xzf systemd-manager-backup-20240115.tar.gz -C /

# Restaurar configuración
sudo cp /opt/systemd-manager/backend/.env.backup.20240115 /opt/systemd-manager/backend/.env
sudo systemctl restart systemd-manager
```

## Actualización

### Actualizar dependencias
```bash
# Backend
cd /opt/systemd-manager/backend
sudo npm update

# Frontend
cd /opt/systemd-manager/frontend
sudo npm update
sudo npm run build

# Reiniciar servicios
sudo systemctl restart systemd-manager
sudo systemctl reload nginx
```

### Actualizar Node.js
```bash
# Ver versión actual
node --version

# Actualizar con NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar nueva versión
node --version
```

## Troubleshooting Rápido

### Servicio no inicia
```bash
# 1. Ver error específico
sudo journalctl -u systemd-manager -n 50 --no-pager

# 2. Verificar puertos en uso
sudo netstat -tulpn | grep -E '8080|8081'

# 3. Matar procesos conflictivos
sudo lsof -ti:8080 | xargs sudo kill -9
sudo lsof -ti:8081 | xargs sudo kill -9

# 4. Verificar permisos
ls -la /opt/systemd-manager/backend/

# 5. Intentar inicio manual
cd /opt/systemd-manager/backend
node server.js
```

### Frontend no carga
```bash
# 1. Verificar que nginx esté corriendo
sudo systemctl status nginx

# 2. Verificar configuración
sudo nginx -t

# 3. Ver logs de error
sudo tail -f /var/log/nginx/error.log

# 4. Verificar archivos compilados
ls -la /opt/systemd-manager/frontend/dist/

# 5. Recompilar frontend
cd /opt/systemd-manager/frontend
sudo npm run build
sudo systemctl reload nginx
```

### WebSocket no conecta
```bash
# 1. Verificar puerto 8081
sudo netstat -tulpn | grep 8081

# 2. Ver logs del servicio
sudo journalctl -u systemd-manager -f

# 3. Verificar firewall
sudo ufw status | grep 8081

# 4. Test manual con wscat
npm install -g wscat
wscat -c ws://localhost:8081
```

### Error de permisos
```bash
# Establecer permisos correctos
sudo chown -R www-data:www-data /opt/systemd-manager/
sudo chmod -R 755 /opt/systemd-manager/

# Verificar que el usuario www-data existe
id www-data

# Si no existe, crearlo
sudo useradd -r -s /bin/false www-data
```

## Performance Tuning

### Optimizar Node.js
```bash
# Aumentar límite de archivos abiertos
ulimit -n 65536

# Ver límites actuales
ulimit -a

# Editar límites permanentes
sudo nano /etc/security/limits.conf
# Agregar:
# www-data soft nofile 65536
# www-data hard nofile 65536
```

### Optimizar Nginx
```bash
# Editar configuración principal
sudo nano /etc/nginx/nginx.conf

# Ajustar worker_processes y worker_connections
# worker_processes auto;
# worker_connections 1024;

# Habilitar gzip
# gzip on;
# gzip_vary on;

# Aplicar cambios
sudo nginx -t && sudo systemctl reload nginx
```

## Scripts Útiles

### Reinicio Completo
```bash
#!/bin/bash
# reiniciar_todo.sh

echo "Deteniendo servicios..."
sudo systemctl stop systemd-manager
sudo systemctl stop nginx

echo "Limpiando caché..."
cd /opt/systemd-manager/frontend
sudo rm -rf dist/

echo "Recompilando frontend..."
sudo npm run build

echo "Iniciando servicios..."
sudo systemctl start systemd-manager
sudo systemctl start nginx

echo "Verificando estado..."
sudo systemctl status systemd-manager --no-pager
sudo systemctl status nginx --no-pager

echo "Listo!"
```

### Monitor de Salud
```bash
#!/bin/bash
# health_check.sh

echo "=== SystemD Manager Health Check ==="
echo ""

echo "1. Servicio systemd-manager:"
sudo systemctl is-active systemd-manager && echo "✓ Activo" || echo "✗ Inactivo"

echo ""
echo "2. Nginx:"
sudo systemctl is-active nginx && echo "✓ Activo" || echo "✗ Inactivo"

echo ""
echo "3. Puertos:"
sudo netstat -tulpn | grep -E '8080|8081' || echo "✗ Puertos no disponibles"

echo ""
echo "4. API Health:"
curl -s http://localhost:8080/health | jq . || echo "✗ API no responde"

echo ""
echo "5. Uso de recursos:"
ps aux | grep systemd-manager | grep -v grep | awk '{print "CPU: "$3"% | MEM: "$4"%"}'

echo ""
echo "6. Últimos errores:"
sudo journalctl -u systemd-manager -p err -n 5 --no-pager || echo "Sin errores recientes"
```

## Testing de API

### Health Check
```bash
curl http://localhost:8080/health
```

### Login y Token
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# Usar token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/services | jq .
```

### Test Completo
```bash
#!/bin/bash
# test_api.sh

API="http://localhost:8080/api"

# Login
echo "1. Testing login..."
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

if [ -z "$TOKEN" ]; then
    echo "✗ Login failed"
    exit 1
fi
echo "✓ Login successful"

# Listar servicios
echo "2. Testing service list..."
SERVICES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  $API/services | jq -r '.count')
echo "✓ Found $SERVICES services"

# Estado de un servicio
echo "3. Testing service status..."
curl -s -H "Authorization: Bearer $TOKEN" \
  $API/services/nginx.service/status | jq .
echo "✓ Status check complete"

echo ""
echo "All tests passed!"
```

---

**Tip**: Guarda estos comandos en un archivo para referencia rápida.  
**Nota**: Reemplaza los valores por defecto con los de tu configuración.

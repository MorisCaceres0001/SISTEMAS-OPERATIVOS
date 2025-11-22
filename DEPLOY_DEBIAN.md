Guía rápida de despliegue en Debian
=================================

Objetivo: dejar el backend corriendo como servicio systemd y servir el frontend con Nginx.

Requisitos (en el servidor Debian):
- Debian 10+ / Ubuntu 20.04+
- Acceso root o sudo
- Node.js 18+ (o usar nvm)

Resumen de pasos:
1) Crear usuario de despliegue (opcional, recomendado)
2) Clonar el repo en `/opt/systemd-manager` o copiarlo
3) Preparar `.env` y generar `JWT_SECRET`
4) Instalar dependencias backend y frontend
5) Construir frontend y configurar Nginx
6) Instalar y habilitar la unidad `systemd` para el backend
7) Probar endpoints y WebSocket

Comandos ejemplo (ejecutar como root o con sudo)
------------------------------------------------
# 1) Crear usuario deploy (opcional)
adduser deploy
usermod -aG sudo deploy

# 2) Clonar projeto (si no lo has clonado)
cd /opt
git clone https://github.com/<TU_USUARIO>/<TU_REPO>.git systemd-manager
chown -R deploy:deploy /opt/systemd-manager

# 3) Preparar .env (en backend)
cd /opt/systemd-manager/backend
cp .env.example .env
JWT_SECRET=$(openssl rand -hex 32)
# Edita .env y pega el JWT_SECRET generado o usa:
grep -q '^JWT_SECRET=' .env && sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env || echo "JWT_SECRET=${JWT_SECRET}" >> .env

# 4) Instalar Node (si falta) e instalar dependencias
# (como root o usando deploy con sudo)
# usando Nodesource (ejemplo):
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt update
apt install -y nodejs build-essential python3 make g++

# Instalar dependencias backend como user deploy (recomendado)
chown -R deploy:deploy /opt/systemd-manager
su - deploy -s /bin/bash -c "cd /opt/systemd-manager/backend && npm install"

# 5) Frontend: instalar y construir
su - deploy -s /bin/bash -c "cd /opt/systemd-manager/frontend && npm install && npm run build"
# Resultado en frontend/build

# 6) Configurar Nginx para servir frontend (ejemplo)
apt install -y nginx
# Copia el build a /var/www/html o configura site
cp -r /opt/systemd-manager/frontend/build/* /var/www/html/
# Opcional: copia el archivo nginx-config.conf del repo a /etc/nginx/sites-available/systemd-manager
cp /opt/systemd-manager/nginx-config.conf /etc/nginx/sites-available/systemd-manager
ln -s /etc/nginx/sites-available/systemd-manager /etc/nginx/sites-enabled/
systemctl restart nginx

# 7) Instalar unidad systemd (backend)
# El repo incluye systemd-manager.service en la raíz
cp /opt/systemd-manager/systemd-manager.service /etc/systemd/system/systemd-manager.service
# Asegúrate de que ExecStart apunte a un binario node válido o al script 'start.sh'
# Ejemplo para ejecutar como user deploy con script:
# Edita la unidad y pon ExecStart=/opt/systemd-manager/backend/bin/start.sh
# y User=deploy

systemctl daemon-reload
systemctl enable --now systemd-manager.service
systemctl status systemd-manager.service --no-pager
journalctl -u systemd-manager.service -n 200 --no-pager

Pruebas rápidas
---------------
# Health
curl http://localhost:8080/api/health

# Login (por defecto, si no cambiaste): admin/admin123
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

# Usar token para listar servicios
# copiar token de la salida anterior
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/api/services

Seguridad / recomendaciones
---------------------------
- NO ejecutar Node como root en producción si no es necesario.
- Cambia las credenciales por defecto y el `JWT_SECRET` inmediatamente.
- Crear un archivo sudoers limitado si quieres que el proceso Node use sudo para comandos concretos (systemctl/journalctl).
- Considera habilitar HTTPS (Nginx + Certbot) para el frontend y proxy a backend.

Ejemplo sudoers (muy restrictivo) para permitir solo systemctl/journalctl sin password:
# /etc/sudoers.d/systemd-manager
# Reemplaza 'deploy' por el usuario que ejecuta Node
# deploy ALL=(ALL) NOPASSWD: /bin/systemctl start *, /bin/systemctl stop *, /bin/systemctl restart *, /bin/systemctl status *, /bin/journalctl -u *

Notas finales
------------
Esta guía está pensada para la primera prueba. Si quieres, puedo:
- Generar la unidad systemd adaptada que ejecute el script `backend/bin/start.sh` como `deploy`.
- Modificar el backend para usar `sudo` en las llamadas a systemctl/journalctl (y añadir instrucciones sudoers).
- Preparar un workflow GitHub Actions para CI.

Indica qué prefieres que haga ahora: crear la unidad systemd adaptada en el repo (SÍ/NO) y si quieres que modifique el backend para usar `sudo` en las llamadas a systemctl/journalctl (SÍ/NO).
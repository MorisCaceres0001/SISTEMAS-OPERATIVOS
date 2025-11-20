#!/bin/bash

# Script de deployment para SystemD Manager
# Ejecutar con: sudo bash deploy.sh

set -e

echo "=================================="
echo "SystemD Manager - Deployment"
echo "=================================="
echo ""

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: Este script debe ejecutarse como root (sudo)"
    exit 1
fi

INSTALL_DIR="/opt/systemd-manager"
WEB_DIR="/var/www/systemd-manager"

echo "1. Actualizando código..."
cd $INSTALL_DIR
git pull origin main

echo ""
echo "2. Actualizando dependencias del backend..."
cd $INSTALL_DIR/backend
npm install --production

echo ""
echo "3. Reiniciando servicio backend..."
systemctl restart systemd-manager

echo ""
echo "4. Compilando frontend..."
cd $INSTALL_DIR/frontend
npm install
npm run build

echo ""
echo "5. Desplegando frontend..."
mkdir -p $WEB_DIR
rm -rf $WEB_DIR/*
cp -r build/* $WEB_DIR/

echo ""
echo "6. Ajustando permisos..."
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR

echo ""
echo "7. Verificando Nginx..."
nginx -t

echo ""
echo "8. Recargando Nginx..."
systemctl reload nginx

echo ""
echo "9. Verificando estado de servicios..."
echo ""
echo "Backend:"
systemctl status systemd-manager --no-pager | head -n 10

echo ""
echo "Nginx:"
systemctl status nginx --no-pager | head -n 10

echo ""
echo "=================================="
echo "¡Deployment completado!"
echo "=================================="
echo ""
echo "La aplicación está disponible en:"
echo "  - Backend: http://localhost:8080"
echo "  - Frontend: http://localhost (o tu dominio)"
echo ""
echo "Para ver logs:"
echo "  - Backend: journalctl -u systemd-manager -f"
echo "  - Nginx: tail -f /var/log/nginx/systemd-manager-access.log"
echo ""

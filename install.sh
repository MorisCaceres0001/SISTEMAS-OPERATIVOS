#!/bin/bash

# Script de instalación de SystemD Manager en Debian Server
# Ejecutar con: sudo bash install.sh

set -e

echo "=================================="
echo "SystemD Manager - Instalador"
echo "=================================="
echo ""

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: Este script debe ejecutarse como root (sudo)"
    exit 1
fi

# Detectar el directorio actual
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_DIR="/opt/systemd-manager"

echo "1. Actualizando sistema..."
apt-get update

echo ""
echo "2. Instalando dependencias..."
apt-get install -y curl git

# Instalar Node.js 18.x
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js ya está instalado: $(node --version)"
fi

echo ""
echo "3. Creando directorio de instalación..."
mkdir -p $INSTALL_DIR
cp -r $SCRIPT_DIR/* $INSTALL_DIR/

echo ""
echo "4. Instalando dependencias del backend..."
cd $INSTALL_DIR/backend
npm install --production

echo ""
echo "5. Configurando variables de entorno..."
if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
    cp $INSTALL_DIR/backend/.env.example $INSTALL_DIR/backend/.env
    
    # Generar secret aleatorio
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/change_this_secret_key_in_production_use_strong_random_value/$JWT_SECRET/" $INSTALL_DIR/backend/.env
    
    echo "Archivo .env creado. IMPORTANTE: Cambia las credenciales por defecto!"
fi

echo ""
echo "6. Instalando servicio systemd..."
cp $INSTALL_DIR/systemd-manager.service /etc/systemd/system/
systemctl daemon-reload

echo ""
echo "7. Habilitando e iniciando el servicio..."
systemctl enable systemd-manager.service
systemctl start systemd-manager.service

echo ""
echo "8. Verificando estado del servicio..."
sleep 2
systemctl status systemd-manager.service --no-pager

echo ""
echo "=================================="
echo "¡Instalación completada!"
echo "=================================="
echo ""
echo "El backend está corriendo en: http://localhost:8080"
echo ""
echo "Comandos útiles:"
echo "  - Ver estado:    systemctl status systemd-manager"
echo "  - Ver logs:      journalctl -u systemd-manager -f"
echo "  - Reiniciar:     systemctl restart systemd-manager"
echo "  - Detener:       systemctl stop systemd-manager"
echo ""
echo "Credenciales por defecto:"
echo "  Usuario: admin"
echo "  Contraseña: admin123"
echo ""
echo "IMPORTANTE: Cambia las credenciales en $INSTALL_DIR/backend/.env"
echo ""
echo "Para instalar el frontend, consulta el README.md"
echo ""

#!/bin/bash

# Script de desinstalación de SystemD Manager
# Ejecutar con: sudo bash uninstall.sh

set -e

echo "=================================="
echo "SystemD Manager - Desinstalador"
echo "=================================="
echo ""

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: Este script debe ejecutarse como root (sudo)"
    exit 1
fi

echo "⚠️  ADVERTENCIA: Esto eliminará SystemD Manager completamente"
read -p "¿Estás seguro? (s/N): " confirm

if [[ ! $confirm =~ ^[sS]$ ]]; then
    echo "Desinstalación cancelada."
    exit 0
fi

echo ""
echo "1. Deteniendo servicio..."
systemctl stop systemd-manager.service || true

echo ""
echo "2. Deshabilitando servicio..."
systemctl disable systemd-manager.service || true

echo ""
echo "3. Eliminando archivo de servicio..."
rm -f /etc/systemd/system/systemd-manager.service
systemctl daemon-reload

echo ""
echo "4. Eliminando archivos de instalación..."
read -p "¿Eliminar /opt/systemd-manager? (s/N): " delete_files

if [[ $delete_files =~ ^[sS]$ ]]; then
    rm -rf /opt/systemd-manager
    echo "Archivos eliminados."
else
    echo "Archivos conservados en /opt/systemd-manager"
fi

echo ""
echo "=================================="
echo "Desinstalación completada"
echo "=================================="
echo ""

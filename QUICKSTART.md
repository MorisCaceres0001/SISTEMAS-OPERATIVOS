# 🚀 Inicio Rápido - SystemD Manager

## Instalación en 5 minutos

### En Debian/Ubuntu Server:

```bash
# 1. Clonar repositorio
git clone https://github.com/yourusername/systemd-manager.git
cd systemd-manager

# 2. Instalar automáticamente
sudo ./install.sh

# 3. ¡Listo! El backend está corriendo en http://localhost:8080
```

### Probar la API:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Guardar el token de la respuesta
TOKEN="tu_token_aqui"

# Listar servicios
curl http://localhost:8080/api/services \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend en Desarrollo:

```bash
cd frontend
npm install
npm start
# Abre http://localhost:3000
```

## Frontend en Producción:

```bash
cd frontend
npm install
npm run build

# Servir con Nginx o servidor estático
sudo cp -r build/* /var/www/html/
```

## Docker (Todo en uno):

```bash
docker-compose up -d
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

## Credenciales por Defecto:

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **¡Cámbialas en producción!**

## Comandos Útiles:

```bash
# Ver logs del servicio
sudo journalctl -u systemd-manager -f

# Reiniciar servicio
sudo systemctl restart systemd-manager

# Estado del servicio
sudo systemctl status systemd-manager
```

## ¿Problemas?

1. Verifica que Node.js esté instalado: `node --version`
2. Verifica que el servicio esté corriendo: `systemctl status systemd-manager`
3. Revisa los logs: `journalctl -u systemd-manager -n 50`
4. Consulta el [README completo](README.md)

---

Para más detalles, consulta el [README.md](README.md) completo.

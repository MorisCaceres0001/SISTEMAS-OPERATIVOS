# Ejemplos de Uso - SystemD Manager API

## Autenticación

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

### Verificar Token

```bash
curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Servicios

**Nota:** Todos los endpoints de servicios requieren autenticación con Bearer token.

### Listar Todos los Servicios

```bash
curl -X GET http://localhost:8080/api/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
{
  "services": [
    {
      "name": "nginx",
      "fullName": "nginx.service",
      "load": "loaded",
      "active": "active",
      "sub": "running",
      "description": "A high performance web server",
      "status": "running"
    }
  ],
  "count": 1
}
```

### Listar Servicios Activos

```bash
curl -X GET http://localhost:8080/api/services/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Listar Servicios Inactivos

```bash
curl -X GET http://localhost:8080/api/services/inactive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Estado de un Servicio

```bash
curl -X GET http://localhost:8080/api/services/nginx/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
{
  "service": "nginx",
  "status": "● nginx.service - A high performance web server\n   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)\n   Active: active (running) since Mon 2024-11-20 10:00:00 UTC; 1h 30min ago\n...",
  "raw": "..."
}
```

### Iniciar Servicio

```bash
curl -X POST http://localhost:8080/api/services/nginx/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Servicio nginx iniciado correctamente",
  "service": "nginx"
}
```

### Detener Servicio

```bash
curl -X POST http://localhost:8080/api/services/nginx/stop \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Reiniciar Servicio

```bash
curl -X POST http://localhost:8080/api/services/nginx/restart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener Logs

```bash
# Obtener últimas 100 líneas (por defecto)
curl -X GET http://localhost:8080/api/services/nginx/logs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Obtener últimas 500 líneas
curl -X GET "http://localhost:8080/api/services/nginx/logs?lines=500" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta:**
```json
{
  "service": "nginx",
  "logs": "Nov 20 10:00:00 server nginx[1234]: 2024/11/20 10:00:00 [notice] 1234#1234: using the \"epoll\" event method\n...",
  "lines": 100
}
```

### Habilitar Servicio (Auto-start)

```bash
curl -X POST http://localhost:8080/api/services/nginx/enable \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Deshabilitar Servicio

```bash
curl -X POST http://localhost:8080/api/services/nginx/disable \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## WebSocket (Logs en Tiempo Real)

### Ejemplo en JavaScript

```javascript
const ws = new WebSocket('ws://localhost:8080');
const token = 'YOUR_JWT_TOKEN';
const serviceName = 'nginx';

ws.onopen = () => {
  console.log('WebSocket conectado');
  
  // Suscribirse a logs de un servicio
  ws.send(JSON.stringify({
    type: 'subscribe',
    service: serviceName,
    token: token
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'log') {
    console.log('Log:', data.data);
  } else if (data.error) {
    console.error('Error:', data.error);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket desconectado');
};
```

### Ejemplo en Python

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    if data.get('type') == 'log':
        print(f"Log: {data['data']}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("WebSocket cerrado")

def on_open(ws):
    print("WebSocket conectado")
    
    # Suscribirse a logs
    ws.send(json.dumps({
        'type': 'subscribe',
        'service': 'nginx',
        'token': 'YOUR_JWT_TOKEN'
    }))

ws = websocket.WebSocketApp(
    "ws://localhost:8080",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

ws.run_forever()
```

## Manejo de Errores

### Token Inválido o Expirado

**Respuesta (403):**
```json
{
  "error": "Token inválido o expirado"
}
```

### Servicio No Encontrado

**Respuesta (500):**
```json
{
  "error": "Error al iniciar servicio",
  "details": "Failed to start nginx.service: Unit nginx.service not found."
}
```

### Sin Permisos

**Respuesta (500):**
```json
{
  "error": "Error al detener servicio",
  "details": "Failed to stop nginx.service: Access denied"
}
```

## Scripts de Ejemplo

### Script Bash - Monitorear Servicio

```bash
#!/bin/bash

API_URL="http://localhost:8080/api"
TOKEN="YOUR_JWT_TOKEN"
SERVICE="nginx"

# Función para verificar estado
check_status() {
    response=$(curl -s -X GET "$API_URL/services/$SERVICE/status" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$response" | grep -q "active (running)"; then
        echo "✓ $SERVICE está corriendo"
        return 0
    else
        echo "✗ $SERVICE está detenido"
        return 1
    fi
}

# Función para reiniciar si está caído
auto_restart() {
    if ! check_status; then
        echo "Intentando reiniciar $SERVICE..."
        curl -s -X POST "$API_URL/services/$SERVICE/start" \
            -H "Authorization: Bearer $TOKEN"
        sleep 2
        check_status
    fi
}

# Monitorear cada 30 segundos
while true; do
    auto_restart
    sleep 30
done
```

### Script Python - Listar Servicios Caídos

```python
import requests
import json

API_URL = "http://localhost:8080/api"
TOKEN = "YOUR_JWT_TOKEN"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_failed_services():
    response = requests.get(f"{API_URL}/services", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        failed = [s for s in data['services'] if s['active'] == 'failed']
        
        print(f"Servicios caídos: {len(failed)}")
        for service in failed:
            print(f"  - {service['name']}: {service['description']}")
        
        return failed
    else:
        print(f"Error: {response.status_code}")
        return []

if __name__ == "__main__":
    get_failed_services()
```

## Testing con Postman

### Configurar Environment

1. Crear nueva colección "SystemD Manager"
2. Agregar variable `{{base_url}}` = `http://localhost:8080/api`
3. Agregar variable `{{token}}` (se llenará después del login)

### Request de Login

```
POST {{base_url}}/auth/login
Body (JSON):
{
  "username": "admin",
  "password": "admin123"
}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
    pm.environment.set("token", jsonData.token);
});
```

### Request de Servicios

```
GET {{base_url}}/services
Headers:
Authorization: Bearer {{token}}

Tests:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Has services array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('services');
    pm.expect(jsonData.services).to.be.an('array');
});
```

---

Para más información, consulta el [README.md](README.md).

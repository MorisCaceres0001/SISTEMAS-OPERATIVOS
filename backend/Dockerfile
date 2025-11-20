FROM node:18-alpine

# Instalar systemd y dependencias necesarias
RUN apk add --no-cache systemd dbus

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 8080

# Usuario no root (comentado para permitir acceso a systemd)
# RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# USER nodejs

# Comando de inicio
CMD ["node", "server.js"]

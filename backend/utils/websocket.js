const { spawn } = require('child_process');
const { isValidServiceName } = require('./systemctl');

const activeStreams = new Map();

const handleWebSocketConnection = (ws, wss) => {
  console.log('Cliente WebSocket conectado');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.action === 'stream_logs' && data.service) {
        const serviceName = data.service;
        
        if (!isValidServiceName(serviceName)) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Nombre de servicio inválido'
          }));
          return;
        }

        // Detener stream anterior si existe
        if (activeStreams.has(ws)) {
          const oldProcess = activeStreams.get(ws);
          oldProcess.kill();
        }

        // Iniciar nuevo stream con journalctl -f
        const journalProcess = spawn('journalctl', [
          '-u',
          serviceName,
          '-f',
          '--no-pager',
          '-n',
          '50' // Últimas 50 líneas
        ]);

        activeStreams.set(ws, journalProcess);

        // Enviar confirmación
        ws.send(JSON.stringify({
          type: 'stream_started',
          service: serviceName
        }));

        // Enviar stdout
        journalProcess.stdout.on('data', (data) => {
          const logs = data.toString();
          ws.send(JSON.stringify({
            type: 'log',
            service: serviceName,
            data: logs
          }));
        });

        // Enviar stderr
        journalProcess.stderr.on('data', (data) => {
          const error = data.toString();
          ws.send(JSON.stringify({
            type: 'error',
            service: serviceName,
            data: error
          }));
        });

        // Manejar cierre del proceso
        journalProcess.on('close', (code) => {
          console.log(`Stream de logs cerrado para ${serviceName}, código: ${code}`);
          activeStreams.delete(ws);
          
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
              type: 'stream_ended',
              service: serviceName,
              code
            }));
          }
        });

      } else if (data.action === 'stop_stream') {
        // Detener stream actual
        if (activeStreams.has(ws)) {
          const process = activeStreams.get(ws);
          process.kill();
          activeStreams.delete(ws);
          
          ws.send(JSON.stringify({
            type: 'stream_stopped'
          }));
        }
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Acción no reconocida'
        }));
      }

    } catch (error) {
      console.error('Error al parsear mensaje WebSocket:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error al procesar mensaje'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
    
    // Limpiar procesos activos
    if (activeStreams.has(ws)) {
      const process = activeStreams.get(ws);
      process.kill();
      activeStreams.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('Error WebSocket:', error);
    
    // Limpiar procesos activos
    if (activeStreams.has(ws)) {
      const process = activeStreams.get(ws);
      process.kill();
      activeStreams.delete(ws);
    }
  });
};

module.exports = { handleWebSocketConnection };

const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

// Lista de comandos permitidos
const ALLOWED_COMMANDS = [
  'list-units',
  'start',
  'stop',
  'restart',
  'status',
  'enable',
  'disable',
  'is-active',
  'is-enabled'
];

// Validar nombre de servicio para prevenir inyección de comandos
const isValidServiceName = (serviceName) => {
  // Solo permite letras, números, guiones, puntos y @
  const regex = /^[a-zA-Z0-9@._-]+$/;
  return regex.test(serviceName);
};

// Ejecutar comando systemctl de forma segura
const executeSystemctl = async (command, serviceName = null) => {
  try {
    // Validar comando
    if (!ALLOWED_COMMANDS.includes(command)) {
      throw new Error('Comando no permitido');
    }

    // Validar nombre de servicio si es necesario
    if (serviceName && !isValidServiceName(serviceName)) {
      throw new Error('Nombre de servicio inválido');
    }

    // Construir comando
    let fullCommand = `systemctl ${command}`;
    
    if (serviceName) {
      fullCommand += ` ${serviceName}`;
    }

    // Agregar flags según el comando
    if (command === 'status') {
      fullCommand += ' --no-pager';
    } else if (command === 'list-units') {
      fullCommand += ' --type=service --all --no-pager';
    }

    console.log('Ejecutando:', fullCommand);

    // Ejecutar comando
    const { stdout, stderr } = await execPromise(fullCommand, {
      timeout: 10000, // 10 segundos de timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    return { success: true, stdout, stderr };
  } catch (error) {
    console.error('Error ejecutando systemctl:', error);
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
};

// Obtener logs con journalctl
const getServiceLogs = async (serviceName, lines = 100) => {
  try {
    if (!isValidServiceName(serviceName)) {
      throw new Error('Nombre de servicio inválido');
    }

    const command = `journalctl -u ${serviceName} -n ${lines} --no-pager`;
    console.log('Ejecutando:', command);

    const { stdout, stderr } = await execPromise(command, {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024 // 2MB buffer
    });

    return { success: true, logs: stdout };
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    return { 
      success: false, 
      error: error.message,
      logs: error.stdout || ''
    };
  }
};

// Parsear lista de servicios
const parseServiceList = (output) => {
  const lines = output.split('\n');
  const services = [];

  for (const line of lines) {
    // Buscar líneas que contengan .service
    if (line.includes('.service')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const name = parts[0];
        const loaded = parts[1];
        const active = parts[2];
        const running = parts[3];
        const description = parts.slice(4).join(' ');

        services.push({
          name: name.replace('.service', ''),
          fullName: name,
          loaded,
          active,
          running,
          description,
          status: active === 'active' ? 'active' : 'inactive'
        });
      }
    }
  }

  return services;
};

module.exports = {
  executeSystemctl,
  getServiceLogs,
  parseServiceList,
  isValidServiceName
};

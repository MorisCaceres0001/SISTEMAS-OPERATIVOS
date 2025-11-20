const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

// Lista blanca de comandos permitidos
const ALLOWED_COMMANDS = {
  list: 'systemctl list-units --type=service --all --no-pager',
  listActive: 'systemctl list-units --type=service --state=active --no-pager',
  listInactive: 'systemctl list-units --type=service --state=inactive --no-pager',
  status: (serviceName) => `systemctl status ${serviceName} --no-pager`,
  start: (serviceName) => `systemctl start ${serviceName}`,
  stop: (serviceName) => `systemctl stop ${serviceName}`,
  restart: (serviceName) => `systemctl restart ${serviceName}`,
  enable: (serviceName) => `systemctl enable ${serviceName}`,
  disable: (serviceName) => `systemctl disable ${serviceName}`,
  logs: (serviceName, lines = 100) => `journalctl -u ${serviceName} --no-pager -n ${lines}`,
  isActive: (serviceName) => `systemctl is-active ${serviceName}`
};

/**
 * Valida que el nombre del servicio sea seguro
 * Previene inyección de comandos
 */
function validateServiceName(serviceName) {
  // Solo permite caracteres alfanuméricos, guiones, puntos y @
  const regex = /^[a-zA-Z0-9\-_.@]+$/;
  
  if (!serviceName || typeof serviceName !== 'string') {
    throw new Error('Nombre de servicio inválido');
  }
  
  if (!regex.test(serviceName)) {
    throw new Error('Nombre de servicio contiene caracteres no permitidos');
  }
  
  // Prevenir path traversal
  if (serviceName.includes('..') || serviceName.includes('/')) {
    throw new Error('Nombre de servicio no válido');
  }
  
  return serviceName.trim();
}

/**
 * Ejecuta un comando systemctl de forma segura
 */
async function executeSystemctl(command, timeout = 30000) {
  try {
    const { stdout, stderr } = await execPromise(command, {
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      shell: '/bin/bash'
    });
    
    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : ''
    };
  }
}

/**
 * Lista todos los servicios
 */
async function listServices() {
  const result = await executeSystemctl(ALLOWED_COMMANDS.list);
  
  if (!result.success) {
    throw new Error('Error al listar servicios: ' + result.error);
  }
  
  return parseServiceList(result.stdout);
}

/**
 * Lista servicios activos
 */
async function listActiveServices() {
  const result = await executeSystemctl(ALLOWED_COMMANDS.listActive);
  
  if (!result.success) {
    throw new Error('Error al listar servicios activos: ' + result.error);
  }
  
  return parseServiceList(result.stdout);
}

/**
 * Lista servicios inactivos
 */
async function listInactiveServices() {
  const result = await executeSystemctl(ALLOWED_COMMANDS.listInactive);
  
  if (!result.success) {
    throw new Error('Error al listar servicios inactivos: ' + result.error);
  }
  
  return parseServiceList(result.stdout);
}

/**
 * Parsea la salida de systemctl list-units
 */
function parseServiceList(output) {
  const lines = output.split('\n');
  const services = [];
  
  for (let line of lines) {
    line = line.trim();
    
    // Saltar encabezados y líneas vacías
    if (!line || line.startsWith('UNIT') || line.startsWith('●') || 
        line.includes('loaded units listed') || line.startsWith('To show')) {
      continue;
    }
    
    // Parsear línea
    const parts = line.split(/\s+/);
    
    if (parts.length >= 4 && parts[0].endsWith('.service')) {
      services.push({
        name: parts[0],
        load: parts[1],
        active: parts[2],
        sub: parts[3],
        description: parts.slice(4).join(' ')
      });
    }
  }
  
  return services;
}

/**
 * Obtiene el estado de un servicio
 */
async function getServiceStatus(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.status(validName));
  
  // Para status, un código de salida diferente de 0 no siempre es error
  // El servicio podría estar inactivo
  return {
    name: validName,
    output: result.stdout || result.stderr,
    isRunning: result.success
  };
}

/**
 * Inicia un servicio
 */
async function startService(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.start(validName));
  
  if (!result.success) {
    throw new Error(`Error al iniciar ${validName}: ${result.error || result.stderr}`);
  }
  
  return { success: true, message: `Servicio ${validName} iniciado correctamente` };
}

/**
 * Detiene un servicio
 */
async function stopService(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.stop(validName));
  
  if (!result.success) {
    throw new Error(`Error al detener ${validName}: ${result.error || result.stderr}`);
  }
  
  return { success: true, message: `Servicio ${validName} detenido correctamente` };
}

/**
 * Reinicia un servicio
 */
async function restartService(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.restart(validName));
  
  if (!result.success) {
    throw new Error(`Error al reiniciar ${validName}: ${result.error || result.stderr}`);
  }
  
  return { success: true, message: `Servicio ${validName} reiniciado correctamente` };
}

/**
 * Habilita un servicio para inicio automático
 */
async function enableService(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.enable(validName));
  
  if (!result.success) {
    throw new Error(`Error al habilitar ${validName}: ${result.error || result.stderr}`);
  }
  
  return { success: true, message: `Servicio ${validName} habilitado correctamente` };
}

/**
 * Deshabilita un servicio del inicio automático
 */
async function disableService(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.disable(validName));
  
  if (!result.success) {
    throw new Error(`Error al deshabilitar ${validName}: ${result.error || result.stderr}`);
  }
  
  return { success: true, message: `Servicio ${validName} deshabilitado correctamente` };
}

/**
 * Obtiene los logs de un servicio
 */
async function getServiceLogs(serviceName, lines = 100) {
  const validName = validateServiceName(serviceName);
  const validLines = Math.min(Math.max(parseInt(lines) || 100, 1), 1000);
  
  const result = await executeSystemctl(ALLOWED_COMMANDS.logs(validName, validLines));
  
  if (!result.success) {
    throw new Error(`Error al obtener logs de ${validName}: ${result.error}`);
  }
  
  return {
    service: validName,
    logs: result.stdout
  };
}

/**
 * Verifica si un servicio está activo
 */
async function isServiceActive(serviceName) {
  const validName = validateServiceName(serviceName);
  const result = await executeSystemctl(ALLOWED_COMMANDS.isActive(validName));
  
  return {
    service: validName,
    active: result.success && result.stdout.trim() === 'active'
  };
}

module.exports = {
  validateServiceName,
  listServices,
  listActiveServices,
  listInactiveServices,
  getServiceStatus,
  startService,
  stopService,
  restartService,
  enableService,
  disableService,
  getServiceLogs,
  isServiceActive
};

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const router = express.Router();

const execPromise = promisify(exec);

// Función para sanitizar nombres de servicios
function sanitizeServiceName(name) {
  // Solo permitir caracteres alfanuméricos, puntos, guiones y guiones bajos
  return name.replace(/[^a-zA-Z0-9._@-]/g, '');
}

// Función para ejecutar comandos de systemctl de forma segura
async function executeSystemctl(command) {
  try {
    const { stdout, stderr } = await execPromise(command, {
      timeout: 10000, // 10 segundos timeout
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer
    });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

// Listar todos los servicios
router.get('/', async (req, res) => {
  try {
    const result = await executeSystemctl('systemctl list-units --type=service --all --no-pager --no-legend');
    
    if (!result.success) {
      return res.status(500).json({ error: 'Error al listar servicios', details: result.error });
    }

    const services = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const name = parts[0];
        const load = parts[1];
        const active = parts[2];
        const sub = parts[3];
        const description = parts.slice(4).join(' ');

        return {
          name: name.replace('.service', ''),
          fullName: name,
          load,
          active,
          sub,
          description,
          status: active === 'active' ? 'running' : 'stopped'
        };
      });

    res.json({ services, count: services.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al procesar servicios' });
  }
});

// Listar servicios activos
router.get('/active', async (req, res) => {
  try {
    const result = await executeSystemctl('systemctl list-units --type=service --state=active --no-pager --no-legend');
    
    if (!result.success) {
      return res.status(500).json({ error: 'Error al listar servicios activos', details: result.error });
    }

    const services = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0].replace('.service', ''),
          fullName: parts[0],
          load: parts[1],
          active: parts[2],
          sub: parts[3],
          description: parts.slice(4).join(' ')
        };
      });

    res.json({ services, count: services.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar servicios activos' });
  }
});

// Listar servicios inactivos
router.get('/inactive', async (req, res) => {
  try {
    const result = await executeSystemctl('systemctl list-units --type=service --state=inactive --no-pager --no-legend');
    
    if (!result.success) {
      return res.status(500).json({ error: 'Error al listar servicios inactivos', details: result.error });
    }

    const services = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0].replace('.service', ''),
          fullName: parts[0],
          load: parts[1],
          active: parts[2],
          sub: parts[3],
          description: parts.slice(4).join(' ')
        };
      });

    res.json({ services, count: services.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar servicios inactivos' });
  }
});

// Obtener estado de un servicio específico
router.get('/:name/status', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`systemctl status ${serviceName} --no-pager`);
    
    // systemctl status puede retornar código de salida diferente de 0 para servicios detenidos
    // pero aún así proporciona información útil
    res.json({
      service: serviceName,
      status: result.stdout,
      raw: result.stdout
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado del servicio' });
  }
});

// Iniciar servicio
router.post('/:name/start', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`systemctl start ${serviceName}`);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Error al iniciar servicio', 
        details: result.stderr || result.error 
      });
    }

    res.json({ 
      success: true, 
      message: `Servicio ${serviceName} iniciado correctamente`,
      service: serviceName
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar servicio' });
  }
});

// Detener servicio
router.post('/:name/stop', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`systemctl stop ${serviceName}`);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Error al detener servicio', 
        details: result.stderr || result.error 
      });
    }

    res.json({ 
      success: true, 
      message: `Servicio ${serviceName} detenido correctamente`,
      service: serviceName
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al detener servicio' });
  }
});

// Reiniciar servicio
router.post('/:name/restart', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`systemctl restart ${serviceName}`);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Error al reiniciar servicio', 
        details: result.stderr || result.error 
      });
    }

    res.json({ 
      success: true, 
      message: `Servicio ${serviceName} reiniciado correctamente`,
      service: serviceName
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al reiniciar servicio' });
  }
});

// Obtener logs de un servicio
router.get('/:name/logs', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    const lines = req.query.lines || 100;
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`journalctl -u ${serviceName} -n ${lines} --no-pager`);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Error al obtener logs', 
        details: result.stderr || result.error 
      });
    }

    res.json({
      service: serviceName,
      logs: result.stdout,
      lines: lines
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs del servicio' });
  }
});

// Habilitar servicio (enable)
router.post('/:name/enable', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`systemctl enable ${serviceName}`);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Error al habilitar servicio', 
        details: result.stderr || result.error 
      });
    }

    res.json({ 
      success: true, 
      message: `Servicio ${serviceName} habilitado correctamente`,
      service: serviceName
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al habilitar servicio' });
  }
});

// Deshabilitar servicio (disable)
router.post('/:name/disable', async (req, res) => {
  try {
    const serviceName = sanitizeServiceName(req.params.name);
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Nombre de servicio inválido' });
    }

    const result = await executeSystemctl(`systemctl disable ${serviceName}`);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Error al deshabilitar servicio', 
        details: result.stderr || result.error 
      });
    }

    res.json({ 
      success: true, 
      message: `Servicio ${serviceName} deshabilitado correctamente`,
      service: serviceName
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al deshabilitar servicio' });
  }
});

module.exports = router;

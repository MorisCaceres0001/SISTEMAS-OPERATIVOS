const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Usuario por defecto (en producción usar base de datos)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

/**
 * Valida las credenciales del usuario
 */
async function validateCredentials(username, password) {
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return {
      username: ADMIN_USER,
      role: 'admin'
    };
  }
  
  return null;
}

/**
 * Genera un token JWT
 */
function generateToken(user) {
  return jwt.sign(
    { 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica un token JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticación
 */
function authMiddleware(req, res, next) {
  // Obtener token del header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No autorizado', 
      message: 'Token no proporcionado' 
    });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ 
      error: 'No autorizado', 
      message: 'Token inválido o expirado' 
    });
  }
  
  // Agregar usuario al request
  req.user = decoded;
  next();
}

/**
 * Login endpoint
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Usuario y contraseña son requeridos' 
      });
    }
    
    const user = await validateCredentials(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos' 
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno',
      message: 'Error al procesar el login' 
    });
  }
}

/**
 * Verifica el token actual
 */
function verifyCurrentToken(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

module.exports = {
  authMiddleware,
  login,
  verifyCurrentToken,
  verifyToken
};

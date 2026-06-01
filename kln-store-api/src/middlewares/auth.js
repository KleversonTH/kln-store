const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito ao admin' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };

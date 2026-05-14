// server/middleware/auth.js
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'manttrack-secret-change-in-production'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' })
  try {
    req.user = jwt.verify(header.slice(7), SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Sin permisos suficientes' })
    }
    next()
  }
}

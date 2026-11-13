import jwt from 'jsonwebtoken';

export const firmar = (u) =>
  jwt.sign({ id: u._id, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });

export function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'No autorizado' }); }
}

export const soloAdmin = (req, res, next) =>
  req.user?.rol === 'admin' ? next() : res.status(403).json({ error: 'Solo administradores' });

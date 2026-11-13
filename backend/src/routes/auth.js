import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { firmar, auth } from '../auth.js';

const r = Router();

r.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Datos incompletos (contraseña mínimo 6 caracteres)' });
  const dominio = process.env.EMAIL_DOMAIN || 'unab.cl';
  if (!email.toLowerCase().endsWith(dominio))
    return res.status(400).json({ error: `Usa tu correo institucional (@...${dominio})` });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ error: 'El correo ya está registrado' });
  const u = await User.create({ nombre, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: firmar(u), nombre: u.nombre, rol: u.rol });
});

r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !u.activo || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ token: firmar(u), nombre: u.nombre, rol: u.rol });
});

r.put('/perfil', auth, async (req, res) => {
  const u = await User.findByIdAndUpdate(req.user.id, { nombre: req.body.nombre }, { new: true });
  res.json({ nombre: u.nombre });
});

export default r;

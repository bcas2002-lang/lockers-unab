import { Router } from 'express';
import { Locker, User } from '../models.js';
import { auth, soloAdmin } from '../auth.js';

const r = Router();
r.get('/', auth, async (_req, res) => res.json(await Locker.find().sort('codigo')));

// Administrador: listar y activar/desactivar usuarios
r.get('/admin/usuarios', auth, soloAdmin, async (_req, res) =>
  res.json(await User.find().select('-password')));
r.patch('/admin/usuarios/:id', auth, soloAdmin, async (req, res) =>
  res.json(await User.findByIdAndUpdate(req.params.id, { activo: !!req.body.activo }, { new: true }).select('-password')));

export default r;

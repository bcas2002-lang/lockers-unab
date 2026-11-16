import { Router } from 'express';
import { Locker, User, Reserva } from '../models.js';
import { auth, soloAdmin } from '../auth.js';

const r = Router();
r.get('/', auth, async (_req, res) => res.json(await Locker.find().sort('codigo')));

// ---- Administrador ----
r.get('/admin/usuarios', auth, soloAdmin, async (_req, res) =>
  res.json(await User.find().select('-password')));
r.patch('/admin/usuarios/:id', auth, soloAdmin, async (req, res) =>
  res.json(await User.findByIdAndUpdate(req.params.id, { activo: !!req.body.activo }, { new: true }).select('-password')));

// Reservas vigentes: quién tiene cada locker
r.get('/admin/reservas', auth, soloAdmin, async (_req, res) =>
  res.json(await Reserva.find({ estado: { $in: ['activa', 'usada'] } })
    .populate('usuario', 'nombre email').populate('locker', 'codigo')));

async function liberarLocker(id, io) {
  await Reserva.updateMany({ locker: id, estado: { $in: ['activa', 'usada'] } }, { estado: 'finalizada' });
  const l = await Locker.findByIdAndUpdate(id, { estado: 'Disponible' }, { new: true });
  if (l) io.emit('locker:update', l);
  return l;
}

// Liberar un locker
r.post('/admin/:id/liberar', auth, soloAdmin, async (req, res) => {
  const l = await liberarLocker(req.params.id, req.app.get('io'));
  if (!l) return res.status(404).json({ error: 'Locker no encontrado' });
  res.json({ ok: true });
});

// Liberar todos
r.post('/admin/liberar-todos', auth, soloAdmin, async (req, res) => {
  const todos = await Locker.find({ estado: { $ne: 'Disponible' } });
  for (const l of todos) await liberarLocker(l._id, req.app.get('io'));
  res.json({ ok: true, liberados: todos.length });
});

export default r;
import { Router } from 'express';
import crypto from 'crypto';
import { Locker, Reserva } from '../models.js';
import { auth } from '../auth.js';
import { simularPago } from '../pago.js';

const r = Router();
const avisar = (req, l) => req.app.get('io').emit('locker:update', l);

// Reservar + pagar + generar llave digital (QR/PIN)
r.post('/', auth, async (req, res) => {
  const { lockerId, horas, tarjeta } = req.body;
  const h = Number(horas);
  if (!lockerId || !(h >= 1 && h <= 24)) return res.status(400).json({ error: 'Horas inválidas (1 a 24)' });

  // Reserva atómica: evita que dos usuarios tomen el mismo locker
  const locker = await Locker.findOneAndUpdate(
    { _id: lockerId, estado: 'Disponible' }, { estado: 'Reservado' }, { new: true });
  if (!locker) return res.status(409).json({ error: 'El locker ya no está disponible' });

  const total = h * locker.tarifaHora;
  const pago = simularPago({ monto: total, tarjeta });
  if (!pago.aprobado) {
    locker.estado = 'Disponible'; await locker.save(); avisar(req, locker);
    return res.status(402).json({ error: 'Pago rechazado' });
  }
  const reserva = await Reserva.create({
    usuario: req.user.id, locker: locker._id, horas: h, total,
    token: crypto.randomBytes(16).toString('hex'),
    pin: String(crypto.randomInt(100000, 999999)),
    expiraAt: new Date(Date.now() + h * 3600 * 1000)
  });
  avisar(req, locker);
  res.status(201).json(await reserva.populate('locker'));
});

r.get('/mias', auth, async (req, res) =>
  res.json(await Reserva.find({ usuario: req.user.id }).populate('locker').sort('-createdAt')));

// Simulador de cerradura: valida QR (token) o PIN y "abre"
r.post('/abrir', auth, async (req, res) => {
  const { codigo } = req.body;
  const reserva = await Reserva.findOne({
    usuario: req.user.id, estado: { $in: ['activa', 'usada'] },
    $or: [{ token: codigo }, { pin: codigo }]
  }).populate('locker');
  if (!reserva) return res.status(403).json({ error: 'Llave inválida' });
  if (reserva.expiraAt < new Date()) {
    reserva.estado = 'expirada'; await reserva.save();
    reserva.locker.estado = 'Disponible'; await reserva.locker.save(); avisar(req, reserva.locker);
    return res.status(403).json({ error: 'Llave expirada' });
  }
  reserva.estado = 'usada'; await reserva.save();
  reserva.locker.estado = 'Ocupado'; await reserva.locker.save(); avisar(req, reserva.locker);
  res.json({ abierto: true, locker: reserva.locker.codigo });
});

export default r;

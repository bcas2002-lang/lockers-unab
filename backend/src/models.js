import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const User = model('User', new Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },          // hash bcrypt
  rol: { type: String, enum: ['user', 'admin'], default: 'user' },
  activo: { type: Boolean, default: true }
}, { timestamps: true }));

export const Locker = model('Locker', new Schema({
  codigo: { type: String, required: true, unique: true },
  ubicacion: { type: String, default: 'Biblioteca' },
  estado: { type: String, enum: ['Disponible', 'Reservado', 'Ocupado'], default: 'Disponible' },
  tarifaHora: { type: Number, default: 500 }
}));

export const Reserva = model('Reserva', new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  locker: { type: Schema.Types.ObjectId, ref: 'Locker', required: true },
  horas: Number,
  total: Number,
  token: String,                                        // contenido del QR
  pin: String,                                          // alternativa al QR
  expiraAt: Date,
  estado: { type: String, enum: ['activa', 'usada', 'expirada'], default: 'activa' }
}, { timestamps: true }));

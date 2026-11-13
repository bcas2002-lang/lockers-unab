import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Locker, User } from './models.js';

await mongoose.connect(process.env.MONGO_URI);
await Locker.deleteMany({});
await Locker.insertMany(Array.from({ length: 12 }, (_, i) => ({
  codigo: 'L-' + String(i + 1).padStart(2, '0'),
  ubicacion: i < 6 ? 'Biblioteca' : 'Edificio B', tarifaHora: 500
})));
if (!(await User.findOne({ email: 'admin@' + (process.env.EMAIL_DOMAIN || 'unab.cl') })))
  await User.create({ nombre: 'Admin', email: 'admin@' + (process.env.EMAIL_DOMAIN || 'unab.cl'),
    password: await bcrypt.hash('admin123', 10), rol: 'admin' });
console.log('Datos de prueba cargados (admin: admin@unab.cl / admin123)');
process.exit(0);

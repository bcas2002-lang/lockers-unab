import 'dotenv/config';
import http from 'http';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import lockerRoutes from './routes/lockers.js';
import reservaRoutes from './routes/reservas.js';

const origin = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*';
const app = express();
app.use(cors({ origin }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin } });   // tiempo real (RF-05)
app.set('io', io);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/lockers', lockerRoutes);
app.use('/api/reservas', reservaRoutes);

await mongoose.connect(process.env.MONGO_URI);
server.listen(process.env.PORT || 4000, () => console.log('API lista en puerto', process.env.PORT || 4000));

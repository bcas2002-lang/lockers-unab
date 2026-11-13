# Lockers UNAB – Prototipo (PWA + API)

Arquitectura: PWA React (cliente) ⇄ API Express (REST + WebSocket) ⇄ MongoDB.

## 1. Requisitos
- Node.js 18 o superior (https://nodejs.org)
- VS Code y Git
- MongoDB: instalado localmente **o** una cuenta gratuita en MongoDB Atlas (https://www.mongodb.com/atlas)

## 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# edita .env: MONGO_URI (local o la cadena de Atlas) y JWT_SECRET
npm run seed              # crea 12 lockers y el admin de prueba
npm run dev               # API en http://localhost:4000
npm test                  # pruebas Jest
```
Prueba: abre http://localhost:4000/health → {"ok":true}

## 3. App móvil (PWA)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

## 4. Probarla en tu celular
1. Computador y celular en la misma red Wi-Fi.
2. Averigua la IP del computador (Windows: `ipconfig`, Mac/Linux: `ifconfig`), ej. 192.168.1.50.
3. En `frontend/.env` pon `VITE_API_URL=http://192.168.1.50:4000` y en `backend/.env` agrega esa URL a `CLIENT_URL` (ej. `CLIENT_URL=http://localhost:5173,http://192.168.1.50:5173`). Reinicia ambos.
4. En el celular abre http://192.168.1.50:5173.

Para **instalar** la PWA como app (icono en pantalla de inicio) se necesita HTTPS: publícala (sección 5).

## 5. Publicarla gratis (HTTPS)
- **Base de datos:** MongoDB Atlas (plan gratuito M0). Copia la cadena de conexión a `MONGO_URI`.
- **Backend:** Render o Railway (servicio Node). Root: `backend`, build `npm install`, start `npm start`. Variables: las de `.env`.
- **Frontend:** Vercel o Netlify. Root: `frontend`, build `npm run build`, salida `dist`. Variable: `VITE_API_URL` = URL del backend.
- Agrega la URL del frontend en `CLIENT_URL` del backend.
- En el celular abre la URL: Chrome → menú → “Instalar app” / Safari → Compartir → “Agregar a inicio”.

## 6. Datos de prueba
- Admin: admin@unab.cl / admin123 (cámbialo)
- Para registrarte, usa un correo que termine en el dominio de `EMAIL_DOMAIN`.
- Tarjeta simulada: cualquiera aprueba; la que termina en 0000 se rechaza.

## 7. Siguientes pasos (Sprints 4 y 5)
- Escaneo real del QR con la cámara (librería `html5-qrcode`; requiere HTTPS).
- Registro de eventos (logs) de aperturas, panel de administrador en la app, notificaciones.
- Guardar el PIN con hash, límite de intentos y más pruebas Jest.
- Si tu tutor exige APK: empaquetar la PWA con Capacitor (https://capacitorjs.com).

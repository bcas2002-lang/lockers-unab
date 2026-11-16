import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { api, BASE } from './api.js';

/* ---------- Login / Registro ---------- */
function Acceso({ onLogin }) {
  const [modo, setModo] = useState('login');
  const [f, setF] = useState({ nombre: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar() {
    try {
      const d = await api(modo === 'login' ? '/auth/login' : '/auth/registro', { method: 'POST', body: f });
      onLogin(d);
    } catch (e) { setErr(e.message); }
  }
  return (
    <div className="card">
      <h2>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      {modo === 'registro' && <input placeholder="Nombre" value={f.nombre} onChange={set('nombre')} />}
      <input placeholder="Correo institucional" value={f.email} onChange={set('email')} />
      <input type="password" placeholder="Contraseña" value={f.password} onChange={set('password')} />
      {err && <div className="error">{err}</div>}
      <button onClick={enviar} style={{ width: '100%' }}>{modo === 'login' ? 'Entrar' : 'Registrarme'}</button>
      <p className="centro">
        <a href="#" onClick={(e) => { e.preventDefault(); setErr(''); setModo(modo === 'login' ? 'registro' : 'login'); }}>
          {modo === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
        </a>
      </p>
    </div>
  );
}

/* ---------- Mapa de lockers + reserva ---------- */
function Lockers({ token, onReservado }) {
  const [lista, setLista] = useState([]);
  const [sel, setSel] = useState(null);
  const [horas, setHoras] = useState(1);
  const [tarjeta, setTarjeta] = useState('4242');
  const [msg, setMsg] = useState({ t: '', ok: false });

  useEffect(() => {
    api('/lockers', { token }).then(setLista).catch((e) => setMsg({ t: e.message }));
    const s = io(BASE);                                   // actualización en tiempo real
    s.on('locker:update', (l) => setLista((p) => p.map((x) => (x._id === l._id ? l : x))));
    return () => s.disconnect();
  }, [token]);

  async function reservar() {
    try {
      await api('/reservas', { method: 'POST', token, body: { lockerId: sel._id, horas, tarjeta } });
      setSel(null); onReservado();
    } catch (e) { setMsg({ t: e.message }); }
  }
  return (
    <>
      <div className="grid">
        {lista.map((l) => (
          <div key={l._id} className={`locker ${l.estado}`} onClick={() => l.estado === 'Disponible' && setSel(l)}>
            {l.codigo}<br /><small>{l.estado}</small>
          </div>
        ))}
      </div>
      {sel && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3>Reservar {sel.codigo} ({sel.ubicacion})</h3>
          <label>Horas (1–24)</label>
          <input type="number" min="1" max="24" value={horas} onChange={(e) => setHoras(e.target.value)} />
          <p>Total: <b>${(horas * sel.tarifaHora).toLocaleString('es-CL')}</b></p>
          <label>Tarjeta simulada (termina en 0000 = rechazada)</label>
          <input value={tarjeta} onChange={(e) => setTarjeta(e.target.value)} />
          <button onClick={reservar}>Pagar y reservar</button>{' '}
          <button className="sec" onClick={() => setSel(null)}>Cancelar</button>
        </div>
      )}
      {msg.t && <div className="error">{msg.t}</div>}
    </>
  );
}

/* ---------- Mis reservas + llave QR/PIN + simulador de cerradura ---------- */
function MisReservas({ token }) {
  const [rs, setRs] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState({ t: '', ok: false });
  const cargar = () => api('/reservas/mias', { token }).then(setRs);

  useEffect(() => {
    cargar();
    const s = io(BASE);
    s.on('locker:update', cargar);
    return () => s.disconnect();
  }, []);

  async function accion(ruta, body, texto) {
    try {
      await api(ruta, { method: 'POST', token, body });
      setMsg({ t: texto, ok: true }); cargar();
    } catch (e) { setMsg({ t: e.message, ok: false }); }
  }
  const abrir = (c) => accion('/reservas/abrir', { codigo: c }, 'Locker abierto');

  return (
    <>
      {rs.length === 0 && <div className="card">Aún no tienes reservas.</div>}
      {rs.map((r) => {
        const vigente = r.estado === 'activa' || r.estado === 'usada';
        const est = r.locker?.estado;
        return (
          <div className="card centro" key={r._id}>
            <b>{r.locker?.codigo}</b> · reserva {r.estado}
            {vigente && <div className={`locker ${est}`} style={{ margin: '10px 0' }}>{est}</div>}
            {vigente && (<>
              <div style={{ margin: 12 }}><QRCodeSVG value={r.token} size={150} /></div>
              <div>PIN: <b>{r.pin}</b> · vence {new Date(r.expiraAt).toLocaleString('es-CL')}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {est !== 'Abierto' && <button onClick={() => abrir(r.token)}>Abrir locker</button>}
                {est === 'Abierto' && <button onClick={() => accion(`/reservas/${r._id}/cerrar`, {}, 'Locker cerrado')}>Cerrar locker</button>}
                <button className="sec" onClick={() => accion(`/reservas/${r._id}/liberar`, {}, 'Locker liberado')}>Terminar y liberar</button>
              </div>
            </>)}
          </div>
        );
      })}
      <div className="card">
        <h3>Simulador de cerradura</h3>
        <input placeholder="Pega el código del QR o escribe el PIN" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        <button onClick={() => abrir(codigo)}>Abrir con código</button>
        {msg.t && <div className={msg.ok ? 'ok' : 'error'}>{msg.t}</div>}
      </div>
    </>
  );
}
/* ---------- App ---------- */
export default function App() {
  const [sesion, setSesion] = useState(() => JSON.parse(localStorage.getItem('sesion') || 'null'));
  const [vista, setVista] = useState('lockers');
  const guardar = (d) => { localStorage.setItem('sesion', JSON.stringify(d)); setSesion(d); };
  const salir = () => { localStorage.removeItem('sesion'); setSesion(null); setVista('lockers'); };

  return (
    <>
      <header>
        <h1>Lockers UNAB</h1>
        {sesion && <button className="sec" onClick={salir}>Salir</button>}
      </header>
      <main>
        {!sesion ? <Acceso onLogin={guardar} /> : (<>
          <p>Hola, <b>{sesion.nombre}</b></p>
          <nav>
            <button className={vista === 'lockers' ? '' : 'sec'} onClick={() => setVista('lockers')}>Lockers</button>
            <button className={vista === 'mias' ? '' : 'sec'} onClick={() => setVista('mias')}>Mis reservas</button>
            {sesion.rol === 'admin' && (
              <button className={vista === 'admin' ? '' : 'sec'} onClick={() => setVista('admin')}>Admin</button>
            )}
          </nav>
          {vista === 'lockers' && <Lockers token={sesion.token} onReservado={() => setVista('mias')} />}
          {vista === 'mias' && <MisReservas token={sesion.token} />}
          {vista === 'admin' && <Admin token={sesion.token} />}
        </>)}
      </main>
    </>
  );
}
/* ---------- Panel de administrador: liberar lockers ---------- */
function Admin({ token }) {
  const [lockers, setLockers] = useState([]);
  const [rs, setRs] = useState([]);
  const [msg, setMsg] = useState({ t: '', ok: false });

  const cargar = () => {
    api('/lockers', { token }).then(setLockers).catch(() => {});
    api('/lockers/admin/reservas', { token }).then(setRs).catch((e) => setMsg({ t: e.message, ok: false }));
  };
  useEffect(() => {
    cargar();
    const s = io(BASE);
    s.on('locker:update', cargar);
    return () => s.disconnect();
  }, []);

  async function liberar(id, codigo) {
    try {
      await api(`/lockers/admin/${id}/liberar`, { method: 'POST', token, body: {} });
      setMsg({ t: `Locker ${codigo} liberado`, ok: true });
    } catch (e) { setMsg({ t: e.message, ok: false }); }
  }
  async function liberarTodos() {
    if (!window.confirm('¿Liberar TODOS los lockers?')) return;
    try {
      const d = await api('/lockers/admin/liberar-todos', { method: 'POST', token, body: {} });
      setMsg({ t: `${d.liberados} lockers liberados`, ok: true });
    } catch (e) { setMsg({ t: e.message, ok: false }); }
  }
  const quien = (l) => rs.find((x) => x.locker?._id === l._id)?.usuario;

  return (
    <>
      <div className="card fila">
        <b>Panel de administrador</b>
        <button onClick={liberarTodos}>Liberar todos</button>
      </div>
      {msg.t && <div className={msg.ok ? 'ok' : 'error'}>{msg.t}</div>}
      {lockers.map((l) => (
        <div className="card fila" key={l._id}>
          <div>
            <b>{l.codigo}</b> <span className={`chip ${l.estado}`}>{l.estado}</span>
            {quien(l) && <div style={{ fontSize: 13, color: '#666' }}>{quien(l).nombre} · {quien(l).email}</div>}
          </div>
          <button className="sec" disabled={l.estado === 'Disponible'} onClick={() => liberar(l._id, l.codigo)}>Liberar</button>
        </div>
      ))}
    </>
  );
}
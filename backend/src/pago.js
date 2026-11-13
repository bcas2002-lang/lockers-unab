// Pasarela de pago SIMULADA (adaptador). Para una real, solo se cambia este módulo.
// Regla de prueba: una tarjeta que termina en 0000 se rechaza.
export function simularPago({ monto, tarjeta = '' }) {
  const aprobado = monto > 0 && !String(tarjeta).endsWith('0000');
  return { aprobado, referencia: 'SIM-' + Date.now() };
}

import { simularPago } from '../src/pago.js';

test('aprueba un pago normal', () => {
  expect(simularPago({ monto: 1000, tarjeta: '4242' }).aprobado).toBe(true);
});
test('rechaza tarjeta terminada en 0000', () => {
  expect(simularPago({ monto: 1000, tarjeta: '0000' }).aprobado).toBe(false);
});
test('rechaza monto cero', () => {
  expect(simularPago({ monto: 0, tarjeta: '4242' }).aprobado).toBe(false);
});

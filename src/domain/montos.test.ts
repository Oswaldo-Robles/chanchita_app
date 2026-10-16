import { formatearMonto, parsearMonto } from './montos';

describe('parsearMonto', () => {
  it('acepta punto y coma decimal', () => {
    expect(parsearMonto('12.50')).toBe(1250);
    expect(parsearMonto('12,50')).toBe(1250);
  });

  it('acepta enteros y un solo decimal', () => {
    expect(parsearMonto('40')).toBe(4000);
    expect(parsearMonto('7.5')).toBe(750);
    expect(parsearMonto(' 3,05 ')).toBe(305);
  });

  it('no sufre errores de coma flotante', () => {
    expect(parsearMonto('0.29')).toBe(29);
    expect(parsearMonto('1.15')).toBe(115);
  });

  it('devuelve null si no es un monto válido', () => {
    expect(parsearMonto('')).toBeNull();
    expect(parsearMonto('abc')).toBeNull();
    expect(parsearMonto('12.345')).toBeNull();
    expect(parsearMonto('1.2.3')).toBeNull();
    expect(parsearMonto('-5')).toBeNull();
  });
});

describe('formatearMonto', () => {
  it('formatea céntimos como soles', () => {
    expect(formatearMonto(1250)).toBe('S/ 12.50');
    expect(formatearMonto(4000)).toBe('S/ 40.00');
    expect(formatearMonto(5)).toBe('S/ 0.05');
    expect(formatearMonto(0)).toBe('S/ 0.00');
  });
});

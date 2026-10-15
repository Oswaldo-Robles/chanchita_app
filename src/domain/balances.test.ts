import { calcularBalances, repartir } from './balances';
import type { Gasto, Participante, Salida } from './types';

const persona = (id: string): Participante => ({ id, nombre: id });

const salida = (ids: string[], gastos: Gasto[]): Salida => ({
  id: 's1',
  nombre: 'Salida de prueba',
  fecha: '2026-10-14',
  participantes: ids.map(persona),
  gastos,
});

const gasto = (
  montoCentimos: number,
  pagadoPor: string,
  divididoEntre: string[],
  id = 'g1',
): Gasto => ({ id, descripcion: 'gasto', montoCentimos, pagadoPor, divididoEntre });

const suma = (balances: Record<string, number>) =>
  Object.values(balances).reduce((a, b) => a + b, 0);

describe('repartir', () => {
  it('reparte en partes iguales cuando es divisible', () => {
    expect(repartir(4000, ['A', 'B', 'C', 'D'])).toEqual({ A: 1000, B: 1000, C: 1000, D: 1000 });
  });

  it('S/10.00 entre 3 → 334/333/333 y la suma es el monto', () => {
    const partes = repartir(1000, ['A', 'B', 'C']);
    expect(partes).toEqual({ A: 334, B: 333, C: 333 });
    expect(suma(partes)).toBe(1000);
  });

  it('el céntimo sobrante sigue el orden de divididoEntre', () => {
    expect(repartir(1000, ['B', 'A', 'C'])).toEqual({ B: 334, A: 333, C: 333 });
    expect(repartir(1000, ['C', 'B', 'A'])).toEqual({ C: 334, B: 333, A: 333 });
  });

  it('con varios céntimos sobrantes los reparte a los primeros', () => {
    // 1002 entre 5 → base 200, sobran 2 → los dos primeros reciben 1 más
    expect(repartir(1002, ['A', 'B', 'C', 'D', 'E'])).toEqual({
      A: 201,
      B: 201,
      C: 200,
      D: 200,
      E: 200,
    });
  });
});

describe('calcularBalances', () => {
  it('pizza S/40 pagada por A entre A, B, C, D → B, C, D deben S/10 a A', () => {
    const b = calcularBalances(salida(['A', 'B', 'C', 'D'], [gasto(4000, 'A', ['A', 'B', 'C', 'D'])]));
    expect(b).toEqual({ A: 3000, B: -1000, C: -1000, D: -1000 });
  });

  it('gasto de un subgrupo (3 de 5): los excluidos quedan en 0', () => {
    const b = calcularBalances(
      salida(['A', 'B', 'C', 'D', 'E'], [gasto(3000, 'A', ['A', 'B', 'C'])]),
    );
    expect(b).toEqual({ A: 2000, B: -1000, C: -1000, D: 0, E: 0 });
  });

  it('S/10.00 entre 3: suma de balances exactamente 0', () => {
    const b = calcularBalances(salida(['A', 'B', 'C'], [gasto(1000, 'A', ['A', 'B', 'C'])]));
    expect(b).toEqual({ A: 666, B: -333, C: -333 });
    expect(suma(b)).toBe(0);
  });

  it('determinismo: el sobrante lo asume quien va primero en divididoEntre', () => {
    const b1 = calcularBalances(salida(['A', 'B', 'C'], [gasto(1000, 'A', ['B', 'A', 'C'])]));
    const b2 = calcularBalances(salida(['A', 'B', 'C'], [gasto(1000, 'A', ['C', 'B', 'A'])]));
    expect(b1).toEqual({ A: 667, B: -334, C: -333 });
    expect(b2).toEqual({ A: 667, B: -333, C: -334 });
  });

  it('quien paga y no participa solo acumula a favor', () => {
    const b = calcularBalances(salida(['A', 'B', 'C'], [gasto(1000, 'A', ['B', 'C'])]));
    expect(b).toEqual({ A: 1000, B: -500, C: -500 });
  });

  it('varios gastos se acumulan', () => {
    const b = calcularBalances(
      salida(
        ['A', 'B', 'C'],
        [gasto(3000, 'A', ['A', 'B', 'C'], 'g1'), gasto(1200, 'B', ['B', 'C'], 'g2')],
      ),
    );
    // A: +3000 -1000 = 2000 | B: +1200 -1000 -600 = -400 | C: -1000 -600 = -1600
    expect(b).toEqual({ A: 2000, B: -400, C: -1600 });
    expect(suma(b)).toBe(0);
  });

  it('salida sin gastos → todos en 0', () => {
    expect(calcularBalances(salida(['A', 'B'], []))).toEqual({ A: 0, B: 0 });
  });
});

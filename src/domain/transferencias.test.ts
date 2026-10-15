import { calcularBalances } from './balances';
import { minimizarTransferencias } from './transferencias';
import type { Balances, Gasto, Salida, Transferencia } from './types';

// Aplica las transferencias sobre los balances: el deudor sube, el acreedor baja.
const aplicar = (balances: Balances, transferencias: Transferencia[]): Balances => {
  const resultado = { ...balances };
  for (const t of transferencias) {
    resultado[t.de] += t.montoCentimos;
    resultado[t.a] -= t.montoCentimos;
  }
  return resultado;
};

const todosEnCero = (balances: Balances) => Object.values(balances).every((v) => v === 0);

describe('minimizarTransferencias', () => {
  it('sin deudas devuelve lista vacía', () => {
    expect(minimizarTransferencias({ A: 0, B: 0, C: 0 })).toEqual([]);
  });

  it('un acreedor y varios deudores: cada deudor le paga', () => {
    const t = minimizarTransferencias({ A: 3000, B: -1000, C: -1000, D: -1000 });
    expect(t).toEqual([
      { de: 'B', a: 'A', montoCentimos: 1000 },
      { de: 'C', a: 'A', montoCentimos: 1000 },
      { de: 'D', a: 'A', montoCentimos: 1000 },
    ]);
  });

  it('deudas cruzadas: como máximo N−1 transferencias y todo queda en 0', () => {
    const balances: Balances = { A: 5000, B: 2000, C: -3000, D: -1500, E: -2500 };
    const t = minimizarTransferencias(balances);
    expect(t.length).toBeLessThanOrEqual(Object.keys(balances).length - 1);
    expect(todosEnCero(aplicar(balances, t))).toBe(true);
  });

  it('empareja al mayor deudor con el mayor acreedor', () => {
    const t = minimizarTransferencias({ A: 1000, B: 500, C: -1200, D: -300 });
    expect(t[0]).toEqual({ de: 'C', a: 'A', montoCentimos: 1000 });
  });

  it('los montos de las transferencias son siempre positivos', () => {
    const t = minimizarTransferencias({ A: 700, B: -200, C: -500 });
    expect(t.every((x) => x.montoCentimos > 0)).toBe(true);
  });

  it('es determinista: mismo dato, mismo resultado', () => {
    const balances: Balances = { A: 1000, B: 1000, C: -1000, D: -1000 };
    expect(minimizarTransferencias(balances)).toEqual(minimizarTransferencias({ ...balances }));
  });

  it('no modifica el objeto de entrada', () => {
    const balances: Balances = { A: 1000, B: -1000 };
    minimizarTransferencias(balances);
    expect(balances).toEqual({ A: 1000, B: -1000 });
  });
});

describe('salidas de ejemplo completas (balances + transferencias)', () => {
  const gasto = (
    id: string,
    montoCentimos: number,
    pagadoPor: string,
    divididoEntre: string[],
  ): Gasto => ({ id, descripcion: id, montoCentimos, pagadoPor, divididoEntre });

  const ejemplos: Record<string, Salida> = {
    'pizza entre 4': {
      id: 's1',
      nombre: 'Pizza',
      fecha: '2026-10-14',
      participantes: ['A', 'B', 'C', 'D'].map((id) => ({ id, nombre: id })),
      gastos: [gasto('g1', 4000, 'A', ['A', 'B', 'C', 'D'])],
    },
    'cinco amigos, gastos mixtos con céntimos': {
      id: 's2',
      nombre: 'Viernes',
      fecha: '2026-10-14',
      participantes: ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, nombre: id })),
      gastos: [
        gasto('pizza', 4000, 'A', ['A', 'B', 'C']),
        gasto('gaseosas', 1001, 'D', ['A', 'B', 'C', 'D', 'E']),
        gasto('taxi', 2333, 'E', ['D', 'E']),
        gasto('helados', 1777, 'B', ['B', 'C', 'E']),
      ],
    },
    'sin gastos': {
      id: 's3',
      nombre: 'Vacía',
      fecha: '2026-10-14',
      participantes: ['A', 'B'].map((id) => ({ id, nombre: id })),
      gastos: [],
    },
  };

  it.each(Object.entries(ejemplos))('%s: suma 0, ≤ N−1 pagos y liquida todo', (_nombre, s) => {
    const balances = calcularBalances(s);
    expect(Object.values(balances).reduce((a, b) => a + b, 0)).toBe(0);

    const t = minimizarTransferencias(balances);
    expect(t.length).toBeLessThanOrEqual(Math.max(s.participantes.length - 1, 0));
    expect(todosEnCero(aplicar(balances, t))).toBe(true);
  });
});

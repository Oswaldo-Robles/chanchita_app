import { calcularBalances } from './balances';
import { formatearMonto } from './montos';
import { minimizarTransferencias } from './transferencias';
import type { Salida } from './types';

export type EstadoBalance = 'recibe' | 'debe' | 'neutro';

export type FilaBalance = {
  id: string;
  nombre: string;
  balanceCentimos: number;
  montoTexto: string; // siempre positivo; el signo lo da `estado`
  estado: EstadoBalance;
};

export type FilaTransferencia = {
  deId: string;
  aId: string;
  deNombre: string;
  aNombre: string;
  montoCentimos: number;
  montoTexto: string;
};

export type Resultado = {
  filas: FilaBalance[];
  transferencias: FilaTransferencia[];
  todoCuadrado: boolean;
};

/** Convierte el cálculo del dominio en filas listas para mostrar (sin lógica en la pantalla). */
export function armarFilasResultado(salida: Salida): Resultado {
  const balances = calcularBalances(salida);
  const nombre = (id: string) => salida.participantes.find((p) => p.id === id)?.nombre ?? '?';

  const filas = salida.participantes.map((p): FilaBalance => {
    const balance = balances[p.id] ?? 0;
    return {
      id: p.id,
      nombre: p.nombre,
      balanceCentimos: balance,
      montoTexto: formatearMonto(Math.abs(balance)),
      estado: balance > 0 ? 'recibe' : balance < 0 ? 'debe' : 'neutro',
    };
  });

  const transferencias = minimizarTransferencias(balances).map(
    (t): FilaTransferencia => ({
      deId: t.de,
      aId: t.a,
      deNombre: nombre(t.de),
      aNombre: nombre(t.a),
      montoCentimos: t.montoCentimos,
      montoTexto: formatearMonto(t.montoCentimos),
    }),
  );

  return { filas, transferencias, todoCuadrado: transferencias.length === 0 };
}

import type { Balances, Transferencia } from './types';

type Saldo = { id: string; monto: number };

// Mayor monto primero; a igual monto se respeta el orden original (sort es estable).
const mayorPrimero = (a: Saldo, b: Saldo) => b.monto - a.monto;

/**
 * Lista reducida de pagos que deja todos los balances en 0 (algoritmo greedy):
 * siempre empareja al mayor deudor con el mayor acreedor. Cada paso salda al
 * menos a uno de los dos, así que hay como máximo N−1 transferencias.
 * No garantiza el mínimo absoluto.
 */
export function minimizarTransferencias(balances: Balances): Transferencia[] {
  const deudores: Saldo[] = [];
  const acreedores: Saldo[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < 0) deudores.push({ id, monto: -balance });
    if (balance > 0) acreedores.push({ id, monto: balance });
  }

  const transferencias: Transferencia[] = [];

  while (deudores.length > 0 && acreedores.length > 0) {
    deudores.sort(mayorPrimero);
    acreedores.sort(mayorPrimero);

    const deudor = deudores[0];
    const acreedor = acreedores[0];
    const monto = Math.min(deudor.monto, acreedor.monto);

    transferencias.push({ de: deudor.id, a: acreedor.id, montoCentimos: monto });

    deudor.monto -= monto;
    acreedor.monto -= monto;
    if (deudor.monto === 0) deudores.shift();
    if (acreedor.monto === 0) acreedores.shift();
  }

  return transferencias;
}

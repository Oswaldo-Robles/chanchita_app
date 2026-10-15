import type { Balances, Salida } from './types';

/**
 * Reparte un monto en céntimos enteros entre los ids dados.
 * Cada uno recibe floor(monto / n); los céntimos sobrantes van de a uno
 * a los primeros ids, en el orden recibido (así el resultado es determinista).
 */
export function repartir(montoCentimos: number, ids: string[]): Record<string, number> {
  const base = Math.floor(montoCentimos / ids.length);
  const sobrante = montoCentimos - base * ids.length;

  const partes: Record<string, number> = {};
  ids.forEach((id, i) => {
    partes[id] = base + (i < sobrante ? 1 : 0);
  });
  return partes;
}

/**
 * Balance en céntimos de cada participante: lo que pagó menos lo que le toca.
 * Positivo: le deben. Negativo: debe.
 */
export function calcularBalances(salida: Salida): Balances {
  const balances: Balances = {};
  for (const p of salida.participantes) {
    balances[p.id] = 0;
  }

  for (const gasto of salida.gastos) {
    balances[gasto.pagadoPor] = (balances[gasto.pagadoPor] ?? 0) + gasto.montoCentimos;

    const partes = repartir(gasto.montoCentimos, gasto.divididoEntre);
    for (const id of gasto.divididoEntre) {
      balances[id] = (balances[id] ?? 0) - partes[id];
    }
  }

  return balances;
}

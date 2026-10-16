/**
 * Convierte lo que escribe el usuario ("12.50" o "12,50") a céntimos enteros.
 * Devuelve null si no es un monto válido (máximo dos decimales).
 */
export function parsearMonto(texto: string): number | null {
  const m = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(texto.trim());
  if (!m) return null;
  const soles = Number(m[1]);
  const centimos = Number((m[2] ?? '').padEnd(2, '0'));
  return soles * 100 + centimos;
}

/** 1250 → "S/ 12.50" */
export function formatearMonto(centimos: number): string {
  const soles = Math.floor(centimos / 100);
  const resto = String(centimos % 100).padStart(2, '0');
  return `S/ ${soles}.${resto}`;
}

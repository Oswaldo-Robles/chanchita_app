export type DatosGasto = {
  descripcion: string;
  montoCentimos: number | null; // null: el texto del monto no se pudo interpretar
  divididoEntre: string[];
};

export type ResultadoGasto =
  | { ok: true }
  | { ok: false; errores: { descripcion?: string; monto?: string; divididoEntre?: string } };

export function validarGasto(datos: DatosGasto): ResultadoGasto {
  const errores: { descripcion?: string; monto?: string; divididoEntre?: string } = {};

  if (datos.descripcion.trim() === '') errores.descripcion = 'Escribe una descripción';
  if (datos.montoCentimos === null || datos.montoCentimos <= 0) {
    errores.monto = 'El monto debe ser mayor a 0';
  }
  if (datos.divididoEntre.length === 0) errores.divididoEntre = 'Elige al menos a una persona';

  return Object.keys(errores).length > 0 ? { ok: false, errores } : { ok: true };
}

/** Suma en céntimos de todos los gastos de una salida. */
export function totalGastos(gastos: { montoCentimos: number }[]): number {
  return gastos.reduce((suma, g) => suma + g.montoCentimos, 0);
}

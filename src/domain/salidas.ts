import type { Participante, Perfil, Salida } from './types';

export const ID_ORGANIZADOR = 'organizador';

/** El organizador entra a cada salida con el número de Yape de su perfil. */
export function crearOrganizador(perfil: Perfil): Participante {
  return {
    id: ID_ORGANIZADOR,
    nombre: perfil.nombre,
    telefono: perfil.telefonoYape,
    esOrganizador: true,
  };
}

/**
 * Deja un celular peruano en 9 dígitos ("+51 987 654 321" → "987654321").
 * Devuelve undefined si no es un celular válido (así un contacto raro se
 * agrega igual, solo que sin teléfono).
 */
export function normalizarTelefono(crudo: string): string | undefined {
  let digitos = crudo.replace(/\D/g, '');
  if (digitos.length === 11 && digitos.startsWith('51')) digitos = digitos.slice(2);
  return /^9\d{8}$/.test(digitos) ? digitos : undefined;
}

export type ResultadoParticipante =
  | { ok: true; nombre: string; telefono: string | undefined }
  | { ok: false; errores: { nombre?: string; telefono?: string } };

/** Alta manual de un participante: nombre obligatorio, teléfono opcional pero válido. */
export function validarParticipante(nombre: string, telefono: string): ResultadoParticipante {
  const nombreLimpio = nombre.trim();
  const errores: { nombre?: string; telefono?: string } = {};

  if (nombreLimpio === '') errores.nombre = 'Escribe un nombre';

  let telefonoNormalizado: string | undefined;
  if (telefono.trim() !== '') {
    telefonoNormalizado = normalizarTelefono(telefono);
    if (!telefonoNormalizado) errores.telefono = 'Número inválido (9 dígitos, empieza con 9)';
  }

  if (errores.nombre || errores.telefono) return { ok: false, errores };
  return { ok: true, nombre: nombreLimpio, telefono: telefonoNormalizado };
}

export type ResultadoSalida =
  | { ok: true }
  | { ok: false; errores: { nombre?: string; fecha?: string; participantes?: string } };

const MIN_PARTICIPANTES = 2;

function esFechaISOValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

export function validarSalida(
  nombre: string,
  fecha: string,
  participantes: Participante[],
): ResultadoSalida {
  const errores: { nombre?: string; fecha?: string; participantes?: string } = {};

  if (nombre.trim() === '') errores.nombre = 'Ponle un nombre a la salida';
  if (!esFechaISOValida(fecha)) errores.fecha = 'Usa el formato AAAA-MM-DD';
  if (participantes.length < MIN_PARTICIPANTES) {
    errores.participantes = 'Agrega al menos a otra persona';
  }

  return Object.keys(errores).length > 0 ? { ok: false, errores } : { ok: true };
}

/** Fecha local de hoy como AAAA-MM-DD. */
export function fechaHoyISO(ahora: Date = new Date()): string {
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mm}-${dd}`;
}

/** Más reciente primero; con la misma fecha, la guardada después va antes. */
export function ordenarSalidas(salidas: Salida[]): Salida[] {
  return [...salidas].reverse().sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export type ResultadoQuitar = { ok: true } | { ok: false; motivo: string };

/** Regla de borrado: no se quita al organizador ni a quien figura en algún gasto. */
export function puedeQuitarParticipante(salida: Salida, id: string): ResultadoQuitar {
  const participante = salida.participantes.find((p) => p.id === id);
  if (!participante) return { ok: false, motivo: 'Ese participante no está en la salida' };
  if (participante.esOrganizador) {
    return { ok: false, motivo: 'El organizador no se puede quitar de su propia salida' };
  }

  const enGasto = salida.gastos.some((g) => g.pagadoPor === id || g.divididoEntre.includes(id));
  if (enGasto) {
    return {
      ok: false,
      motivo: `${participante.nombre} figura en un gasto. Edita o elimina ese gasto primero.`,
    };
  }

  return { ok: true };
}

/** Evita agregar dos veces a la misma persona (mismo teléfono o mismo nombre). */
export function yaEstaAgregado(
  participantes: Participante[],
  nombre: string,
  telefono?: string,
): boolean {
  const nombreNorm = nombre.trim().toLowerCase();
  return participantes.some(
    (p) =>
      p.nombre.trim().toLowerCase() === nombreNorm ||
      (telefono !== undefined && p.telefono === telefono),
  );
}

/** Un borrador "vacío" no vale la pena guardarlo: sin nombre y solo con el organizador. */
export function esBorradorVacio(nombre: string, participantes: Participante[]): boolean {
  return nombre.trim() === '' && participantes.every((p) => p.esOrganizador);
}

/** Garantiza que el organizador esté, actualizado con el perfil actual, y en primer lugar. */
export function asegurarOrganizador(participantes: Participante[], perfil: Perfil): Participante[] {
  const otros = participantes.filter((p) => !p.esOrganizador);
  return [crearOrganizador(perfil), ...otros];
}

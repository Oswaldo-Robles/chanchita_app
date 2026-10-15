import type { Perfil } from './types';

export type ResultadoPerfil =
  | { ok: true; perfil: Perfil }
  | { ok: false; errores: { nombre?: string; telefono?: string } };

/** Valida los datos del onboarding: nombre no vacío y teléfono de 9 dígitos. */
export function validarPerfil(nombre: string, telefono: string): ResultadoPerfil {
  const nombreLimpio = nombre.trim();
  const telefonoLimpio = telefono.replace(/\s+/g, '');

  const errores: { nombre?: string; telefono?: string } = {};
  if (nombreLimpio === '') errores.nombre = 'Escribe tu nombre';
  if (!/^\d{9}$/.test(telefonoLimpio)) errores.telefono = 'El número debe tener 9 dígitos';

  if (errores.nombre || errores.telefono) return { ok: false, errores };
  return { ok: true, perfil: { nombre: nombreLimpio, telefonoYape: telefonoLimpio } };
}

import { formatearMonto } from './montos';
import { armarFilasResultado } from './resultado';
import { normalizarTelefono } from './salidas';
import type { Salida } from './types';

// En los mensajes el monto va pegado: "S/12.50".
const monto = (centimos: number) => formatearMonto(centimos).replace('S/ ', 'S/');

export type DatosCobro = {
  deudorNombre: string;
  salidaNombre: string;
  montoCentimos: number;
  acreedorNombre: string;
  acreedorTelefono?: string; // si falta, el mensaje omite el número
};

export function construirMensajeCobro(d: DatosCobro): string {
  const numero = d.acreedorTelefono ? ` al ${d.acreedorTelefono}` : '';
  return (
    `Hola ${d.deudorNombre}, de la salida '${d.salidaNombre}' ` +
    `te toca yapearle ${monto(d.montoCentimos)} a ${d.acreedorNombre}${numero} 🐷`
  );
}

/** "987654321" → "51987654321"; undefined si no es un celular válido. */
export function telefonoWhatsApp(telefono: string | undefined): string | undefined {
  if (!telefono) return undefined;
  const nacional = normalizarTelefono(telefono);
  return nacional ? `51${nacional}` : undefined;
}

/** Con teléfono abre el chat; sin él, WhatsApp deja elegir el chat a mano. */
export function construirEnlaceWhatsApp(telefono: string | undefined, texto: string): string {
  const numero = telefonoWhatsApp(telefono) ?? '';
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/** Texto para pegar en el grupo con todas las deudas de la salida. */
export function construirResumen(salida: Salida): string {
  const { transferencias, todoCuadrado } = armarFilasResultado(salida);
  if (todoCuadrado) return `Cuentas de '${salida.nombre}': todo cuadrado 🎉`;

  const lineas = transferencias.map((t) => `${t.deNombre} → ${t.aNombre}: ${monto(t.montoCentimos)}`);
  return [`Cuentas de '${salida.nombre}' 🐷`, ...lineas].join('\n');
}

import {
  construirEnlaceWhatsApp,
  construirMensajeCobro,
  construirResumen,
  telefonoWhatsApp,
} from './mensajes';
import type { Salida } from './types';

const base = {
  deudorNombre: 'Juan',
  salidaNombre: 'Pizza viernes',
  montoCentimos: 1250,
  acreedorNombre: 'María',
};

describe('construirMensajeCobro', () => {
  it('con teléfono del acreedor lo incluye', () => {
    expect(construirMensajeCobro({ ...base, acreedorTelefono: '987654321' })).toBe(
      "Hola Juan, de la salida 'Pizza viernes' te toca yapearle S/12.50 a María al 987654321 🐷",
    );
  });

  it('sin teléfono del acreedor omite el número', () => {
    expect(construirMensajeCobro(base)).toBe(
      "Hola Juan, de la salida 'Pizza viernes' te toca yapearle S/12.50 a María 🐷",
    );
  });
});

describe('telefonoWhatsApp', () => {
  it('agrega el prefijo 51', () => {
    expect(telefonoWhatsApp('987654321')).toBe('51987654321');
  });

  it('acepta formatos con espacios y prefijo', () => {
    expect(telefonoWhatsApp('+51 987 654 321')).toBe('51987654321');
  });

  it('devuelve undefined si falta o es inválido', () => {
    expect(telefonoWhatsApp(undefined)).toBeUndefined();
    expect(telefonoWhatsApp('123')).toBeUndefined();
  });
});

describe('construirEnlaceWhatsApp', () => {
  it('chat del deudor con el texto codificado', () => {
    expect(construirEnlaceWhatsApp('987654321', "Hola & 'chao' 🐷\nok")).toBe(
      `https://wa.me/51987654321?text=${encodeURIComponent("Hola & 'chao' 🐷\nok")}`,
    );
  });

  it('sin teléfono abre el selector de chat', () => {
    expect(construirEnlaceWhatsApp(undefined, 'Hola')).toBe('https://wa.me/?text=Hola');
  });
});

describe('construirResumen', () => {
  const salida = (gastos: Salida['gastos']): Salida => ({
    id: 's1',
    nombre: 'Pizza viernes',
    fecha: '2026-10-14',
    participantes: [
      { id: 'maria', nombre: 'María', telefono: '987654321' },
      { id: 'juan', nombre: 'Juan' },
      { id: 'luis', nombre: 'Luis' },
    ],
    gastos,
  });

  it('lista todas las transferencias de la salida', () => {
    const texto = construirResumen(
      salida([
        { id: 'g1', descripcion: 'Pizza', montoCentimos: 3000, pagadoPor: 'maria', divididoEntre: ['maria', 'juan', 'luis'] },
      ]),
    );
    expect(texto).toBe(
      ["Cuentas de 'Pizza viernes' 🐷", 'Juan → María: S/10.00', 'Luis → María: S/10.00'].join('\n'),
    );
  });

  it('sin deudas avisa que todo está cuadrado', () => {
    expect(construirResumen(salida([]))).toBe("Cuentas de 'Pizza viernes': todo cuadrado 🎉");
  });
});

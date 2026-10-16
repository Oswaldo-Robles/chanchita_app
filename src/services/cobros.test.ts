import type { Salida } from '../domain/types';
import { armarFilasResultado } from '../domain/resultado';
import { cobrarTransferencia, compartirResumen } from './cobros';
import type { Mensajero, ResultadoEnvio } from './Mensajero';

/** Doble de prueba: registra lo que se enviaría sin abrir WhatsApp. */
function crearMensajeroDoble(resultado: ResultadoEnvio = { ok: true }) {
  const enviados: { telefono: string | undefined; texto: string }[] = [];
  const mensajero: Mensajero = {
    async enviar(telefono, texto) {
      enviados.push({ telefono, texto });
      return resultado;
    },
  };
  return { mensajero, enviados };
}

const salida: Salida = {
  id: 's1',
  nombre: 'Pizza viernes',
  fecha: '2026-10-14',
  participantes: [
    { id: 'maria', nombre: 'María', telefono: '987654321' },
    { id: 'juan', nombre: 'Juan', telefono: '912345678' },
    { id: 'luis', nombre: 'Luis' }, // sin teléfono
  ],
  gastos: [
    { id: 'g1', descripcion: 'Pizza', montoCentimos: 3000, pagadoPor: 'maria', divididoEntre: ['maria', 'juan', 'luis'] },
  ],
};
const { transferencias } = armarFilasResultado(salida);
const deJuan = transferencias.find((t) => t.deId === 'juan')!;
const deLuis = transferencias.find((t) => t.deId === 'luis')!;

describe('cobrarTransferencia', () => {
  it('envía al teléfono del deudor el mensaje con el número del acreedor', async () => {
    const { mensajero, enviados } = crearMensajeroDoble();
    const r = await cobrarTransferencia(mensajero, salida, deJuan);

    expect(r).toEqual({ ok: true });
    expect(enviados).toEqual([
      {
        telefono: '912345678',
        texto: "Hola Juan, de la salida 'Pizza viernes' te toca yapearle S/10.00 a María al 987654321 🐷",
      },
    ]);
  });

  it('deudor sin teléfono: se envía sin chat específico', async () => {
    const { mensajero, enviados } = crearMensajeroDoble();
    await cobrarTransferencia(mensajero, salida, deLuis);
    expect(enviados[0].telefono).toBeUndefined();
  });

  it('propaga el fallo del mensajero sin lanzar', async () => {
    const { mensajero } = crearMensajeroDoble({ ok: false, motivo: 'sin WhatsApp' });
    expect(await cobrarTransferencia(mensajero, salida, deJuan)).toEqual({
      ok: false,
      motivo: 'sin WhatsApp',
    });
  });
});

describe('compartirResumen', () => {
  it('envía el resumen sin teléfono para elegir el grupo', async () => {
    const { mensajero, enviados } = crearMensajeroDoble();
    await compartirResumen(mensajero, salida);
    expect(enviados).toHaveLength(1);
    expect(enviados[0].telefono).toBeUndefined();
    expect(enviados[0].texto).toContain('Juan → María: S/10.00');
    expect(enviados[0].texto).toContain('Luis → María: S/10.00');
  });
});

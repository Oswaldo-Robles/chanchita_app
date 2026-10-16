import { construirMensajeCobro, construirResumen } from '../domain/mensajes';
import type { FilaTransferencia } from '../domain/resultado';
import type { Salida } from '../domain/types';
import type { Mensajero, ResultadoEnvio } from './Mensajero';

/** Cobra una transferencia: abre el chat del deudor con el mensaje listo. */
export function cobrarTransferencia(
  mensajero: Mensajero,
  salida: Salida,
  transferencia: FilaTransferencia,
): Promise<ResultadoEnvio> {
  const deudor = salida.participantes.find((p) => p.id === transferencia.deId);
  const acreedor = salida.participantes.find((p) => p.id === transferencia.aId);

  const texto = construirMensajeCobro({
    deudorNombre: transferencia.deNombre,
    salidaNombre: salida.nombre,
    montoCentimos: transferencia.montoCentimos,
    acreedorNombre: transferencia.aNombre,
    acreedorTelefono: acreedor?.telefono,
  });
  return mensajero.enviar(deudor?.telefono, texto);
}

/** Abre WhatsApp con el resumen para elegir el chat o grupo. */
export function compartirResumen(mensajero: Mensajero, salida: Salida): Promise<ResultadoEnvio> {
  return mensajero.enviar(undefined, construirResumen(salida));
}

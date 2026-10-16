export type ResultadoEnvio = { ok: true } | { ok: false; motivo: string };

/**
 * Contrato para mandar un texto por mensajería. Las pantallas dependen de esta
 * interfaz, no de Linking: así los tests usan un doble que no abre nada.
 */
export interface Mensajero {
  /**
   * Abre el chat del teléfono con el texto prellenado. Sin teléfono (o con uno
   * inválido) deja elegir el chat a mano. Nunca lanza: devuelve ok:false.
   */
  enviar(telefono: string | undefined, texto: string): Promise<ResultadoEnvio>;
}

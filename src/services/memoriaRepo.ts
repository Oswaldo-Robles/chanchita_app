import type { Salida } from '../domain/types';
import type { SalidasRepository } from './SalidasRepository';

/** Repositorio en memoria: para tests y para probar pantallas sin el teléfono. */
export function crearRepoMemoria(): SalidasRepository {
  const salidas = new Map<string, Salida>();

  return {
    async listar() {
      return [...salidas.values()];
    },
    async obtener(id) {
      return salidas.get(id) ?? null;
    },
    async guardar(salida) {
      salidas.set(salida.id, salida);
    },
    async eliminar(id) {
      salidas.delete(id);
    },
  };
}

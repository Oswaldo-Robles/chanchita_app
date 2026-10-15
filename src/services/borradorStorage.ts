import type { BorradorSalida } from '../domain/types';
import type { KeyValueStorage } from './KeyValueStorage';

const CLAVE_BORRADOR = 'borrador-salida';

/** Guarda lo que el usuario lleva escrito al crear una salida, para no perderlo al retroceder. */
export interface BorradorRepository {
  leer(): Promise<BorradorSalida | null>;
  guardar(borrador: BorradorSalida): Promise<void>;
  borrar(): Promise<void>;
}

export function crearBorradorStorage(storage: KeyValueStorage): BorradorRepository {
  return {
    async leer() {
      const crudo = await storage.getItem(CLAVE_BORRADOR);
      if (!crudo) return null;
      try {
        const d = JSON.parse(crudo) as Partial<BorradorSalida>;
        if (
          typeof d.nombre === 'string' &&
          typeof d.fecha === 'string' &&
          Array.isArray(d.participantes)
        ) {
          return { nombre: d.nombre, fecha: d.fecha, participantes: d.participantes };
        }
        return null;
      } catch {
        return null;
      }
    },
    async guardar(borrador) {
      await storage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    },
    async borrar() {
      await storage.removeItem(CLAVE_BORRADOR);
    },
  };
}

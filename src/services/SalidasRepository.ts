import type { Salida } from '../domain/types';

/**
 * Contrato de almacenamiento de salidas. Las pantallas dependen de esta
 * interfaz, no de AsyncStorage: así los tests usan un repositorio en memoria.
 */
export interface SalidasRepository {
  listar(): Promise<Salida[]>;
  obtener(id: string): Promise<Salida | null>;
  /** Crea la salida o, si el id ya existe, la reemplaza. */
  guardar(salida: Salida): Promise<void>;
  eliminar(id: string): Promise<void>;
}

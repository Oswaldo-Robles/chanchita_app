import type { Salida } from '../domain/types';
import type { KeyValueStorage } from './KeyValueStorage';
import type { SalidasRepository } from './SalidasRepository';

const CLAVE_SALIDAS = 'salidas';

/** Guarda todas las salidas como un único JSON bajo la clave "salidas". */
export function crearRepoAsyncStorage(storage: KeyValueStorage): SalidasRepository {
  async function leerTodas(): Promise<Salida[]> {
    const crudo = await storage.getItem(CLAVE_SALIDAS);
    if (!crudo) return [];
    try {
      const datos: unknown = JSON.parse(crudo);
      return Array.isArray(datos) ? (datos as Salida[]) : [];
    } catch {
      return []; // contenido corrupto: se parte de cero en vez de romper la app
    }
  }

  const escribirTodas = (salidas: Salida[]) =>
    storage.setItem(CLAVE_SALIDAS, JSON.stringify(salidas));

  return {
    listar: leerTodas,

    async obtener(id) {
      const todas = await leerTodas();
      return todas.find((s) => s.id === id) ?? null;
    },

    async guardar(salida) {
      const todas = await leerTodas();
      const i = todas.findIndex((s) => s.id === salida.id);
      if (i >= 0) todas[i] = salida;
      else todas.push(salida);
      await escribirTodas(todas);
    },

    async eliminar(id) {
      const todas = await leerTodas();
      await escribirTodas(todas.filter((s) => s.id !== id));
    },
  };
}

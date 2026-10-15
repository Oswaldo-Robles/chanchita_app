import type { Perfil } from '../domain/types';
import type { KeyValueStorage } from './KeyValueStorage';

const CLAVE_PERFIL = 'perfil';

export async function leerPerfil(storage: KeyValueStorage): Promise<Perfil | null> {
  const crudo = await storage.getItem(CLAVE_PERFIL);
  if (!crudo) return null;
  try {
    const datos = JSON.parse(crudo) as Partial<Perfil>;
    if (typeof datos.nombre === 'string' && typeof datos.telefonoYape === 'string') {
      return { nombre: datos.nombre, telefonoYape: datos.telefonoYape };
    }
    return null;
  } catch {
    return null;
  }
}

export async function guardarPerfil(storage: KeyValueStorage, perfil: Perfil): Promise<void> {
  await storage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
}

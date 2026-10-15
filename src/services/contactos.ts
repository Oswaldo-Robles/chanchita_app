import * as Contacts from 'expo-contacts/legacy';

import { normalizarTelefono } from '../domain/salidas';

export type ContactoTelefono = {
  id: string;
  nombre: string;
  telefono?: string; // 9 dígitos, o undefined si el contacto no tiene un celular válido
};

export type ResultadoContactos =
  | { ok: true; contactos: ContactoTelefono[] }
  | { ok: false; motivo: 'denegado' | 'error' };

/**
 * Lee los contactos del teléfono (pide permiso la primera vez).
 * Si se niega o falla, devuelve ok:false y la pantalla ofrece agregar a mano.
 */
export async function leerContactos(): Promise<ResultadoContactos> {
  try {
    const permiso = await Contacts.requestPermissionsAsync();
    if (permiso.status !== Contacts.PermissionStatus.GRANTED) {
      return { ok: false, motivo: 'denegado' };
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    const contactos: ContactoTelefono[] = [];
    for (const c of data) {
      if (!c.id || !c.name) continue;
      const numeros = c.phoneNumbers ?? [];
      const telefono = numeros
        .map((n) => normalizarTelefono(n.number ?? n.digits ?? ''))
        .find((t): t is string => t !== undefined);
      contactos.push({ id: c.id, nombre: c.name, telefono });
    }
    return { ok: true, contactos };
  } catch {
    return { ok: false, motivo: 'error' };
  }
}

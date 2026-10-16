import { Linking } from 'react-native';

import { construirEnlaceWhatsApp } from '../domain/mensajes';
import type { Mensajero } from './Mensajero';

/**
 * Mensajero real: abre WhatsApp con un enlace wa.me. No usa canOpenURL porque
 * en Android exige declarar el esquema en `queries`; se intenta abrir y se captura el error.
 */
export function crearWhatsAppMensajero(): Mensajero {
  return {
    async enviar(telefono, texto) {
      try {
        await Linking.openURL(construirEnlaceWhatsApp(telefono, texto));
        return { ok: true };
      } catch {
        return { ok: false, motivo: 'No se pudo abrir WhatsApp. ¿Está instalado?' };
      }
    },
  };
}

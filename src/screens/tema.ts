import { useColorScheme } from 'react-native';

/**
 * Los estilos van en clases de Tailwind (ver global.css). Aquí solo viven los
 * valores que React Native pide como JS: placeholder, spinner, toast y navegación.
 */
export function useTema() {
  const oscuro = useColorScheme() === 'dark';
  return {
    oscuro,
    placeholder: oscuro ? '#64748b' : '#94a3b8', // slate 500 / 400
    spinner: oscuro ? '#fb7185' : '#e11d48', // primary 400 / 600
    toastFondo: oscuro ? '#f8fafc' : '#0f172a', // slate 50 / 900
    toastTexto: oscuro ? '#0f172a' : '#f8fafc',
  };
}

/** Colores del contenedor de navegación (encabezados y fondo entre pantallas). */
export const temaNavegacion = {
  claro: {
    primary: '#e11d48',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    notification: '#e11d48',
  },
  oscuro: {
    primary: '#fb7185',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    border: '#334155',
    notification: '#fb7185',
  },
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { Perfil } from '../domain/types';
import { crearRepoAsyncStorage } from '../services/asyncStorageRepo';
import { crearBorradorStorage } from '../services/borradorStorage';
import type { BorradorRepository } from '../services/borradorStorage';
import { guardarPerfil as persistirPerfil, leerPerfil } from '../services/perfilStorage';
import type { SalidasRepository } from '../services/SalidasRepository';

type AppContexto = {
  /** true mientras se lee el perfil guardado al abrir la app */
  cargando: boolean;
  /** null si todavía no hizo el onboarding */
  perfil: Perfil | null;
  guardarPerfil: (perfil: Perfil) => Promise<void>;
  salidas: SalidasRepository;
  borrador: BorradorRepository;
};

const Contexto = createContext<AppContexto | null>(null);

/**
 * Único lugar que conoce las implementaciones reales (AsyncStorage).
 * Las pantallas piden lo que necesitan con useApp() y no importan AsyncStorage.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const salidas = useMemo(() => crearRepoAsyncStorage(AsyncStorage), []);
  const borrador = useMemo(() => crearBorradorStorage(AsyncStorage), []);

  useEffect(() => {
    leerPerfil(AsyncStorage)
      .then(setPerfil)
      .finally(() => setCargando(false));
  }, []);

  const guardarPerfil = useCallback(async (nuevo: Perfil) => {
    await persistirPerfil(AsyncStorage, nuevo);
    setPerfil(nuevo);
  }, []);

  const valor = useMemo(
    () => ({ cargando, perfil, guardarPerfil, salidas, borrador }),
    [cargando, perfil, guardarPerfil, salidas, borrador],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): AppContexto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return valor;
}

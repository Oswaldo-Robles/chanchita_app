import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BorradorSalida } from '../domain/types';
import { crearBorradorStorage } from './borradorStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const borrador: BorradorSalida = {
  nombre: 'Pizza',
  fecha: '2026-10-14',
  participantes: [
    { id: 'organizador', nombre: 'Jesús', telefono: '987654321', esOrganizador: true },
    { id: 'a', nombre: 'Ana' },
  ],
};

describe('borradorStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sin borrador devuelve null', async () => {
    expect(await crearBorradorStorage(AsyncStorage).leer()).toBeNull();
  });

  it('guarda y recupera el borrador', async () => {
    const repo = crearBorradorStorage(AsyncStorage);
    await repo.guardar(borrador);
    expect(await repo.leer()).toEqual(borrador);
  });

  it('una instancia nueva ve el borrador de la anterior', async () => {
    await crearBorradorStorage(AsyncStorage).guardar(borrador);
    expect(await crearBorradorStorage(AsyncStorage).leer()).toEqual(borrador);
  });

  it('borrar lo elimina', async () => {
    const repo = crearBorradorStorage(AsyncStorage);
    await repo.guardar(borrador);
    await repo.borrar();
    expect(await repo.leer()).toBeNull();
  });

  it('borrar sin borrador no falla', async () => {
    await expect(crearBorradorStorage(AsyncStorage).borrar()).resolves.toBeUndefined();
  });

  it('contenido corrupto o incompleto devuelve null', async () => {
    const repo = crearBorradorStorage(AsyncStorage);
    await AsyncStorage.setItem('borrador-salida', '{roto');
    expect(await repo.leer()).toBeNull();
    await AsyncStorage.setItem('borrador-salida', JSON.stringify({ nombre: 'x' }));
    expect(await repo.leer()).toBeNull();
  });
});

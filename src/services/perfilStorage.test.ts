import AsyncStorage from '@react-native-async-storage/async-storage';

import { guardarPerfil, leerPerfil } from './perfilStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('perfilStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sin perfil guardado devuelve null', async () => {
    expect(await leerPerfil(AsyncStorage)).toBeNull();
  });

  it('guarda y recupera el perfil', async () => {
    const perfil = { nombre: 'Jesús', telefonoYape: '987654321' };
    await guardarPerfil(AsyncStorage, perfil);
    expect(await leerPerfil(AsyncStorage)).toEqual(perfil);
  });

  it('si el contenido guardado está corrupto devuelve null en vez de fallar', async () => {
    await AsyncStorage.setItem('perfil', '{no es json');
    expect(await leerPerfil(AsyncStorage)).toBeNull();
  });
});

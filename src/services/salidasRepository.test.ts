import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Salida } from '../domain/types';
import { crearRepoAsyncStorage } from './asyncStorageRepo';
import { crearRepoMemoria } from './memoriaRepo';
import type { SalidasRepository } from './SalidasRepository';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const salida = (id: string, nombre = `Salida ${id}`): Salida => ({
  id,
  nombre,
  fecha: '2026-10-14',
  participantes: [
    { id: 'a', nombre: 'Ana', telefono: '987654321' },
    { id: 'b', nombre: 'Beto' },
  ],
  gastos: [
    { id: 'g1', descripcion: 'Pizza', montoCentimos: 4000, pagadoPor: 'a', divididoEntre: ['a', 'b'] },
  ],
});

// El mismo contrato se exige a todas las implementaciones (principio L).
const implementaciones: [string, () => SalidasRepository][] = [
  ['memoria', () => crearRepoMemoria()],
  ['AsyncStorage', () => crearRepoAsyncStorage(AsyncStorage)],
];

describe.each(implementaciones)('SalidasRepository (%s)', (_nombre, crear) => {
  let repo: SalidasRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    repo = crear();
  });

  it('empieza vacío', async () => {
    expect(await repo.listar()).toEqual([]);
  });

  it('guarda y recupera la misma salida con participantes y gastos', async () => {
    await repo.guardar(salida('s1'));
    expect(await repo.obtener('s1')).toEqual(salida('s1'));
  });

  it('obtener un id inexistente devuelve null', async () => {
    expect(await repo.obtener('nada')).toBeNull();
  });

  it('lista todas las salidas guardadas', async () => {
    await repo.guardar(salida('s1'));
    await repo.guardar(salida('s2'));
    const ids = (await repo.listar()).map((s) => s.id).sort();
    expect(ids).toEqual(['s1', 's2']);
  });

  it('guardar con un id existente reemplaza la salida (no duplica)', async () => {
    await repo.guardar(salida('s1', 'Original'));
    await repo.guardar(salida('s1', 'Editada'));
    const todas = await repo.listar();
    expect(todas).toHaveLength(1);
    expect(todas[0].nombre).toBe('Editada');
  });

  it('eliminar quita la salida del listado', async () => {
    await repo.guardar(salida('s1'));
    await repo.guardar(salida('s2'));
    await repo.eliminar('s1');
    expect((await repo.listar()).map((s) => s.id)).toEqual(['s2']);
    expect(await repo.obtener('s1')).toBeNull();
  });

  it('eliminar un id inexistente no falla', async () => {
    await expect(repo.eliminar('nada')).resolves.toBeUndefined();
  });
});

describe('persistencia entre sesiones (AsyncStorage)', () => {
  it('una instancia nueva del repositorio ve lo guardado por la anterior', async () => {
    await AsyncStorage.clear();
    await crearRepoAsyncStorage(AsyncStorage).guardar(salida('s1'));

    const trasReiniciar = crearRepoAsyncStorage(AsyncStorage);
    expect((await trasReiniciar.listar()).map((s) => s.id)).toEqual(['s1']);
  });
});

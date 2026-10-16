import { armarFilasResultado } from './resultado';
import type { Salida } from './types';

const salida = (gastos: Salida['gastos']): Salida => ({
  id: 's1',
  nombre: 'Salida',
  fecha: '2026-10-14',
  participantes: [
    { id: 'ana', nombre: 'Ana' },
    { id: 'beto', nombre: 'Beto' },
    { id: 'carla', nombre: 'Carla' },
  ],
  gastos,
});

describe('armarFilasResultado', () => {
  it('pizza S/30 pagada por Ana entre los tres: Beto y Carla le deben S/ 10.00', () => {
    const r = armarFilasResultado(
      salida([
        { id: 'g1', descripcion: 'Pizza', montoCentimos: 3000, pagadoPor: 'ana', divididoEntre: ['ana', 'beto', 'carla'] },
      ]),
    );

    expect(r.todoCuadrado).toBe(false);
    expect(r.filas).toEqual([
      { id: 'ana', nombre: 'Ana', balanceCentimos: 2000, montoTexto: 'S/ 20.00', estado: 'recibe' },
      { id: 'beto', nombre: 'Beto', balanceCentimos: -1000, montoTexto: 'S/ 10.00', estado: 'debe' },
      { id: 'carla', nombre: 'Carla', balanceCentimos: -1000, montoTexto: 'S/ 10.00', estado: 'debe' },
    ]);
    expect(r.transferencias).toEqual([
      { deId: 'beto', aId: 'ana', deNombre: 'Beto', aNombre: 'Ana', montoCentimos: 1000, montoTexto: 'S/ 10.00' },
      { deId: 'carla', aId: 'ana', deNombre: 'Carla', aNombre: 'Ana', montoCentimos: 1000, montoTexto: 'S/ 10.00' },
    ]);
  });

  it('un participante fuera del gasto queda neutro', () => {
    const r = armarFilasResultado(
      salida([{ id: 'g1', descripcion: 'Taxi', montoCentimos: 1000, pagadoPor: 'ana', divididoEntre: ['ana', 'beto'] }]),
    );
    const carla = r.filas.find((f) => f.id === 'carla');
    expect(carla).toMatchObject({ balanceCentimos: 0, estado: 'neutro', montoTexto: 'S/ 0.00' });
  });

  it('salida sin gastos: todo cuadrado y sin transferencias', () => {
    const r = armarFilasResultado(salida([]));
    expect(r.todoCuadrado).toBe(true);
    expect(r.transferencias).toEqual([]);
    expect(r.filas.every((f) => f.estado === 'neutro')).toBe(true);
  });
});

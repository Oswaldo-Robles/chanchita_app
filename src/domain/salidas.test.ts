import {
  asegurarOrganizador,
  crearOrganizador,
  esBorradorVacio,
  fechaHoyISO,
  normalizarTelefono,
  ordenarSalidas,
  puedeQuitarParticipante,
  validarParticipante,
  validarSalida,
  yaEstaAgregado,
} from './salidas';
import type { Participante, Salida } from './types';

const persona = (id: string, extra: Partial<Participante> = {}): Participante => ({
  id,
  nombre: id,
  ...extra,
});

const salida = (id: string, fecha: string, over: Partial<Salida> = {}): Salida => ({
  id,
  nombre: `Salida ${id}`,
  fecha,
  participantes: [persona('A'), persona('B'), persona('C')],
  gastos: [],
  ...over,
});

describe('crearOrganizador', () => {
  it('usa el nombre y el número de Yape del perfil, marcado como organizador', () => {
    expect(crearOrganizador({ nombre: 'Jesús', telefonoYape: '987654321' })).toEqual({
      id: 'organizador',
      nombre: 'Jesús',
      telefono: '987654321',
      esOrganizador: true,
    });
  });
});

describe('normalizarTelefono', () => {
  it.each([
    ['987654321', '987654321'],
    ['987 654 321', '987654321'],
    ['+51 987 654 321', '987654321'],
    ['51987654321', '987654321'],
    ['(+51) 987-654-321', '987654321'],
  ])('%p → %p', (entrada, esperado) => {
    expect(normalizarTelefono(entrada)).toBe(esperado);
  });

  it.each(['', 'abc', '12345', '+1 202 555 0143', '01 234 5678'])(
    'devuelve undefined para %p (no es un celular peruano de 9 dígitos)',
    (entrada) => {
      expect(normalizarTelefono(entrada)).toBeUndefined();
    },
  );
});

describe('validarParticipante', () => {
  it('acepta nombre sin teléfono', () => {
    expect(validarParticipante('Beto', '')).toEqual({
      ok: true,
      nombre: 'Beto',
      telefono: undefined,
    });
  });

  it('acepta nombre con teléfono válido y lo normaliza', () => {
    expect(validarParticipante('  Beto ', '987 654 321')).toEqual({
      ok: true,
      nombre: 'Beto',
      telefono: '987654321',
    });
  });

  it('rechaza nombre vacío', () => {
    const r = validarParticipante('  ', '');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.nombre).toBeDefined();
  });

  it('rechaza un teléfono escrito que no es válido', () => {
    const r = validarParticipante('Beto', '123');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.telefono).toBeDefined();
  });
});

describe('validarSalida', () => {
  const dos = [persona('A'), persona('B')];

  it('acepta nombre, fecha y 2 participantes', () => {
    expect(validarSalida('Pizza', '2026-10-14', dos)).toEqual({ ok: true });
  });

  it('rechaza nombre vacío', () => {
    const r = validarSalida('  ', '2026-10-14', dos);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.nombre).toBeDefined();
  });

  it('rechaza menos de 2 participantes', () => {
    const r = validarSalida('Pizza', '2026-10-14', [persona('A')]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.participantes).toBeDefined();
  });

  it.each(['14/10/2026', '2026-13-01', '2026-02-30', 'hoy', ''])(
    'rechaza la fecha inválida %p',
    (fecha) => {
      const r = validarSalida('Pizza', fecha, dos);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errores.fecha).toBeDefined();
    },
  );

  it('acepta un 29 de febrero de año bisiesto', () => {
    expect(validarSalida('Pizza', '2028-02-29', dos).ok).toBe(true);
  });
});

describe('fechaHoyISO', () => {
  it('formatea la fecha local como AAAA-MM-DD con ceros', () => {
    expect(fechaHoyISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('ordenarSalidas', () => {
  it('la fecha más reciente va primero', () => {
    const r = ordenarSalidas([
      salida('1', '2026-10-01'),
      salida('3', '2026-10-20'),
      salida('2', '2026-10-10'),
    ]);
    expect(r.map((s) => s.id)).toEqual(['3', '2', '1']);
  });

  it('con la misma fecha, la guardada después va primero', () => {
    const r = ordenarSalidas([salida('1', '2026-10-14'), salida('2', '2026-10-14')]);
    expect(r.map((s) => s.id)).toEqual(['2', '1']);
  });

  it('no modifica el arreglo original', () => {
    const original = [salida('1', '2026-10-01'), salida('2', '2026-10-10')];
    ordenarSalidas(original);
    expect(original.map((s) => s.id)).toEqual(['1', '2']);
  });
});

describe('puedeQuitarParticipante', () => {
  const conGastos = salida('s', '2026-10-14', {
    participantes: [
      persona('org', { esOrganizador: true }),
      persona('A'),
      persona('B'),
      persona('C'),
      persona('D'),
    ],
    gastos: [
      { id: 'g1', descripcion: 'Pizza', montoCentimos: 3000, pagadoPor: 'A', divididoEntre: ['A', 'B'] },
    ],
  });

  it('permite quitar a quien no figura en ningún gasto', () => {
    expect(puedeQuitarParticipante(conGastos, 'D')).toEqual({ ok: true });
  });

  it('bloquea a quien pagó un gasto', () => {
    const r = puedeQuitarParticipante(conGastos, 'A');
    expect(r.ok).toBe(false);
  });

  it('bloquea a quien participa en la división de un gasto', () => {
    const r = puedeQuitarParticipante(conGastos, 'B');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toMatch(/gasto/i);
  });

  it('bloquea al organizador aunque no tenga gastos', () => {
    const r = puedeQuitarParticipante(conGastos, 'org');
    expect(r.ok).toBe(false);
  });

  it('tras eliminar el gasto, ya se puede quitar', () => {
    const sinGastos = { ...conGastos, gastos: [] };
    expect(puedeQuitarParticipante(sinGastos, 'A')).toEqual({ ok: true });
  });

  it('un id que no existe no se puede quitar', () => {
    expect(puedeQuitarParticipante(conGastos, 'zzz').ok).toBe(false);
  });
});

describe('yaEstaAgregado', () => {
  const lista = [persona('Ana', { telefono: '987654321' }), persona('Beto')];

  it('detecta el mismo nombre sin importar mayúsculas ni espacios', () => {
    expect(yaEstaAgregado(lista, '  ana ')).toBe(true);
  });

  it('detecta el mismo teléfono con otro nombre', () => {
    expect(yaEstaAgregado(lista, 'Anita', '987654321')).toBe(true);
  });

  it('no marca como duplicado a alguien nuevo', () => {
    expect(yaEstaAgregado(lista, 'Carla', '911111111')).toBe(false);
    expect(yaEstaAgregado(lista, 'Carla')).toBe(false);
  });
});

describe('esBorradorVacio', () => {
  const org = persona('organizador', { esOrganizador: true });

  it('vacío: sin nombre y solo el organizador', () => {
    expect(esBorradorVacio('', [org])).toBe(true);
    expect(esBorradorVacio('   ', [org])).toBe(true);
  });

  it('no vacío si hay nombre', () => {
    expect(esBorradorVacio('Pizza', [org])).toBe(false);
  });

  it('no vacío si hay más participantes que el organizador', () => {
    expect(esBorradorVacio('', [org, persona('A')])).toBe(false);
  });
});

describe('asegurarOrganizador', () => {
  const perfil = { nombre: 'Jesús', telefonoYape: '987654321' };

  it('si falta el organizador, lo pone primero', () => {
    const r = asegurarOrganizador([persona('A')], perfil);
    expect(r.map((p) => p.id)).toEqual(['organizador', 'A']);
  });

  it('si ya está, lo actualiza con el perfil actual y lo deja primero', () => {
    const viejo = persona('organizador', { nombre: 'Viejo', esOrganizador: true });
    const r = asegurarOrganizador([persona('A'), viejo], perfil);
    expect(r).toEqual([crearOrganizador(perfil), persona('A')]);
  });

  it('no duplica al organizador', () => {
    const r = asegurarOrganizador([crearOrganizador(perfil)], perfil);
    expect(r).toHaveLength(1);
  });
});

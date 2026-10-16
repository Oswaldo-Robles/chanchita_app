import { totalGastos, validarGasto } from './gastos';

const valido = { descripcion: 'Pizza', montoCentimos: 4000, divididoEntre: ['a', 'b'] };

describe('validarGasto', () => {
  it('acepta un gasto válido', () => {
    expect(validarGasto(valido)).toEqual({ ok: true });
  });

  it('rechaza monto 0 o inválido', () => {
    const r = validarGasto({ ...valido, montoCentimos: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.monto).toBeDefined();
    expect(validarGasto({ ...valido, montoCentimos: null }).ok).toBe(false);
  });

  it('rechaza descripción vacía', () => {
    const r = validarGasto({ ...valido, descripcion: '   ' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.descripcion).toBeDefined();
  });

  it('rechaza división vacía', () => {
    const r = validarGasto({ ...valido, divididoEntre: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.divididoEntre).toBeDefined();
  });
});

describe('totalGastos', () => {
  it('suma los montos en céntimos', () => {
    expect(totalGastos([{ montoCentimos: 4000 }, { montoCentimos: 1250 }])).toBe(5250);
  });

  it('sin gastos es 0', () => {
    expect(totalGastos([])).toBe(0);
  });
});

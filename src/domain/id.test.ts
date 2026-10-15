import { generarId } from './id';

describe('generarId', () => {
  it('genera ids distintos aunque se llamen en el mismo instante', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generarId()));
    expect(ids.size).toBe(1000);
  });

  it('es un texto no vacío', () => {
    expect(generarId().length).toBeGreaterThan(5);
  });
});

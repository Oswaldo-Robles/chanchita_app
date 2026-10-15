import { validarPerfil } from './perfil';

describe('validarPerfil', () => {
  it('acepta nombre y teléfono de 9 dígitos', () => {
    expect(validarPerfil('Jesús', '987654321')).toEqual({
      ok: true,
      perfil: { nombre: 'Jesús', telefonoYape: '987654321' },
    });
  });

  it('recorta espacios del nombre y quita espacios del teléfono', () => {
    expect(validarPerfil('  Jesús  ', '987 654 321')).toEqual({
      ok: true,
      perfil: { nombre: 'Jesús', telefonoYape: '987654321' },
    });
  });

  it('rechaza un nombre vacío o solo espacios', () => {
    const r = validarPerfil('   ', '987654321');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.nombre).toBeDefined();
  });

  it.each(['12345678', '9876543210', 'abcdefghi', '', '98765432a'])(
    'rechaza el teléfono %p',
    (telefono) => {
      const r = validarPerfil('Jesús', telefono);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errores.telefono).toBeDefined();
    },
  );

  it('informa ambos errores a la vez', () => {
    const r = validarPerfil('', '123');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores.nombre).toBeDefined();
      expect(r.errores.telefono).toBeDefined();
    }
  });
});

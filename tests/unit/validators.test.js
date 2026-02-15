const { describe, test, expect } = require('bun:test');
const {
  authorSchema,
  bookSchema,
  userSchema,
  parseSchema,
} = require('../../src/main/services/validators');

describe('validators', () => {
  test('authorSchema normaliza strings y valida nombre obligatorio', () => {
    const parsed = parseSchema(authorSchema, {
      name: '  Ursula K. Le Guin  ',
      website: '',
      biography: '  ',
    });

    expect(parsed.name).toBe('Ursula K. Le Guin');
    expect(parsed.website).toBe(null);
    expect(parsed.biography).toBe(null);
  });

  test('authorSchema falla con URL inválida', () => {
    expect(() =>
      parseSchema(authorSchema, {
        name: 'Autor X',
        website: 'ftp://invalid-url',
      })
    ).toThrow('URL inválida');
  });

  test('bookSchema acepta file:// como cover_url local', () => {
    const parsed = parseSchema(bookSchema, {
      title: 'Libro con portada local',
      language: 'es',
      cover_url: 'file:///tmp/cover.jpg',
    });

    expect(parsed.cover_url).toBe('file:///tmp/cover.jpg');
  });

  test('bookSchema acepta campos CDU/signatura', () => {
    const parsed = parseSchema(bookSchema, {
      title: 'Libro con signatura',
      language: 'es',
      cdu: '821.134.2',
      signature: '821.134.2 GAR CIE',
    });

    expect(parsed.cdu).toBe('821.134.2');
    expect(parsed.signature).toBe('821.134.2 GAR CIE');
  });

  test('bookSchema aplica defaults críticos', () => {
    const parsed = parseSchema(bookSchema, {
      title: 'El libro',
      language: 'es',
    });

    expect(parsed.read_status).toBe('unread');
    expect(parsed.favorite).toBe(0);
    expect(parsed.loanable).toBe(1);
    expect(Array.isArray(parsed.authors)).toBe(true);
  });

  test('userSchema valida email', () => {
    expect(() =>
      parseSchema(userSchema, {
        name: 'Ana',
        email: 'email-invalido',
      })
    ).toThrow('Email inválido');
  });
});

import { describe, expect, it } from 'vitest';
import { azarConSemilla, azarCripto } from '../src/nucleo/azar';

describe('azarConSemilla', () => {
  it('la misma semilla produce siempre la misma secuencia', () => {
    const secuenciaA = Array.from({ length: 50 }, () => azarConSemilla(42)(100));
    const secuenciaB = Array.from({ length: 50 }, () => azarConSemilla(42)(100));
    expect(secuenciaA).toEqual(secuenciaB);
  });

  it('una sola instancia produce una secuencia determinista al llamarla repetidamente', () => {
    const azarA = azarConSemilla(7);
    const azarB = azarConSemilla(7);
    const secuenciaA = Array.from({ length: 30 }, () => azarA(10));
    const secuenciaB = Array.from({ length: 30 }, () => azarB(10));
    expect(secuenciaA).toEqual(secuenciaB);
  });

  it('semillas distintas producen (casi siempre) secuencias distintas', () => {
    const secuenciaA = Array.from({ length: 20 }, () => azarConSemilla(1)(1000));
    const secuenciaB = Array.from({ length: 20 }, () => azarConSemilla(2)(1000));
    expect(secuenciaA).not.toEqual(secuenciaB);
  });

  it('siempre devuelve un índice válido dentro de [0, n)', () => {
    const azar = azarConSemilla(123);
    for (let i = 0; i < 200; i += 1) {
      const valor = azar(7);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(7);
    }
  });
});

describe('azarCripto', () => {
  it('devuelve un índice válido dentro de [0, n)', () => {
    for (let i = 0; i < 200; i += 1) {
      const valor = azarCripto(6);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(6);
    }
  });

  it('con n = 1 siempre devuelve 0', () => {
    expect(azarCripto(1)).toBe(0);
  });
});

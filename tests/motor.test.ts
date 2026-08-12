import { describe, expect, it } from 'vitest';
import type { Azar } from '../src/nucleo/azar';
import {
  actualizarConfig,
  actualizarParticipantes,
  crearRonda,
  elegirPorPeso,
  girar,
  pesoTotal,
  pozoDe,
} from '../src/nucleo/motor';
import type { Config, Participante } from '../src/nucleo/tipos';

const AHORA = new Date('2026-01-01T00:00:00Z');

function crearParticipantes(nombres: string[]): Participante[] {
  return nombres.map((nombre, i) => ({ id: `p${i}`, nombre, tickets: 1 }));
}

function azarFijo(indice: number): Azar {
  return () => indice;
}

function configBase(overrides: Partial<Config> = {}): Config {
  return { cantidadGanadores: 1, modo: 'lote', repeticion: 'sin', ...overrides };
}

// PRNG determinista solo para los tests (no forma parte de nucleo/azar.ts;
// azarConSemilla llega en T1.3).
function mulberry32(semilla: number): () => number {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function azarConSemillaLocal(semilla: number): Azar {
  const rng = mulberry32(semilla);
  return (n: number) => Math.floor(rng() * n);
}

describe('pozoDe', () => {
  it('con repetición devuelve siempre la lista completa', () => {
    const participantes = crearParticipantes(['Ana', 'Beto']);
    let estado = crearRonda(configBase({ repeticion: 'con' }), participantes);
    const resultado = girar(estado, azarFijo(0), AHORA);
    estado = resultado!.estado;
    expect(pozoDe(estado)).toHaveLength(2);
  });

  it('sin repetir excluye a quienes ya están en el historial', () => {
    const participantes = crearParticipantes(['Ana', 'Beto']);
    let estado = crearRonda(configBase({ repeticion: 'sin', modo: 'continuo' }), participantes);
    const resultado = girar(estado, azarFijo(0), AHORA);
    estado = resultado!.estado;
    expect(pozoDe(estado)).toEqual([participantes[1]]);
  });

  it('pozo vacío cuando no hay participantes', () => {
    const estado = crearRonda(configBase(), []);
    expect(pozoDe(estado)).toHaveLength(0);
  });
});

describe('girar — equidad', () => {
  it('gana el elemento k cuando el azar devuelve k', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro', 'Diego']);
    const estado = crearRonda(configBase({ repeticion: 'con' }), participantes);
    for (let k = 0; k < participantes.length; k += 1) {
      const resultado = girar(estado, azarFijo(k), AHORA);
      expect(resultado?.ganador).toEqual(participantes[k]);
    }
  });

  it('devuelve null si el pozo está vacío', () => {
    const estado = crearRonda(configBase(), []);
    expect(girar(estado, azarFijo(0), AHORA)).toBeNull();
  });

  it('pozo de un solo participante: gira y gana esa persona', () => {
    const participantes = crearParticipantes(['Ana']);
    const estado = crearRonda(configBase(), participantes);
    const resultado = girar(estado, azarFijo(0), AHORA);
    expect(resultado?.ganador).toEqual(participantes[0]);
  });
});

describe('girar — modo lote', () => {
  it('lote de 1: cierra la ronda tras el primer ganador', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    const estado = crearRonda(configBase({ cantidadGanadores: 1 }), participantes);
    const resultado = girar(estado, azarFijo(0), AHORA);
    expect(resultado?.rondaTerminada).toBe(true);
    expect(resultado?.rondaTerminadaAntes).toBe(false);
    expect(resultado?.estado.ganadoresRondaActual).toHaveLength(0);
  });

  it('lote de 2: no cierra tras el primero, cierra tras el segundo', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ cantidadGanadores: 2 }), participantes);
    const primero = girar(estado, azarFijo(0), AHORA)!;
    expect(primero.rondaTerminada).toBe(false);
    estado = primero.estado;
    const segundo = girar(estado, azarFijo(0), AHORA)!;
    expect(segundo.rondaTerminada).toBe(true);
  });

  it('lote de 3 sobre 3 participantes cierra exactamente al tercero', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ cantidadGanadores: 3 }), participantes);
    for (let i = 0; i < 2; i += 1) {
      const resultado = girar(estado, azarFijo(0), AHORA)!;
      expect(resultado.rondaTerminada).toBe(false);
      estado = resultado.estado;
    }
    const ultimo = girar(estado, azarFijo(0), AHORA)!;
    expect(ultimo.rondaTerminada).toBe(true);
    expect(ultimo.rondaTerminadaAntes).toBe(false);
  });

  it('lote de N (10) sobre 10 participantes cierra al décimo', () => {
    const participantes = crearParticipantes(Array.from({ length: 10 }, (_, i) => `P${i}`));
    let estado = crearRonda(configBase({ cantidadGanadores: 10 }), participantes);
    let ultimo;
    for (let i = 0; i < 10; i += 1) {
      ultimo = girar(estado, azarFijo(0), AHORA)!;
      estado = ultimo.estado;
    }
    expect(ultimo?.rondaTerminada).toBe(true);
  });

  it('lote de 5 con solo 3 disponibles y sin repetir cierra la ronda antes', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ cantidadGanadores: 5, repeticion: 'sin' }), participantes);
    let resultado;
    for (let i = 0; i < 3; i += 1) {
      resultado = girar(estado, azarFijo(0), AHORA)!;
      estado = resultado.estado;
    }
    expect(resultado?.rondaTerminada).toBe(true);
    expect(resultado?.rondaTerminadaAntes).toBe(true);
    expect(estado.historial).toHaveLength(3);
    expect(girar(estado, azarFijo(0), AHORA)).toBeNull();
  });

  it('puestos ordinales: 1er, 2do, 3er LUGAR', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ cantidadGanadores: 3 }), participantes);
    const puestos: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const resultado = girar(estado, azarFijo(0), AHORA)!;
      puestos.push(resultado.puestoTexto);
      estado = resultado.estado;
    }
    expect(puestos).toEqual(['1er LUGAR', '2do LUGAR', '3er LUGAR']);
  });
});

describe('girar — modo continuo', () => {
  it('nunca cierra la ronda automáticamente', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ modo: 'continuo', repeticion: 'con' }), participantes);
    for (let i = 0; i < 20; i += 1) {
      const resultado = girar(estado, azarFijo(i % 3), AHORA)!;
      expect(resultado.rondaTerminada).toBe(false);
      estado = resultado.estado;
    }
  });

  it('numera los ganadores como GANADOR 01, 02, ...', () => {
    const participantes = crearParticipantes(['Ana', 'Beto']);
    let estado = crearRonda(configBase({ modo: 'continuo', repeticion: 'con' }), participantes);
    const primero = girar(estado, azarFijo(0), AHORA)!;
    expect(primero.puestoTexto).toBe('GANADOR 01');
    estado = primero.estado;
    const segundo = girar(estado, azarFijo(0), AHORA)!;
    expect(segundo.puestoTexto).toBe('GANADOR 02');
  });

  it('sin repetir vacía el pozo tras N giros sobre N participantes', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ modo: 'continuo', repeticion: 'sin' }), participantes);
    for (let i = 0; i < 3; i += 1) {
      const resultado = girar(estado, azarFijo(0), AHORA)!;
      estado = resultado.estado;
    }
    expect(pozoDe(estado)).toHaveLength(0);
    expect(girar(estado, azarFijo(0), AHORA)).toBeNull();
  });

  it('con repetición permite que el mismo participante gane varias veces', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ modo: 'continuo', repeticion: 'con' }), participantes);
    for (let i = 0; i < 5; i += 1) {
      const resultado = girar(estado, azarFijo(0), AHORA)!;
      expect(resultado.ganador.id).toBe('p0');
      estado = resultado.estado;
    }
    expect(estado.historial).toHaveLength(5);
  });
});

describe('elegirPorPeso', () => {
  it('con un ticket cada uno, la posición del azar es el índice ganador', () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    expect(pesoTotal(participantes)).toBe(3);
    expect(elegirPorPeso(participantes, azarFijo(0)).participante.nombre).toBe('Ana');
    expect(elegirPorPeso(participantes, azarFijo(1)).participante.nombre).toBe('Beto');
    expect(elegirPorPeso(participantes, azarFijo(2)).participante.nombre).toBe('Caro');
  });

  it('reparte por peso acumulado: Beto con 3 tickets cubre las posiciones 1 a 3', () => {
    const participantes: Participante[] = [
      { id: 'p0', nombre: 'Ana', tickets: 1 },
      { id: 'p1', nombre: 'Beto', tickets: 3 },
      { id: 'p2', nombre: 'Caro', tickets: 1 },
    ];
    expect(pesoTotal(participantes)).toBe(5);
    expect(elegirPorPeso(participantes, azarFijo(0)).participante.nombre).toBe('Ana');
    expect(elegirPorPeso(participantes, azarFijo(1)).participante.nombre).toBe('Beto');
    expect(elegirPorPeso(participantes, azarFijo(2)).participante.nombre).toBe('Beto');
    expect(elegirPorPeso(participantes, azarFijo(3)).participante.nombre).toBe('Beto');
    expect(elegirPorPeso(participantes, azarFijo(4)).participante.nombre).toBe('Caro');
  });

  it('tickets en 0 o negativo se tratan como 1 (nunca desaparece del pozo)', () => {
    const participantes: Participante[] = [
      { id: 'p0', nombre: 'Ana', tickets: 0 },
      { id: 'p1', nombre: 'Beto', tickets: -5 },
    ];
    expect(pesoTotal(participantes)).toBe(2);
  });
});

describe('actualizarParticipantes', () => {
  it('editar la lista a mitad de ronda conserva el historial', () => {
    const [ana, beto, caro] = crearParticipantes(['Ana', 'Beto', 'Caro']);
    let estado = crearRonda(configBase({ cantidadGanadores: 3, repeticion: 'sin' }), [
      ana,
      beto,
      caro,
    ]);

    estado = girar(estado, azarFijo(0), AHORA)!.estado; // gana Ana (pozo: [Ana,Beto,Caro])
    estado = girar(estado, azarFijo(0), AHORA)!.estado; // gana Beto (pozo: [Beto,Caro])
    expect(estado.historial).toHaveLength(2);

    // Se edita la lista: Ana (ya ganó) desaparece, se agrega Diego.
    const diego: Participante = { id: 'p3', nombre: 'Diego', tickets: 1 };
    estado = actualizarParticipantes(estado, [beto, caro, diego]);

    expect(estado.historial).toHaveLength(2);
    expect(estado.historial.map((g) => g.participante.nombre)).toEqual(['Ana', 'Beto']);
    expect(pozoDe(estado).map((p) => p.nombre)).toEqual(['Caro', 'Diego']);
  });
});

describe('actualizarConfig', () => {
  it('cambia la configuración sin tocar historial ni participantes', () => {
    const participantes = crearParticipantes(['Ana', 'Beto']);
    const estado = crearRonda(configBase({ repeticion: 'sin' }), participantes);
    const nuevo = actualizarConfig(estado, configBase({ repeticion: 'con' }));
    expect(nuevo.config.repeticion).toBe('con');
    expect(nuevo.participantes).toBe(estado.participantes);
    expect(nuevo.historial).toBe(estado.historial);
  });
});

describe('girar — estadístico', () => {
  it('60.000 giros sobre 6 participantes reparten cada uno entre 15% y 18.3%', () => {
    const nombres = ['A', 'B', 'C', 'D', 'E', 'F'];
    const participantes = crearParticipantes(nombres);
    const estado = crearRonda(configBase({ modo: 'continuo', repeticion: 'con' }), participantes);
    const azar = azarConSemillaLocal(20260101);
    const conteos = new Map<string, number>(nombres.map((n) => [n, 0]));

    const TOTAL = 60_000;
    for (let i = 0; i < TOTAL; i += 1) {
      const resultado = girar(estado, azar, AHORA)!;
      conteos.set(resultado.ganador.nombre, (conteos.get(resultado.ganador.nombre) ?? 0) + 1);
    }

    for (const nombre of nombres) {
      const proporcion = (conteos.get(nombre) ?? 0) / TOTAL;
      expect(proporcion).toBeGreaterThan(0.15);
      expect(proporcion).toBeLessThan(0.183);
    }
  });

  it('selección por peso: la proporción de victorias sigue los tickets de cada uno', () => {
    // Ana=1 ticket, Beto=2, Caro=3 → total 6 papeletas: 1/6, 2/6, 3/6.
    const participantes: Participante[] = [
      { id: 'p0', nombre: 'Ana', tickets: 1 },
      { id: 'p1', nombre: 'Beto', tickets: 2 },
      { id: 'p2', nombre: 'Caro', tickets: 3 },
    ];
    const estado = crearRonda(configBase({ modo: 'continuo', repeticion: 'con' }), participantes);
    const azar = azarConSemillaLocal(7654321);
    const conteos = new Map<string, number>([
      ['Ana', 0],
      ['Beto', 0],
      ['Caro', 0],
    ]);

    const TOTAL = 60_000;
    for (let i = 0; i < TOTAL; i += 1) {
      const resultado = girar(estado, azar, AHORA)!;
      conteos.set(resultado.ganador.nombre, (conteos.get(resultado.ganador.nombre) ?? 0) + 1);
    }

    const esperado: Record<string, number> = { Ana: 1 / 6, Beto: 2 / 6, Caro: 3 / 6 };
    for (const [nombre, proporcionEsperada] of Object.entries(esperado)) {
      const proporcion = (conteos.get(nombre) ?? 0) / TOTAL;
      expect(proporcion).toBeGreaterThan(proporcionEsperada - 0.02);
      expect(proporcion).toBeLessThan(proporcionEsperada + 0.02);
    }
  });
});

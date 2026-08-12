import { describe, expect, it } from 'vitest';
import { crearActa } from '../src/nucleo/acta';
import { azarConSemilla } from '../src/nucleo/azar';
import { crearRonda, girar } from '../src/nucleo/motor';
import type { Config, Participante } from '../src/nucleo/tipos';

function crearParticipantes(nombres: string[]): Participante[] {
  return nombres.map((nombre, i) => ({ id: `p${i}`, nombre, tickets: 1 }));
}

const AHORA = new Date('2026-01-01T00:00:00Z');
const CONFIG: Config = { cantidadGanadores: 1, modo: 'continuo', repeticion: 'con' };

describe('crearActa', () => {
  it('produce un hash SHA-256 (64 caracteres hex) y un código corto', async () => {
    const participantes = crearParticipantes(['Ana', 'Beto']);
    const acta = await crearActa(participantes, 42);
    expect(acta.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(acta.codigo).toHaveLength(10);
    expect(acta.codigo).toBe(acta.hash.slice(0, 10).toUpperCase());
    expect(acta.cantidadParticipantes).toBe(2);
  });

  it('misma lista y misma semilla producen el mismo hash', async () => {
    const participantes = crearParticipantes(['Ana', 'Beto', 'Caro']);
    const actaA = await crearActa(participantes, 42);
    const actaB = await crearActa(participantes, 42);
    expect(actaA.hash).toBe(actaB.hash);
  });

  it('distinta semilla produce distinto hash con la misma lista', async () => {
    const participantes = crearParticipantes(['Ana', 'Beto']);
    const actaA = await crearActa(participantes, 1);
    const actaB = await crearActa(participantes, 2);
    expect(actaA.hash).not.toBe(actaB.hash);
  });

  it('distinta lista produce distinto hash con la misma semilla', async () => {
    const actaA = await crearActa(crearParticipantes(['Ana', 'Beto']), 42);
    const actaB = await crearActa(crearParticipantes(['Ana', 'Caro']), 42);
    expect(actaA.hash).not.toBe(actaB.hash);
  });

  it('modo criptográfico (semilla null) también produce un hash válido', async () => {
    const acta = await crearActa(crearParticipantes(['Ana']), null);
    expect(acta.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(acta.semilla).toBeNull();
  });
});

describe('reproducibilidad de un sorteo completo', () => {
  it('misma semilla + misma lista ⇒ misma secuencia de ganadores', () => {
    const nombres = ['Ana', 'Beto', 'Caro', 'Diego', 'Elena'];
    const semilla = 987654;

    function correrSorteo(): string[] {
      const participantes = crearParticipantes(nombres);
      let estado = crearRonda(CONFIG, participantes, semilla);
      const azar = azarConSemilla(semilla);
      const ganadores: string[] = [];
      for (let i = 0; i < 25; i += 1) {
        const resultado = girar(estado, azar, AHORA)!;
        ganadores.push(resultado.ganador.nombre);
        estado = resultado.estado;
      }
      return ganadores;
    }

    expect(correrSorteo()).toEqual(correrSorteo());
  });

  it('semillas distintas producen secuencias distintas', () => {
    const nombres = ['Ana', 'Beto', 'Caro', 'Diego', 'Elena'];

    function correrSorteo(semilla: number): string[] {
      const participantes = crearParticipantes(nombres);
      let estado = crearRonda(CONFIG, participantes, semilla);
      const azar = azarConSemilla(semilla);
      const ganadores: string[] = [];
      for (let i = 0; i < 25; i += 1) {
        const resultado = girar(estado, azar, AHORA)!;
        ganadores.push(resultado.ganador.nombre);
        estado = resultado.estado;
      }
      return ganadores;
    }

    expect(correrSorteo(1)).not.toEqual(correrSorteo(2));
  });
});

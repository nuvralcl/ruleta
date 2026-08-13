import type { EventoEntrante, Modo, Repeticion } from './tipos.js';

const TAMANO_MAXIMO_BODY = 1024;

/**
 * Valida el cuerpo recibido campo por campo y construye un objeto nuevo con
 * exactamente los campos esperados — nunca se persiste el body tal como
 * llegó, así un cliente modificado no puede colar nombre/correo/teléfono ni
 * ningún otro dato personal.
 */
export function validarEvento(crudo: unknown): EventoEntrante | null {
  if (typeof crudo !== 'object' || crudo === null) return null;
  const objeto = crudo as Record<string, unknown>;

  if (objeto.tipo === 'giro') {
    return { tipo: 'giro' };
  }

  if (objeto.tipo === 'ronda_iniciada') {
    const participantes = objeto.participantes;
    const modo = objeto.modo;
    const repeticion = objeto.repeticion;

    if (
      typeof participantes !== 'number' ||
      !Number.isInteger(participantes) ||
      participantes < 1 ||
      participantes > 100_000
    ) {
      return null;
    }
    if (modo !== 'lote' && modo !== 'continuo') return null;
    if (repeticion !== 'sin' && repeticion !== 'con') return null;

    return {
      tipo: 'ronda_iniciada',
      participantes,
      modo: modo as Modo,
      repeticion: repeticion as Repeticion,
    };
  }

  return null;
}

export async function leerBodyJson(request: {
  on(evento: 'data' | 'end' | 'error', cb: (arg?: unknown) => void): void;
}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let total = 0;
    const trozos: Buffer[] = [];
    request.on('data', (trozo) => {
      const buffer = trozo as Buffer;
      total += buffer.length;
      if (total > TAMANO_MAXIMO_BODY) {
        reject(new Error('body demasiado grande'));
        return;
      }
      trozos.push(buffer);
    });
    request.on('end', () => {
      try {
        const texto = Buffer.concat(trozos).toString('utf8');
        resolve(texto ? JSON.parse(texto) : null);
      } catch {
        reject(new Error('json inválido'));
      }
    });
    request.on('error', (error) => reject(error));
  });
}

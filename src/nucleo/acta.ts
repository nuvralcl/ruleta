import { normalizarNombre } from './participantes';
import type { Participante } from './tipos';

function listaNormalizada(participantes: Participante[]): string {
  return participantes.map((p) => normalizarNombre(p.nombre)).join('\n');
}

async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type Acta = {
  hash: string;
  codigo: string;
  semilla: number | null;
  cantidadParticipantes: number;
};

const LARGO_CODIGO = 10;

/**
 * Hash de la lista normalizada + semilla. Un tercero con la misma lista y la
 * misma semilla puede recalcular este hash y confirmar que coincide, y luego
 * usar azarConSemilla(semilla) para repetir la secuencia de ganadores.
 */
export async function crearActa(
  participantesIniciales: Participante[],
  semilla: number | null,
): Promise<Acta> {
  const texto = `${listaNormalizada(participantesIniciales)}||semilla=${semilla ?? 'crypto'}`;
  const hash = await sha256Hex(texto);
  return {
    hash,
    codigo: hash.slice(0, LARGO_CODIGO).toUpperCase(),
    semilla,
    cantidadParticipantes: participantesIniciales.length,
  };
}

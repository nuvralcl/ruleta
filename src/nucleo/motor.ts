import type { Azar } from './azar';
import type { Config, Ganador, Participante } from './tipos';

export type EstadoRonda = {
  config: Config;
  participantes: Participante[];
  /** Lista con la que se abrió la ronda, para el acta — nunca se muta. */
  participantesIniciales: Participante[];
  /** Semilla del sorteo si se abrió en modo reproducible; null en modo criptográfico normal. */
  semilla: number | null;
  historial: Ganador[];
  ganadoresRondaActual: Participante[];
  rondaNumero: number;
};

export function crearRonda(
  config: Config,
  participantes: Participante[],
  semilla: number | null = null,
): EstadoRonda {
  return {
    config,
    participantes,
    participantesIniciales: participantes,
    semilla,
    historial: [],
    ganadoresRondaActual: [],
    rondaNumero: 1,
  };
}

export function pozoDe(estado: EstadoRonda): Participante[] {
  if (estado.config.repeticion === 'con') return estado.participantes;
  const idsGanadores = new Set(estado.historial.map((g) => g.participante.id));
  return estado.participantes.filter((p) => !idsGanadores.has(p.id));
}

export function pesoDe(participante: Participante): number {
  return Math.max(1, participante.tickets);
}

export function pesoTotal(pozo: Participante[]): number {
  return pozo.reduce((acumulado, p) => acumulado + pesoDe(p), 0);
}

/** Selección por peso acumulado: cada ticket es una "papeleta" más en el sombrero. */
export function elegirPorPeso(pozo: Participante[], azar: Azar): { participante: Participante; indice: number } {
  const total = pesoTotal(pozo);
  const posicion = azar(total);
  let acumulado = 0;
  for (let i = 0; i < pozo.length; i += 1) {
    acumulado += pesoDe(pozo[i]);
    if (posicion < acumulado) return { participante: pozo[i], indice: i };
  }
  return { participante: pozo[pozo.length - 1], indice: pozo.length - 1 };
}

function calcularPuestoTexto(estado: EstadoRonda): string {
  if (estado.config.modo === 'lote') {
    const puesto = estado.ganadoresRondaActual.length + 1;
    const ordinales: Record<number, string> = { 1: '1er', 2: '2do', 3: '3er' };
    const texto = ordinales[puesto] ?? `${puesto}to`;
    return `${texto} LUGAR`;
  }
  const numero = String(estado.historial.length + 1).padStart(2, '0');
  return `GANADOR ${numero}`;
}

export type ResultadoGiro = {
  estado: EstadoRonda;
  ganador: Participante;
  puestoTexto: string;
  rondaTerminada: boolean;
  rondaTerminadaAntes: boolean;
};

export function girar(estado: EstadoRonda, azar: Azar, ahora: Date): ResultadoGiro | null {
  const pozo = pozoDe(estado);
  if (pozo.length === 0) return null;

  const { participante: participanteGanador } = elegirPorPeso(pozo, azar);
  const puestoTexto = calcularPuestoTexto(estado);
  const ganador: Ganador = {
    participante: participanteGanador,
    puesto: puestoTexto,
    hora: ahora,
    ronda: estado.rondaNumero,
  };

  const historial = [...estado.historial, ganador];
  const ganadoresRondaActual = [...estado.ganadoresRondaActual, participanteGanador];
  const idsGanadores = new Set(historial.map((g) => g.participante.id));
  const pozoRestante =
    estado.config.repeticion === 'sin'
      ? estado.participantes.filter((p) => !idsGanadores.has(p.id))
      : estado.participantes;

  let rondaTerminada = false;
  let rondaTerminadaAntes = false;
  let ganadoresRondaSiguiente = ganadoresRondaActual;
  let rondaNumeroSiguiente = estado.rondaNumero;

  if (estado.config.modo === 'lote') {
    if (ganadoresRondaActual.length >= estado.config.cantidadGanadores) {
      rondaTerminada = true;
    } else if (pozoRestante.length === 0) {
      rondaTerminada = true;
      rondaTerminadaAntes = true;
    }
    if (rondaTerminada) {
      ganadoresRondaSiguiente = [];
      rondaNumeroSiguiente = estado.rondaNumero + 1;
    }
  }

  const nuevoEstado: EstadoRonda = {
    ...estado,
    historial,
    ganadoresRondaActual: ganadoresRondaSiguiente,
    rondaNumero: rondaNumeroSiguiente,
  };

  return { estado: nuevoEstado, ganador: participanteGanador, puestoTexto, rondaTerminada, rondaTerminadaAntes };
}

export function actualizarParticipantes(
  estado: EstadoRonda,
  participantes: Participante[],
): EstadoRonda {
  return { ...estado, participantes };
}

export function actualizarConfig(estado: EstadoRonda, config: Config): EstadoRonda {
  return { ...estado, config };
}

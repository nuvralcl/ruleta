export type Participante = {
  id: string;
  nombre: string;
  correo?: string;
  fono?: string;
  tickets: number;
};

export type ModoRonda = 'lote' | 'continuo';

export type Repeticion = 'sin' | 'con';

export type Config = {
  cantidadGanadores: number;
  modo: ModoRonda;
  repeticion: Repeticion;
  /** Premios por posición dentro de la ronda (0 = 1er lugar). Vacío = sin premios. */
  premios: string[];
};

export type Ganador = {
  participante: Participante;
  puesto: string;
  premio?: string;
  hora: Date;
  ronda: number;
};

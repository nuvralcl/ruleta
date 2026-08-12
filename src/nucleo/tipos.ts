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
};

export type Ganador = {
  participante: Participante;
  puesto: string;
  hora: Date;
  ronda: number;
};

export type Modo = 'lote' | 'continuo';
export type Repeticion = 'sin' | 'con';

export type EventoRondaIniciada = {
  tipo: 'ronda_iniciada';
  participantes: number;
  modo: Modo;
  repeticion: Repeticion;
};

export type EventoGiro = {
  tipo: 'giro';
};

export type EventoEntrante = EventoRondaIniciada | EventoGiro;

export type EventoGuardado = EventoEntrante & {
  fecha: string;
};

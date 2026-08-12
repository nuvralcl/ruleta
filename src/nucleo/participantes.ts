import type { Participante } from './tipos';

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_FONO = /^[+()\d][\d\s()+-]{5,}$/;
const RE_TICKETS = /^x(\d+)$/i;

export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function dividirCampos(linea: string): string[] {
  const campos: string[] = [];
  let actual = '';
  let entreComillas = false;
  for (const caracter of linea) {
    if (caracter === '"') {
      entreComillas = !entreComillas;
      continue;
    }
    if (!entreComillas && /[,;\t]/.test(caracter)) {
      campos.push(actual.trim());
      actual = '';
      continue;
    }
    actual += caracter;
  }
  campos.push(actual.trim());
  if (campos.length === 1) {
    const porEspacios = linea
      .split(/\s{3,}/)
      .map((campo) => campo.trim())
      .filter(Boolean);
    if (porEspacios.length > 1) return porEspacios;
  }
  return campos.filter((campo) => campo.length > 0);
}

export const LIMITE_LINEAS = 5000;

export type ResultadoParseo = {
  participantes: Participante[];
  duplicados: number;
  truncado: boolean;
  totalLineas: number;
};

export function parseParticipantes(texto: string): ResultadoParseo {
  const todasLasLineas = texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);

  const truncado = todasLasLineas.length > LIMITE_LINEAS;
  const lineas = truncado ? todasLasLineas.slice(0, LIMITE_LINEAS) : todasLasLineas;

  const participantes: Participante[] = [];
  const conteoPorClave = new Map<string, number>();

  for (const linea of lineas) {
    const campos = dividirCampos(linea);
    const nombre = campos[0] ?? linea;
    let correo: string | undefined;
    let fono: string | undefined;
    let tickets = 1;
    for (const campo of campos.slice(1)) {
      const coincidenciaTickets = RE_TICKETS.exec(campo);
      if (!correo && RE_CORREO.test(campo)) correo = campo;
      else if (!fono && RE_FONO.test(campo)) fono = campo;
      else if (coincidenciaTickets) tickets = Math.max(1, Number(coincidenciaTickets[1]));
    }

    const clave = normalizarNombre(nombre);
    const ocurrencia = conteoPorClave.get(clave) ?? 0;
    conteoPorClave.set(clave, ocurrencia + 1);

    participantes.push({
      id: `${clave}__${ocurrencia}`,
      nombre,
      correo,
      fono,
      tickets,
    });
  }

  const duplicados = [...conteoPorClave.values()].filter((n) => n > 1).length;
  return { participantes, duplicados, truncado, totalLineas: todasLasLineas.length };
}

export function quitarDuplicados(participantes: Participante[]): Participante[] {
  const vistos = new Set<string>();
  const resultado: Participante[] = [];
  for (const participante of participantes) {
    const clave = normalizarNombre(participante.nombre);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    resultado.push(participante);
  }
  return resultado;
}

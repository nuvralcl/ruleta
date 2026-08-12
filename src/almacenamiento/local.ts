const CLAVE_LISTAS = 'tombola:listas';
const CLAVE_HISTORIAL = 'tombola:historial';

export type ListaGuardada = {
  nombre: string;
  /** Solo nombres, uno por línea — nunca correo ni teléfono (ver docs/PRIVACIDAD.md). */
  participantesTexto: string;
  guardadaEn: string;
};

export type EntradaHistorialGuardada = {
  nombre: string;
  puesto: string;
  hora: string;
  ronda: number;
};

function leerJson<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribirJson(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function listarListas(): ListaGuardada[] {
  return leerJson<ListaGuardada[]>(CLAVE_LISTAS, []);
}

export function guardarLista(nombre: string, nombresParticipantes: string[]): boolean {
  const listas = listarListas().filter((l) => l.nombre !== nombre);
  listas.push({
    nombre,
    participantesTexto: nombresParticipantes.join('\n'),
    guardadaEn: new Date().toISOString(),
  });
  return escribirJson(CLAVE_LISTAS, listas);
}

export function eliminarLista(nombre: string): void {
  escribirJson(
    CLAVE_LISTAS,
    listarListas().filter((l) => l.nombre !== nombre),
  );
}

export function agregarAlHistorial(entradas: EntradaHistorialGuardada[]): boolean {
  if (entradas.length === 0) return true;
  const actual = leerJson<EntradaHistorialGuardada[]>(CLAVE_HISTORIAL, []);
  return escribirJson(CLAVE_HISTORIAL, [...actual, ...entradas]);
}

export function obtenerHistorial(): EntradaHistorialGuardada[] {
  return leerJson<EntradaHistorialGuardada[]>(CLAVE_HISTORIAL, []);
}

export function borrarTodo(): void {
  localStorage.removeItem(CLAVE_LISTAS);
  localStorage.removeItem(CLAVE_HISTORIAL);
}

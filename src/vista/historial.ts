import type { Ganador } from '../nucleo/tipos';

export function crearHistorial(lista: HTMLOListElement) {
  function renderizar(entradas: Ganador[]): void {
    lista.innerHTML = '';
    for (const entrada of [...entradas].reverse()) {
      const li = document.createElement('li');
      li.textContent = entrada.premio
        ? `${entrada.puesto} — ${entrada.participante.nombre} (${entrada.premio})`
        : `${entrada.puesto} — ${entrada.participante.nombre}`;
      lista.appendChild(li);
    }
  }

  return { renderizar };
}

export type Historial = ReturnType<typeof crearHistorial>;

function escaparCampoCSV(valor: string): string {
  return /[",\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function exportarHistorialCSV(entradas: Ganador[]): string {
  const encabezado = ['ronda', 'puesto', 'nombre', 'premio', 'correo', 'fono', 'hora'];
  const filas = entradas.map((g) => [
    String(g.ronda),
    g.puesto,
    g.participante.nombre,
    g.premio ?? '',
    g.participante.correo ?? '',
    g.participante.fono ?? '',
    g.hora.toISOString(),
  ]);
  return [encabezado, ...filas].map((fila) => fila.map(escaparCampoCSV).join(',')).join('\r\n');
}

export function exportarHistorialJSON(entradas: Ganador[]): string {
  return JSON.stringify(
    entradas.map((g) => ({
      ronda: g.ronda,
      puesto: g.puesto,
      nombre: g.participante.nombre,
      premio: g.premio ?? null,
      correo: g.participante.correo ?? null,
      fono: g.participante.fono ?? null,
      hora: g.hora.toISOString(),
    })),
    null,
    2,
  );
}

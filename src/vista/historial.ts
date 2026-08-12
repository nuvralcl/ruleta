import type { Ganador } from '../nucleo/tipos';

export function crearHistorial(lista: HTMLOListElement) {
  function renderizar(entradas: Ganador[]): void {
    lista.innerHTML = '';
    for (const entrada of [...entradas].reverse()) {
      const li = document.createElement('li');
      li.textContent = `${entrada.puesto} — ${entrada.participante.nombre}`;
      lista.appendChild(li);
    }
  }

  return { renderizar };
}

export type Historial = ReturnType<typeof crearHistorial>;

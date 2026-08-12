import type { Participante } from '../nucleo/tipos';

export type ElementosAnuncio = {
  overlay: HTMLElement;
  puesto: HTMLElement;
  nombre: HTMLElement;
  btnCerrar: HTMLButtonElement;
  vivo: HTMLElement;
};

export function crearAnuncio(elementos: ElementosAnuncio) {
  const { overlay, puesto, nombre, btnCerrar, vivo } = elementos;
  let elementoFocoPrevio: HTMLElement | null = null;

  function manejarTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      cerrar();
      return;
    }
    if (evento.key === 'Tab') {
      evento.preventDefault();
      btnCerrar.focus();
    }
  }

  function mostrar(ganador: Participante, puestoTexto: string): void {
    nombre.textContent = ganador.nombre;
    puesto.textContent = puestoTexto;
    overlay.hidden = false;
    vivo.textContent = `Ganó ${ganador.nombre}`;
    elementoFocoPrevio = document.activeElement as HTMLElement | null;
    btnCerrar.focus();
    document.addEventListener('keydown', manejarTecla);
  }

  function cerrar(): void {
    overlay.hidden = true;
    document.removeEventListener('keydown', manejarTecla);
    elementoFocoPrevio?.focus();
  }

  btnCerrar.addEventListener('click', cerrar);

  return { mostrar, cerrar };
}

export type Anuncio = ReturnType<typeof crearAnuncio>;

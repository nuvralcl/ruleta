import type { Config } from '../nucleo/tipos';

export type ElementosPanel = {
  textareaParticipantes: HTMLTextAreaElement;
  avisoLimite: HTMLElement;
  textoLimite: HTMLElement;
  avisoDuplicados: HTMLElement;
  textoDuplicados: HTMLElement;
  btnQuitarDuplicados: HTMLButtonElement;
  inputCantidad: HTMLInputElement;
  selectModo: HTMLSelectElement;
  selectRepeticion: HTMLSelectElement;
  btnGirar: HTMLButtonElement;
  btnSilencio: HTMLButtonElement;
  estadoPozo: HTMLElement;
};

export type CallbacksPanel = {
  alCambiarParticipantes: (texto: string) => void;
  alQuitarDuplicados: () => void;
  alGirar: () => void;
  alAlternarSilencio: () => void;
  alCambiarConfig: () => void;
};

export function crearPanel(elementos: ElementosPanel, callbacks: CallbacksPanel) {
  const {
    textareaParticipantes,
    avisoLimite,
    textoLimite,
    avisoDuplicados,
    textoDuplicados,
    btnQuitarDuplicados,
    inputCantidad,
    selectModo,
    selectRepeticion,
    btnGirar,
    btnSilencio,
    estadoPozo,
  } = elementos;

  textareaParticipantes.addEventListener('input', () => {
    callbacks.alCambiarParticipantes(textareaParticipantes.value);
  });
  btnQuitarDuplicados.addEventListener('click', callbacks.alQuitarDuplicados);
  btnGirar.addEventListener('click', callbacks.alGirar);
  btnSilencio.addEventListener('click', callbacks.alAlternarSilencio);
  selectRepeticion.addEventListener('change', callbacks.alCambiarConfig);
  selectModo.addEventListener('change', callbacks.alCambiarConfig);
  inputCantidad.addEventListener('change', callbacks.alCambiarConfig);

  function obtenerConfig(): Config {
    return {
      cantidadGanadores: Number(inputCantidad.value) || 1,
      modo: selectModo.value === 'continuo' ? 'continuo' : 'lote',
      repeticion: selectRepeticion.value === 'con' ? 'con' : 'sin',
    };
  }

  function establecerTextoParticipantes(texto: string): void {
    textareaParticipantes.value = texto;
  }

  function mostrarAvisoDuplicados(cantidad: number): void {
    avisoDuplicados.hidden = false;
    textoDuplicados.textContent = `${cantidad} nombres repetidos.`;
  }

  function ocultarAvisoDuplicados(): void {
    avisoDuplicados.hidden = true;
  }

  function mostrarAvisoLimite(totalLineas: number, limite: number): void {
    avisoLimite.hidden = false;
    textoLimite.textContent = `La lista tiene ${totalLineas} líneas; solo se usan las primeras ${limite}.`;
  }

  function ocultarAvisoLimite(): void {
    avisoLimite.hidden = true;
  }

  function actualizarEstadoPozo(texto: string): void {
    estadoPozo.textContent = texto;
  }

  function habilitarGirar(habilitado: boolean): void {
    btnGirar.disabled = !habilitado;
  }

  function actualizarBotonSilencio(silenciado: boolean): void {
    btnSilencio.textContent = silenciado ? '🔇 Silencio' : '🔊 Sonido';
    btnSilencio.setAttribute('aria-pressed', String(silenciado));
  }

  function elementoActivoEsCampo(): boolean {
    const activo = document.activeElement;
    return Boolean(activo && ['TEXTAREA', 'INPUT', 'SELECT'].includes(activo.tagName));
  }

  return {
    obtenerConfig,
    establecerTextoParticipantes,
    mostrarAvisoDuplicados,
    ocultarAvisoDuplicados,
    mostrarAvisoLimite,
    ocultarAvisoLimite,
    actualizarEstadoPozo,
    habilitarGirar,
    actualizarBotonSilencio,
    elementoActivoEsCampo,
  };
}

export type Panel = ReturnType<typeof crearPanel>;

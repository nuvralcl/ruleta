export function crearProyeccion(root: HTMLElement, alCambiar: (activo: boolean) => void) {
  let activo = false;

  function actualizar(): void {
    root.classList.toggle('modo-proyeccion', activo);
    alCambiar(activo);
  }

  async function alternar(): Promise<void> {
    activo = !activo;
    actualizar();

    if (activo && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Sin permiso o no soportado: seguimos en modo proyección solo con CSS.
      }
    } else if (!activo && document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Nada que hacer si el navegador no deja salir de fullscreen a mano.
      }
    }
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && activo) {
      activo = false;
      actualizar();
    }
  });

  return { alternar, estaActivo: () => activo };
}

export type Proyeccion = ReturnType<typeof crearProyeccion>;

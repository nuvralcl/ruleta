const TOTAL_AMPOLLETAS = 40;

export function crearMarquesina(contenedor: HTMLElement) {
  for (let i = 0; i < TOTAL_AMPOLLETAS; i += 1) {
    const angulo = (i / TOTAL_AMPOLLETAS) * Math.PI * 2;
    const radio = 49;
    const x = 50 + radio * Math.sin(angulo);
    const y = 50 - radio * Math.cos(angulo);
    const bulbo = document.createElement('div');
    bulbo.className = 'ampolleta';
    bulbo.style.left = `${x}%`;
    bulbo.style.top = `${y}%`;
    bulbo.style.animationDelay = `${(i / TOTAL_AMPOLLETAS) * 2.4}s`;
    contenedor.appendChild(bulbo);
  }

  function marcarGirando(activo: boolean): void {
    contenedor.classList.toggle('girando', activo);
  }

  function marcarGanador(duracionMs: number): void {
    contenedor.classList.add('ganador');
    setTimeout(() => contenedor.classList.remove('ganador'), duracionMs);
  }

  return { marcarGirando, marcarGanador };
}

export type Marquesina = ReturnType<typeof crearMarquesina>;

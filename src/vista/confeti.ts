const COLOR_ACENTO = '#ffd166';
const TONOS = ['#ff6b6b', '#4ecdc4', '#ffd166', '#a78bfa'];

type Pieza = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  tam: number;
  color: string;
};

export function crearConfeti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El canvas no soporta contexto 2D');

  function ajustarTamano(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function disparar(): void {
    ajustarTamano();
    const coloresConfeti = TONOS.concat([COLOR_ACENTO]);
    const piezas: Pieza[] = [];
    for (let i = 0; i < 170; i += 1) {
      piezas.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        tam: 6 + Math.random() * 6,
        color: coloresConfeti[Math.floor(Math.random() * coloresConfeti.length)],
      });
    }

    const inicio = performance.now();
    function paso(ahora: number): void {
      if (!ctx) return;
      const transcurrido = ahora - inicio;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let algunaVisible = false;
      for (const p of piezas) {
        p.vy += 0.06;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y < canvas.height + 30) algunaVisible = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2);
        ctx.restore();
      }
      if (algunaVisible && transcurrido < 4000) {
        requestAnimationFrame(paso);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(paso);
  }

  return { disparar };
}

export type Confeti = ReturnType<typeof crearConfeti>;

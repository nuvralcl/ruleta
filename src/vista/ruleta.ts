import type { Participante } from '../nucleo/tipos';

const COLOR_TEXTO_SEGMENTO = '#1c1140';
const COLOR_PANEL = '#1c1140';
const COLOR_ACENTO = '#ffd166';
const TONOS = ['#ff6b6b', '#4ecdc4', '#ffd166', '#a78bfa'];
const UMBRAL_SIN_TEXTO = 46;
const UMBRAL_MODO_DISCO = 200;

function normalizarAngulo(angulo: number): number {
  const dosPi = Math.PI * 2;
  return ((angulo % dosPi) + dosPi) % dosPi;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function recortar(texto: string, maxLargo: number): string {
  return texto.length > maxLargo ? `${texto.slice(0, maxLargo - 1)}…` : texto;
}

function colorParaSegmento(indice: number, n: number): string {
  let color = TONOS[indice % TONOS.length];
  if (indice === n - 1 && n > 1 && color === TONOS[0]) {
    color = TONOS[(indice + 1) % TONOS.length];
  }
  return color;
}

function centroSegmento(indice: number, n: number): number {
  return (indice + 0.5) * ((Math.PI * 2) / n);
}

export type OpcionesGiro = {
  indiceGanador: number;
  duracionMs: number;
  vueltas: number;
  onTic?: (velocidad: number) => void;
  onFin: () => void;
};

export function crearRuleta(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El canvas no soporta contexto 2D');

  // Los segmentos (o los anillos del modo disco) se dibujan una sola vez en
  // este canvas fuera de pantalla; cada frame del giro solo lo rota y lo
  // pega encima, en vez de volver a trazar cada segmento.
  const capaRotable = document.createElement('canvas');
  const ctxCapa = capaRotable.getContext('2d');
  let pozoCacheado: Participante[] | null = null;

  let anguloAcumulado = 0;
  let pozoActual: Participante[] = [];

  function ajustarTamano(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    pozoCacheado = null; // el tamaño cambió: la capa cacheada quedó obsoleta
    dibujar(pozoActual);
  }

  function dibujarAnillosDisco(contexto: CanvasRenderingContext2D, cx: number, cy: number, radio: number): void {
    const anillos = 10;
    contexto.save();
    contexto.translate(cx, cy);
    for (let i = anillos; i > 0; i -= 1) {
      contexto.beginPath();
      contexto.arc(0, 0, radio * (i / anillos), 0, Math.PI * 2);
      contexto.fillStyle = TONOS[i % TONOS.length];
      contexto.fill();
    }
    contexto.restore();
  }

  function dibujarSegmentos(
    contexto: CanvasRenderingContext2D,
    pozo: Participante[],
    cx: number,
    cy: number,
    radio: number,
  ): void {
    const n = pozo.length;
    const anguloPorSegmento = (Math.PI * 2) / n;
    const mostrarTexto = n <= UMBRAL_SIN_TEXTO;

    contexto.save();
    contexto.translate(cx, cy);
    for (let i = 0; i < n; i += 1) {
      const inicio = i * anguloPorSegmento;
      const fin = inicio + anguloPorSegmento;
      contexto.beginPath();
      contexto.moveTo(0, 0);
      contexto.arc(0, 0, radio, inicio, fin);
      contexto.closePath();
      contexto.fillStyle = colorParaSegmento(i, n);
      contexto.fill();
      contexto.strokeStyle = 'rgba(18,10,36,0.25)';
      contexto.stroke();

      if (mostrarTexto) {
        contexto.save();
        contexto.rotate(inicio + anguloPorSegmento / 2);
        contexto.textAlign = 'right';
        contexto.textBaseline = 'middle';
        contexto.fillStyle = COLOR_TEXTO_SEGMENTO;
        contexto.font = `600 ${Math.round(radio * 0.045)}px system-ui, sans-serif`;
        contexto.fillText(recortar(pozo[i].nombre, 20), radio - radio * 0.06, 0);
        contexto.restore();
      }
    }
    contexto.restore();
  }

  function asegurarCapaRotable(pozo: Participante[], w: number, h: number, cx: number, cy: number, radio: number): void {
    if (!ctxCapa) return;
    if (capaRotable.width !== w || capaRotable.height !== h) {
      capaRotable.width = w;
      capaRotable.height = h;
      pozoCacheado = null;
    }
    if (pozoCacheado === pozo) return;
    pozoCacheado = pozo;

    ctxCapa.clearRect(0, 0, w, h);
    if (pozo.length > UMBRAL_MODO_DISCO) {
      dibujarAnillosDisco(ctxCapa, cx, cy, radio);
    } else {
      dibujarSegmentos(ctxCapa, pozo, cx, cy, radio);
    }
  }

  function dibujarContadorDisco(cx: number, cy: number, radio: number, n: number): void {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(cx, cy, radio * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_PANEL;
    ctx.fill();
    ctx.fillStyle = COLOR_ACENTO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(radio * 0.14)}px system-ui, sans-serif`;
    ctx.fillText(String(n), cx, cy);
  }

  function dibujar(pozo: Participante[]): void {
    if (!ctx) return;
    pozoActual = pozo;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radio = Math.min(w, h) / 2 - 4;
    ctx.clearRect(0, 0, w, h);

    if (pozo.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radio, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_PANEL;
      ctx.fill();
      ctx.fillStyle = '#b9aed6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(radio * 0.09)}px system-ui, sans-serif`;
      ctx.fillText('Agrega participantes', cx, cy);
      return;
    }

    asegurarCapaRotable(pozo, w, h, cx, cy, radio);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(anguloAcumulado);
    ctx.drawImage(capaRotable, -cx, -cy);
    ctx.restore();

    if (pozo.length > UMBRAL_MODO_DISCO) {
      dibujarContadorDisco(cx, cy, radio, pozo.length);
    }
  }

  function girarHasta(pozo: Participante[], opciones: OpcionesGiro): void {
    const { indiceGanador, duracionMs, vueltas, onTic, onFin } = opciones;
    const n = pozo.length;
    const modoDisco = n > UMBRAL_MODO_DISCO;
    const anguloInicial = anguloAcumulado;
    const a0 = normalizarAngulo(anguloInicial);

    let anguloFinal: number;
    if (modoDisco) {
      anguloFinal = anguloInicial + vueltas * Math.PI * 2 + Math.random() * Math.PI * 2;
    } else {
      const anguloPorSegmento = (Math.PI * 2) / n;
      const margen = anguloPorSegmento * 0.15;
      const desvio = margen + Math.random() * (anguloPorSegmento - margen * 2);
      const objetivoBase = normalizarAngulo(-Math.PI / 2 - centroSegmento(indiceGanador, n) + desvio);
      const delta = normalizarAngulo(objetivoBase - a0);
      anguloFinal = anguloInicial + vueltas * Math.PI * 2 + delta;
    }

    const inicioTiempo = performance.now();
    let ultimoAnguloParaTic = a0;

    function paso(ahora: number): void {
      const t = Math.min(1, (ahora - inicioTiempo) / duracionMs);
      const avance = easeOutQuart(t);
      anguloAcumulado = anguloInicial + (anguloFinal - anguloInicial) * avance;
      dibujar(pozo);

      if (!modoDisco && onTic) {
        const anguloPorSegmento = (Math.PI * 2) / n;
        const actual = normalizarAngulo(anguloAcumulado);
        if (Math.floor(actual / anguloPorSegmento) !== Math.floor(ultimoAnguloParaTic / anguloPorSegmento)) {
          onTic(t < 1 ? 1 - t : 0);
        }
        ultimoAnguloParaTic = actual;
      }

      if (t < 1) {
        requestAnimationFrame(paso);
      } else {
        anguloAcumulado = anguloFinal;
        dibujar(pozo);
        onFin();
      }
    }

    requestAnimationFrame(paso);
  }

  return { dibujar, girarHasta, ajustarTamano };
}

export type Ruleta = ReturnType<typeof crearRuleta>;

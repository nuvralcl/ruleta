const TOPE_MS_ENTRE_TICS = 24;

export function crearSintetizador() {
  let contexto: AudioContext | null = null;
  let nodoGanancia: GainNode | null = null;
  let silenciado = false;
  let ultimoTic = 0;

  function obtenerContexto(): AudioContext {
    if (!contexto) {
      contexto = new AudioContext();
      nodoGanancia = contexto.createGain();
      nodoGanancia.gain.value = silenciado ? 0 : 1;
      nodoGanancia.connect(contexto.destination);
    }
    if (contexto.state === 'suspended') contexto.resume();
    return contexto;
  }

  function tic(velocidad: number): void {
    const ahora = performance.now();
    if (ahora - ultimoTic < TOPE_MS_ENTRE_TICS) return;
    ultimoTic = ahora;
    const ctx = obtenerContexto();
    const frecuencia = 300 + velocidad * 600;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = frecuencia;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.22, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    osc.connect(env).connect(nodoGanancia as GainNode);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  function ruidoDeGiro(duracionSeg: number): void {
    const ctx = obtenerContexto();
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duracionSeg));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) datos[i] = Math.random() * 2 - 1;
    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 1;
    filtro.frequency.setValueAtTime(1500, ctx.currentTime);
    filtro.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + duracionSeg);
    const env = ctx.createGain();
    env.gain.value = 0.14;
    fuente.connect(filtro).connect(env).connect(nodoGanancia as GainNode);
    fuente.start();
    fuente.stop(ctx.currentTime + duracionSeg);
  }

  function sonidoGanador(): void {
    const ctx = obtenerContexto();
    const base = 523.25; // do5
    const semitonos = [0, 2, 4, 5, 7, 9, 11];
    semitonos.forEach((s, i) => {
      const freq = base * Math.pow(2, s / 12);
      const inicio = ctx.currentTime + i * 0.09;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, inicio);
      env.gain.linearRampToValueAtTime(0.2, inicio + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.3);
      osc.connect(env).connect(nodoGanancia as GainNode);
      osc.start(inicio);
      osc.stop(inicio + 0.32);
    });

    const golpe = ctx.createOscillator();
    golpe.type = 'sine';
    golpe.frequency.value = 80;
    const envGolpe = ctx.createGain();
    envGolpe.gain.setValueAtTime(0.3, ctx.currentTime);
    envGolpe.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    golpe.connect(envGolpe).connect(nodoGanancia as GainNode);
    golpe.start();
    golpe.stop(ctx.currentTime + 0.4);
  }

  function alternarSilencio(): boolean {
    obtenerContexto();
    silenciado = !silenciado;
    if (nodoGanancia) nodoGanancia.gain.value = silenciado ? 0 : 1;
    return silenciado;
  }

  function estaSilenciado(): boolean {
    return silenciado;
  }

  return { tic, ruidoDeGiro, sonidoGanador, alternarSilencio, estaSilenciado };
}

export type Sintetizador = ReturnType<typeof crearSintetizador>;

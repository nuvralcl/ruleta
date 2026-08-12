import { crearActa } from './nucleo/acta';
import { azarConSemilla, azarCripto } from './nucleo/azar';
import { actualizarConfig, actualizarParticipantes, crearRonda, girar, pozoDe } from './nucleo/motor';
import { LIMITE_LINEAS, parseParticipantes, quitarDuplicados } from './nucleo/participantes';
import { crearSintetizador } from './audio/sintetizador';
import { crearAnuncio } from './vista/anuncio';
import { crearConfeti } from './vista/confeti';
import { crearHistorial } from './vista/historial';
import { crearMarquesina } from './vista/marquesina';
import { crearPanel } from './vista/panel';
import { crearProyeccion } from './vista/proyeccion';
import { crearRuleta } from './vista/ruleta';

const PARTICIPANTES_EJEMPLO = [
  'Camila Riquelme, camila.r@correo.cl, +56 9 8123 4455',
  'Matías Sandoval, matias.sandoval@correo.cl',
  'Fernanda Aguilar',
  'Diego Torres, diego.torres@correo.cl',
  'Valentina Muñoz, +56 9 5544 3322',
  'Camila Riquelme',
  'Ignacio Rojas',
  'Javiera Contreras, javiera.c@correo.cl',
  'Benjamín Silva',
  'Antonia Vergara, antonia.v@correo.cl, +56 9 1122 3344',
  'Tomás Fuentes',
  'Sofía Herrera',
].join('\n');

function elemento<T extends Element>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`No se encontró el elemento #${id}`);
  return el as unknown as T;
}

const canvasRuleta = elemento<HTMLCanvasElement>('ruleta');
const canvasConfeti = elemento<HTMLCanvasElement>('confeti');
const marcoMarquesina = elemento<HTMLElement>('marquesina');
const agujaEl = elemento<HTMLElement>('aguja');

const ruleta = crearRuleta(canvasRuleta);
const confeti = crearConfeti(canvasConfeti);
const marquesina = crearMarquesina(marcoMarquesina);
const historial = crearHistorial(elemento<HTMLOListElement>('historial'));
const codigoActaEl = elemento<HTMLElement>('codigoActa');
const btnProyeccion = elemento<HTMLButtonElement>('btnProyeccion');
const sintetizador = crearSintetizador();
const proyeccion = crearProyeccion(elemento('app'), (activo) => {
  btnProyeccion.setAttribute('aria-pressed', String(activo));
  btnProyeccion.textContent = activo ? '🖥 Salir de proyección' : '🖥 Proyección';
  ruleta.ajustarTamano();
});
const anuncio = crearAnuncio({
  overlay: elemento('anuncioOverlay'),
  puesto: elemento('anuncioPuesto'),
  nombre: elemento('anuncioNombre'),
  btnCerrar: elemento('btnCerrarAnuncio'),
  vivo: elemento('vivoGanador'),
});

const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let girando = false;
const parseoInicial = parseParticipantes(PARTICIPANTES_EJEMPLO);
let estado = crearRonda(
  { cantidadGanadores: 1, modo: 'lote', repeticion: 'sin' },
  parseoInicial.participantes,
);

const panel = crearPanel(
  {
    textareaParticipantes: elemento('participantes'),
    avisoLimite: elemento('avisoLimite'),
    textoLimite: elemento('textoLimite'),
    avisoDuplicados: elemento('avisoDuplicados'),
    textoDuplicados: elemento('textoDuplicados'),
    btnQuitarDuplicados: elemento('btnQuitarDuplicados'),
    inputCantidad: elemento('cantidad'),
    selectModo: elemento('modo'),
    selectRepeticion: elemento('repeticion'),
    btnGirar: elemento('btnGirar'),
    btnSilencio: elemento('btnSilencio'),
    estadoPozo: elemento('estadoPozo'),
  },
  {
    alCambiarParticipantes: (texto) => {
      const { participantes, duplicados, truncado, totalLineas } = parseParticipantes(texto);
      estado = actualizarParticipantes(estado, participantes);
      if (truncado) panel.mostrarAvisoLimite(totalLineas, LIMITE_LINEAS);
      else panel.ocultarAvisoLimite();
      if (duplicados > 0) panel.mostrarAvisoDuplicados(duplicados);
      else panel.ocultarAvisoDuplicados();
      actualizarPozoYDibujo();
    },
    alQuitarDuplicados: () => {
      estado = actualizarParticipantes(estado, quitarDuplicados(estado.participantes));
      panel.ocultarAvisoDuplicados();
      actualizarPozoYDibujo();
    },
    alGirar: empezarGiro,
    alAlternarSilencio: () => {
      const silenciado = sintetizador.alternarSilencio();
      panel.actualizarBotonSilencio(silenciado);
    },
    alCambiarConfig: () => {
      estado = actualizarConfig(estado, panel.obtenerConfig());
      actualizarPozoYDibujo();
    },
  },
);

function actualizarPozoYDibujo(): void {
  const pozo = pozoDe(estado);
  ruleta.dibujar(pozo);
  panel.habilitarGirar(pozo.length > 0 && !girando);
  panel.actualizarEstadoPozo(
    pozo.length === 0 ? 'No quedan participantes disponibles.' : `${pozo.length} en el pozo`,
  );
}

function empezarGiro(): void {
  if (girando) return;
  const pozoAlGirar = pozoDe(estado);
  const azar = estado.semilla === null ? azarCripto : azarConSemilla(estado.semilla);
  const resultado = girar(estado, azar, new Date());
  if (!resultado) return;

  const indiceGanador = pozoAlGirar.findIndex((p) => p.id === resultado.ganador.id);

  girando = true;
  panel.habilitarGirar(false);
  marquesina.marcarGirando(true);
  agujaEl.classList.add('girando');

  const duracionMs = prefiereMovimientoReducido ? 900 : 5200 + Math.random() * 900;
  const vueltas = prefiereMovimientoReducido ? 1 : 5 + Math.floor(Math.random() * 3);
  if (!prefiereMovimientoReducido) sintetizador.ruidoDeGiro(duracionMs / 1000);

  ruleta.girarHasta(pozoAlGirar, {
    indiceGanador,
    duracionMs,
    vueltas,
    onTic: prefiereMovimientoReducido ? undefined : sintetizador.tic,
    onFin: () => {
      estado = resultado.estado;
      historial.renderizar(estado.historial);

      girando = false;
      marquesina.marcarGirando(false);
      agujaEl.classList.remove('girando');
      marquesina.marcarGanador(1600);

      sintetizador.sonidoGanador();
      if (!prefiereMovimientoReducido) confeti.disparar();
      anuncio.mostrar(resultado.ganador, resultado.puestoTexto);

      actualizarPozoYDibujo();
      if (resultado.rondaTerminada) {
        panel.actualizarEstadoPozo(
          resultado.rondaTerminadaAntes
            ? 'La ronda terminó antes: se acabaron los participantes.'
            : 'Ronda cerrada. Presiona "Girar la ruleta" para abrir una nueva.',
        );
      }
    },
  });
}

window.addEventListener('resize', () => {
  ruleta.ajustarTamano();
});

btnProyeccion.addEventListener('click', () => {
  proyeccion.alternar();
});

const inputLogo = elemento<HTMLInputElement>('logoOrganizador');
const btnQuitarLogo = elemento<HTMLButtonElement>('btnQuitarLogo');
let urlLogoActual: string | null = null;

inputLogo.addEventListener('change', () => {
  const archivo = inputLogo.files?.[0];
  if (!archivo) return;
  const url = URL.createObjectURL(archivo);
  const imagen = new Image();
  imagen.onload = () => {
    ruleta.establecerLogo(imagen);
    btnQuitarLogo.hidden = false;
    if (urlLogoActual) URL.revokeObjectURL(urlLogoActual);
    urlLogoActual = url;
  };
  imagen.src = url;
});

btnQuitarLogo.addEventListener('click', () => {
  ruleta.establecerLogo(null);
  inputLogo.value = '';
  btnQuitarLogo.hidden = true;
  if (urlLogoActual) {
    URL.revokeObjectURL(urlLogoActual);
    urlLogoActual = null;
  }
});

const inputColorAcento = elemento<HTMLInputElement>('colorAcento');
inputColorAcento.addEventListener('input', () => {
  document.documentElement.style.setProperty('--color-acento', inputColorAcento.value);
  ruleta.establecerColorAcento(inputColorAcento.value);
});

document.addEventListener('keydown', (evento) => {
  if (panel.elementoActivoEsCampo()) return;
  if (evento.code === 'Space') {
    evento.preventDefault();
    empezarGiro();
    return;
  }
  if (evento.key.toLowerCase() === 'f') {
    evento.preventDefault();
    proyeccion.alternar();
  }
});

panel.establecerTextoParticipantes(PARTICIPANTES_EJEMPLO);
if (parseoInicial.duplicados > 0) panel.mostrarAvisoDuplicados(parseoInicial.duplicados);
ruleta.ajustarTamano();
actualizarPozoYDibujo();

crearActa(estado.participantesIniciales, estado.semilla).then((acta) => {
  codigoActaEl.textContent = `Código de verificación: ${acta.codigo}`;
});

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { guardarEvento, leerEventos } from './almacenamiento.js';
import { ipBloqueada, limpiarIntentos, registrarIntentoFallido, verificarBasicAuth } from './autenticacion.js';
import { construirDashboard } from './dashboard.js';
import { leerBodyJson, validarEvento } from './eventos.js';
import { crearLimitadorDeTasa } from './limitadorDeTasa.js';

const PUERTO = Number(process.env.PORT ?? 3000);
const ORIGEN_PERMITIDO = process.env.ORIGEN_PERMITIDO ?? 'https://ruleta.nuvral.cl';

const limitadorEventos = crearLimitadorDeTasa(30, 60 * 1000);

function obtenerIp(request: IncomingMessage): string {
  const adelante = request.headers['x-forwarded-for'];
  if (typeof adelante === 'string' && adelante.length > 0) return adelante.split(',')[0].trim();
  return request.socket.remoteAddress ?? 'desconocida';
}

function responderJson(response: ServerResponse, estado: number, cuerpo: unknown): void {
  const texto = JSON.stringify(cuerpo);
  response.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(texto);
}

async function manejarEventos(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader('Access-Control-Allow-Origin', ORIGEN_PERMITIDO);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== 'POST') {
    responderJson(response, 405, { error: 'método no permitido' });
    return;
  }

  const ip = obtenerIp(request);
  if (!limitadorEventos.permitir(ip)) {
    responderJson(response, 429, { error: 'demasiadas solicitudes' });
    return;
  }

  let cuerpo: unknown;
  try {
    cuerpo = await leerBodyJson(request);
  } catch {
    responderJson(response, 400, { error: 'body inválido' });
    return;
  }

  const evento = validarEvento(cuerpo);
  if (!evento) {
    responderJson(response, 400, { error: 'evento inválido' });
    return;
  }

  try {
    await guardarEvento({ ...evento, fecha: new Date().toISOString() });
    responderJson(response, 201, { ok: true });
  } catch {
    responderJson(response, 500, { error: 'no se pudo guardar' });
  }
}

async function manejarDashboard(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const ip = obtenerIp(request);
  if (ipBloqueada(ip)) {
    responderJson(response, 429, { error: 'demasiados intentos, esperá unos minutos' });
    return;
  }

  if (!verificarBasicAuth(request.headers.authorization)) {
    registrarIntentoFallido(ip);
    response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Estadísticas"' });
    response.end('Autenticación requerida');
    return;
  }
  limpiarIntentos(ip);

  try {
    const eventos = await leerEventos();
    const html = construirDashboard(eventos);
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  } catch {
    responderJson(response, 500, { error: 'no se pudo generar el panel' });
  }
}

const servidor = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PUERTO}`);

  if (url.pathname === '/salud') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('ok');
    return;
  }

  if (url.pathname === '/eventos') {
    manejarEventos(request, response).catch(() => responderJson(response, 500, { error: 'error interno' }));
    return;
  }

  if (url.pathname === '/dashboard') {
    manejarDashboard(request, response).catch(() => responderJson(response, 500, { error: 'error interno' }));
    return;
  }

  responderJson(response, 404, { error: 'no encontrado' });
});

servidor.listen(PUERTO, () => {
  console.log(`Servidor de estadísticas escuchando en el puerto ${PUERTO}`);
});

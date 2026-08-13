import { timingSafeEqual } from 'node:crypto';

const USUARIO = process.env.DASHBOARD_USUARIO ?? '';
const CLAVE = process.env.DASHBOARD_CLAVE ?? '';

/**
 * Intentos fallidos por IP, solo en memoria — nunca se escribe a disco, para
 * no terminar guardando IPs (dato personal) en ningún archivo persistente.
 */
const intentosFallidos = new Map<string, number[]>();
const VENTANA_MS = 5 * 60 * 1000;
const MAXIMO_INTENTOS = 5;

function compararSeguro(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function ipBloqueada(ip: string): boolean {
  const ahora = Date.now();
  const intentos = (intentosFallidos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  intentosFallidos.set(ip, intentos);
  return intentos.length >= MAXIMO_INTENTOS;
}

export function registrarIntentoFallido(ip: string): void {
  const intentos = intentosFallidos.get(ip) ?? [];
  intentos.push(Date.now());
  intentosFallidos.set(ip, intentos);
}

export function limpiarIntentos(ip: string): void {
  intentosFallidos.delete(ip);
}

export function verificarBasicAuth(encabezado: string | undefined): boolean {
  if (!USUARIO || !CLAVE) return false;
  if (!encabezado?.startsWith('Basic ')) return false;

  const decodificado = Buffer.from(encabezado.slice(6), 'base64').toString('utf8');
  const indiceDosPuntos = decodificado.indexOf(':');
  if (indiceDosPuntos === -1) return false;

  const usuarioRecibido = decodificado.slice(0, indiceDosPuntos);
  const claveRecibida = decodificado.slice(indiceDosPuntos + 1);

  return compararSeguro(usuarioRecibido, USUARIO) && compararSeguro(claveRecibida, CLAVE);
}

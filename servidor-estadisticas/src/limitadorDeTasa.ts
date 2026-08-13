/**
 * Límite de tasa por IP, efímero (solo en memoria, nunca a disco) — evita
 * inflar el conteo de eventos con spam sin dejar un registro de IPs.
 */
export function crearLimitadorDeTasa(maximoPorVentana: number, ventanaMs: number) {
  const marcasPorIp = new Map<string, number[]>();

  function permitir(ip: string): boolean {
    const ahora = Date.now();
    const marcas = (marcasPorIp.get(ip) ?? []).filter((t) => ahora - t < ventanaMs);
    if (marcas.length >= maximoPorVentana) {
      marcasPorIp.set(ip, marcas);
      return false;
    }
    marcas.push(ahora);
    marcasPorIp.set(ip, marcas);
    return true;
  }

  return { permitir };
}

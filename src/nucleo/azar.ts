export type Azar = (n: number) => number;

export function azarCripto(n: number): number {
  if (n <= 0) throw new Error('n debe ser mayor a 0');
  const maxUint32 = 0xffffffff;
  const limite = Math.floor((maxUint32 + 1) / n) * n;
  const buffer = new Uint32Array(1);
  let valor: number;
  do {
    crypto.getRandomValues(buffer);
    valor = buffer[0];
  } while (valor >= limite);
  return valor % n;
}

/** Generador determinista mulberry32: misma semilla -> misma secuencia siempre. */
function mulberry32(semilla: number): () => number {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Azar reproducible para tests y para el modo "sorteo reproducible": la misma
 * semilla siempre devuelve la misma secuencia, lo que permite que un tercero
 * verifique un sorteo repitiéndolo.
 */
export function azarConSemilla(semilla: number): Azar {
  const rng = mulberry32(semilla);
  return (n: number) => Math.floor(rng() * n);
}

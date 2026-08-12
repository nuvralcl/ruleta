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

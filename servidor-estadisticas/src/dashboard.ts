import type { EventoGuardado } from './tipos.js';

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

function contarPor<T extends string>(valores: T[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const valor of valores) conteo[valor] = (conteo[valor] ?? 0) + 1;
  return conteo;
}

function filaTabla(etiqueta: string, valor: string | number): string {
  return `<tr><td>${escaparHtml(etiqueta)}</td><td>${escaparHtml(String(valor))}</td></tr>`;
}

export function construirDashboard(eventos: EventoGuardado[]): string {
  const rondas = eventos.filter((e) => e.tipo === 'ronda_iniciada');
  const giros = eventos.filter((e) => e.tipo === 'giro');

  const totalParticipantes = rondas.reduce((acumulado, r) => acumulado + r.participantes, 0);
  const promedioParticipantes = rondas.length > 0 ? totalParticipantes / rondas.length : 0;

  const porModo = contarPor(rondas.map((r) => r.modo));
  const porRepeticion = contarPor(rondas.map((r) => r.repeticion));

  const girosPorDia = contarPor(giros.map((g) => g.fecha.slice(0, 10)));
  const diasOrdenados = Object.keys(girosPorDia)
    .sort()
    .reverse()
    .slice(0, 14);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Estadísticas — Tómbola</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1c1140; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; }
  .metricas { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
  .metrica { background: #f5f1ff; border-radius: 10px; padding: 12px 16px; }
  .metrica .numero { font-size: 1.6rem; font-weight: 700; }
  .metrica .etiqueta { font-size: 0.8rem; color: #5f5e5a; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 4px 8px; border-bottom: 1px solid #e5e0f5; }
</style>
</head>
<body>
  <h1>Estadísticas de uso — Tómbola</h1>
  <p>Solo conteos anónimos: nunca se registran nombres, correos ni teléfonos de participantes.</p>

  <div class="metricas">
    <div class="metrica"><div class="numero">${rondas.length}</div><div class="etiqueta">Rondas iniciadas</div></div>
    <div class="metrica"><div class="numero">${giros.length}</div><div class="etiqueta">Giros totales</div></div>
    <div class="metrica"><div class="numero">${promedioParticipantes.toFixed(1)}</div><div class="etiqueta">Participantes promedio por ronda</div></div>
  </div>

  <h2>Modalidad de las rondas</h2>
  <table>
    ${filaTabla('Ronda cerrada (lote)', porModo.lote ?? 0)}
    ${filaTabla('Uno a la vez (continuo)', porModo.continuo ?? 0)}
    ${filaTabla('Sin repetir', porRepeticion.sin ?? 0)}
    ${filaTabla('Con repetición', porRepeticion.con ?? 0)}
  </table>

  <h2>Giros por día (últimos 14 días con actividad)</h2>
  <table>
    ${diasOrdenados.map((dia) => filaTabla(dia, girosPorDia[dia])).join('') || '<tr><td>Todavía no hay giros registrados.</td></tr>'}
  </table>
</body>
</html>`;
}

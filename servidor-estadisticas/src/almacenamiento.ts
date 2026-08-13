import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { EventoGuardado } from './tipos.js';

const ARCHIVO_DATOS = process.env.ARCHIVO_DATOS ?? './datos/eventos.ndjson';

let carpetaAsegurada = false;

async function asegurarCarpeta(): Promise<void> {
  if (carpetaAsegurada) return;
  await mkdir(dirname(ARCHIVO_DATOS), { recursive: true });
  carpetaAsegurada = true;
}

export async function guardarEvento(evento: EventoGuardado): Promise<void> {
  await asegurarCarpeta();
  await appendFile(ARCHIVO_DATOS, `${JSON.stringify(evento)}\n`, 'utf8');
}

export async function leerEventos(): Promise<EventoGuardado[]> {
  try {
    const contenido = await readFile(ARCHIVO_DATOS, 'utf8');
    return contenido
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean)
      .map((linea) => JSON.parse(linea) as EventoGuardado);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

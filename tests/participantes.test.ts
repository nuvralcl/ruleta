import { describe, expect, it } from 'vitest';
import {
  LIMITE_LINEAS,
  dividirCampos,
  normalizarNombre,
  parseParticipantes,
  quitarDuplicados,
} from '../src/nucleo/participantes';

describe('dividirCampos — separadores', () => {
  it('separa por coma', () => {
    expect(dividirCampos('Ana,ana@correo.cl')).toEqual(['Ana', 'ana@correo.cl']);
  });

  it('separa por punto y coma', () => {
    expect(dividirCampos('Ana;ana@correo.cl')).toEqual(['Ana', 'ana@correo.cl']);
  });

  it('separa por tabulación (pegado desde Excel)', () => {
    expect(dividirCampos('Ana\tana@correo.cl\t+56912345678')).toEqual([
      'Ana',
      'ana@correo.cl',
      '+56912345678',
    ]);
  });

  it('separa por 3 o más espacios', () => {
    expect(dividirCampos('Ana Pérez   ana@correo.cl')).toEqual(['Ana Pérez', 'ana@correo.cl']);
  });

  it('no separa por uno o dos espacios (son parte del nombre)', () => {
    expect(dividirCampos('Ana María Pérez')).toEqual(['Ana María Pérez']);
  });

  it('respeta campos entre comillas aunque contengan comas', () => {
    expect(dividirCampos('"Pérez, Ana",ana@correo.cl')).toEqual(['Pérez, Ana', 'ana@correo.cl']);
  });
});

describe('normalizarNombre', () => {
  it('quita tildes, pasa a minúsculas y colapsa espacios', () => {
    expect(normalizarNombre('  José   Pérez  ')).toBe('jose perez');
  });

  it('nombres equivalentes normalizan igual', () => {
    expect(normalizarNombre('Ñuño')).toBe(normalizarNombre('ñuño'));
  });
});

describe('parseParticipantes — reglas básicas', () => {
  it('una línea sin más campos: el nombre es la línea completa', () => {
    const { participantes } = parseParticipantes('Fernanda Aguilar');
    expect(participantes).toHaveLength(1);
    expect(participantes[0].nombre).toBe('Fernanda Aguilar');
    expect(participantes[0].correo).toBeUndefined();
    expect(participantes[0].fono).toBeUndefined();
  });

  it('una línea que es solo un correo se muestra tal cual como nombre', () => {
    const { participantes } = parseParticipantes('ana@correo.cl');
    expect(participantes[0].nombre).toBe('ana@correo.cl');
  });

  it('detecta correo y teléfono sin importar el orden de los campos', () => {
    const { participantes } = parseParticipantes(
      'Camila Riquelme, +56 9 8123 4455, camila.r@correo.cl',
    );
    expect(participantes[0].correo).toBe('camila.r@correo.cl');
    expect(participantes[0].fono).toBe('+56 9 8123 4455');
  });

  it('ignora campos que no son ni correo ni teléfono', () => {
    const { participantes } = parseParticipantes('Ana, mesa 3, ana@correo.cl');
    expect(participantes[0].correo).toBe('ana@correo.cl');
    expect(participantes[0].fono).toBeUndefined();
  });

  it('descarta líneas vacías', () => {
    const { participantes } = parseParticipantes('Ana\n\n\nBeto\n');
    expect(participantes).toHaveLength(2);
  });

  it('recorta espacios sobrantes', () => {
    const { participantes } = parseParticipantes('   Ana   ');
    expect(participantes[0].nombre).toBe('Ana');
  });
});

describe('parseParticipantes — duplicados', () => {
  it('cuenta duplicados por nombre normalizado sin eliminarlos', () => {
    const { participantes, duplicados } = parseParticipantes('Ana\nana\nBeto\nANA');
    expect(participantes).toHaveLength(4);
    expect(duplicados).toBe(1); // una clave (ana) con 3 ocurrencias -> 1 nombre repetido
  });

  it('sin duplicados el contador es 0', () => {
    const { duplicados } = parseParticipantes('Ana\nBeto\nCaro');
    expect(duplicados).toBe(0);
  });

  it('ids estables dentro de la misma sesión para nombres repetidos', () => {
    const { participantes } = parseParticipantes('Ana\nAna');
    expect(participantes[0].id).not.toBe(participantes[1].id);
  });
});

describe('quitarDuplicados', () => {
  it('conserva la primera ocurrencia de cada nombre', () => {
    const { participantes } = parseParticipantes('Ana,ana@correo.cl\nBeto\nana,ana2@correo.cl');
    const resultado = quitarDuplicados(participantes);
    expect(resultado).toHaveLength(2);
    expect(resultado[0].correo).toBe('ana@correo.cl');
  });
});

describe('parseParticipantes — límite de 5.000 líneas', () => {
  it('no trunca listas de 5.000 líneas o menos', () => {
    const texto = Array.from({ length: LIMITE_LINEAS }, (_, i) => `P${i}`).join('\n');
    const { participantes, truncado, totalLineas } = parseParticipantes(texto);
    expect(truncado).toBe(false);
    expect(participantes).toHaveLength(LIMITE_LINEAS);
    expect(totalLineas).toBe(LIMITE_LINEAS);
  });

  it('trunca listas de más de 5.000 líneas y avisa el total real', () => {
    const texto = Array.from({ length: LIMITE_LINEAS + 250 }, (_, i) => `P${i}`).join('\n');
    const { participantes, truncado, totalLineas } = parseParticipantes(texto);
    expect(truncado).toBe(true);
    expect(participantes).toHaveLength(LIMITE_LINEAS);
    expect(totalLineas).toBe(LIMITE_LINEAS + 250);
  });
});

describe('parseParticipantes — pegado desde Excel', () => {
  it('columnas separadas por tabulación con saltos de línea \\r\\n', () => {
    const texto = 'Ana\tana@correo.cl\t+56911111111\r\nBeto\tbeto@correo.cl\r\nCaro';
    const { participantes } = parseParticipantes(texto);
    expect(participantes).toHaveLength(3);
    expect(participantes[0]).toMatchObject({
      nombre: 'Ana',
      correo: 'ana@correo.cl',
      fono: '+56911111111',
    });
    expect(participantes[1]).toMatchObject({ nombre: 'Beto', correo: 'beto@correo.cl' });
    expect(participantes[2].nombre).toBe('Caro');
  });

  it('celdas vacías de Excel (tabulaciones consecutivas) no rompen el parseo', () => {
    const texto = 'Ana\t\tana@correo.cl\r\nBeto\t\t';
    const { participantes } = parseParticipantes(texto);
    expect(participantes[0].nombre).toBe('Ana');
    expect(participantes[0].correo).toBe('ana@correo.cl');
    expect(participantes[1].nombre).toBe('Beto');
  });
});

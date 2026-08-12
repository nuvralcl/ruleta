# Tómbola — contexto del proyecto

App de sorteos en vivo con ruleta gráfica, efectos y sonido. Corre 100% en el
navegador, se sirve como sitio estático y se despliega en Dokploy.

Antes de escribir código lee `docs/ESPECIFICACION.md`. El trabajo se toma de
`docs/PLAN.md`, **una tarea por sesión**.

---

## Stack

| Qué | Decisión | Por qué |
|---|---|---|
| Build | Vite + TypeScript (sin framework) | Salida estática, sin runtime extra; TS para que el núcleo sea testeable |
| UI | DOM + Canvas 2D a mano | La ruleta y el confeti son canvas; un framework no aporta nada acá |
| Audio | Web Audio API sintetizada | Cero archivos que precargar; funciona offline |
| Tests | Vitest | Solo sobre `src/nucleo/` |
| Deploy | Docker multi-stage → nginx → Dokploy | Imagen chica, sin backend |

**Sin dependencias de UI.** No agregar React, Vue, Tailwind, jQuery, librerías
de confeti ni de ruleta. Si una tarea parece necesitar una dependencia nueva,
detente y pregunta antes de instalarla.

## Estructura

```
src/
  main.ts               punto de entrada: arma la app y conecta las piezas
  nucleo/               LÓGICA PURA — sin DOM, sin audio, sin timers
    tipos.ts            Participante, Ganador, Config, Ronda
    azar.ts             fuente de azar inyectable (crypto | semilla)
    participantes.ts    parseo, normalización, deduplicación
    motor.ts            pozo, selección, modalidades, estado de ronda
    acta.ts             hash de la lista + semilla (verificabilidad)
  vista/                todo lo que toca el DOM
    ruleta.ts  confeti.ts  marquesina.ts  anuncio.ts  panel.ts  historial.ts
  audio/sintetizador.ts
  almacenamiento/local.ts
  estilos/  tokens.css  base.css  componentes.css
tests/                  espejo de src/nucleo/
docs/                   ESPECIFICACION.md  PLAN.md  PRIVACIDAD.md
```

**Regla de oro:** `src/nucleo/` no importa nada de `vista/`, `audio/` ni
`almacenamiento/`, y nunca toca `window`, `document` ni `crypto` directamente
(el azar entra por parámetro). Es lo que hace posible testear la equidad del
sorteo sin navegador.

## Convenciones

- **Idioma:** código, comentarios, commits y UI en español. Sin `Winner`,
  `spinWheel` ni mezclas: `ganador`, `girarRuleta`.
- **Commits:** Conventional Commits en español — `feat(motor): modo uno a la vez`.
  Un commit por tarea del plan, mencionando el ID: `feat(ruleta): modo disco (T2.1)`.
- **CSS:** variables en `tokens.css`, nunca colores hardcodeados en componentes.
  Cuidado con la especificidad entre selectores de sección y de elemento.
- **Nada de `any`.** `strict: true` en tsconfig.
- **Sin datos personales en logs, URLs ni mensajes de error** (ver `docs/PRIVACIDAD.md`).

## Comandos

```bash
npm run dev        # servidor local
npm run build      # dist/
npm run preview    # revisar el build
npm test           # Vitest
npm run check      # tsc --noEmit + eslint + vitest run   ← debe pasar antes de commitear
docker compose up --build   # probar la imagen real en :8080
```

## Definición de "terminado"

Una tarea está lista cuando:
1. `npm run check` pasa sin errores ni warnings.
2. Todos los criterios de aceptación de la tarea están cumplidos.
3. Se probó a mano en ventana angosta (390px) y ancha.
4. Nada de fases posteriores quedó a medio implementar.

## Cómo trabajar

- Empieza cada tarea en **plan mode**: lee los archivos involucrados, propone el
  plan, espera aprobación, recién ahí escribe.
- **Una tarea por sesión**, luego `/clear`. No encadenes tareas sin revisión.
- No implementes cosas de fases futuras "de paso". Si ves algo que falta,
  anótalo en `docs/PLAN.md` bajo *Pendientes detectados* y sigue.
- Si una decisión marcada `DECISIÓN PENDIENTE` en el plan bloquea la tarea,
  pregunta en vez de asumir.
- La demo original está en `referencia/demo.html`: sirve como fuente del diseño
  visual y de los algoritmos, no como código a copiar tal cual.

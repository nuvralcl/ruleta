---
description: Revisa el trabajo de la última tarea antes de commitear
---

Revisa los cambios sin commitear (`git diff`) contra:

- Los criterios de aceptación de la tarea en `docs/PLAN.md`.
- Las reglas de `CLAUDE.md`: nada de dependencias de UI nuevas, `src/nucleo/` sin
  DOM, español en código y commits, colores solo en `tokens.css`, sin `any`.
- `docs/PRIVACIDAD.md`: ningún dato personal en logs, URLs ni mensajes de error.
- Casos borde de la sección 3 de `docs/ESPECIFICACION.md`.

Lista los hallazgos por severidad y arregla solo los que sean de esta tarea.

---
description: Ejecuta una tarea del plan (ej. /tarea T1.1)
---

Vas a ejecutar la tarea **$ARGUMENTS** de `docs/PLAN.md`.

1. Lee `CLAUDE.md`, `docs/ESPECIFICACION.md` y la tarea $ARGUMENTS completa en `docs/PLAN.md`.
2. Lee los archivos que vas a tocar antes de proponer nada.
3. Presenta el plan y **espera aprobación**. No escribas archivos todavía.
4. Al implementar, cumple los criterios de aceptación uno por uno.
5. Corre `npm run check`. Si falla, arréglalo antes de seguir.
6. Marca la tarea como ✅ en `docs/PLAN.md` y anota lo que hayas detectado y no
   corresponda a esta tarea bajo "Pendientes detectados".
7. Commit único: `tipo(alcance): descripción ($ARGUMENTS)`.

Si algo marcado como DECISIÓN PENDIENTE bloquea la tarea, pregunta en vez de asumir.

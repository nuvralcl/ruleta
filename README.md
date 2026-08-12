# Tómbola

App de sorteos en vivo con ruleta gráfica, efectos y sonido. Sitio estático,
sin backend. Ver `CLAUDE.md` y `docs/ESPECIFICACION.md` para el contexto
completo del proyecto.

## Comandos

```bash
npm run dev        # servidor local
npm run build      # dist/
npm run preview    # revisar el build
npm test           # Vitest
npm run check      # tsc --noEmit + eslint + vitest run   ← debe pasar antes de commitear
docker compose up --build   # probar la imagen real en :8080
```

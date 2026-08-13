# Servidor de estadísticas — Tómbola

Backend chico y aparte de la tombola: guarda conteos anónimos de uso
(`ronda_iniciada`, `giro` — nunca nombres, correos ni teléfonos) y expone un
dashboard con contraseña. Node + TypeScript, cero dependencias de runtime.

Ver `docs/DEPLOY.md` (raíz del repo) para desplegarlo, y `docs/PRIVACIDAD.md`
para las reglas de privacidad que este servicio tiene que cumplir (sobre todo:
nunca loguear IPs de origen).

## Comandos

```bash
npm install
npm run build   # compila src/ a dist/
npm start       # corre dist/servidor.js
npm run dev     # tsc --watch, para desarrollo
```

## Variables de entorno

| Variable | Para qué | Por defecto |
|---|---|---|
| `PORT` | Puerto donde escucha | `3000` |
| `DASHBOARD_USUARIO` / `DASHBOARD_CLAVE` | Credenciales del `/dashboard` (Basic Auth) | vacío — sin esto, el dashboard rechaza cualquier acceso |
| `ORIGEN_PERMITIDO` | Origen permitido para `POST /eventos` (CORS) | `https://ruleta.nuvral.cl` |
| `ARCHIVO_DATOS` | Ruta del archivo NDJSON donde se guardan los eventos | `./datos/eventos.ndjson` |

## Rutas

- `POST /eventos` — recibe `{ tipo: 'ronda_iniciada', participantes, modo, repeticion }` o `{ tipo: 'giro' }`. Cualquier otro campo se ignora, nunca se persiste.
- `GET /dashboard` — HTML con las métricas agregadas, protegido con Basic Auth.
- `GET /salud` — `200 ok`, sin auth, para healthchecks.

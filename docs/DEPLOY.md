# Despliegue

La tombola en sí es un sitio estático: se construye con Vite y se sirve con
nginx dentro de un contenedor Docker, sin backend ni base de datos. Aparte,
`servidor-estadisticas/` es un segundo servicio (opcional) que se despliega
como otra aplicación en Dokploy — ver la sección al final de este documento.

## Probar la imagen localmente

```bash
docker compose up --build
```

Sirve la app en <http://localhost:8080>. `docker-compose.yml` solo mapea el
puerto 8080 al 80 del contenedor; no hay volúmenes ni variables de entorno que
configurar.

Para revisar el tamaño de la imagen:

```bash
docker images tombola
```

Debería quedar bajo 60 MB (nginx:1.27-alpine ya pesa ~40 MB comprimido; los
archivos de `dist/` agregan menos de 100 KB).

## Desplegar la tombola en Dokploy

1. **Create → Application**, elegir el proveedor Git y la rama a desplegar
   (`master`).
2. **Build Type: Dockerfile** (usa el `Dockerfile` de la raíz del repo).
3. **Container Port: `80`** (el puerto que expone la imagen de nginx).
4. **Domains**: agregar el dominio y activar HTTPS con Let's Encrypt.
5. Si vas a usar el servidor de estadísticas (ver más abajo), agregar la
   variable de entorno de build **`VITE_URL_ESTADISTICAS`** apuntando a
   `https://stats.tudominio/eventos`. Sin esta variable, la tombola
   simplemente no manda ningún evento — no es obligatoria.
6. **Deploy**.
7. Activar **Auto Deploy** para que cada push a `master` redespliegue solo.

Sin base de datos, sin migraciones. El build de Dokploy es el mismo
Dockerfile multi-stage que se prueba localmente con `docker compose up
--build`.

## Cache y cabeceras

`nginx.conf` ya deja configurado:

- `Cache-Control: no-cache` en `index.html` (para que un despliegue nuevo se
  note sin tener que purgar caché del navegador).
- `Cache-Control: public, max-age=31536000, immutable` en `assets/` (los
  archivos de Vite llevan hash en el nombre, así que cachearlos "para
  siempre" es seguro).
- gzip para texto, CSS, JS, JSON y SVG.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy`.

## Servidor de estadísticas (`servidor-estadisticas/`, opcional)

Backend chico y aparte que guarda conteos anónimos de uso y expone un
dashboard con contraseña. No es necesario para que la tombola funcione — si
no se configura `VITE_URL_ESTADISTICAS` en el build de la tombola, este
servicio simplemente no recibe nada.

### Probar localmente

```bash
cd servidor-estadisticas
npm install
npm run build
DASHBOARD_USUARIO=admin DASHBOARD_CLAVE=una-clave-larga node dist/servidor.js
```

- `POST http://localhost:3000/eventos` — recibe los conteos.
- `GET http://localhost:3000/dashboard` — pide usuario/clave (Basic Auth).
- `GET http://localhost:3000/salud` — sin auth, para healthchecks.

### Desplegar en Dokploy (como aplicación aparte)

1. **Create → Application**, mismo repositorio, mismo proveedor Git.
2. **Build Type: Dockerfile**, apuntando el contexto/build al subdirectorio
   `servidor-estadisticas/` (si el panel no deja elegir subdirectorio,
   revisar la opción de "build path" o "Docker context path" — depende de
   la versión de Dokploy).
3. **Container Port: `3000`**.
4. **Variables de entorno**:
   - `DASHBOARD_USUARIO` / `DASHBOARD_CLAVE` — credenciales del panel.
   - `ORIGEN_PERMITIDO` — el origen exacto de la tombola en producción, ej.
     `https://ruleta.nuvral.cl` (sin barra final). Sin esto, el navegador
     bloquea el `POST /eventos` por CORS.
5. **Domain**: por ejemplo `stats.nuvral.cl`, con HTTPS.
6. **Volumen persistente**: montar un volumen en `/app/datos` — **si el plan
   de Dokploy no soporta volúmenes persistentes, cada redeploy borra el
   historial guardado.** Confirmar esto en el panel antes de asumir que las
   estadísticas se acumulan entre despliegues.
7. En la app de la **tombola**, agregar `VITE_URL_ESTADISTICAS=https://stats.nuvral.cl/eventos`
   como variable de build y volver a desplegarla.

## Verificación pendiente

Esta configuración se armó y se revisó a mano (Dockerfile, `nginx.conf`,
`docker-compose.yml`), pero **no se pudo ejecutar `docker compose up --build`
en esta máquina porque no tiene Docker instalado**. Antes de dar T0.3 por
completamente cerrada, correr una vez:

```bash
docker compose up --build
curl -I http://localhost:8080/
docker images tombola   # confirmar < 60 MB
```

y confirmar que la página carga y que las cabeceras de cache/seguridad
aparecen en la respuesta.

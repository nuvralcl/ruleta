# Despliegue

La app es un sitio estático. Se construye con Vite y se sirve con nginx dentro
de un contenedor Docker; no hay backend ni base de datos.

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

## Desplegar en Dokploy

1. **Create → Application**, elegir el proveedor Git y la rama a desplegar
   (`master`).
2. **Build Type: Dockerfile** (usa el `Dockerfile` de la raíz del repo, no
   necesita configuración adicional — no hay variables de entorno).
3. **Container Port: `80`** (el puerto que expone la imagen de nginx).
4. **Domains**: agregar el dominio y activar HTTPS con Let's Encrypt.
5. **Deploy**.
6. Activar **Auto Deploy** para que cada push a `master` redespliegue solo.

No hay pasos extra: sin base de datos, sin variables de entorno, sin
migraciones. El build de Dokploy es el mismo Dockerfile multi-stage que se
prueba localmente con `docker compose up --build`.

## Cache y cabeceras

`nginx.conf` ya deja configurado:

- `Cache-Control: no-cache` en `index.html` (para que un despliegue nuevo se
  note sin tener que purgar caché del navegador).
- `Cache-Control: public, max-age=31536000, immutable` en `assets/` (los
  archivos de Vite llevan hash en el nombre, así que cachearlos "para
  siempre" es seguro).
- gzip para texto, CSS, JS, JSON y SVG.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy`.

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

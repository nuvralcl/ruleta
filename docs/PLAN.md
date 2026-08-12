# Plan de trabajo — Tómbola

Backlog ordenado. **Una tarea por sesión de Claude Code**, en plan mode, con un
commit al cerrar. No saltarse el orden dentro de una fase; las fases 3 en
adelante sí se pueden reordenar según lo que necesites primero.

Leyenda: `⬜ pendiente` · `🟨 en curso` · `✅ listo`

---

## Fase 0 — Andamiaje (bloquea todo lo demás)

### ✅ T0.1 — Esqueleto del proyecto

**Objetivo:** repo que compila, testea y lintea desde el primer commit.

**Criterios de aceptación**
- [x] Vite + TypeScript `strict`, sin framework ni dependencias de UI.
- [x] Vitest configurado, con un test trivial que pasa.
- [x] ESLint + Prettier; `npm run check` = `tsc --noEmit && eslint . && vitest run`.
- [x] Carpetas de `CLAUDE.md` creadas, cada una con su `.gitkeep` o índice.
- [x] `.gitignore`, `README.md` con los comandos.
- [x] `npm run build` genera `dist/` sin warnings.

> **Prompt:** Lee CLAUDE.md y docs/ESPECIFICACION.md. Ejecuta la tarea T0.1 de docs/PLAN.md: arma el esqueleto Vite + TypeScript strict + Vitest + ESLint + Prettier con la estructura de carpetas descrita, sin agregar dependencias de UI. Muéstrame el plan antes de escribir archivos.

---

### ✅ T0.2 — Portar la demo a la estructura modular

**Objetivo:** la demo de un archivo pasa a módulos tipados, **sin cambiar nada
de lo que se ve ni de lo que hace**. Es una refactorización, no un rediseño.

**Archivos:** todo `src/`, tomando `referencia/demo.html` como fuente.

**Criterios de aceptación**
- [x] Los estilos quedan en `estilos/tokens.css` (todas las variables), `base.css`
      y `componentes.css`. Ningún color literal fuera de `tokens.css`.
- [x] `nucleo/motor.ts` y `nucleo/participantes.ts` no importan nada del DOM.
- [x] `nucleo/azar.ts` expone `type Azar = (n: number) => number` y una
      implementación con `crypto` sin sesgo de módulo.
- [x] `vista/ruleta.ts` recibe el canvas y el pozo; no lee el estado global.
- [x] `audio/sintetizador.ts` encapsula el `AudioContext` perezoso y el silencio.
- [x] La app se ve y suena idéntica a la demo. Verificar a ojo, lado a lado.
- [x] Cero `any`, cero variables globales sueltas.

> **Prompt:** Ejecuta T0.2: porta referencia/demo.html a la estructura modular de CLAUDE.md sin cambiar comportamiento ni diseño. Es refactor puro: si encuentras bugs, anótalos en docs/PLAN.md bajo "Pendientes detectados" en vez de arreglarlos. Plan primero.

---

### 🟨 T0.3 — Docker y despliegue en Dokploy

**Objetivo:** el sitio construido corre en nginx y queda publicado.

**Criterios de aceptación**
- [x] Dockerfile multi-stage: `node:22-alpine` construye, `nginx:1.27-alpine` sirve.
- [x] `nginx.conf` con gzip, `try_files`, cache largo para assets con hash y
      `no-cache` para `index.html`, más cabeceras `X-Content-Type-Options`,
      `X-Frame-Options`, `Referrer-Policy`.
- [ ] `docker compose up --build` sirve la app en `:8080`. **Sin verificar:**
      esta máquina no tiene Docker instalado.
- [ ] Imagen final bajo 60 MB (`docker images`). **Sin verificar**, mismo motivo.
- [x] `docs/DEPLOY.md` con los pasos de Dokploy (pendiente confirmar en un
      panel real de Dokploy, ver nota abajo).

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

**Pasos en Dokploy** (para el humano, no para Claude Code): Create → Application
→ proveedor Git y rama → Build Type **Dockerfile** → Container Port `80` →
Domains: dominio + HTTPS con Let's Encrypt → Deploy. Activar Auto Deploy para
redesplegar en cada push.

> **Prompt:** Ejecuta T0.3: Dockerfile multi-stage, nginx.conf de producción, docker-compose para pruebas locales y docs/DEPLOY.md con los pasos de Dokploy. Verifica el tamaño final de la imagen.

---

## Fase 1 — Núcleo confiable

### ✅ T1.1 — Motor de sorteo con tests

**Objetivo:** que las modalidades sean lógica probada, no condicionales
esparcidos por la UI.

**Archivos:** `src/nucleo/motor.ts`, `tests/motor.test.ts`

**Criterios de aceptación**
- [x] `crearRonda(config)`, `girar(estado, azar)` y `pozoDe(estado)` como
      funciones puras: reciben estado, devuelven estado nuevo.
- [x] Tests que cubren, con azar inyectado y determinista:
      lote de 1/2/3/N · continuo sin límite · sin repetir vacía el pozo ·
      con repetición permite ganador repetido · pozo de 1 · pozo vacío ·
      lote de 5 con 3 disponibles cierra la ronda antes ·
      editar la lista a mitad de ronda conserva el historial.
- [x] Test de equidad: con azar falso que devuelve `k`, gana el elemento `k`.
- [x] Test estadístico: 60.000 giros sobre 6 participantes, cada uno entre 15% y
      18,3%. Con semilla fija para que no sea intermitente.
- [x] Cobertura de `motor.ts` en 100%. El umbral global de 90% sobre
      `src/nucleo/` se cumple desde T1.3 (99.21% con `npm run coverage`, una
      vez que `participantes.ts` y `azar.ts` tuvieron sus propios tests).

> **Prompt:** Ejecuta T1.1: extrae el motor de sorteo a funciones puras en src/nucleo/motor.ts y escribe la batería de tests de docs/PLAN.md, incluyendo los casos borde de la sección 3 de la especificación. El azar entra siempre por parámetro.

---

### ✅ T1.2 — Parser de participantes robusto

**Criterios de aceptación**
- [x] Separadores coma, punto y coma, tabulación y 3+ espacios.
- [x] Campos entre comillas se respetan: `"Pérez, Ana", ana@correo.cl` es un nombre.
- [x] Detección de correo y teléfono en cualquier posición después del nombre.
- [x] Normalización para comparar (minúsculas, sin tildes, espacios colapsados).
- [x] Contador de duplicados + acción "Quitar repetidos" que conserva el primero.
- [x] Corte en 5.000 líneas con aviso claro, sin congelar la pestaña.
- [x] Tests con lista pegada desde Excel (tabulaciones y `\r\n`).

> **Prompt:** Ejecuta T1.2 según la sección 2 de docs/ESPECIFICACION.md, con tests para cada regla de parseo incluyendo el pegado desde Excel.

---

### ✅ T1.3 — Azar auditable

**Objetivo:** poder repetir un sorteo y demostrar que dio lo mismo.

**Criterios de aceptación**
- [x] `azarCripto()` por defecto, sin sesgo de módulo (rechazo de valores altos).
- [x] `azarConSemilla(semilla)` determinista (mulberry32) para tests y para el
      modo "sorteo reproducible".
- [x] La ronda registra la semilla usada y la lista de participantes con la que
      se abrió (`EstadoRonda.semilla` y `EstadoRonda.participantesIniciales`).
- [x] `nucleo/acta.ts`: hash SHA-256 (`crypto.subtle`) de la lista normalizada +
      semilla, mostrado en la UI como código corto (`#codigoActa`).
- [x] Test: misma semilla + misma lista ⇒ misma secuencia de ganadores.

> **Prompt:** Ejecuta T1.3: azar auditable con semilla, sin sesgo de módulo, y el hash de acta en src/nucleo/acta.ts. Explícame en el resumen final cómo un tercero verificaría un sorteo.

---

## Fase 2 — Experiencia en vivo

### ✅ T2.1 — Ruleta que aguanta listas grandes
- [x] ≤46: nombres. 47–200: segmentos sin texto. >200: modo disco con contador.
- [x] 1.000 participantes mantienen 60 fps en el giro (medido con
      `performance.now()` sobre los timestamps de `requestAnimationFrame`
      durante un giro real en el navegador: ~59-60 fps promedio con 200 y con
      1.000 participantes).
- [x] El pozo no se redibuja completo en cada frame si no cambió: los
      segmentos (o los anillos del modo disco) se dibujan una vez en un
      canvas fuera de pantalla (`capaRotable` en `vista/ruleta.ts`) y cada
      frame solo se rota y se pega con `drawImage`.

### ✅ T2.2 — Modo proyección
- [x] Tecla `F` o botón: oculta el panel, ruleta centrada al máximo, tipografía
      del anuncio escalada a la altura de la ventana (`vista/proyeccion.ts`).
- [x] Funciona con `requestFullscreen` y también sin él (si la API no existe o
      la promesa rechaza, el modo proyección por CSS igual queda activo).
- [x] Título del sorteo editable, visible en modo proyección (vive fuera de
      `.panel`, que es lo único que se oculta).

### ✅ T2.3 — Accesibilidad y teclado
- [x] Barra espaciadora gira, salvo con foco en un campo de texto (probado con
      foco en textarea/input/select/botón).
- [x] Trampa de foco en el anuncio, `Esc` cierra, foco vuelve al botón
      (`vista/anuncio.ts`, un solo elemento enfocable dentro del modal).
- [x] `aria-live="polite"` anuncia "Ganó &lt;nombre&gt;"; contraste AA
      verificado con la fórmula de WCAG 2 sobre texto `#1c1140` en los 4 tonos:
      `#ff6b6b` 6.29:1 · `#4ecdc4` 9.02:1 · `#ffd166` 12.10:1 · `#a78bfa`
      6.41:1 — los cuatro pasan el mínimo de 4.5:1.
- [x] `prefers-reduced-motion` acorta el giro a 0,9s sin confeti (`main.ts`) y
      apaga la animación de las ampolletas y la vibración de la aguja (media
      query en `componentes.css`).

Ya venía implementado desde el port de T0.2 (la demo seguía la sección 7 de
la especificación desde el principio); esta tarea fue sobre todo verificar
cada punto, más el cálculo formal de contraste.

### ✅ T2.4 — Marca del organizador
- [x] Logo (PNG/SVG) al centro de la ruleta, subido desde el equipo
      (`<input type="file">` + `URL.createObjectURL`, dibujado recortado en
      círculo sobre la capa rotable, sin rotar).
- [x] Color de acento configurable (`<input type="color">` escribe
      `--color-acento`); el resto de la paleta no depende de él y sigue igual
      — botón, marquesina y ticket lo toman solos vía CSS, el canvas usa
      `ruleta.establecerColorAcento`.
- [x] La imagen se queda en memoria: se verificó con `read_network_requests`
      que solo se lee el `blob:` local, no sale ninguna petición externa.
      `URL.revokeObjectURL` libera el blob anterior al cambiar o quitar el logo.

---

## Fase 3 — Datos

### ✅ T3.1 — Guardar y recuperar
- [x] Listas con nombre y historial de rondas en `localStorage`
      (`src/almacenamiento/local.ts`, claves `tombola:listas` y
      `tombola:historial`). Solo se guardan nombres — nunca correo ni
      teléfono, ver `docs/PRIVACIDAD.md` y la decisión #6 de este plan.
- [x] Aviso visible junto a "Listas guardadas": "Estos datos quedan guardados
      en este navegador; no se suben a ningún servidor."
- [x] Botón "Borrar todos los datos" (con confirmación) que borra ambas
      claves de `localStorage` de verdad — probado en el navegador.
- [x] Manejo de cuota llena: `guardarLista`/`agregarAlHistorial` devuelven
      `false` si `localStorage.setItem` falla (try/catch), y la UI muestra un
      aviso en vez de romperse.

### 🟨 T3.2 — Importar y exportar
- [ ] ~~Importar CSV y XLSX~~ — **DECISIÓN TOMADA (2026-08-12): por ahora no.**
      El usuario pidió quedarse solo con pegado a mano por el momento, así que
      no se instaló SheetJS ni ninguna otra dependencia. Queda para retomar
      cuando haga falta.
- [ ] ~~Selector de columna para nombre / correo / teléfono~~ — depende de la
      importación de archivos, queda pendiente junto con el punto anterior.
- [x] Exportar ganadores a CSV y JSON (`vista/historial.ts`:
      `exportarHistorialCSV` / `exportarHistorialJSON`, botones en el panel).
      Sin dependencias nuevas — `Blob` + `<a download>`. Incluye correo/fono
      del ganador si el organizador los pegó (a diferencia de lo que se
      guarda en `localStorage`, que nunca los incluye).

### ⬜ T3.3 — Tickets por participante
- [ ] Sintaxis `Nombre, correo, x3` o columna de tickets al importar.
- [ ] Selección por peso acumulado, con test estadístico de proporción.
- [ ] La ruleta refleja el peso en el ancho del segmento.

### ⬜ T3.4 — Premios por puesto
- [ ] Lista de premios editable; el anuncio muestra el premio del puesto.
- [ ] Los premios salen en el CSV y en el acta.

---

## Fase 4 — Confianza

### ⬜ T4.1 — Privacidad (ver `docs/PRIVACIDAD.md`)
- [ ] Aviso de privacidad accesible desde el pie.
- [ ] Minimización: no persistir correo ni teléfono salvo que el organizador lo
      active explícitamente (casilla desmarcada por defecto).
- [ ] Borrado efectivo y exportación de datos en formato estructurado.
- [ ] Cero datos personales en logs, URLs o mensajes de error.

### ⬜ T4.2 — Acta del sorteo
- [ ] Vista imprimible: fecha, título, cantidad de participantes, hash de la
      lista, semilla, modalidad y ganadores en orden.
- [ ] Descarga en PDF vía impresión del navegador (sin dependencias).

---

## Fase 5 — Backend (no empezar sin decidir)

**DECISIÓN PENDIENTE:** solo tiene sentido si necesitas inscripción online o
sorteos auditables por terceros. Duplica el costo de operación y activa de
lleno las obligaciones de la Ley 21.719 (ver `docs/PRIVACIDAD.md`).

Boceto: API en Node + Postgres en Dokploy · formulario público de inscripción
con consentimiento registrado · panel del organizador · link público de
verificación del acta · borrado automático por retención.

---

## Decisiones pendientes

| # | Pregunta | Por defecto si no se decide |
|---|---|---|
| 1 | ¿Cuántos participantes como máximo? | Se optimiza hasta 1.000 (T2.1) |
| 2 | ¿De dónde salen los datos? | Pegado a mano; CSV/XLSX en T3.2 |
| 3 | ¿El sorteo debe ser verificable por terceros? | Sí, pero local (acta T4.2), sin backend |
| 4 | ¿Marca propia? | Paleta actual; logo configurable en T2.4 |
| 5 | ¿Premios distintos por puesto? | Sí, T3.4 |
| 6 | ¿Se guardan correos y teléfonos? | No se persisten; solo se muestran en la sesión |

## Pendientes detectados

_Claude Code anota acá lo que encuentre y no corresponda arreglar en la tarea en curso._

- (T0.2) `main.ts` arranca con una lista de participantes de ejemplo precargada
  (la misma de `referencia/demo.html`), para portar el comportamiento tal cual.
  Antes de ir a producción real habría que decidir si el organizador debe ver
  la textarea vacía en el primer uso.
- (T0.2) `nucleo/motor.ts` ya quedó con la forma de estado puro que pedía T1.1
  (`crearRonda`, `girar(estado, azar, ahora)`, `pozoDe(estado)`) en vez de la
  versión más simple de la demo, para no reescribirlo dos veces.
- (T1.3) `crearRonda` ya acepta una `semilla` y `main.ts` ya elige entre
  `azarCripto`/`azarConSemilla` según `estado.semilla`, pero no hay ningún
  control en la UI para que el organizador abra una ronda en "modo
  reproducible" — hoy `semilla` siempre es `null` (modo criptográfico normal).
  Falta decidir dónde va ese control (¿T4.2, junto al acta imprimible?).
- (T3.1) El historial que se ve en pantalla (`historial.renderizar`) es solo
  el de la ronda actual en memoria; se pierde al recargar la página aunque
  `agregarAlHistorial` ya lo guardó en `localStorage`. No hay ninguna vista
  que muestre el historial guardado entre sesiones — probablemente el lugar
  natural es T4.2 (acta del sorteo) o una vista propia de "historial
  completo".
- (T0.3) **Docker sin instalar en esta máquina** — no se pudo correr
  `docker compose up --build` ni medir el tamaño de la imagen. El Dockerfile,
  `nginx.conf` y `docker-compose.yml` están escritos y revisados a mano, y el
  contenido de `dist/` se probó funcionalmente sirviéndolo con un servidor
  estático (sin nginx real). Falta: correr el build de Docker una vez donde
  haya Docker disponible (o directamente en el primer deploy de Dokploy) y
  confirmar tamaño de imagen y cabeceras de `nginx.conf` en una respuesta real.

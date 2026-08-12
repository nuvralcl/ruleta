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

### ⬜ T0.3 — Docker y despliegue en Dokploy

**Objetivo:** el sitio construido corre en nginx y queda publicado.

**Criterios de aceptación**
- [ ] Dockerfile multi-stage: `node:22-alpine` construye, `nginx:1.27-alpine` sirve.
- [ ] `nginx.conf` con gzip, `try_files`, cache largo para assets con hash y
      `no-cache` para `index.html`, más cabeceras `X-Content-Type-Options`,
      `X-Frame-Options`, `Referrer-Policy`.
- [ ] `docker compose up --build` sirve la app en `:8080`.
- [ ] Imagen final bajo 60 MB (`docker images`).
- [ ] `docs/DEPLOY.md` con los pasos de Dokploy verificados en el panel real.

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

### ⬜ T1.1 — Motor de sorteo con tests

**Objetivo:** que las modalidades sean lógica probada, no condicionales
esparcidos por la UI.

**Archivos:** `src/nucleo/motor.ts`, `tests/motor.test.ts`

**Criterios de aceptación**
- [ ] `crearRonda(config)`, `girar(estado, azar)` y `pozoDe(estado)` como
      funciones puras: reciben estado, devuelven estado nuevo.
- [ ] Tests que cubren, con azar inyectado y determinista:
      lote de 1/2/3/N · continuo sin límite · sin repetir vacía el pozo ·
      con repetición permite ganador repetido · pozo de 1 · pozo vacío ·
      lote de 5 con 3 disponibles cierra la ronda antes ·
      editar la lista a mitad de ronda conserva el historial.
- [ ] Test de equidad: con azar falso que devuelve `k`, gana el elemento `k`.
- [ ] Test estadístico: 60.000 giros sobre 6 participantes, cada uno entre 15% y
      18,3%. Con semilla fija para que no sea intermitente.
- [ ] Cobertura de `src/nucleo/` sobre 90%.

> **Prompt:** Ejecuta T1.1: extrae el motor de sorteo a funciones puras en src/nucleo/motor.ts y escribe la batería de tests de docs/PLAN.md, incluyendo los casos borde de la sección 3 de la especificación. El azar entra siempre por parámetro.

---

### ⬜ T1.2 — Parser de participantes robusto

**Criterios de aceptación**
- [ ] Separadores coma, punto y coma, tabulación y 3+ espacios.
- [ ] Campos entre comillas se respetan: `"Pérez, Ana", ana@correo.cl` es un nombre.
- [ ] Detección de correo y teléfono en cualquier posición después del nombre.
- [ ] Normalización para comparar (minúsculas, sin tildes, espacios colapsados).
- [ ] Contador de duplicados + acción "Quitar repetidos" que conserva el primero.
- [ ] Corte en 5.000 líneas con aviso claro, sin congelar la pestaña.
- [ ] Tests con lista pegada desde Excel (tabulaciones y `\r\n`).

> **Prompt:** Ejecuta T1.2 según la sección 2 de docs/ESPECIFICACION.md, con tests para cada regla de parseo incluyendo el pegado desde Excel.

---

### ⬜ T1.3 — Azar auditable

**Objetivo:** poder repetir un sorteo y demostrar que dio lo mismo.

**Criterios de aceptación**
- [ ] `azarCripto()` por defecto, sin sesgo de módulo (rechazo de valores altos).
- [ ] `azarConSemilla(semilla)` determinista (mulberry32) para tests y para el
      modo "sorteo reproducible".
- [ ] La ronda registra la semilla usada y la lista de participantes con la que
      se abrió.
- [ ] `nucleo/acta.ts`: hash SHA-256 (`crypto.subtle`) de la lista normalizada +
      semilla, mostrado en la UI como código corto.
- [ ] Test: misma semilla + misma lista ⇒ misma secuencia de ganadores.

> **Prompt:** Ejecuta T1.3: azar auditable con semilla, sin sesgo de módulo, y el hash de acta en src/nucleo/acta.ts. Explícame en el resumen final cómo un tercero verificaría un sorteo.

---

## Fase 2 — Experiencia en vivo

### ⬜ T2.1 — Ruleta que aguanta listas grandes
- [ ] ≤46: nombres. 47–200: segmentos sin texto. >200: modo disco con contador.
- [ ] 1.000 participantes mantienen 60 fps en el giro (medir con Performance).
- [ ] El pozo no se redibuja completo en cada frame si no cambió (cachear en
      canvas fuera de pantalla y solo rotar).

### ⬜ T2.2 — Modo proyección
- [ ] Tecla `F` o botón: oculta el panel, ruleta centrada al máximo, tipografía
      del anuncio escalada a la altura de la ventana.
- [ ] Funciona con `requestFullscreen` y también sin él.
- [ ] Título del sorteo editable, visible en modo proyección.

### ⬜ T2.3 — Accesibilidad y teclado
- [ ] Barra espaciadora gira, salvo con foco en un campo de texto.
- [ ] Trampa de foco en el anuncio, `Esc` cierra, foco vuelve al botón.
- [ ] `aria-live` anuncia el ganador; contraste AA verificado en los 4 tonos.
- [ ] `prefers-reduced-motion` cubre giro, confeti y ampolletas.

### ⬜ T2.4 — Marca del organizador
- [ ] Logo (PNG/SVG) al centro de la ruleta, subido desde el equipo.
- [ ] Color de acento configurable; el resto de la paleta se deriva sola.
- [ ] La imagen se queda en memoria, no se sube a ningún servidor.

---

## Fase 3 — Datos

### ⬜ T3.1 — Guardar y recuperar
- [ ] Listas con nombre y historial de rondas en `localStorage`.
- [ ] Aviso visible de que los datos quedan en ese navegador.
- [ ] Botón "Borrar todos los datos" que deja el equipo limpio de verdad.
- [ ] Manejo de cuota llena sin romper la app.

### ⬜ T3.2 — Importar y exportar
- [ ] Importar CSV y XLSX (evaluar SheetJS: **DECISIÓN PENDIENTE**, es la única
      dependencia que valdría la pena).
- [ ] Selector de columna para nombre / correo / teléfono.
- [ ] Exportar ganadores a CSV y JSON.

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

# Especificación funcional — Tómbola

## 1. Para qué existe

Sortear premios frente a un público (evento, transmisión, sala de clases, feria)
de forma que el resultado se vea y se escuche. El organizador pega una lista,
elige cómo quiere sortear y gira. La ruleta es el espectáculo; el resultado ya
está decidido por un generador criptográfico antes de la animación.

**Usuario:** quien organiza el sorteo, operando en un notebook conectado a un
proyector o compartiendo pantalla. No es un usuario técnico.

## 2. Participantes

### Entrada
Texto libre, un participante por línea. Los campos extra se separan con coma,
punto y coma o tabulación:

```
Camila Riquelme, camila.r@correo.cl, +56 9 8123 4455
Matías Sandoval, matias.sandoval@correo.cl
Fernanda Aguilar
+56 9 7744 1290
```

### Reglas de parseo
- El primer campo es el **nombre**. Si no hay más campos, la línea completa es
  el nombre (aunque sea un correo o un número: se muestra tal cual).
- De los campos restantes: el que valide como correo va a `correo`, el que
  valide como teléfono va a `fono`. El resto se ignora sin error.
- Líneas vacías se descartan. Los espacios sobrantes se recortan.
- **Duplicados:** se detectan por nombre normalizado (minúsculas, sin tildes,
  sin espacios dobles). No se eliminan solos: se avisa "3 nombres repetidos" con
  un botón "Quitar repetidos". Un duplicado puede ser intencional (más tickets).
- **Límite:** 5.000 líneas. Pasado eso, avisar y no procesar.

### Modelo

```ts
type Participante = {
  id: string          // estable dentro de la sesión
  nombre: string
  correo?: string
  fono?: string
  tickets: number     // 1 por defecto; F3 permite más (más chance)
}

type Ganador = Participante & {
  puesto: string      // "1er LUGAR" | "GANADOR 07"
  hora: Date
  ronda: number
}
```

## 3. Modalidades

Dos ejes independientes que se combinan libremente:

**Cantidad de ganadores por ronda:** 1, 2, 3 o N (input libre, 1–99).

**Modo de ronda**
| Modo | Comportamiento |
|---|---|
| `lote` (ronda cerrada) | La ronda saca exactamente N ganadores y termina. Cada giro entrega uno, con puestos ordinales (1er, 2do, 3er lugar). Al completarse, el botón vuelve a "Girar la ruleta" para abrir una ronda nueva. |
| `continuo` (uno a la vez) | Un ganador por giro, sin límite. El anuncio ofrece "Seguir sorteando" indefinidamente mientras quede gente. |

**Repetición**
| Opción | Comportamiento |
|---|---|
| `sin repetir` | El ganador sale del pozo y desaparece de la ruleta. Cuando el pozo se agota, el botón se deshabilita con el mensaje "No quedan participantes disponibles". |
| `con repetición` | Todos siguen en cada giro; la misma persona puede ganar dos veces. |

**Casos borde obligatorios**
- Pozo con 1 solo participante: gira y gana esa persona (no es error).
- Pozo vacío: botón deshabilitado, ruleta en estado vacío con instrucción.
- Ronda `lote` de 5 con solo 3 disponibles y sin repetir: entrega 3, cierra la
  ronda y avisa "La ronda terminó antes: se acabaron los participantes".
- Editar la lista a mitad de ronda: los ganadores ya salidos se mantienen; el
  pozo se recalcula. Si un ganador desaparece de la lista, sigue en el historial.

## 4. Sorteo y equidad

1. Se calcula el pozo (participantes menos ganadores, si no hay repetición).
2. Se elige el índice ganador con `crypto.getRandomValues`, con rechazo de los
   valores que sesgarían el módulo.
3. Recién entonces se calcula el ángulo final para que la aguja caiga en ese
   segmento, más un desvío aleatorio dentro del segmento para que no se vea
   siempre centrado.

La animación **nunca** determina el ganador. Los tests deben verificarlo
inyectando un azar falso: si el azar devuelve 0, gana el primero del pozo.

Con tickets (F3), la selección es por peso acumulado, no por índice plano.

## 5. Ruleta

- Canvas 2D, cuadrada, responsiva, sensible a `devicePixelRatio` (tope 2).
- Colores rotando en 4 tonos; se corrige el choque cuando el último segmento
  quedaría del mismo color que el primero.
- **Nombres visibles hasta 46 segmentos.** Entre 47 y 200: segmentos sin texto.
  Sobre 200: modo disco — anillos de color y un contador central; el nombre
  ganador aparece solo en el anuncio (tarea T2.1).
- Giro: 5–7 vueltas, 5,2–6,1 s, easing `easeOutQuart`. Con
  `prefers-reduced-motion`, un giro corto de 0,9 s sin confeti.
- Aguja arriba (−π/2), vibra mientras gira.

## 6. Efectos y sonido

**Visual:** marco de 40 ampolletas que corren lento en reposo, rápido al girar y
quedan fijas encendidas 1,6 s al ganar. Confeti sobre canvas (170 piezas, con
gravedad y rotación). Tarjeta de anuncio tipo boleto troquelado con entrada en
rebote.

**Sonido** (Web Audio, sintetizado, nada de archivos):
| Evento | Sonido |
|---|---|
| Cada segmento bajo la aguja | Tic triangular, tono más agudo mientras más rápido, con tope de 24 ms entre tics |
| Durante el giro | Ruido en banda pasante barriendo de 1500 Hz a 180 Hz |
| Ganador | Arpegio de 7 notas desde do5 + golpe grave |

El contexto de audio se crea recién con el primer gesto del usuario (política de
autoplay). Botón de silencio siempre visible; el estado se recuerda.

## 7. Accesibilidad y calidad

- Responsive hasta 360 px de ancho.
- Foco visible en todo control; el anuncio atrapa el foco y se cierra con `Esc`.
- Barra espaciadora gira la ruleta cuando no hay foco en un campo de texto.
- El ganador se anuncia por `aria-live="polite"`.
- `prefers-reduced-motion` respetado en giro, confeti y ampolletas.
- Contraste mínimo AA en texto sobre segmentos.

## 8. Fuera de alcance en v1

Cuentas de usuario, inscripción online, sorteos multiusuario en tiempo real,
integración con redes sociales, y cualquier backend. Ver Fase 5 del plan.

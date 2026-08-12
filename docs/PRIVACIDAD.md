# Datos personales — Ley 21.719 (Chile)

La app trata **nombres, correos y teléfonos de personas en Chile**, así que la
Ley 21.719 aplica (vigente desde el 1 de diciembre de 2026). Esto es orientación
técnica, no asesoría legal: las decisiones de base de licitud y las cláusulas del
aviso deben validarse con quien vea lo legal.

## Qué datos toca la app

| Dato | Categoría | Dónde vive en v1 |
|---|---|---|
| Nombre | Personal común | Memoria del navegador |
| Correo | Personal común | Memoria del navegador |
| Teléfono | Personal común | Memoria del navegador |
| Logo del organizador | No personal | Memoria del navegador |

No hay datos sensibles, biométricos, de salud ni geolocalización. **Si en algún
momento se agrega RUT, fecha de nacimiento o datos de menores de 14, esta tabla
cambia y hay que rehacer el análisis antes de escribir el código.**

## Por qué v1 está en una posición cómoda

Todo el tratamiento ocurre en el navegador del organizador: la app no transmite
ni almacena datos en servidores. El sitio es estático, sin cookies, sin analytics
y sin terceros. Eso resuelve de entrada seguridad en tránsito, transferencia
internacional y buena parte del deber de seguridad. **La regla es no romper eso**:
cualquier tarea que agregue una llamada de red con datos de participantes deja de
ser una decisión técnica y pasa a requerir base de licitud y aviso.

## Reglas que el código debe cumplir

1. **Minimización (art. 3° c, 14 quáter).** El correo y el teléfono son
   opcionales: sirven para contactar al ganador, no para sortear. En T3.1 no se
   persisten salvo que el organizador active una casilla **desmarcada por
   defecto**. El resto de campos de una línea importada simplemente se descarta.
2. **Sin fugas por el costado (art. 14 quinquies).** Nada de nombres, correos ni
   teléfonos en `console.log`, en la URL, en el `title` de la pestaña, ni en
   mensajes de error. En producción el logging queda apagado.
3. **Borrado real (art. 7°).** "Borrar todos los datos" limpia `localStorage`,
   el estado en memoria y el historial. Sin borrado lógico oculto.
4. **Portabilidad (art. 9°).** La exportación va en CSV y JSON, formatos
   estructurados y de uso común.
5. **Transparencia (art. 14 ter).** Aviso de privacidad accesible desde el pie,
   en lenguaje simple: qué se trata, para qué, dónde queda, por cuánto tiempo,
   y que no se envía a ningún servidor. Se versiona junto con la app.
6. **Sin decisiones automatizadas con efectos jurídicos (art. 8° bis).** El
   sorteo asigna un premio, no un derecho. Aun así, el acta con hash y semilla
   (T1.3, T4.2) da trazabilidad y permite revisión humana del resultado.
7. **Retención.** Los datos viven mientras dura el sorteo. Si se agrega
   persistencia, se define un plazo y se purga solo al vencer.

## Responsabilidad del organizador

Quien usa la app es el responsable del tratamiento frente a la ley: él consiguió
la lista y debe tener base de licitud para usarla en un sorteo. La app le entrega
las herramientas (minimización, borrado, exportación, aviso), no lo reemplaza. El
aviso de privacidad debe decirlo con todas sus letras.

## Si se hace la Fase 5 (backend)

Ahí sí se activa el paquete completo y hay que planificarlo antes de escribir la
primera línea: consentimiento válido en el formulario de inscripción (casilla
desmarcada, granular por finalidad, con registro de titular, finalidad, fecha y
versión de la política) · endpoints de acceso, rectificación, supresión,
oposición y portabilidad · cifrado en reposo y respaldos probados · registro de
incidentes y proceso de notificación de brechas · verificación de dónde queda
alojado el servidor y, si sale de Chile, base para la transferencia
internacional. Si el sorteo llegara a apuntar a menores de 14, se suma
consentimiento de los padres.

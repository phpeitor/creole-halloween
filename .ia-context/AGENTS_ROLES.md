# Roles y contexto del proyecto

Guía de trabajo para mantener coherente la landing interactiva de Halloween Criollo.

## Contexto del proyecto

- Es una landing estática temática de Halloween, sin framework ni proceso de build.
- La experiencia principal es un juego de Tres en Raya entre Halloween y Criollo.
- La página combina un video de fondo aleatorio, una capa de ambiente para mejorar el contraste, una apertura con máscara de calabaza, un logotipo animado y el tablero interactivo.
- La interfaz usa una estética de arcade retro: panel central con neón, marcador, indicador de turno y casillas navegables por teclado.
- Todo el contenido se sirve como archivos estáticos desde Apache o cualquier servidor HTTP local.
- La interfaz y los mensajes están en español.

## Estructura real

- `index.html`: documento base, video, capa visual, logotipo, encabezado de juego, marcador, tablero y contenedor de notificaciones.
- `css/styles.css`: layout, identidad visual, tablero, animaciones, overlay de apertura y responsive styling.
- `css/logo.css`: estilos autocontenidos del componente de logo reutilizable.
- `js/script.js`: creación del tablero, turnos, validación de victorias/empates, marcador, efectos de celebración y selección de video.
- `js/logo.js`: inicialización independiente del logo, partículas y lightbox.
- `resources/`: videos, logotipos y SVG utilizados por la landing.
- `README.md`: instrucciones básicas del repositorio y enlaces a demos.
- `.ia-context/`: contexto y reglas para asistentes de desarrollo.

## Roles recomendados

### Agent HTML / UX

Responsable de la estructura de la landing y de la accesibilidad.

Trabaja en:

- `index.html`

Debe:

- Mantener la carga de `css/styles.css` y `js/script.js`.
- Conservar `lang="es"`, el viewport y textos alternativos descriptivos.
- Mantener los identificadores que usa `script.js`: `background-video`, `playerHalloween`, `playerCriollo`, `draw`, `board` y `notification`.
- Mantener `game-status` como región de estado accesible y las casillas como botones con `aria-label`.
- Evitar introducir markup innecesario o dependencias de frameworks.

### Agent CSS / Visual

Responsable de la identidad visual y las animaciones.

Trabaja en:

- `css/styles.css`
- `css/logo.css`

Debe:

- Mantener la estética de Halloween y la legibilidad del tablero sobre el video.
- Mantener la capa `.video-atmosphere` entre el video y el contenido para que el juego central tenga contraste.
- Conservar la jerarquía arcade de `.game-header`, `.game-status`, `.score` y `.cell`.
- Respetar `prefers-reduced-motion` cuando se modifiquen animaciones.
- Mantener el layout usable en pantallas pequeñas.
- Referenciar recursos con rutas relativas a `resources/`.
- Mantener el estilo del logo dentro de `css/logo.css`; no volver a mezclarlo en los estilos del juego.

### Agent JS / Juego

Responsable del comportamiento interactivo.

Trabaja en:

- `js/script.js`

Debe:

- Mantener el flujo de turnos, victorias, empates y reinicio automático.
- Comprobar que los elementos del DOM existan antes de usarlos si se modifica la estructura.
- Mantener la selección aleatoria entre `video01.mp4` y `video04.mp4`.
- Limpiar efectos temporales (`.burst`, notificaciones y clases de victoria) para no acumular nodos ni estados.
- Evitar dependencias adicionales y mantener JavaScript vanilla.

### Agent Logo / Componente

Responsable del logo interactivo reutilizable.

Trabaja en:

- `css/logo.css`
- `js/logo.js`

Debe:

- Mantener la integración basada en `.logo > .box > img`.
- No depender del tablero, del video ni del overlay de apertura.
- Evitar listeners duplicados y exponer únicamente la inicialización necesaria.
- Conservar soporte para clic, teclado, `Escape` y `prefers-reduced-motion`.

### Agent Docs / IA Context

Responsable de que esta documentación refleje el código real.

Trabaja en:

- `.ia-context/`
- `README.md`

Debe:

- Actualizar las rutas y nombres de archivos cuando cambie la estructura.
- No documentar módulos, templates o librerías que no existan en el repositorio.
- Mantener las reglas concisas y accionables.

## Checklist final

- La landing abre correctamente desde Apache o un servidor HTTP local.
- El video de fondo, la máscara de apertura y los recursos cargan sin errores 404.
- El tablero permite nueve jugadas, detecta las ocho líneas ganadoras y registra empates.
- El marcador y las notificaciones se actualizan de acuerdo con el resultado.
- El reinicio no deja clases, partículas ni listeners duplicados.
- La experiencia sigue siendo usable con movimiento reducido y en pantallas pequeñas.

# Reglas de desarrollo frontend

## Alcance

Este repositorio contiene una landing estática llamada **Halloween Criollo**. No usa Node.js, bundler, framework frontend ni backend: la página se ejecuta con HTML, CSS y JavaScript vanilla.

La experiencia visual incluye:

- Video de fondo elegido aleatoriamente entre cuatro archivos locales.
- Capa de ambiente oscura con textura scanline para separar visualmente el juego del video.
- Overlay inicial con forma de calabaza y animación de apertura.
- Logotipo con efectos de brillo, movimiento y partículas.
- Juego de Tres en Raya entre `🎃 Halloween` y `🎸 Criollo`.
- Marcador persistente durante la sesión, detección de victoria/empate y reinicio automático.
- Indicador de turno accesible y tablero navegable por teclado con botones.

## Archivos y responsabilidades

- `index.html`: shell HTML y elementos que necesita el runtime.
- `css/styles.css`: capa de contraste, layout arcade, colores, estados del tablero y animaciones.
- `css/logo.css`: estilos y animaciones independientes del componente de logo.
- `js/script.js`: estado del juego, eventos y efectos visuales.
- `js/logo.js`: comportamiento reutilizable del logo y su lightbox.
- `resources/video01.mp4` a `resources/video04.mp4`: fondos de video.
- `resources/logo01.png`, `resources/logo02.png`: identidad visual.
- `resources/halloween.svg`: recurso de la máscara de apertura.

## Reglas HTML

- Mantener `lang="es"` y el viewport responsive.
- Mantener las rutas relativas porque el sitio se publica como archivos estáticos.
- Conservar los IDs consumidos por `js/script.js`: `background-video`, `playerHalloween`, `playerCriollo`, `draw`, `board` y `notification`.
- Conservar `game-status` con `role="status"` y `aria-live="polite"` para comunicar el turno.
- Las casillas creadas por JavaScript deben ser botones `type="button"` con etiquetas accesibles.
- Usar `alt` descriptivo en imágenes y texto comprensible para estados del juego.
- No incrustar SVG, video o JavaScript grande directamente en `index.html` si puede permanecer en `resources/`, `css/` o `js/`.
- Evitar dependencias externas para una funcionalidad que pueda resolverse con la plataforma web.

## Componente de logo reutilizable

- Integrar incluyendo `css/logo.css` y `js/logo.js`.
- Usar la estructura mínima `.logo > .box > img`.
- El componente debe funcionar aunque el proyecto no tenga tablero, video, overlay o `script.js`.
- Mantener `role="button"`, `tabindex="0"` y un `aria-label` en el contenedor cuando el logo sea interactivo.
- No mover reglas del logo a `styles.css` ni lógica del logo a `script.js`.

## Reglas CSS

- Mantener los estilos en `css/styles.css`; no añadir estilos inline salvo una necesidad puntual generada por JavaScript.
- Usar clases e IDs existentes de forma consistente y evitar selectores innecesariamente específicos.
- Preservar el contraste entre el tablero, el marcador y el video de fondo.
- Mantener `.video-atmosphere` por encima del video y por debajo del contenido; no eliminarla sin una alternativa de contraste equivalente.
- Mantener el lenguaje visual arcade retro: bordes luminosos, tipografía monoespaciada, estados hover/focus visibles y panel central destacado.
- Mantener el tablero adaptable a viewport pequeños sin cortar celdas ni notificaciones.
- Respetar `@media (prefers-reduced-motion: reduce)` al agregar o modificar animaciones.
- Usar rutas relativas correctas (`../resources/...`) desde `css/styles.css`.
- No sustituir el sistema visual de Halloween por estilos genéricos sin una razón explícita.

## Reglas JavaScript

- Mantener el código en `js/script.js` y usar JavaScript vanilla.
- Crear y configurar las nueve celdas desde el runtime; no duplicar el tablero en HTML y JavaScript.
- No permitir jugadas después de una victoria o empate.
- Mantener separadas las responsabilidades de jugada, validación, marcador, notificación y reinicio.
- Validar elementos del DOM antes de utilizarlos si se modifica `index.html`.
- Limpiar timeouts, partículas y clases temporales cuando corresponda.
- No ocultar errores con catches amplios ni fallbacks que aparenten que una funcionalidad se ejecutó.
- Mantener la reproducción de video compatible con políticas del navegador (`autoplay`, `muted`, `playsinline`).

## Recursos y ejecución

- Probar desde Apache o un servidor HTTP local, no depender únicamente de abrir `index.html` con `file://`.
- Verificar que las cuatro fuentes de video y los recursos gráficos devuelvan `HTTP 200`.
- No renombrar recursos sin actualizar todas sus referencias.
- No añadir archivos generados, credenciales ni datos sensibles al repositorio.

## QA mínima

- Abrir la landing en escritorio y móvil.
- Confirmar que el overlay termina y no bloquea la interacción.
- Confirmar que se puede completar una partida, que gana cada jugador y que se registra un empate.
- Confirmar el reinicio automático y que el marcador conserva los resultados.
- Revisar consola y red para detectar errores JavaScript o recursos faltantes.
- Probar con `prefers-reduced-motion` habilitado.

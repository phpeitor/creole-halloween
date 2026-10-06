# Halloween Criollo🎃 
[![forthebadge](http://forthebadge.com/images/badges/made-with-javascript.svg)](https://www.linkedin.com/in/drphp/)
[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](https://www.linkedin.com/in/drphp/)

[![Video](https://img.youtube.com/vi/62yWyHRWk0s/0.jpg)](https://www.youtube.com/watch?v=62yWyHRWk0s)  
[![Video Demo](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=62yWyHRWk0s)

## 🚀 Quick Start

### Requisitos

- Node.js 18 o superior.
- npm.
- Navegador moderno con soporte para WebGL si se desea visualizar la carta 3D.

### Instalación

```bash
git clone https://github.com/phpeitor/creole-halloween.git
cd creole-halloween
npm install
```

### Ejecución

```bash
npm start
```

La aplicación estará disponible en:

```text
http://localhost:3000
```

No se debe abrir la landing directamente con `file://` para probar el modo multijugador. El servidor Express debe estar activo para servir Socket.IO y los recursos estáticos.

## Funcionalidades

- Landing temática de Halloween con video de fondo, overlay animado y UI arcade retro.
- Tres en Raya para dos jugadores en tiempo real.
- Salas independientes mediante el parámetro `room`.
- Asignación automática de los roles Halloween y Criollo.
- Validación autoritativa de turnos, casillas, victorias y empates en el servidor.
- Soporte para espectadores cuando una sala ya tiene dos jugadores.
- Modo local de respaldo cuando Socket.IO no está disponible.
- Recompensa 3D exclusiva para el jugador ganador durante 15 segundos.
- Controles `dat.GUI` interactivos dentro de la carta desbloqueada.
- Logo independiente con animación, partículas, accesibilidad y lightbox.

## Multijugador

Abre la misma sala en dos navegadores o pestañas:

```text
http://localhost:3000/?room=halloween
```

El primer cliente recibe el rol `Halloween` y el segundo `Criollo`. Los clientes adicionales entran como espectadores. Para aislar partidas, utiliza otro identificador:

```text
http://localhost:3000/?room=amigos
```

El estado de la partida vive en `server.js`; el cliente no puede confirmar directamente una jugada ni modificar el marcador remoto. Cuando un jugador gana, solo esa ventana muestra la carta 3D. El rival recibe el resultado y observa el tablero sincronizado.

## Arquitectura

```text
Browser
  ├── index.html
  ├── css/styles.css
  ├── css/logo.css
  ├── css/batman.css
  └── js/script.js
          │ Socket.IO
          ▼
      server.js
          │
          └── salas y estado autoritativo en memoria

Recompensa:
index.html ── iframe ──> card.html
                         ├── css/card.css
                         └── js/card.js
```

### Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Shell de la landing, tablero y modal de recompensa. |
| `css/styles.css` | Layout arcade, tablero, overlay inicial y modal. |
| `css/logo.css` | Estilos autocontenidos del logo reutilizable. |
| `css/batman.css` | Sprite decorativo del murciélago. |
| `js/script.js` | Juego local, cliente Socket.IO y sincronización visual. |
| `js/logo.js` | Interacción, partículas y lightbox del logo. |
| `server.js` | Express, salas Socket.IO y reglas de la partida. |
| `card.html` | Demo de la carta 3D y entrada del iframe de recompensa. |
| `js/card.js` | Escena Three.js y controles `dat.GUI`. |
| `resources/` | Videos, logos y recursos gráficos. |

## Carta 3D de victoria

La carta se carga en un `iframe` para mantener la escena Three.js aislada del juego principal. Al mostrarse:

- El panel `dat.GUI` queda visible.
- El usuario puede modificar Bloom, colores y animación.
- El modal se cierra con `×`, `Escape`, clic fuera o automáticamente.
- El tiempo máximo de visualización es de 15 segundos.
- El tablero se reinicia al finalizar ese mismo intervalo.

`card.html` también puede abrirse de forma independiente para revisar la escena 3D.

## Componente de logo reutilizable

El componente no depende del tablero, Socket.IO ni del servidor. Incluye:

- `css/logo.css`
- `js/logo.js`
- La estructura `.logo > .box > img`

Integración mínima:

```html
<link rel="stylesheet" href="./css/logo.css">
<script defer src="./js/logo.js"></script>

<div class="logo" role="button" tabindex="0" aria-label="Abrir logo">
  <div class="box">
    <img src="./ruta/logo.png" alt="Logo">
  </div>
</div>
```

El componente admite clic, `Enter`, `Espacio`, `Escape`, cierre mediante botón y `prefers-reduced-motion`. Ajusta únicamente la ruta del atributo `src` si se integra en otro proyecto.

## Desarrollo

### Comandos

| Comando | Uso |
| --- | --- |
| `npm install` | Instala Express y Socket.IO. |
| `npm start` | Inicia el servidor en el puerto 3000. |
| `node --check server.js` | Valida la sintaxis del servidor. |
| `node --check js/script.js` | Valida la sintaxis del cliente. |

El puerto puede cambiarse mediante la variable de entorno `PORT`:

```bash
set PORT=4000
npm start
```

En PowerShell:

```powershell
$env:PORT=4000
npm start
```

## Verificación manual

1. Ejecutar `npm install` y `npm start`.
2. Abrir la misma sala en dos navegadores.
3. Confirmar que cada cliente recibe un rol distinto.
4. Realizar jugadas alternadas y comprobar la sincronización.
5. Completar una victoria y confirmar que la carta solo aparece al ganador.
6. Probar los controles Bloom, Colors y Animate dentro de la carta.
7. Confirmar cierre manual, cierre con `Escape` y cierre automático a los 15 segundos.
8. Revisar la consola del navegador y que no existan recursos con errores 404.

## Consideraciones técnicas

- El estado de las salas se almacena en memoria; reiniciar el proceso elimina las partidas activas.
- Para producción se requiere persistencia o un adaptador compartido si se ejecutan múltiples instancias.
- Los recursos de la carta 3D y algunas dependencias se cargan desde CDN.
- `node_modules/` está excluido mediante `.gitignore`.

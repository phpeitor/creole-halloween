# Halloween Criollo🎃 
[![forthebadge](http://forthebadge.com/images/badges/made-with-javascript.svg)](https://www.linkedin.com/in/drphp/)
[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](https://www.linkedin.com/in/drphp/)

[![Video](https://img.youtube.com/vi/62yWyHRWk0s/0.jpg)](https://www.youtube.com/watch?v=62yWyHRWk0s)  
[![Video Demo](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=62yWyHRWk0s)

## 🚀 Quick Start

1. **Clonar este repositorio**
```bash
git clone https://github.com/phpeitor/creole-halloween.git
cd creole-halloween
```
2. **Ejecutar comando**
```bash
npm install
npm start
```

Abre `http://localhost:3000` en dos navegadores o pestañas. Ambos entrarán a la sala `halloween` y el servidor asignará automáticamente un jugador Halloween y otro Criollo. Para usar otra sala, añade un identificador en la URL, por ejemplo `http://localhost:3000/?room=amigos`.

El servidor es autoritativo: valida turnos, casillas ocupadas, victorias y empates antes de sincronizar el tablero. Si se abre directamente con `file://`, el juego continúa funcionando en modo local, pero Socket.IO no se activa.

Al ganar una partida, la landing muestra `card.html` dentro de una recompensa modal únicamente en la ventana del jugador ganador. La carta 3D se carga en un `iframe` para reutilizar su animación sin mezclar la escena Three.js con el tablero; sus controles `dat.GUI` permanecen visibles e interactivos. Se cierra con el botón, `Escape`, clic fuera o automáticamente después de 15 segundos. La ventana del perdedor recibe el resultado sincronizado, pero no la recompensa. `card.html` continúa disponible como demo independiente.

## Componente de logo reutilizable

El logo interactivo está separado para poder reutilizarlo en otros proyectos sin copiar la lógica del juego:

```html
<link rel="stylesheet" href="./css/logo.css">
<script defer src="./js/logo.js"></script>

<div class="logo" role="button" tabindex="0" aria-label="Abrir logo">
  <div class="box">
    <img src="./ruta/logo.png" alt="Logo">
  </div>
</div>
```

`logo.css` contiene la presentación, animaciones, responsive y lightbox. `logo.js` agrega partículas, apertura al hacer clic o pulsar `Enter`/`Espacio`, y cierre con `Escape`. Para reutilizarlo solo hay que conservar la estructura `.logo > .box > img` y ajustar la ruta de la imagen.

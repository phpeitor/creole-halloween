# Halloween Criollo 🎃 
[![forthebadge](http://forthebadge.com/images/badges/made-with-javascript.svg)](https://www.linkedin.com/in/drphp/)
[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](https://www.linkedin.com/in/drphp/)

Para utilizar este proyecto sigue estos pasos:

## 🚀 Quick Start

1. **Clonar este repositorio**
```bash
git clone https://github.com/phpeitor/creole-halloween.git
cd creole-halloween
```
2. **Ejecutar comando**
```bash
index.html
```

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

[![Video](https://img.youtube.com/vi/uMBzC09BLy4/0.jpg)](https://www.youtube.com/watch?v=uMBzC09BLy4)  
[Ver demo v1.0](https://www.youtube.com/watch?v=uMBzC09BLy4)

[![Video](https://img.youtube.com/vi/62yWyHRWk0s/0.jpg)](https://www.youtube.com/watch?v=62yWyHRWk0s)  
[Ver demov2.0](https://www.youtube.com/watch?v=62yWyHRWk0s)

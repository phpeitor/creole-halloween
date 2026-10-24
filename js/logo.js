(function () {
  'use strict';

  function initLogo(logo) {
    if (!logo || logo.dataset.logoReady === 'true') return;

    const image = logo.querySelector('.box img, .box video');
    if (!image) return;
    const isVideo = image.tagName === 'VIDEO';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Safari renders WebM alpha as an opaque box: keep the static poster there
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

    if (isVideo && (reducedMotion || isSafari)) {
      image.removeAttribute('autoplay');
      image.pause();
      if (isSafari && image.poster) {
        image.removeAttribute('src');
        image.load();
      }
    }

    logo.dataset.logoReady = 'true';
    logo.classList.add('haunt');

    const emojis = ['✨', '🕸️', '🦇', '🎃', '🩸', '🕯️'];
    let sparkTimer = null;

    function makeSpark() {
      const rect = logo.getBoundingClientRect();
      const spark = document.createElement('span');
      spark.className = 'logo-spark';
      spark.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      spark.style.left = `${rect.left + rect.width * (Math.random() * 1.2 - .1)}px`;
      spark.style.top = `${rect.top + rect.height * (Math.random() * 1.2 - .1)}px`;
      spark.style.setProperty('--sx', '-50%');
      spark.style.setProperty('--sy', '-50%');
      spark.style.setProperty('--dx', `${Math.random() * 120 - 60}px`);
      spark.style.setProperty('--dy', `${Math.random() * -120}px`);
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 1100);
    }

    function startSparks() {
      if (sparkTimer) return;
      const loop = () => {
        makeSpark();
        sparkTimer = window.setTimeout(loop, 400 + Math.random() * 400);
      };
      loop();
    }

    function stopSparks() {
      window.clearTimeout(sparkTimer);
      sparkTimer = null;
    }

    function openLightbox() {
      if (document.querySelector('.logo-lightbox')) return;

      const rect = logo.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.className = 'logo-lightbox';
      overlay.style.setProperty('--lbx', `${rect.left + rect.width / 2 - innerWidth / 2}px`);
      overlay.style.setProperty('--lby', `${rect.top + rect.height / 2 - innerHeight / 2}px`);

      let largeImage;
      if (isVideo) {
        largeImage = document.createElement('video');
        largeImage.poster = image.poster;
        if (image.currentSrc) largeImage.src = image.currentSrc;
        largeImage.muted = true;
        largeImage.loop = true;
        largeImage.playsInline = true;
        largeImage.autoplay = !reducedMotion;
        largeImage.setAttribute('aria-label', logo.getAttribute('aria-label') || 'Logo');
      } else {
        largeImage = document.createElement('img');
        largeImage.src = image.currentSrc || image.src;
        largeImage.alt = image.alt;
      }
      largeImage.className = 'logo-lightbox__img';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'logo-lightbox__close';
      close.setAttribute('aria-label', 'Cerrar logo');
      close.innerHTML = '&times;';
      overlay.append(largeImage, close);
      document.body.appendChild(overlay);

      const closeLightbox = () => {
        document.removeEventListener('keydown', onKey);
        overlay.classList.remove('logo-lightbox--open');
        overlay.classList.add('logo-lightbox--closing');
        window.setTimeout(() => overlay.remove(), 420);
      };
      const onKey = event => {
        if (event.key === 'Escape') closeLightbox();
      };

      close.addEventListener('click', closeLightbox);
      overlay.addEventListener('click', event => {
        if (event.target === overlay) closeLightbox();
      });
      document.addEventListener('keydown', onKey);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.classList.add('logo-lightbox--open');
      }));
    }

    function triggerBrainEffect() {
      logo.classList.toggle('brain');
      if (logo.classList.contains('brain')) {
        Array.from({ length: 10 }, (_, index) => {
          window.setTimeout(makeSpark, Math.random() * 350 + index * 10);
        });
      }
    }

    startSparks();
    logo.addEventListener('mouseenter', stopSparks);
    logo.addEventListener('mouseleave', startSparks);
    logo.addEventListener('click', () => {
      openLightbox();
      triggerBrainEffect();
    });
    logo.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox();
      }
    });
  }

  function init() {
    document.querySelectorAll('.logo').forEach(initLogo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HalloweenLogo = { init: initLogo };
})();

(function () {
  'use strict';

  const SPEED = 150;          // px por segundo en vuelo
  const MARGIN = 28;          // distancia mínima al panel del juego
  const HOVER_MIN = 1800;
  const HOVER_MAX = 4200;
  const NARROW = 700;         // sin espacio a los lados: salta entre esquinas del panel

  function initBat() {
    const mascot = document.querySelector('.bat-mascot');
    if (!mascot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const panel = document.getElementById('container');
    let pos = null;
    let flight = null;        // { p0, p1, p2, p3, start, duration, orbit }
    let hoverUntil = 0;
    let lastTime = 0;
    let excitedTimer = null;

    const rand = (min, max) => min + Math.random() * (max - min);
    const size = () => ({ w: mascot.offsetWidth, h: mascot.offsetHeight });

    function bounds() {
      const { w, h } = size();
      return { minX: 8, minY: 8, maxX: innerWidth - w - 8, maxY: innerHeight - h - 8 };
    }

    // Zona prohibida: el panel ampliado por el margen y el tamaño del murciélago
    function forbidden() {
      if (!panel) return null;
      const r = panel.getBoundingClientRect();
      const { w, h } = size();
      return {
        left: r.left - MARGIN - w,
        right: r.right + MARGIN,
        top: r.top - MARGIN - h,
        bottom: r.bottom + MARGIN
      };
    }

    const inside = (p, z) => z && p.x > z.left && p.x < z.right && p.y > z.top && p.y < z.bottom;

    // En pantallas angostas se posa sobre las esquinas superiores del panel
    function perchTarget() {
      const r = panel.getBoundingClientRect();
      const { w, h } = size();
      const b = bounds();
      const left = Math.max(b.minX, r.left - w * .25);
      const right = Math.min(b.maxX, r.right - w * .75);
      const x = Math.abs(pos.x - left) < Math.abs(pos.x - right) ? right : left;
      return { x, y: Math.max(b.minY, r.top - h * .7) };
    }

    const isNarrow = () => panel && innerWidth < NARROW;

    function randomFreePoint() {
      const b = bounds();
      const z = forbidden();
      for (let i = 0; i < 30; i++) {
        const p = { x: rand(b.minX, b.maxX), y: rand(b.minY, b.maxY) };
        if (!inside(p, z)) return p;
      }
      return null;
    }

    function bezier(f, t) {
      const u = 1 - t;
      const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      return {
        x: k[0] * f.p0.x + k[1] * f.p1.x + k[2] * f.p2.x + k[3] * f.p3.x,
        y: k[0] * f.p0.y + k[1] * f.p1.y + k[2] * f.p2.y + k[3] * f.p3.y
      };
    }

    function makeFlight(from, to) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      // En móvil el salto entre esquinas siempre se arquea hacia arriba
      const bend = isNarrow() ? -Math.sign(dx || 1) * Math.min(90, dist * .35) : rand(-.35, .35) * dist;
      return {
        p0: from,
        p1: { x: from.x + dx * .3 + nx * bend, y: from.y + dy * .3 + ny * bend },
        p2: { x: from.x + dx * .7 + nx * bend, y: from.y + dy * .7 + ny * bend },
        p3: to,
        duration: Math.min(5200, Math.max(1300, dist / SPEED * 1000))
      };
    }

    function crossesPanel(f) {
      const z = forbidden();
      if (!z) return false;
      for (let i = 1; i < 20; i++) {
        if (inside(bezier(f, i / 20), z)) return true;
      }
      return false;
    }

    function startFlight(now) {
      let f = null;
      if (isNarrow()) {
        f = makeFlight(pos, perchTarget());
      } else {
        // Busca un destino libre cuya curva no cruce el panel; tras la órbita
        // puede estar sobre el panel y entonces solo se exige salir de él
        const escaping = inside(pos, forbidden());
        for (let i = 0; i < 40 && !f; i++) {
          const target = randomFreePoint();
          if (!target) break;
          const candidate = makeFlight(pos, target);
          if (escaping || !crossesPanel(candidate)) f = candidate;
        }
      }
      if (!f) {
        hoverUntil = now + HOVER_MIN;
        return;
      }
      flight = { ...f, start: now };
      mascot.classList.remove('is-hovering');
    }

    function startOrbit(now) {
      if (!panel || !pos) return;
      const r = panel.getBoundingClientRect();
      const { w, h } = size();
      const b = bounds();
      const cx = r.left + r.width / 2 - w / 2;
      const cy = r.top + r.height / 2 - h / 2;
      flight = {
        orbit: { cx, cy, rx: r.width / 2 + MARGIN + w / 2, ry: r.height / 2 + MARGIN + h / 2, from: { ...pos }, b },
        start: now,
        duration: 2600
      };
      mascot.classList.remove('is-hovering');
    }

    function orbitPoint(o, t) {
      const angle = -Math.PI / 2 + t * Math.PI * 2;
      const p = {
        x: Math.min(o.b.maxX, Math.max(o.b.minX, o.cx + Math.cos(angle) * o.rx)),
        y: Math.min(o.b.maxY, Math.max(o.b.minY, o.cy + Math.sin(angle) * o.ry))
      };
      // Entra a la órbita suavemente desde donde estaba
      const blend = Math.min(1, t * 5);
      return { x: o.from.x + (p.x - o.from.x) * blend, y: o.from.y + (p.y - o.from.y) * blend };
    }

    const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    function render(p, tilt, now) {
      const bob = Math.sin(now / 260) * 4;
      mascot.style.transform = `translate3d(${p.x.toFixed(1)}px, ${(p.y + bob).toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`;
    }

    function frame(now) {
      // Al volver de una pestaña oculta no saltar de golpe
      if (lastTime && now - lastTime > 500 && flight) flight.start += now - lastTime;
      lastTime = now;

      let tilt = 0;
      if (flight) {
        const t = Math.min(1, Math.max(0, (now - flight.start) / flight.duration));
        const next = flight.orbit ? orbitPoint(flight.orbit, t) : bezier(flight, ease(t));
        tilt = Math.max(-18, Math.min(18, (next.x - pos.x) * 2.2));
        pos = next;
        if (t >= 1) {
          // Al terminar la órbita no se queda sobre el panel: sale enseguida
          hoverUntil = flight.orbit ? now + 300 : now + rand(HOVER_MIN, HOVER_MAX);
          flight = null;
          mascot.classList.add('is-hovering');
        }
      } else if (now >= hoverUntil) {
        startFlight(now);
      }

      render(pos, tilt, now);
      requestAnimationFrame(frame);
    }

    function start() {
      const r = mascot.getBoundingClientRect();
      pos = { x: r.left, y: r.top };
      mascot.classList.add('is-flying', 'is-hovering');
      hoverUntil = performance.now() + 1200;
      render(pos, 0, performance.now());
      requestAnimationFrame(frame);
    }

    document.addEventListener('game:win', () => {
      startOrbit(performance.now());
      mascot.classList.add('is-excited');
      window.clearTimeout(excitedTimer);
      excitedTimer = window.setTimeout(() => mascot.classList.remove('is-excited'), 2600);
    });

    window.addEventListener('resize', () => {
      if (!pos) return;
      const b = bounds();
      pos = { x: Math.min(b.maxX, Math.max(b.minX, pos.x)), y: Math.min(b.maxY, Math.max(b.minY, pos.y)) };
      if (!flight?.orbit) {
        flight = null;
        hoverUntil = 0;
      }
    });

    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBat);
  } else {
    initBat();
  }
})();

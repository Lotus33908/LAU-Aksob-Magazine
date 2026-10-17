/* confetti.js — canvas particle bursts in LAU green, white and gold */
window.Confetti = (() => {
  const BRAND = ['#006341', '#2E9D6A', '#8FD1B0', '#C8A951', '#E8D08A', '#FFFFFF'];
  let cv, cx, parts = [], raf = null, dpr = 1, W = 0, H = 0;

  function init() {
    cv = document.getElementById('fx-confetti');
    cx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst({ x, y, count = 90, spread = 70, angle = -90, power = 13, colors = BRAND, gravity = .35, scalar = 1 } = {}) {
    if (!cx) init();
    if (U.reduced) count = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const a = (angle + U.rand(-spread / 2, spread / 2)) * Math.PI / 180;
      const v = power * U.rand(.35, 1.15);
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: U.rand(6, 11) * scalar, h: U.rand(4, 8) * scalar,
        rot: U.rand(0, Math.PI * 2), vr: U.rand(-.25, .25),
        color: U.pick(colors), life: 1, decay: U.rand(.007, .014),
        shape: Math.random() < .25 ? 'circle' : 'rect',
        wob: U.rand(0, Math.PI * 2), g: gravity,
      });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function loop() {
    cx.clearRect(0, 0, W, H);
    const next = [];
    for (const p of parts) {
      p.vx *= .985; p.vy += p.g; p.vy *= .985;
      p.x += p.vx + Math.sin(p.wob) * .6; p.y += p.vy;
      p.wob += .12; p.rot += p.vr; p.life -= p.decay;
      if (p.life <= 0 || p.y > H + 30) continue;
      cx.save();
      cx.globalAlpha = Math.min(1, p.life * 1.6);
      cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.fillStyle = p.color;
      if (p.shape === 'circle') { cx.beginPath(); cx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2); cx.fill(); }
      else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.wob)));
      cx.restore();
      next.push(p);
    }
    parts = next;
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = null; cx.clearRect(0, 0, W, H); }
  }

  function fromEl(node, opts = {}) { const c = U.center(node); burst({ x: c.x, y: c.y, ...opts }); }
  function rain({ duration = 1400, every = 120 } = {}) {
    const end = performance.now() + duration;
    (function tick() {
      burst({ x: U.rand(W * .1, W * .9), y: -10, count: 18, angle: 90, spread: 40, power: 4, gravity: .22 });
      if (performance.now() < end) setTimeout(tick, every);
    })();
  }
  function cannons() {
    burst({ x: 0, y: H * .7, angle: -50, spread: 45, count: 90, power: 19 });
    burst({ x: W, y: H * .7, angle: -130, spread: 45, count: 90, power: 19 });
  }

  return { init, burst, fromEl, rain, cannons, BRAND };
})();

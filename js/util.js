/* util.js — tiny helpers shared by every module (classic script, no build step) */
window.U = (() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  /** el('div', {class:'x', dataset:{a:1}, onclick: fn, html:'...'}, [children]) */
  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c != null) n.append(c);
    return n;
  }

  const fmtTime = ms => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const fmtNum = n => Math.round(n).toLocaleString('en-US');
  const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const center = node => { const r = node.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
  const on = (name, fn) => document.addEventListener(name, e => fn(e.detail, e));

  /** Stop the flip engine from folding the page when the user drags inside an interactive widget. */
  const noFlip = node => {
    ['mousedown', 'touchstart'].forEach(t => node.addEventListener(t, e => e.stopPropagation(), { passive: true }));
    node.classList.add('no-flip');
  };

  /** Floating "+1" style text at viewport coords. */
  function floatText(x, y, text, color) {
    const n = el('div', { class: 'float-txt', text });
    n.style.left = x + 'px'; n.style.top = y + 'px';
    if (color) n.style.color = color;
    document.body.append(n);
    setTimeout(() => n.remove(), 950);
  }

  /** Animate a number into an element. */
  function countTo(node, to, { duration = 1600, prefix = '', suffix = '', decimals = 0, from = 0 } = {}) {
    const start = performance.now();
    function step(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const v = from + (to - from) * easeOutExpo(t);
      node.textContent = prefix + (decimals ? v.toFixed(decimals) : fmtNum(v)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return { $, $$, clamp, lerp, rand, randInt, pick, shuffle, el, fmtTime, fmtNum, easeOutExpo, easeOutCubic, center, reduced, debounce, emit, on, noFlip, floatText, countTo };
})();

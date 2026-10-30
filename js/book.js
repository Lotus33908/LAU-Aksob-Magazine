/* book.js — the flipbook (page-flip engine), sizing, navigation and page-visibility events */
window.Book = (() => {
  let INTERACTIVE_SEL = '';
  let flip = null, pages = [], total = 0, stage, bookEl, lastVisible = '', curIdx = 0;
  const W = CONFIG.book.width, H = CONFIG.book.height, RATIO = W / H;

  function sizeStage() {
    const navH = 64, padX = 32, padY = 26;
    const availW = window.innerWidth - padX;
    const availH = window.innerHeight - navH - padY;
    let w = Math.min(availW, availH * RATIO * 2, CONFIG.book.maxWidth * 2);
    if (w < CONFIG.book.minWidth * 2) w = Math.min(availW, availH * RATIO);   // portrait: one page
    stage.style.width = Math.max(240, Math.floor(w)) + 'px';
  }

  function init() {
    stage = U.$('#book-stage'); bookEl = U.$('#book');
    pages = U.$$('#book .page'); total = pages.length;
    pages.forEach((p, i) => { p.classList.add(i % 2 === 1 ? 'is-left' : 'is-right'); p.dataset.index = i; });
    sizeStage();

    flip = new St.PageFlip(bookEl, {
      width: W, height: H, size: 'stretch',
      minWidth: CONFIG.book.minWidth, maxWidth: CONFIG.book.maxWidth,
      minHeight: Math.round(CONFIG.book.minWidth / RATIO), maxHeight: Math.round(CONFIG.book.maxWidth / RATIO),
      showCover: true, maxShadowOpacity: .45, flippingTime: CONFIG.book.flipMs,
      usePortrait: true, mobileScrollSupport: false, disableFlipByClick: true,
      swipeDistance: 40, drawShadow: true, autoSize: true, showPageCorners: false, startZIndex: 0,
    });
    flip.loadFromHTML(pages);

    // Touch devices: the engine's swipe needs a sub-250 ms flick and its slow-drag direction depends on
    // where the finger starts, which made going back unreliable. Keep touches away from the engine and
    // navigate with our own swipe + edge-tap detection instead (mouse drag/fold still works on desktop).
    bookEl.addEventListener('touchstart', e => e.stopPropagation(), { capture: true, passive: true });
    let tp = null;
    stage.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      tp = { x: e.clientX, y: e.clientY, t: performance.now(), interactive: !!e.target.closest(".no-flip, .game, .compare, .scratch, .zip, input") };   // only widgets that drag horizontally keep the swipe
    }, { passive: true });
    stage.addEventListener('pointerup', e => {
      if (e.pointerType !== 'touch' || !tp) return;
      const p = tp; tp = null;
      if (p.interactive) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y, dt = performance.now() - p.t;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 1200) { dx < 0 ? next() : prev(); return; }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (y > .3 && y < .7) { if (x < .12) prev(); else if (x > .88) next(); }
      }
    }, { passive: true });
    stage.addEventListener('pointercancel', () => { tp = null; });

    // Interactive elements must never start a fold or a corner flip, even near page edges.
    const INTERACTIVE = INTERACTIVE_SEL = 'button, a, input, [data-goto], [data-tip], .popcard, .flipcard, .tag, .toc li, .acc__head, .world__dot, .compare, .game, .hold, .holdbar, .poll__opt, .wyr, .popflap, .rsvp, .save, .drawer, .scratch, .lau-mark, .ring-stat';
    pages.forEach(p => ['mousedown', 'touchstart'].forEach(t =>
      p.addEventListener(t, e => { if (e.target.closest(INTERACTIVE)) e.stopPropagation(); }, { passive: true })));

    // Hard flips rotate both sides of a sheet in 3D. Chromium does not cull the back face of these
    // pages reliably, so hide a page's content ourselves while its rotateY points away from the viewer.
    const faceCheck = p => {
      const m = /rotateY\((-?[\d.]+)deg\)/.exec(p.style.transform || '');
      let away = false;
      if (m) { const a = ((parseFloat(m[1]) % 360) + 360) % 360; away = a > 90 && a < 270; }
      const inner = p.firstElementChild;
      if (inner) inner.style.visibility = away ? 'hidden' : '';
    };
    const faceObserver = new MutationObserver(muts => muts.forEach(m => faceCheck(m.target)));
    pages.forEach(p => faceObserver.observe(p, { attributes: true, attributeFilter: ['style'] }));

    // In portrait mode the engine clones a soft page while it folds; tag the clone so CSS can hide secrets (scratch cards).
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1 && n.classList.contains('page') && !pages.includes(n)) n.classList.add('is-clone');
    }))).observe(bookEl, { childList: true, subtree: true });

    flip.on('flip', e => {
      const to = e.data, from = curIdx; curIdx = to;
      if (to === from) return;                      // engine re-emits on update(); not a real turn
      U.emit('book:flip', { to, from });
      const hard = to === 0 || from === 0 || to >= total - 1 || from >= total - 1;
      SFX.play(hard ? 'flipHard' : 'flip');
      Store.ACH.unlock('flip');
      UI.hideTooltip();
    });
    flip.on('changeState', e => {
      if (e.data === 'read') settle();
      else if (e.data === 'flipping' || e.data === 'user_fold') U.emit('book:fold', { state: e.data });
    });
    flip.on('changeOrientation', () => setTimeout(settle, 60));

    window.addEventListener('resize', U.debounce(() => {
      sizeStage();
      try { flip.update(); } catch (e) {}
      setTimeout(settle, 120);
    }, 120));

    U.$('#nav-prev').addEventListener('click', prev);
    U.$('#nav-next').addEventListener('click', next);
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea') || UI.isOpen()) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
      else if (e.key === 'Home') goTo(0);
      else if (e.key === 'End') goTo(total - 1);
    });
  }

  function visible() {
    const idx = flip.getCurrentPageIndex();
    if (flip.getOrientation() === 'portrait') return [idx];
    if (idx === 0) return [0];
    if (idx >= total - 1) return [total - 1];
    const left = idx % 2 === 1 ? idx : idx - 1;
    return [left, left + 1].filter(i => i < total);
  }

  function settle() {
    if (!flip) return;
    const vis = visible();
    updateNav(vis);
    U.emit('book:settle', { indices: vis });
    const key = vis.join(',');
    if (key === lastVisible) return;
    lastVisible = key;
    const els = vis.map(i => pages[i]);
    vis.forEach(i => Store.progress.mark(i));
    els.forEach(p => Interactions.onPageVisible(p));
    Hotspots.flash(els);
    U.emit('book:pages', { indices: vis, pages: els });
    if (Store.progress.visited().length >= total) Store.ACH.unlock('explorer');
  }

  function updateNav(vis) {
    const lbl = U.$('#nav-page');
    if (vis[0] === 0) lbl.textContent = 'Cover';
    else if (vis[0] >= total - 1) lbl.textContent = 'Back cover';
    else lbl.textContent = (vis.length > 1 ? `Pages ${vis[0]}–${vis[1]}` : `Page ${vis[0]}`) + ` of ${total - 2}`;
    U.$('#progress').style.width = (vis[vis.length - 1] / (total - 1) * 100) + '%';
    U.$('#nav-prev').classList.toggle('is-off', vis[0] === 0);
    U.$('#nav-next').classList.toggle('is-off', vis.includes(total - 1));
  }

  // The engine performs programmatic flips by simulating a click at the page edge, and in portrait
  // mode the backward point is not inside a corner zone, so disableFlipByClick would reject it.
  // Lift that setting for the duration of our own flips only.
  function programmatic(fn) {
    const s = flip.getSettings(); const was = s.disableFlipByClick;
    s.disableFlipByClick = false;
    try { fn(); } finally { s.disableFlipByClick = was; }
  }
  function next() { SFX.unlock(); programmatic(() => flip.flipNext()); }
  function prev() { SFX.unlock(); programmatic(() => flip.flipPrev()); }
  function goTo(n) { SFX.unlock(); n = U.clamp(n, 0, total - 1); if (n === flip.getCurrentPageIndex()) return; programmatic(() => flip.flip(n)); }

  function reveal() {
    U.$('#app').classList.add('is-visible');
    stage.classList.add('is-revealing');
    U.emit('book:reveal');
    setTimeout(() => { try { flip.update(); } catch (e) {} settle(); }, 650);
  }

  return { init, next, prev, goTo, reveal, settle, visible, get flip() { return flip; }, get total() { return total; }, current: () => flip.getCurrentPageIndex() };
})();

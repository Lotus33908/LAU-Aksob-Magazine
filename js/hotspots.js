/* hotspots.js — after every page turn: a glossy sheen sweeps the new pages and
   translucent red circles pulse on each clickable element ([data-hot]). */
window.Hotspots = (() => {
  const layer = () => U.$('#fx-hotspots');

  function hiddenInside(n) {
    return !!(
      n.closest('.acc:not(.is-open) .acc__body') ||
      n.closest('.drawer:not(.is-open) .drawer__panel') ||
      n.closest('.flipcard:not(.is-flipped) .flipcard__back') ||
      n.closest('.flipcard.is-flipped .flipcard__front') ||
      n.closest('.reveal-target:not(.is-open)') ||
      n.closest('.popcard__full') ||
      n.closest('[hidden]')
    );
  }
  function visible(n, pr) {
    if (!(n.offsetWidth || n.offsetHeight)) return false;
    if (hiddenInside(n)) return false;
    const r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return cx > pr.left && cx < pr.right && cy > pr.top && cy < pr.bottom;
  }

  function ripple(x, y) {
    const n = U.el('div', { class: 'hs' });
    n.style.left = x + 'px'; n.style.top = y + 'px';
    layer().append(n);
    setTimeout(() => n.remove(), 1700);
  }

  function sheen(pr) {
    const sh = U.el('div', { class: 'sheen' });
    Object.assign(sh.style, { left: pr.left + 'px', top: pr.top + 'px', width: pr.width + 'px', height: pr.height + 'px' });
    layer().append(sh);
    setTimeout(() => sh.remove(), 1100);
  }

  function flash(pages) {
    if (!CONFIG.hotspots.enabled || U.reduced) return;
    let delay = 120;
    pages.forEach(page => {
      const pr = page.getBoundingClientRect();
      if (pr.width < 10) return;
      sheen(pr);
      const hots = U.$$('[data-hot]', page).filter(n => visible(n, pr)).slice(0, CONFIG.hotspots.perPageMax);
      hots.forEach(n => {
        setTimeout(() => {
          if (!document.contains(n)) return;
          const c = U.center(n);
          ripple(c.x, c.y);
        }, delay);
        delay += CONFIG.hotspots.staggerMs;
      });
    });
  }

  return { flash, ripple };
})();

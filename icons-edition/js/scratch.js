/* scratch.js — scratch-to-reveal cards. A canvas "foil" sits over hidden content;
   dragging erases it (destination-out). Past ~55% scratched the rest clears itself.
   Markup:
     <div class="scratch" data-foil="gold|silver" data-label="SCRATCH" [data-fortune]>
       <div class="scratch__under">…revealed content…</div>
       <canvas class="scratch__canvas"></canvas>
       <div class="scratch__hint">Scratch to reveal</div>
       <button class="btn btn--xs btn--white scratch__reset" data-scratch-reset>Again</button>
     </div> */
window.Scratch = (() => {
  const FORTUNES = [
    'Your next big idea arrives on a Tuesday. Write it down before lunch.',
    'The mentor you need is already in your contacts. Send the message.',
    'Buy low, sell high, and call your family in between.',
    'A slow quarter is a free lesson. Take notes.',
    'Someone will say no this month. It is the best thing that happens to you.',
    'Your spreadsheet is right. Your gut is also right. Check both.',
    'The best negotiation this year happens over coffee, not email.',
    'Compound interest also applies to kindness. Invest early.',
    'A door on the Byblos campus opens for you. Walk through it.',
    'Diversify your friendships like a portfolio: a few safe, a few bold.',
  ];

  function mount(box) {
    U.noFlip(box);
    const canvas = box.querySelector('.scratch__canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const under = box.querySelector('.scratch__under');
    const foil = box.dataset.foil || 'gold';
    let W = 0, H = 0, dpr = 1, revealed = false, drawing = false, last = null, moves = 0, lastSfx = 0;

    function setFortune() {
      const t = under.querySelector('[data-fortune-text]');
      if (t) t.textContent = U.pick(FORTUNES);
    }
    if ('fortune' in box.dataset) setFortune();

    function paint() {
      // layout size, not getBoundingClientRect: the page may be mid-flip (transformed) when this runs
      const w = box.clientWidth, h = box.clientHeight;
      if (w < 2 || h < 2) return;
      dpr = Math.min(2, window.devicePixelRatio || 1); W = w; H = h;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, W, H);
      if (foil === 'silver') {
        g.addColorStop(0, '#cfd6d2'); g.addColorStop(.3, '#f3f5f4'); g.addColorStop(.5, '#b4bdb8'); g.addColorStop(.72, '#eceeed'); g.addColorStop(1, '#bfc7c3');
      } else {
        g.addColorStop(0, '#b4903a'); g.addColorStop(.3, '#ead394'); g.addColorStop(.5, '#c8a951'); g.addColorStop(.72, '#f3e4ac'); g.addColorStop(1, '#9a7b2c');
      }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = .13;
      for (let i = 0, n = W * H / 55; i < n; i++) { ctx.fillStyle = Math.random() < .5 ? '#000' : '#fff'; ctx.fillRect(Math.random() * W, Math.random() * H, 1.3, 1.3); }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.rotate(-0.16);
      ctx.font = `800 ${Math.max(11, H * .17)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(40,28,0,.13)';
      const label = (box.dataset.label || 'SCRATCH').toUpperCase() + '   ';
      for (let y = -H; y <= H; y += H * .34) for (let x = -W; x <= W * 1.2; x += W * .62) ctx.fillText(label.repeat(2), x, y);
      ctx.restore();
      ctx.globalCompositeOperation = 'destination-out';
      canvas.style.opacity = '';
      box.classList.remove('is-revealed', 'is-scratching');
      revealed = false; moves = 0; last = null;
    }
    function scratchAt(x, y) {
      const rad = Math.max(12, W * .065);
      ctx.lineWidth = rad * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last ? last.x : x, last ? last.y : y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      last = { x, y };
    }
    function ratio() {
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < d.length; i += 4 * 9) { total++; if (d[i] < 40) clear++; }
      return clear / total;
    }
    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    canvas.addEventListener('pointerdown', e => {
      if (revealed) return;
      e.preventDefault(); SFX.unlock();
      drawing = true; last = null;
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      const p = pos(e); scratchAt(p.x, p.y);
      box.classList.add('is-scratching');
      SFX.play('scratch');
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing || revealed) return;
      const p = pos(e); scratchAt(p.x, p.y);
      const now = performance.now();
      if (now - lastSfx > 85) { lastSfx = now; SFX.play('scratch'); }
      if (++moves % 5 === 0 && ratio() > 0.55) reveal();
    });
    const stop = () => { drawing = false; last = null; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => canvas.addEventListener(t, stop));

    function reveal() {
      revealed = true; drawing = false;
      box.classList.add('is-revealed');
      canvas.style.opacity = '0';
      SFX.play('win');
      Confetti.fromEl(box, { count: 90, spread: 90, power: 12, colors: ['#C8A951', '#E8D08A', '#fff', '#2E9D6A'] });
      Store.ACH.unlock('scratch');
      U.emit('scratch:reveal', box);
    }
    const reset = box.querySelector('[data-scratch-reset]');
    if (reset) reset.addEventListener('click', e => { e.stopPropagation(); if ('fortune' in box.dataset) setFortune(); paint(); SFX.play('whoosh'); });

    new ResizeObserver(() => { if (!revealed) paint(); }).observe(box);
  }

  function init() { U.$$('.scratch').forEach(mount); }
  return { init, mount, FORTUNES };
})();

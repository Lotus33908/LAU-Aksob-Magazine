/* wrap.js — the shrink-wrapped intro.
   1. Click the magazine once: a pair of scissors appears at the top edge.
   2. Press and swipe along the top band: the scissors snip the plastic as you go.
   3. Past the end, the strip tears off and the magazine is pulled out of the sleeve. */
window.Wrap = (() => {
  function init(onDone) {
    const wrap = U.$('#wrap'), pack = U.$('#pack'), plastic = U.$('#plastic'), scissors = U.$('#scissors');
    const hint = U.$('#wrap-hint-text');
    if (!wrap) { onDone && onDone(); return; }
    let state = 'idle';            // idle → armed → done
    let p = 0, cutting = false, downAt = null, snipTimer = null;
    const CUT_Y = 0.13;            // must match --cut-y in wrap.css

    wrap.addEventListener('pointermove', e => {
      if (state === 'done') return;
      const dx = e.clientX / window.innerWidth - .5, dy = e.clientY / window.innerHeight - .5;
      wrap.style.setProperty('--ry', (dx * 10).toFixed(2) + 'deg');
      wrap.style.setProperty('--rx', (-dy * 8).toFixed(2) + 'deg');
      wrap.style.setProperty('--mx', (dx * 90 + 50).toFixed(1) + '%');
      wrap.style.setProperty('--my', (dy * 90 + 50).toFixed(1) + '%');
    });

    const rel = e => { const r = pack.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
    const inZone = e => Math.abs(rel(e).y - CUT_Y) < 0.1;

    function arm() {
      state = 'armed';
      pack.classList.add('is-armed');
      hint.innerHTML = '<b>Press and swipe</b> along the top band to cut<small>Follow the dashed line with the scissors</small>';
      SFX.unlock(); SFX.play('pop'); SFX.play('crinkle', 5, .2);
    }
    function setProgress(v) {
      p = U.clamp(v, 0, 1);
      wrap.style.setProperty('--p', p.toFixed(3));
      SFX.updateCut(p);
      if (p >= 0.985) finish();
    }
    function snip() {
      scissors.classList.add('is-snipping');
      clearTimeout(snipTimer);
      snipTimer = setTimeout(() => scissors.classList.remove('is-snipping'), 140);
    }

    pack.addEventListener('pointerdown', e => {
      if (state === 'done') return;
      e.preventDefault();
      if (state === 'idle') { downAt = { x: e.clientX, y: e.clientY }; return; }
      if (!inZone(e)) {
        pack.classList.remove('is-nudge'); void pack.offsetWidth; pack.classList.add('is-nudge');
        SFX.play('tick');
        return;
      }
      cutting = true;
      try { pack.setPointerCapture(e.pointerId); } catch (x) {}
      pack.classList.add('is-cutting');
      SFX.unlock(); SFX.startCut();
      setProgress(Math.max(p, rel(e).x));
    });
    pack.addEventListener('pointermove', e => {
      if (!cutting || state !== 'armed') return;
      const x = rel(e).x;
      if (x > p + 0.004) { snip(); SFX.play('crinkle', 1, .02); }
      setProgress(Math.max(p, x));
    });
    function release(e) {
      if (state === 'idle' && downAt && e && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 10) { downAt = null; arm(); return; }
      downAt = null;
      if (!cutting) return;
      cutting = false;
      pack.classList.remove('is-cutting');
      scissors.classList.remove('is-snipping');
      SFX.stopCut();
    }
    pack.addEventListener('pointerup', release);
    pack.addEventListener('pointercancel', release);
    pack.addEventListener('lostpointercapture', () => { if (cutting) release(); });

    function finish() {
      if (state === 'done') return;
      state = 'done'; cutting = false;
      SFX.stopCut();
      pack.classList.remove('is-cutting', 'is-armed');
      wrap.classList.add('is-done');
      SFX.play('tear');
      const strip = plastic.cloneNode(true);
      strip.removeAttribute('id'); strip.className = 'pack__strip';
      pack.append(strip);
      pack.classList.add('is-cut');
      setTimeout(() => { pack.classList.add('is-pulling'); SFX.play('whoosh'); SFX.play('crinkle', 10, .5); }, 420);
      setTimeout(() => SFX.play('thud'), 1250);
      setTimeout(() => { wrap.classList.add('is-leaving'); onDone && onDone(); }, 1350);
      setTimeout(() => wrap.remove(), 2200);
    }

    const skip = U.$('#wrap-skip');
    if (skip) skip.addEventListener('click', () => {
      if (state === 'done') return;
      state = 'done'; SFX.unlock(); SFX.play('whoosh');
      wrap.classList.add('is-leaving');
      onDone && onDone();
      setTimeout(() => wrap.remove(), 700);
    });
  }
  return { init };
})();

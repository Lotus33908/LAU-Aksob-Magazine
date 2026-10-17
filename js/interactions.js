/* interactions.js — every in-page widget: hold-to-fill, flip cards, pop-outs,
   drawers, accordions, tags, polls, counters, compare slider, balance game… */
window.Interactions = (() => {

  /* ---- hold-to-fill buttons (.hold and .holdbar) --------------------------- */
  function initHold(btn) {
    U.noFlip(btn);
    const dur = +btn.dataset.hold || 1400;
    const repeat = btn.dataset.repeat === 'true';
    const pct = btn.querySelector('.holdbar__pct');
    let p = 0, raf = null, holding = false, last = 0, lastTick = 0, done = false;

    function frame(now) {
      const dt = Math.min(50, now - last); last = now;
      p = U.clamp(p + (holding ? dt / dur : -dt / (dur * .45)), 0, 1);
      btn.style.setProperty('--p', p.toFixed(3));
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      if (holding) {
        const q = Math.floor(p * 5);
        if (q !== lastTick && q > 0 && q < 5) { lastTick = q; SFX.play('charge', p); }
        if (p >= 1) { complete(); return; }
      }
      raf = (p > 0 || holding) ? requestAnimationFrame(frame) : null;
    }
    function start(e) {
      if (done) return;
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      SFX.unlock();
      holding = true; lastTick = 0; last = performance.now();
      btn.classList.add('is-holding');
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (!holding) return;
      holding = false;
      btn.classList.remove('is-holding');
    }
    function complete() {
      holding = false; raf = null; done = !repeat;
      btn.classList.remove('is-holding');
      btn.classList.add('is-done');
      btn.style.setProperty('--p', 1);
      if (pct) pct.textContent = '100%';
      runAction(btn);
      if (repeat) setTimeout(() => { btn.classList.remove('is-done'); p = 0; btn.style.setProperty('--p', 0); if (pct) pct.textContent = '0%'; }, 1400);
    }
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointercancel'].forEach(t => btn.addEventListener(t, stop));
    btn.addEventListener('lostpointercapture', stop);
  }

  function runAction(btn) {
    const action = btn.dataset.action;
    const label = btn.querySelector('.hold__label, .holdbar__text > span') || btn;
    switch (action) {
      case 'applaud': {
        SFX.play('applause'); SFX.play('confetti');
        Confetti.fromEl(btn, { count: 70, spread: 80, power: 11 });
        const n = Store.counters.inc('applause');
        const target = U.$('#applause-count');
        if (target) U.countTo(target, CONFIG.seeds.applause + n, { duration: 900, from: CONFIG.seeds.applause + n - 1 });
        const lbl = btn.querySelector('.hold__label');
        if (lbl) lbl.innerHTML = 'Applauded!<small>Hold again to clap more</small>';
        Store.ACH.unlock('applause');
        break;
      }
      case 'reveal': {
        SFX.play('pop');
        const t = btn.dataset.target && U.$(btn.dataset.target);
        if (t) t.classList.add('is-open');
        const txt = btn.querySelector('.holdbar__text > span');
        if (txt) txt.textContent = 'Forecast unlocked';
        break;
      }
      case 'subscribe': {
        SFX.play('win'); Confetti.fromEl(btn, { count: 90, spread: 90, power: 13 });
        const lbl = btn.querySelector('.hold__label');
        if (lbl) lbl.innerHTML = 'Subscribed ✓<small>Demo — nothing was sent</small>';
        UI.toast({ kick: 'Subscribed', title: 'You are on the list', text: 'The next issue will find you. (Demo only.)', icon: '📬', type: 'info' });
        break;
      }
      case 'confetti':
      default:
        SFX.play('confetti'); Confetti.fromEl(btn, { count: 80, spread: 85, power: 12 });
    }
    U.emit('hold:complete', { btn, action });
  }

  /* ---- balance the books (stop the marker inside the green zone) ------------- */
  function initBalance(box) {
    U.noFlip(box);
    const marker = box.querySelector('.balance__marker');
    const btn = box.querySelector('[data-balance-btn]');
    const msg = box.querySelector('.balance__msg');
    const tries = U.$$('.balance__tries i', box);
    const assets = box.querySelector('[data-assets]');
    const ZONE_L = 42, ZONE_W = 16;
    let running = false, t0 = 0, raf = null, x = 0, attempt = 0, speed = 1;

    function loop(now) {
      const t = (now - t0) / 1000 * speed;
      x = (Math.sin(t * Math.PI * 1.25 - Math.PI / 2) + 1) / 2 * 100;
      marker.style.left = x + '%';
      if (assets) assets.textContent = '$' + U.fmtNum(900 + (x - 50) * 6) + 'k';
      raf = requestAnimationFrame(loop);
    }
    btn.addEventListener('click', () => {
      SFX.unlock();
      if (!running) {
        running = true; t0 = performance.now();
        raf = requestAnimationFrame(loop);
        btn.textContent = 'Stop!'; msg.textContent = ''; msg.classList.remove('is-bad');
        SFX.play('click');
        return;
      }
      cancelAnimationFrame(raf); running = false; attempt++;
      const dist = Math.abs(x - (ZONE_L + ZONE_W / 2));
      if (tries[attempt - 1]) tries[attempt - 1].classList.add('is-on');
      if (dist <= ZONE_W / 2) {
        msg.textContent = dist < 2 ? 'Perfectly balanced. The auditors are impressed.' : 'Balanced! The books close clean.';
        SFX.play('win');
        Confetti.fromEl(box, { count: 80, spread: 85, power: 11 });
        Store.ACH.unlock('balance');
        btn.textContent = 'Play again';
        attempt = 0; speed = Math.min(2.2, speed + .3);
        setTimeout(() => tries.forEach(i => i.classList.remove('is-on')), 900);
      } else {
        msg.textContent = (x < ZONE_L ? 'Liabilities too high' : 'Assets overstated') + ` — off by $${U.fmtNum(dist * 6)}k.`;
        msg.classList.add('is-bad');
        SFX.play('fail');
        if (attempt >= 3) { btn.textContent = 'Try again'; attempt = 0; setTimeout(() => tries.forEach(i => i.classList.remove('is-on')), 700); }
        else btn.textContent = 'Spin again';
      }
    });
  }

  /* ---- reader poll ------------------------------------------------------------- */
  function initPoll(poll) {
    const opts = U.$$('.poll__opt', poll);
    const key = 'poll.' + (poll.dataset.poll || 'default');
    const base = CONFIG.seeds.poll || [];
    function show(mine) {
      poll.classList.add('is-voted');
      const counts = opts.map((o, i) => (base[i] || 10) + (i === mine ? 1 : 0));
      const total = counts.reduce((a, b) => a + b, 0);
      opts.forEach((o, i) => {
        const pct = Math.round(counts[i] / total * 100);
        o.querySelector('.poll__bar').style.width = pct + '%';
        o.querySelector('.poll__pct').textContent = pct + '%';
        o.classList.toggle('is-mine', i === mine);
      });
    }
    const prev = Store.get(key, null);
    if (prev != null) show(prev);
    opts.forEach((o, i) => o.addEventListener('click', () => {
      if (poll.classList.contains('is-voted')) return;
      Store.set(key, i); show(i);
      SFX.play('coin');
      Confetti.fromEl(o, { count: 26, power: 7, spread: 70 });
      Store.ACH.unlock('voter');
    }));
  }

  /* ---- pop & flap: hold a circle until it pops, then a flap drops with the answer -- */
  function initPopflap(box) {
    U.noFlip(box);
    const btn = box.querySelector('.popflap__btn'), label = box.querySelector('.popflap__label');
    const dur = +box.dataset.hold || 1200;
    let p = 0, raf = null, holding = false, last = 0, lastTick = 0, open = false, popping = false;
    function frame(now) {
      const dt = Math.min(50, now - last); last = now;
      p = U.clamp(p + (holding ? dt / dur : -dt / (dur * .5)), 0, 1);
      box.style.setProperty('--p', p.toFixed(3));
      if (holding) {
        const q = Math.floor(p * 6);
        if (q !== lastTick && q > 0 && q < 6) { lastTick = q; SFX.play('charge', p); }
        if (p >= 1) { pop(); return; }
      }
      raf = (p > 0 || holding) ? requestAnimationFrame(frame) : null;
    }
    function pop() {
      holding = false; raf = null; popping = true;
      box.classList.remove('is-holding'); box.classList.add('is-pop');
      SFX.play('confetti');
      Confetti.fromEl(btn, { count: 55, spread: 140, power: 9 });
      setTimeout(() => {
        box.classList.remove('is-pop'); box.classList.add('is-open');
        open = true; popping = false; p = 0; box.style.setProperty('--p', 0);
        label.textContent = '✓';
        SFX.play('flipHard');
        if (Store.counters.inc('curious') >= 5) Store.ACH.unlock('curious');
      }, 430);
    }
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); SFX.unlock();
      if (popping) return;
      if (open) { open = false; box.classList.remove('is-open'); label.textContent = 'Hold'; SFX.play('unpop'); return; }
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      holding = true; last = performance.now(); lastTick = 0;
      box.classList.add('is-holding');
      if (!raf) raf = requestAnimationFrame(frame);
    });
    const stop = () => { holding = false; box.classList.remove('is-holding'); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => btn.addEventListener(t, stop));
  }

  /* ---- "would you rather" two-sided poll ---------------------------------------- */
  function initWyr(box) {
    const opts = U.$$('.wyr__opt', box);
    const key = 'wyr.' + (box.dataset.wyr || 'default');
    const seed = (CONFIG.seeds.wyr || {})[box.dataset.wyr] || [50, 50];
    const foot = box.querySelector('.wyr__foot');
    const barA = box.querySelector('.wyr__bar .a'), barB = box.querySelector('.wyr__bar .b');
    function show(mine, animate) {
      box.classList.add('is-voted');
      const counts = seed.map((c, i) => c + (i === mine ? 1 : 0));
      const total = counts[0] + counts[1];
      const pA = Math.round(counts[0] / total * 100), pcts = [pA, 100 - pA];
      opts.forEach((o, i) => {
        o.classList.toggle('is-mine', i === mine);
        const el = o.querySelector('.wyr__pct');
        if (animate) U.countTo(el, pcts[i], { suffix: '%', duration: 1100 }); else el.textContent = pcts[i] + '%';
      });
      requestAnimationFrame(() => { barA.style.width = pA + '%'; barB.style.width = (100 - pA) + '%'; });
      if (foot) foot.textContent = `${U.fmtNum(total)} readers answered · you are with the ${pcts[mine] >= 50 ? 'majority' : 'minority'}`;
    }
    const prev = Store.get(key, null);
    if (prev != null) show(prev, false);
    opts.forEach((o, i) => o.addEventListener('click', () => {
      if (box.classList.contains('is-voted')) return;
      Store.set(key, i); show(i, true);
      SFX.play('coin');
      Confetti.fromEl(o, { count: 34, power: 8, spread: 75 });
      Store.ACH.unlock('voter');
    }));
  }

  /* ---- before/after compare slider -------------------------------------------- */
  function initCompare(c) {
    U.noFlip(c);
    let drag = false;
    const set = e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--x', U.clamp((e.clientX - r.left) / r.width * 100, 2, 98) + '%');
    };
    c.addEventListener('pointerdown', e => { drag = true; try { c.setPointerCapture(e.pointerId); } catch (x) {} set(e); SFX.play('tick'); });
    c.addEventListener('pointermove', e => { if (drag) set(e); });
    ['pointerup', 'pointercancel'].forEach(t => c.addEventListener(t, () => drag = false));
  }

  /* ---- things that animate when their page comes into view --------------------- */
  function onPageVisible(page) {
    if (page.dataset.animated) return;
    page.dataset.animated = '1';
    U.$$('.counter[data-to]', page).forEach((n, i) =>
      setTimeout(() => U.countTo(n, +n.dataset.to, { suffix: n.dataset.suffix || '', prefix: n.dataset.prefix || '' }), 200 + i * 140));
    U.$$('.meter__fill[data-v]', page).forEach((n, i) =>
      setTimeout(() => { n.style.width = n.dataset.v + '%'; }, 350 + i * 110));
  }

  /* ---- wire everything ------------------------------------------------------------ */
  function init() {
    // navigation hooks inside pages
    U.$$('[data-goto]').forEach(n => n.addEventListener('click', e => {
      e.stopPropagation(); SFX.play('click'); Book.goTo(+n.dataset.goto);
    }));

    U.$$('.hold, .holdbar').forEach(initHold);
    U.$$('.balance').forEach(initBalance);
    U.$$('.poll').forEach(initPoll);
    U.$$('.wyr').forEach(initWyr);
    U.$$('.popflap').forEach(initPopflap);
    U.$$('.compare').forEach(initCompare);
    U.$$('[data-ach-total]').forEach(n => n.textContent = Store.ACH.list.length);

    U.$$('.flipcard').forEach(c => c.addEventListener('click', () => { c.classList.toggle('is-flipped'); SFX.play('flip'); }));
    U.$$('.popcard').forEach(c => c.addEventListener('click', e => { if (e.target.closest('button, a')) return; UI.popcard(c); }));
    U.$$('.drawer__tab').forEach(t => t.addEventListener('click', () => {
      const d = t.closest('.drawer'); d.classList.toggle('is-open'); SFX.play('whoosh');
    }));
    U.$$('.acc__head').forEach(h => h.addEventListener('click', () => {
      const acc = h.closest('.acc'); const open = acc.classList.contains('is-open');
      U.$$('.acc.is-open', acc.parentElement).forEach(a => a !== acc && a.classList.remove('is-open'));
      acc.classList.toggle('is-open', !open);
      SFX.play(open ? 'unpop' : 'pop');
    }));
    U.$$('.tag[data-tip], .world__dot[data-tip], [data-tip]').forEach(t => t.addEventListener('click', e => {
      e.stopPropagation();
      UI.tooltip(t, (t.dataset.tipTitle ? `<b>${UI.esc(t.dataset.tipTitle)}</b>` : '') + UI.esc(t.dataset.tip));
    }));
    U.$$('.tag--filter').forEach(t => t.addEventListener('click', () => {
      const group = t.closest('.tagcloud');
      const was = t.classList.contains('is-on');
      U.$$('.tag--filter', group).forEach(x => x.classList.remove('is-on'));
      const cards = U.$$('.rcard', t.closest('.sheet'));
      if (was) cards.forEach(c => c.classList.remove('is-dim'));
      else { t.classList.add('is-on'); cards.forEach(c => c.classList.toggle('is-dim', !(c.dataset.tags || '').split(' ').includes(t.dataset.filter))); }
      SFX.play('click');
    }));

    // RSVP + save buttons (persisted)
    U.$$('.rsvp').forEach(b => {
      const key = 'rsvp.' + b.dataset.event;
      if (Store.get(key)) { b.classList.add('is-on'); b.textContent = 'Going ✓'; }
      b.addEventListener('click', () => {
        const on = !b.classList.contains('is-on');
        b.classList.toggle('is-on', on); Store.set(key, on);
        b.textContent = on ? 'Going ✓' : 'RSVP';
        SFX.play(on ? 'coin' : 'unpop');
        if (on) Confetti.fromEl(b, { count: 30, power: 7, spread: 70 });
      });
    });
    const savedCount = () => U.$$('.save.is-on').length;
    U.$$('.save').forEach(b => {
      const key = 'save.' + b.dataset.program;
      if (Store.get(key)) b.classList.add('is-on');
      b.addEventListener('click', e => {
        e.stopPropagation();
        const on = !b.classList.contains('is-on');
        b.classList.toggle('is-on', on); Store.set(key, on);
        SFX.play(on ? 'coin' : 'unpop');
        if (on) Confetti.fromEl(b, { count: 22, power: 6, spread: 80, colors: ['#C8A951', '#E8D08A', '#fff'] });
        U.$$('[data-saved-count]').forEach(n => n.textContent = savedCount());
      });
    });
    U.$$('[data-saved-count]').forEach(n => n.textContent = savedCount());

    // confetti buttons, expand buttons, share buttons
    U.$$('[data-confetti]').forEach(b => b.addEventListener('click', () => { SFX.play('confetti'); Confetti.fromEl(b, { count: 80, spread: 85, power: 12 }); }));
    U.$$('[data-expand]').forEach(b => b.addEventListener('click', () => { const g = U.$(b.dataset.expand); if (g) UI.expand(g); }));
    U.$$('[data-share]').forEach(b => b.addEventListener('click', async () => {
      SFX.play('click');
      try { await navigator.clipboard.writeText(location.href); UI.toast({ kick: 'Share', title: 'Link copied', text: 'Paste it anywhere.', icon: '🔗', type: 'info', ms: 2200 }); }
      catch (e) { UI.toast({ kick: 'Share', title: 'Copy this link', text: location.href, icon: '🔗', type: 'info' }); }
    }));
    U.$$('[data-open-ach]').forEach(b => b.addEventListener('click', () => UI.achievements()));
    U.$$('[data-open-lb]').forEach(b => b.addEventListener('click', () => UI.leaderboard(b.dataset.openLb || 'zip')));

    // glossy cover follows the pointer; LAU mark easter egg
    U.$$('.cover').forEach(c => {
      const gloss = c.querySelector('.cover__gloss');
      if (!gloss) return;
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        gloss.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
        gloss.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
    U.$$('.lau-mark').forEach(m => {
      let taps = 0;
      m.addEventListener('click', e => {
        e.stopPropagation(); taps++;
        SFX.play('tick'); m.style.animation = 'none'; void m.offsetWidth; m.style.animation = 'wiggle .4s';
        if (taps === 5) { taps = 0; SFX.play('confetti'); Confetti.fromEl(m, { count: 120, spread: 120, power: 14 }); UI.toast({ kick: 'Easter egg', title: 'Go Green!', text: 'You found the hidden confetti.', icon: '🎉', type: 'info' }); }
      });
    });

    // pages explored ring + badges
    U.renderRing = () => {
      const ring = U.$('[data-ring="pages"]');
      if (!ring) return;
      const visited = Store.progress.visited().length, total = Book.total || 16;
      ring.style.setProperty('--p', visited / total);
      ring.querySelector('b').textContent = visited;
      ring.querySelector('.tot').textContent = total;
      U.$$('.toc li[data-goto]').forEach(li => li.classList.toggle('is-visited', Store.progress.visited().includes(+li.dataset.goto)));
    };
    U.on('book:pages', () => U.renderRing());
    UI.renderAllBadges();
    U.$$('[data-ach-count]').forEach(n => n.textContent = Store.ACH.count());

    // live applause count
    const ac = U.$('#applause-count');
    if (ac) ac.textContent = U.fmtNum(CONFIG.seeds.applause + Store.counters.get('applause'));

    // hall of fame on the back cover
    renderHall();
    U.on('lb:update', renderHall);
  }

  function renderHall() {
    const hall = U.$('[data-hall]');
    if (!hall) return;
    hall.innerHTML = '';
    Object.entries(Store.LB.games).forEach(([g, def]) => {
      const top = Store.LB.top(g, 3);
      const box = U.el('div', {}, [U.el('div', { class: 'hall__game', html: `${def.icon} ${UI.esc(def.label)}` })]);
      if (!top.length) box.append(U.el('div', { class: 'hall__empty', text: 'No scores yet' }));
      top.forEach((e, i) => box.append(U.el('div', { class: 'hall__entry' }, [U.el('span', { text: `${['🥇', '🥈', '🥉'][i]} ${e.name}` }), U.el('span', { text: def.fmt(e.score) })])));
      hall.append(box);
    });
  }

  return { init, onPageVisible, initHold };
})();

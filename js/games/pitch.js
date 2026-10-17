/* games/pitch.js — "Pitch Rush": a rapid-tap game with a pure time limit.
   Tap as fast as you can for N seconds. There is no score cap: every tap is a pitch,
   funding climbs live, and milestones (angel round → unicorn) keep unlocking the
   faster you go. Investor moods react to your current tap rate. */
window.Games = window.Games || {};

Games.pitch = (() => {
  const FACES = [['😐', '🙂', '😃', '🤩'], ['🤨', '🙂', '😄', '🤑'], ['😶', '🙂', '😁', '🥳']];
  const LABELS = ['skeptical', 'interested', 'excited', 'sold!'];
  const NAMES = ['Angel investor', 'VC partner', 'Bank director'];
  const MILESTONES = [
    { at: 20, label: 'Angel round', emoji: '😇' },
    { at: 45, label: 'Seed round', emoji: '🌱' },
    { at: 70, label: 'Term sheet', emoji: '📝' },
    { at: 100, label: 'Series A', emoji: '🚀' },
    { at: 135, label: 'Series B', emoji: '🏦' },
    { at: 175, label: 'Unicorn', emoji: '🦄' },
    { at: 230, label: 'IPO', emoji: '🔔' },
  ];
  const PER_PITCH = 12500;

  function mount(root) {
    const secs = CONFIG.games.pitchSeconds;
    let state = 'idle', clicks = 0, taps = [], nextIdx = 0, raf = null, endAt = 0, best = Store.get('pitch.best', 0);
    const sh = Games.shell({
      root, game: 'pitch', title: 'Pitch Rush', icon: '🚀',
      howto: [
        `Tap <b>PITCH</b> to start a ${secs}-second round. The clock is the only limit.`,
        'Every tap is one pitch and adds funding. There is no cap — keep going.',
        'Hit milestones (angel round, seed, term sheet, Series A, unicorn…) by piling up pitches.',
        'Investors react to your tap <b>rate</b>: slow down and they cool off. Space bar works too.',
      ],
    });
    sh.body.innerHTML = `<div class="pitch">
      <div class="pitch__investors">${NAMES.map((nm, i) => `<div class="investor" data-mood="0"><div class="investor__face">${FACES[i][0]}</div><b>${nm}</b><span class="mood">${LABELS[0]}</span></div>`).join('')}</div>
      <div class="pitch__next"><span>Next: <b class="n-label">${MILESTONES[0].label}</b></span><span class="n-togo">${MILESTONES[0].at} pitches to go</span></div>
      <div class="pitch__meter"><div class="pitch__fill"></div></div>
      <div class="pitch__btnwrap"><button class="pitch__btn" type="button" data-hot>PITCH<small>tap to start</small></button></div>
      <div class="pitch__stats"><div>Pitches<b class="s-clicks">0</b></div><div>Funding<b class="s-fund">$0</b></div><div>Your best<b class="s-best">${U.fmtNum(best)}</b></div></div>
      <div class="pitch__count"></div>
    </div>`;
    const box = sh.q('.pitch'), btn = sh.q('.pitch__btn'), fill = sh.q('.pitch__fill'), meter = sh.q('.pitch__meter'), countEl = sh.q('.pitch__count');
    const investors = U.$$('.investor', box), sClicks = sh.q('.s-clicks'), sFund = sh.q('.s-fund'), sBest = sh.q('.s-best');
    const nLabel = sh.q('.n-label'), nTogo = sh.q('.n-togo');
    sh.timer.set(secs.toFixed(1) + 's');

    function setMoods(now) {
      while (taps.length && now - taps[0] > 1200) taps.shift();
      const rate = taps.length;
      const m = rate >= 10 ? 3 : rate >= 6 ? 2 : rate >= 3 ? 1 : 0;
      investors.forEach((inv, i) => {
        if (+inv.dataset.mood === m) return;
        inv.dataset.mood = m;
        inv.querySelector('.investor__face').textContent = FACES[i][m];
        inv.querySelector('.mood').textContent = LABELS[m];
      });
    }
    function updateMeter() {
      const prev = nextIdx ? MILESTONES[nextIdx - 1].at : 0;
      const next = MILESTONES[nextIdx];
      if (!next) { fill.style.width = '100%'; nLabel.textContent = 'Legend'; nTogo.textContent = 'every milestone cleared'; return; }
      fill.style.width = Math.min(100, (clicks - prev) / (next.at - prev) * 100) + '%';
      nLabel.textContent = next.label;
      nTogo.textContent = `${next.at - clicks} pitch${next.at - clicks === 1 ? '' : 'es'} to go`;
    }
    function loop(now) {
      setMoods(now);
      const left = Math.max(0, endAt - now);
      sh.timer.set((left / 1000).toFixed(1) + 's');
      if (left <= 0) { finish(); return; }
      raf = requestAnimationFrame(loop);
    }
    function showCount(txt, small) {
      countEl.innerHTML = '';
      countEl.append(U.el('span', { text: txt, class: small ? 'ms' : '' }));
    }
    function start() {
      state = 'countdown'; clicks = 0; taps = []; nextIdx = 0;
      sClicks.textContent = '0'; sFund.textContent = '$0';
      btn.disabled = true; btn.innerHTML = 'READY<small>get set…</small>';
      sh.status(''); updateMeter(); investors.forEach(inv => { inv.dataset.mood = '0'; });
      let c = 3;
      const tick = () => {
        if (c > 0) { showCount(c); SFX.play('countdown'); c--; setTimeout(tick, 600); return; }
        showCount('GO!'); SFX.play('go');
        state = 'running'; btn.disabled = false; btn.innerHTML = 'PITCH<small>tap tap tap</small>'; btn.classList.add('is-go');
        endAt = performance.now() + secs * 1000;
        sh.timerEl.classList.add('is-running');
        raf = requestAnimationFrame(loop);
      };
      tick();
    }
    function milestone(m) {
      showCount(`${m.emoji} ${m.label}!`, true);
      SFX.play('coin');
      meter.classList.remove('is-flash'); void meter.offsetWidth; meter.classList.add('is-flash');
      Confetti.fromEl(meter, { count: 28 + nextIdx * 8, power: 8, spread: 90, colors: ['#C8A951', '#E8D08A', '#006341', '#fff'] });
    }
    function pitch(x, y) {
      if (state !== 'running') return;
      const now = performance.now();
      clicks++; taps.push(now);
      sClicks.textContent = clicks;
      sFund.textContent = '$' + U.fmtNum(clicks * PER_PITCH);
      btn.classList.add('is-down'); setTimeout(() => btn.classList.remove('is-down'), 60);
      SFX.play('tick');
      const b = U.el('div', { class: 'pitch__bubble', text: clicks % 10 === 0 ? '+$' + U.fmtNum(PER_PITCH * 10 / 1000) + 'k' : '+1' });
      const r = box.getBoundingClientRect();
      b.style.left = ((x != null ? x : (r.left + r.width / 2)) - r.left + U.rand(-30, 30)) + 'px';
      b.style.top = ((y != null ? y : (r.top + r.height / 2)) - r.top - 10) + 'px';
      b.style.setProperty('--dx', U.rand(-40, 40) + 'px');
      box.append(b); setTimeout(() => b.remove(), 800);
      while (nextIdx < MILESTONES.length && clicks >= MILESTONES[nextIdx].at) { milestone(MILESTONES[nextIdx]); nextIdx++; }
      updateMeter();
      setMoods(now);
    }
    function finish() {
      state = 'done'; raf = null; taps = [];
      btn.classList.remove('is-go'); btn.innerHTML = 'PITCH<small>play again</small>';
      sh.timerEl.classList.remove('is-running'); sh.timer.set('0.0s');
      SFX.play('timeup');
      investors.forEach((inv, i) => { const m = Math.min(3, nextIdx); inv.dataset.mood = m; inv.querySelector('.investor__face').textContent = FACES[i][m]; inv.querySelector('.mood').textContent = LABELS[m]; });
      const funding = clicks * PER_PITCH;
      const reached = nextIdx ? MILESTONES[nextIdx - 1] : null;
      if (clicks > best) { best = clicks; Store.set('pitch.best', best); sBest.textContent = U.fmtNum(best); }
      if (clicks >= 60) { Confetti.cannons(); SFX.play('win'); Store.ACH.unlock('pitch'); }
      else if (clicks >= 30) Confetti.fromEl(btn, { count: 80, spread: 90, power: 12 });
      sh.status(reached ? `${reached.emoji} ${reached.label} reached — ${clicks} pitches, $${U.fmtNum(funding / 1000)}k raised.` : `${clicks} pitches. The room needs more energy — try again!`);
      setTimeout(() => UI.gameResult({ game: 'pitch', score: clicks, meta: { funding, milestone: reached ? reached.label : null } }), 1300);
    }

    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); SFX.unlock();
      if (state === 'idle' || state === 'done') { SFX.play('click'); start(); }
      else pitch(e.clientX, e.clientY);
    });
    document.addEventListener('keydown', e => {
      if (e.repeat || state !== 'running' || (e.key !== ' ' && e.key !== 'Enter')) return;
      if (UI.isOpen() && !root.closest('.expand')) return;
      e.preventDefault(); pitch();
    });
    return { start };
  }
  return { mount, MILESTONES };
})();

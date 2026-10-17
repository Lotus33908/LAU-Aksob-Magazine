/* games/queens.js — "Queens": one crown per row, column and colour region; no two
   crowns may touch, not even diagonally. Boards are generated from a valid placement
   and regions grown around each queen, so every board has a solution. */
window.Games = window.Games || {};

Games.queens = (() => {
  const PALETTE = ['#F6D5D5', '#D5E8F6', '#F6EDC9', '#D8F0DD', '#E8D9F5', '#F9DFC4', '#D9F2F0', '#E3E3E3', '#F5D9EA'];

  function placeQueens(n) {
    const cols = [], used = new Set();
    (function rec(r) {
      if (r === n) return true;
      for (const c of U.shuffle([...Array(n).keys()])) {
        if (used.has(c)) continue;
        if (r > 0 && Math.abs(cols[r - 1] - c) < 2) continue;
        cols[r] = c; used.add(c);
        if (rec(r + 1)) return true;
        used.delete(c);
      }
      return false;
    })(0);
    return cols;
  }
  function makeRegions(n, cols) {
    const region = new Array(n * n).fill(-1);
    cols.forEach((c, r) => { region[r * n + c] = r; });
    const nb = i => {
      const r = Math.floor(i / n), c = i % n, o = [];
      if (r > 0) o.push(i - n); if (r < n - 1) o.push(i + n);
      if (c > 0) o.push(i - 1); if (c < n - 1) o.push(i + 1);
      return o;
    };
    const weights = cols.map(() => U.rand(.4, 1.6));
    let remaining = n * n - n;
    while (remaining > 0) {
      const cands = [];
      for (let i = 0; i < n * n; i++) if (region[i] !== -1) {
        const free = nb(i).filter(j => region[j] === -1);
        if (free.length) cands.push({ i, free });
      }
      if (!cands.length) break;
      const tot = cands.reduce((s, c) => s + weights[region[c.i]], 0);
      let x = Math.random() * tot, chosen = cands[0];
      for (const c of cands) { x -= weights[region[c.i]]; if (x <= 0) { chosen = c; break; } }
      const j = U.pick(chosen.free);
      region[j] = region[chosen.i]; remaining--;
    }
    return region;
  }

  function mount(root) {
    const n = CONFIG.games.queensSize;
    let region = [], state = [], autoX = true, won = false, started = false, cellsEl = [];
    const sh = Games.shell({
      root, game: 'queens', title: 'Queens', icon: 'crown',
      howto: [
        `Place exactly <b>one crown</b> in every row, every column and every colour region (${n} in total).`,
        'Crowns can never <b>touch</b> — not even diagonally.',
        'Tap a cell to mark ✕, tap again for a crown, again to clear.',
        '<b>Auto-✕</b> marks cells a new crown rules out. Fastest solve wins.',
      ],
      tools: [
        { label: 'New board', onClick: () => newGame() },
        { label: 'Auto-✕', ref: b => { b.classList.add('is-on'); b.dataset.auto = '1'; }, onClick: b => { autoX = !autoX; b.classList.toggle('is-on', autoX); } },
      ],
    });
    sh.body.innerHTML = `<div class="queens"><div class="queens__grid" data-hot></div>
      <div class="queens__legend"><span><b>1 tap</b> ✕</span><span><b>2 taps</b> ${Icons.svg('crown')}</span><span><b>3 taps</b> clear</span></div></div>`;
    const box = sh.q('.queens'), grid = sh.q('.queens__grid');
    grid.style.setProperty('--n', n);

    function newGame() {
      const cols = placeQueens(n);
      region = makeRegions(n, cols);
      state = new Array(n * n).fill(0);   // 0 empty, 1 x (manual), 2 queen
      won = false; started = false;
      box.classList.remove('is-won');
      sh.timer.reset();
      grid.innerHTML = ''; cellsEl = [];
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n), c = i % n;
        const cls = ['queens__cell'];
        if (r > 0 && region[i - n] !== region[i]) cls.push('bt');
        if (c > 0 && region[i - 1] !== region[i]) cls.push('bl');
        const cell = U.el('div', { class: cls.join(' '), style: `--c:${PALETTE[region[i] % PALETTE.length]}` });
        cell.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
        grid.append(cell); cellsEl.push(cell);
      }
      render(); sh.status('');
    }
    const touching = (a, b) => Math.max(Math.abs(Math.floor(a / n) - Math.floor(b / n)), Math.abs(a % n - b % n)) === 1;
    function autoMarks() {
      const marks = new Set();
      state.forEach((s, q) => {
        if (s !== 2) return;
        const r = Math.floor(q / n), c = q % n;
        for (let i = 0; i < n * n; i++) {
          if (i === q || state[i] === 2) continue;
          if (Math.floor(i / n) === r || i % n === c || region[i] === region[q] || touching(i, q)) marks.add(i);
        }
      });
      return marks;
    }
    function tap(i) {
      if (won) return;
      if (!started) { started = true; sh.timer.start(); }
      SFX.unlock();
      const auto = autoX ? autoMarks() : new Set();
      const shownX = state[i] === 1 || (state[i] === 0 && auto.has(i));
      if (state[i] === 2) { state[i] = 0; SFX.play('erase'); }
      else if (shownX) { state[i] = 2; SFX.play('place'); }
      else { state[i] = 1; SFX.play('tick'); }
      render();
    }
    function render() {
      const auto = autoX ? autoMarks() : new Set();
      const queens = [...Array(n * n).keys()].filter(i => state[i] === 2);
      const bad = new Set();
      queens.forEach(a => queens.forEach(b => {
        if (a >= b) return;
        if (Math.floor(a / n) === Math.floor(b / n) || a % n === b % n || region[a] === region[b] || touching(a, b)) { bad.add(a); bad.add(b); }
      }));
      cellsEl.forEach((el, i) => {
        el.classList.toggle('is-q', state[i] === 2);
        el.classList.toggle('is-x', state[i] === 1 || (state[i] === 0 && auto.has(i)));
        el.classList.toggle('is-bad', bad.has(i));
      });
      if (queens.length === n && !bad.size) win();
      else if (queens.length > n) sh.status('Too many crowns', true);
      else if (bad.size) sh.status('Crowns are clashing', true);
      else sh.status(queens.length ? `${queens.length} / ${n} crowns placed` : '');
    }
    function win() {
      won = true;
      const time = sh.timer.stop();
      box.classList.add('is-won');
      sh.status('All crowns placed in ' + U.fmtTime(time) + '!');
      SFX.play('win');
      Confetti.fromEl(grid, { count: 130, spread: 95, power: 14, colors: ['#C8A951', '#E8D08A', '#006341', '#fff'] });
      Store.ACH.unlock('queens');
      setTimeout(() => UI.gameResult({ game: 'queens', score: time, time }), 800);
    }

    newGame();
    return { newGame };
  }

  return { mount, placeQueens, makeRegions };
})();

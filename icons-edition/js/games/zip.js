/* games/zip.js — "Zip": draw one line through every cell, hitting the numbers in order.
   Puzzles are generated from a random Hamiltonian path (backbite algorithm), so
   every board is guaranteed solvable. */
window.Games = window.Games || {};

Games.zip = (() => {
  function hamiltonianPath(n) {
    let path = [];
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) row.push(r * n + c);
      if (r % 2) row.reverse();
      path.push(...row);
    }
    const nb = i => {
      const r = Math.floor(i / n), c = i % n, out = [];
      if (r > 0) out.push(i - n); if (r < n - 1) out.push(i + n);
      if (c > 0) out.push(i - 1); if (c < n - 1) out.push(i + 1);
      return out;
    };
    for (let k = 0, iters = n * n * 45; k < iters; k++) {
      if (Math.random() < .5) path.reverse();
      const end = path[path.length - 1];
      const cands = nb(end).filter(v => v !== path[path.length - 2]);
      if (!cands.length) continue;
      const v = cands[Math.floor(Math.random() * cands.length)];
      const idx = path.indexOf(v);
      path = path.slice(0, idx + 1).concat(path.slice(idx + 1).reverse());
    }
    return path;
  }

  function makePuzzle(n, k) {
    const path = hamiltonianPath(n), L = path.length;
    let idxs = null;
    for (let tries = 0; tries < 60 && !idxs; tries++) {
      const cand = U.shuffle([...Array(L - 2).keys()].map(i => i + 1)).slice(0, k - 2).sort((a, b) => a - b);
      let ok = true, prev = 0;
      for (const i of cand) { if (i - prev < 3) { ok = false; break; } prev = i; }
      if (L - 1 - prev < 3) ok = false;
      if (ok) idxs = cand;
    }
    if (!idxs) idxs = [...Array(k - 2).keys()].map(i => Math.round((i + 1) * (L - 1) / (k - 1)));
    const numbers = {};
    [0, ...idxs, L - 1].forEach((pi, i) => { numbers[path[pi]] = i + 1; });
    return { n, path, numbers, k };
  }

  function mount(root) {
    const n = CONFIG.games.zipSize;
    let puzzle, cells = [], pathCells = [], drawing = false, won = false;

    const sh = Games.shell({
      root, game: 'zip', title: 'Zip', icon: 'zip',
      howto: [
        'Press on <b>1</b> and drag to draw a single line.',
        'Visit the numbers <b>in order</b> and fill <b>every cell</b> of the grid.',
        'Drag back over your line to erase. End on the last number.',
        'Fastest time wins the leaderboard.',
      ],
      tools: [
        { label: 'New puzzle', onClick: () => newGame() },
        { label: 'Clear', onClick: () => { if (won) return; pathCells = []; render(); sh.status(''); } },
      ],
    });
    sh.body.innerHTML = `<div class="zip" data-hot>
      <div class="zip__grid"></div>
      <svg class="zip__svg" viewBox="0 0 ${n} ${n}"><path class="zip__path zip__path--glow"/><path class="zip__path"/><circle class="zip__head" r=".2"/></svg>
    </div>`;
    const zipEl = sh.q('.zip'), grid = sh.q('.zip__grid'), svg = sh.q('.zip__svg');
    const glow = svg.querySelector('.zip__path--glow'), line = svg.querySelectorAll('.zip__path')[1], head = svg.querySelector('.zip__head');
    grid.style.setProperty('--n', n);

    function newGame() {
      puzzle = makePuzzle(n, 6 + Math.floor(Math.random() * 3));
      pathCells = []; won = false;
      sh.timer.reset();
      zipEl.classList.remove('is-won');
      grid.innerHTML = ''; cells = [];
      for (let i = 0; i < n * n; i++) {
        const c = U.el('div', { class: 'zip__cell', dataset: { i } });
        if (puzzle.numbers[i]) c.append(U.el('div', { class: 'zip__num', text: puzzle.numbers[i] }));
        grid.append(c); cells.push(c);
      }
      render(); sh.status('Draw from 1 — hit every number in order');
    }
    const nextNumber = () => { let m = 0; for (const i of pathCells) if (puzzle.numbers[i]) m = Math.max(m, puzzle.numbers[i]); return m + 1; };
    const adjacent = (a, b) => Math.abs(Math.floor(a / n) - Math.floor(b / n)) + Math.abs(a % n - b % n) === 1;

    function render() {
      cells.forEach(c => c.classList.remove('is-on'));
      pathCells.forEach(i => cells[i].classList.add('is-on'));
      const done = new Set(pathCells.filter(i => puzzle.numbers[i]).map(i => puzzle.numbers[i]));
      const next = nextNumber();
      U.$$('.zip__num', grid).forEach(el => { const v = +el.textContent; el.classList.toggle('is-done', done.has(v)); el.classList.toggle('is-next', v === next && !won); });
      const d = pathCells.map((i, k) => (k ? 'L' : 'M') + (i % n + .5) + ' ' + (Math.floor(i / n) + .5)).join(' ');
      line.setAttribute('d', d); glow.setAttribute('d', d);
      if (pathCells.length) {
        const last = pathCells[pathCells.length - 1];
        head.setAttribute('cx', last % n + .5); head.setAttribute('cy', Math.floor(last / n) + .5); head.style.display = '';
      } else head.style.display = 'none';
    }

    function tryAdd(i) {
      if (won) return;
      if (!pathCells.length) {
        if (puzzle.numbers[i] === 1) { pathCells.push(i); sh.timer.start(); SFX.play('draw', 0); render(); sh.status(''); }
        else sh.status('Start on 1', true);
        return;
      }
      const last = pathCells[pathCells.length - 1];
      if (i === last) return;
      const pos = pathCells.indexOf(i);
      if (pos !== -1) { pathCells = pathCells.slice(0, pos + 1); SFX.play('erase'); render(); return; }
      if (!adjacent(last, i)) return;
      const num = puzzle.numbers[i];
      if (num && num !== nextNumber()) { sh.status(`Reach ${nextNumber()} first`, true); return; }
      if (num === puzzle.k && pathCells.length !== n * n - 1) { sh.status(`Fill every cell before ending on ${puzzle.k}`, true); return; }
      pathCells.push(i); SFX.play('draw', pathCells.length); render(); sh.status('');
      if (pathCells.length === n * n) {
        if (puzzle.numbers[pathCells[pathCells.length - 1]] === puzzle.k) win();
        else sh.status('Must end on ' + puzzle.k, true);
      }
    }
    function win() {
      won = true;
      const time = sh.timer.stop();
      zipEl.classList.add('is-won'); render();
      sh.status('Zipped in ' + U.fmtTime(time) + '!');
      SFX.play('win');
      Confetti.fromEl(grid, { count: 120, spread: 90, power: 14 });
      Store.ACH.unlock('zip');
      setTimeout(() => UI.gameResult({ game: 'zip', score: time, time }), 700);
    }

    const cellAt = (x, y) => {
      const t = document.elementFromPoint(x, y);
      const c = t && t.closest ? t.closest('.zip__cell') : null;
      return c && grid.contains(c) ? +c.dataset.i : null;
    };
    zipEl.addEventListener('pointerdown', e => {
      e.preventDefault(); drawing = true; SFX.unlock();
      try { zipEl.setPointerCapture(e.pointerId); } catch (x) {}
      const i = cellAt(e.clientX, e.clientY); if (i != null) tryAdd(i);
    });
    zipEl.addEventListener('pointermove', e => { if (!drawing) return; const i = cellAt(e.clientX, e.clientY); if (i != null) tryAdd(i); });
    ['pointerup', 'pointercancel'].forEach(t => zipEl.addEventListener(t, () => drawing = false));

    newGame();
    return { newGame };
  }

  return { mount, makePuzzle, hamiltonianPath };
})();

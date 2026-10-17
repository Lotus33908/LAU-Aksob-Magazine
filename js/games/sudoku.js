/* games/sudoku.js — classic 9x9 with a unique-solution generator, pencil marks,
   conflicts, hints (30 s penalty), undo, keyboard input and a timed leaderboard. */
window.Games = window.Games || {};

Games.sudoku = (() => {
  /* ---- generator ------------------------------------------------------- */
  function ok(g, r, c, v) {
    for (let k = 0; k < 9; k++) if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
    const br = r - r % 3, bc = c - c % 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[(br + i) * 9 + bc + j] === v) return false;
    return true;
  }
  function fill(g, i) {
    if (i === 81) return true;
    const r = Math.floor(i / 9), c = i % 9;
    for (const v of U.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (ok(g, r, c, v)) { g[i] = v; if (fill(g, i + 1)) return true; g[i] = 0; }
    }
    return false;
  }
  function countSolutions(g, limit = 2) {
    let count = 0;
    (function rec() {
      if (count >= limit) return;
      let best = -1, bestOpts = null;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const r = Math.floor(i / 9), c = i % 9, opts = [];
        for (let v = 1; v <= 9; v++) if (ok(g, r, c, v)) opts.push(v);
        if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (!opts.length) break; }
      }
      if (best === -1) { count++; return; }
      if (!bestOpts.length) return;
      for (const v of bestOpts) { g[best] = v; rec(); g[best] = 0; if (count >= limit) return; }
    })();
    return count;
  }
  function makePuzzle(givens) {
    const sol = new Array(81).fill(0); fill(sol, 0);
    const p = sol.slice();
    let remaining = 81;
    for (const i of U.shuffle([...Array(81).keys()])) {
      if (remaining <= givens) break;
      const bak = p[i]; p[i] = 0;
      if (countSolutions(p.slice(), 2) !== 1) p[i] = bak; else remaining--;
    }
    return { puzzle: p, solution: sol };
  }
  const peers = i => {
    const r = Math.floor(i / 9), c = i % 9, out = new Set();
    for (let k = 0; k < 9; k++) { out.add(r * 9 + k); out.add(k * 9 + c); }
    const br = r - r % 3, bc = c - c % 3;
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) out.add((br + x) * 9 + bc + y);
    out.delete(i); return [...out];
  };

  /* ---- UI ---------------------------------------------------------------- */
  function mount(root) {
    let puzzle = [], solution = [], grid = [], notes = [], sel = null, pencil = false, history = [], diff = 'easy', won = false, hints = 0;
    const sh = Games.shell({
      root, game: 'sudoku', title: 'Sudoku', icon: '🔢',
      howto: [
        'Fill every row, column and 3×3 box with the digits <b>1–9</b>, no repeats.',
        'Tap a cell, then a number. <b>Pencil</b> toggles small candidate notes.',
        'Conflicts turn red. <b>Hint</b> fills a cell for a 30-second penalty.',
        'Type digits on a keyboard too. Fastest clean solve wins.',
      ],
      tools: [{ label: 'New puzzle', onClick: () => newGame() }],
    });
    sh.body.innerHTML = `<div class="sudoku">
      <div class="row row--between mb">
        <div class="sudoku__diff"><button type="button" data-d="easy" class="is-on">Easy</button><button type="button" data-d="medium">Medium</button><button type="button" data-d="hard">Hard</button></div>
        <span class="note">Tap a cell, then a number</span>
      </div>
      <div class="sudoku__grid" data-hot></div>
      <div class="sudoku__pad"></div>
      <div class="sudoku__actions">
        <button type="button" class="btn btn--ghost" data-a="pencil">✏️ Pencil</button>
        <button type="button" class="btn btn--ghost" data-a="erase">Erase</button>
        <button type="button" class="btn btn--ghost" data-a="undo">Undo</button>
        <button type="button" class="btn btn--ghost" data-a="hint">Hint</button>
        <button type="button" class="btn btn--ghost" data-a="check">Check</button>
      </div>
    </div>`;
    const box = sh.q('.sudoku'), gridEl = sh.q('.sudoku__grid'), padEl = sh.q('.sudoku__pad');
    const cellsEl = [], keys = [];
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), c = i % 9;
      const cell = U.el('div', { class: 'sudoku__cell' + (c % 3 === 2 && c < 8 ? ' b-r' : '') + (r % 3 === 2 && r < 8 ? ' b-b' : ''), style: `--i:${i}` }, [U.el('span', { class: 'v' }), U.el('div', { class: 'sudoku__notes' })]);
      cell.addEventListener('pointerdown', e => { e.preventDefault(); select(i); });
      gridEl.append(cell); cellsEl.push(cell);
    }
    for (let v = 1; v <= 9; v++) {
      const k = U.el('button', { class: 'sudoku__key', type: 'button', html: `${v}<small>9</small>` });
      k.addEventListener('click', () => input(v));
      padEl.append(k); keys.push(k);
    }
    U.$$('.sudoku__diff button', box).forEach(b => b.addEventListener('click', () => {
      U.$$('.sudoku__diff button', box).forEach(x => x.classList.remove('is-on')); b.classList.add('is-on');
      diff = b.dataset.d; SFX.play('click'); newGame();
    }));
    const pencilBtn = sh.q('[data-a="pencil"]');
    sh.q('[data-a="pencil"]').addEventListener('click', () => { pencil = !pencil; pencilBtn.classList.toggle('is-on', pencil); SFX.play('click'); });
    sh.q('[data-a="erase"]').addEventListener('click', () => input(0));
    sh.q('[data-a="undo"]').addEventListener('click', undo);
    sh.q('[data-a="hint"]').addEventListener('click', hint);
    sh.q('[data-a="check"]').addEventListener('click', check);

    function newGame() {
      sh.status('Generating…');
      setTimeout(() => {
        const g = makePuzzle(CONFIG.games.sudokuGivens[diff] || 40);
        puzzle = g.puzzle; solution = g.solution; grid = puzzle.slice();
        notes = Array.from({ length: 81 }, () => new Set());
        history = []; sel = null; won = false; hints = 0;
        box.classList.remove('is-won');
        sh.timer.start(); render(); sh.status('');
      }, 30);
    }
    function select(i) { if (won) return; sel = i; highlight(); SFX.play('tick'); root.dataset.active = '1'; }
    function render() {
      for (let i = 0; i < 81; i++) {
        const c = cellsEl[i], v = grid[i];
        c.classList.toggle('is-given', !!puzzle[i]);
        c.querySelector('.v').textContent = v || '';
        c.querySelector('.sudoku__notes').innerHTML = v ? '' : [...Array(9).keys()].map(k => `<i>${notes[i].has(k + 1) ? k + 1 : ''}</i>`).join('');
      }
      highlight(); conflicts(); padCounts();
    }
    function highlight() {
      const sv = sel != null ? grid[sel] : 0, sr = sel != null ? Math.floor(sel / 9) : -1, sc = sel != null ? sel % 9 : -1;
      for (let i = 0; i < 81; i++) {
        const r = Math.floor(i / 9), c = i % 9, el = cellsEl[i];
        el.classList.toggle('is-sel', i === sel);
        el.classList.toggle('is-peer', sel != null && i !== sel && (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3))));
        el.classList.toggle('is-same', !!sv && grid[i] === sv && i !== sel);
      }
    }
    function conflicts() {
      for (let i = 0; i < 81; i++) {
        const v = grid[i];
        cellsEl[i].classList.toggle('is-conflict', !!v && peers(i).some(j => grid[j] === v));
      }
    }
    function padCounts() {
      const cnt = Array(10).fill(0); grid.forEach(v => v && cnt[v]++);
      keys.forEach((k, idx) => { k.querySelector('small').textContent = Math.max(0, 9 - cnt[idx + 1]); k.classList.toggle('is-done', cnt[idx + 1] >= 9); });
    }
    function input(v) {
      if (won || sel == null || puzzle[sel]) { if (sel == null) sh.status('Tap a cell first'); return; }
      history.push({ i: sel, v: grid[sel], notes: new Set(notes[sel]) });
      if (pencil && v) {
        if (grid[sel]) return;
        notes[sel].has(v) ? notes[sel].delete(v) : notes[sel].add(v);
        SFX.play('tick');
      } else {
        grid[sel] = v;
        if (v) { notes[sel].clear(); peers(sel).forEach(j => notes[j].delete(v)); SFX.play('place'); }
        else SFX.play('erase');
      }
      render();
      if (!grid.includes(0)) checkWin();
    }
    function undo() {
      const h = history.pop(); if (!h || won) return;
      grid[h.i] = h.v; notes[h.i] = h.notes; sel = h.i; SFX.play('erase'); render();
    }
    function hint() {
      if (won) return;
      const cands = [...Array(81).keys()].filter(i => !puzzle[i] && grid[i] !== solution[i]);
      if (!cands.length) return;
      const i = sel != null && !puzzle[sel] && grid[sel] !== solution[sel] ? sel : U.pick(cands);
      history.push({ i, v: grid[i], notes: new Set(notes[i]) });
      grid[i] = solution[i]; notes[i].clear(); hints++;
      cellsEl[i].classList.add('is-hint'); setTimeout(() => cellsEl[i].classList.remove('is-hint'), 800);
      SFX.play('coin'); render();
      sh.status(`Hint used (+30 s) — ${hints} so far`);
      if (!grid.includes(0)) checkWin();
    }
    function check() {
      if (won) return;
      const wrong = [...Array(81).keys()].filter(i => grid[i] && grid[i] !== solution[i]);
      if (!wrong.length) { sh.status('All good so far — keep going'); SFX.play('coin'); return; }
      wrong.forEach(i => cellsEl[i].classList.add('is-conflict'));
      setTimeout(() => conflicts(), 1200);
      sh.status(`${wrong.length} cell${wrong.length > 1 ? 's' : ''} wrong`, true); SFX.play('fail');
    }
    function checkWin() {
      if (grid.every((v, i) => v === solution[i])) win();
      else { sh.status('Something is off — check the red cells', true); SFX.play('fail'); }
    }
    function win() {
      won = true;
      const time = sh.timer.stop();
      box.classList.add('is-won'); sel = null; highlight();
      sh.status('Solved in ' + U.fmtTime(time) + (hints ? ` with ${hints} hint${hints > 1 ? 's' : ''}` : ' — clean solve!'));
      SFX.play('win');
      Confetti.fromEl(gridEl, { count: 150, spread: 100, power: 15 });
      Store.ACH.unlock('sudoku');
      setTimeout(() => UI.gameResult({ game: 'sudoku', score: time + hints * 30000, time, meta: { hints, diff } }), 900);
    }

    // keyboard: active after the user touched this game, until they click elsewhere
    document.addEventListener('pointerdown', e => { if (!root.contains(e.target)) delete root.dataset.active; });
    document.addEventListener('keydown', e => {
      if (!root.dataset.active || UI.isOpen() && !root.closest('.expand')) return;
      if (e.key >= '1' && e.key <= '9') { input(+e.key); e.preventDefault(); }
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { input(0); e.preventDefault(); }
      else if (e.key.startsWith('Arrow') && sel != null) {
        const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
        const nx = sel + d; if (nx >= 0 && nx < 81) select(nx); e.preventDefault(); e.stopPropagation();
      }
    });

    newGame();
    return { newGame };
  }

  return { mount, makePuzzle, countSolutions };
})();

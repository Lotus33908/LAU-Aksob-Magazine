/* games/common.js — shared chrome for every game: title, timer, tools, status, mini leaderboard */
window.Games = window.Games || {};

Games.shell = function ({ root, game, title, icon, tools = [], howto = [] }) {
  root.classList.add('game', 'game--' + game);
  root.innerHTML = `
    <div class="game__head">
      <div class="game__title"><span class="ico">${Icons.svg(icon)}</span>${title}</div>
      <div class="game__timer">0:00</div>
    </div>
    <div class="game__tools"></div>
    <div class="game__body"></div>
    <div class="game__status"></div>
    <div class="game__foot"><div class="game__lb"></div><button class="game__lb-link" type="button">All scores</button></div>`;
  const q = s => root.querySelector(s);
  const toolsEl = q('.game__tools');

  tools.forEach(t => {
    const b = U.el('button', { class: 'btn btn--ghost btn--sm', text: t.label, type: 'button' });
    b.addEventListener('click', () => { SFX.play('click'); t.onClick(b); });
    toolsEl.append(b);
    if (t.ref) t.ref(b);
  });
  const howBtn = U.el('button', { class: 'btn btn--ghost btn--sm', text: '? How to play', type: 'button' });
  howBtn.addEventListener('click', () => { SFX.play('click'); UI.howto(title, howto); });
  const expBtn = U.el('button', { class: 'btn btn--ghost btn--sm', html: '&#x2922; Play large', type: 'button' });
  expBtn.addEventListener('click', () => UI.expand(root));
  toolsEl.append(howBtn, expBtn);
  q('.game__lb-link').addEventListener('click', () => { SFX.play('click'); UI.leaderboard(game); });

  const timerEl = q('.game__timer'), statusEl = q('.game__status'), lbEl = q('.game__lb');
  let t0 = 0, iv = null, elapsed = 0;
  const timer = {
    start() { t0 = performance.now(); elapsed = 0; clearInterval(iv); iv = setInterval(() => { elapsed = performance.now() - t0; timerEl.textContent = U.fmtTime(elapsed); }, 250); timerEl.classList.add('is-running'); timerEl.textContent = '0:00'; },
    stop() { if (iv) { clearInterval(iv); iv = null; elapsed = performance.now() - t0; } timerEl.textContent = U.fmtTime(elapsed); timerEl.classList.remove('is-running'); return Math.round(elapsed); },
    reset() { clearInterval(iv); iv = null; elapsed = 0; t0 = 0; timerEl.textContent = '0:00'; timerEl.classList.remove('is-running'); },
    set(text) { timerEl.textContent = text; },
    get running() { return !!iv; },
    get elapsed() { return iv ? performance.now() - t0 : elapsed; },
  };
  function status(msg, bad) { statusEl.textContent = msg || ''; statusEl.classList.toggle('is-bad', !!bad); }
  function renderLb() {
    const def = Store.LB.games[game];
    const top = Store.LB.top(game, 3);
    lbEl.innerHTML = '';
    if (!top.length) { lbEl.append(U.el('span', { class: 'empty', text: 'No scores yet — be the first' })); return; }
        top.forEach((e, i) => lbEl.append(U.el('span', { html: `${Icons.medal(i + 1)} <b>${UI.esc(e.name)}</b> ${def.fmt(e.score)}` })));
  }
  renderLb();
  U.on('lb:update', d => { if (d.game === game) renderLb(); });
  U.noFlip(root);

  return { q, body: q('.game__body'), timer, status, timerEl, renderLb };
};

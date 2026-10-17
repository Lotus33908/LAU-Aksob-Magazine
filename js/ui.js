/* ui.js — toasts, modals, pop-out cards, tooltips, expanded games, leaderboards */
window.UI = (() => {
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let stack = [];

  /* ---- toasts ------------------------------------------------------------ */
  function toast({ title, text, icon = '✨', kick = 'Achievement unlocked', type = '', ms = 3800 }) {
    const n = U.el('div', { class: 'toast' + (type ? ' toast--' + type : '') }, [
      U.el('div', { class: 'toast__icon', text: icon }),
      U.el('div', {}, [
        kick ? U.el('div', { class: 'toast__kick', text: kick }) : null,
        U.el('div', { class: 'toast__title', text: title }),
        text ? U.el('div', { class: 'toast__text', text }) : null,
      ]),
    ]);
    U.$('#toasts').append(n);
    setTimeout(() => { n.classList.add('is-out'); setTimeout(() => n.remove(), 320); }, ms);
    return n;
  }

  /* ---- overlay layers ---------------------------------------------------- */
  function layer(contentEl, { onClose, closeOnBackdrop = true, className = '' } = {}) {
    const ov = U.el('div', { class: 'ov ' + className });
    const bd = U.el('div', { class: 'ov__backdrop' });
    ov.append(bd, contentEl);
    U.$('#overlay').append(ov);
    const api = {
      el: ov, content: contentEl, closed: false,
      close(result, delay = 260) {
        if (api.closed) return;
        api.closed = true;
        ov.classList.add('is-closing');
        stack = stack.filter(l => l !== api);
        if (onClose) onClose(result);
        setTimeout(() => ov.remove(), delay);
      },
    };
    if (closeOnBackdrop) bd.addEventListener('click', () => api.close());
    stack.push(api);
    return api;
  }
  const isOpen = () => stack.length > 0;
  function closeTop() { const l = stack[stack.length - 1]; if (l) { l.close(); return true; } return false; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && closeTop()) e.stopPropagation(); });

  function modal({ title, html, body, actions = [], wide = false, onClose, closeOnBackdrop = true, sound = 'pop' }) {
    const m = U.el('div', { class: 'modal' + (wide ? ' modal--wide' : '') });
    const closeBtn = U.el('button', { class: 'ov__close', 'aria-label': 'Close', html: ICON_X, type: 'button' });
    const bodyEl = U.el('div', { class: 'modal__body' });
    if (html) bodyEl.innerHTML = html;
    if (body) bodyEl.append(body);
    m.append(U.el('div', { class: 'modal__head' }, [U.el('div', { class: 'modal__title', text: title || '' }), closeBtn]), bodyEl);
    let api;
    if (actions.length) {
      const act = U.el('div', { class: 'modal__actions' });
      actions.forEach(a => {
        const b = U.el('button', { class: 'btn ' + (a.cls || 'btn--primary'), text: a.label, type: 'button' });
        b.addEventListener('click', () => {
          SFX.play('click');
          const r = a.onClick ? a.onClick(api, b) : undefined;
          if (r !== false && a.close !== false) api.close();
        });
        act.append(b);
      });
      bodyEl.append(act);
    }
    api = layer(m, { onClose, closeOnBackdrop });
    api.body = bodyEl;
    closeBtn.addEventListener('click', () => { SFX.play('click'); api.close(); });
    if (sound) SFX.play(sound);
    return api;
  }

  function howto(title, steps = []) {
    const list = U.el('ol', { class: 'howto' });
    steps.forEach((s, i) => list.append(U.el('li', {}, [U.el('span', { class: 'n', text: i + 1 }), U.el('span', { html: s })])));
    return modal({ title: 'How to play — ' + title, body: list, actions: [{ label: 'Got it' }] });
  }

  /* ---- tooltip ----------------------------------------------------------- */
  let tipAnchor = null;
  function tooltip(anchor, html) {
    const tip = U.$('#tooltip');
    if (tipAnchor === anchor && tip.classList.contains('is-on')) { hideTooltip(); return; }
    tip.innerHTML = html;
    tipAnchor = anchor;
    tip.classList.add('is-on'); tip.classList.remove('is-below');
    const r = anchor.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = U.clamp(r.left + r.width / 2 - tw / 2, 8, window.innerWidth - tw - 8);
    let y = r.top - th - 12;
    if (y < 8) { y = r.bottom + 12; tip.classList.add('is-below'); }
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.style.setProperty('--ax', (r.left + r.width / 2 - x) + 'px');
    SFX.play('tick');
    if (Store.counters.inc('curious') >= 5) Store.ACH.unlock('curious');
  }
  function hideTooltip() { U.$('#tooltip').classList.remove('is-on'); tipAnchor = null; }
  document.addEventListener('pointerdown', e => {
    if (tipAnchor && !e.target.closest('#tooltip') && !tipAnchor.contains(e.target)) hideTooltip();
  }, true);

  /* ---- pop-out card (FLIP-animated from its spot on the page) --------------- */
  function popcard(src) {
    const r = src.getBoundingClientRect();
    const big = U.el('div', { class: 'popbig' });
    const inner = U.el('div', { class: 'popbig__inner' });
    const gloss = U.el('div', { class: 'popbig__gloss' });
    const closeBtn = U.el('button', { class: 'ov__close', html: ICON_X, 'aria-label': 'Close', type: 'button' });

    const art = src.classList.contains('ph') ? src : src.querySelector('.ph');
    if (art) {
      const a = art.cloneNode(true);
      a.classList.remove('popcard', 'portrait');
      a.classList.add('popbig__art');
      a.style.transform = 'none';
      a.querySelectorAll('.popcard__full, .ph__label').forEach(x => x.remove());
      inner.append(a);
    }
    const full = src.querySelector('.popcard__full');
    const body = U.el('div', { class: 'popbig__body' });
    body.innerHTML = full ? full.innerHTML : `<h3>${esc(src.dataset.title)}</h3><p>${esc(src.dataset.text)}</p>`;
    inner.append(gloss, body);
    big.append(inner, closeBtn);

    let api;
    const doClose = () => {
      if (!api || api.closed) return;
      SFX.play('unpop');
      const f2 = big.getBoundingClientRect(), r2 = src.getBoundingClientRect();
      big.style.transform = `translate(${r2.left - f2.left}px, ${r2.top - f2.top}px) scale(${r2.width / f2.width}, ${r2.height / f2.height})`;
      big.style.opacity = '0';
      api.close(undefined, 480);
    };
    api = layer(big, { closeOnBackdrop: false });
    api.el.querySelector('.ov__backdrop').addEventListener('click', doClose);
    closeBtn.addEventListener('click', doClose);

    // FLIP: measure the final (centred) rect, start from the source rect, animate to identity
    const f = big.getBoundingClientRect();
    big.style.transform = `translate(${r.left - f.left}px, ${r.top - f.top}px) scale(${r.width / f.width}, ${r.height / f.height})`;
    big.style.opacity = '.5';
    void big.offsetWidth;
    big.classList.add('is-animating');
    big.style.transform = 'none';
    big.style.opacity = '1';
    SFX.play('pop');

    big.addEventListener('pointermove', e => {
      const b = inner.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - .5, py = (e.clientY - b.top) / b.height - .5;
      inner.style.setProperty('--ty', (px * 7) + 'deg');
      inner.style.setProperty('--tx', (-py * 7) + 'deg');
      gloss.style.setProperty('--gx', ((px + .5) * 100) + '%');
      gloss.style.setProperty('--gy', ((py + .5) * 100) + '%');
    });
    big.addEventListener('pointerleave', () => { inner.style.setProperty('--tx', '0deg'); inner.style.setProperty('--ty', '0deg'); });

    if (Store.counters.inc('curious') >= 5) Store.ACH.unlock('curious');
    return api;
  }

  /* ---- expanded game: the real DOM node moves into an overlay and back ------ */
  function expand(gameEl) {
    const marker = document.createComment('expand-marker');
    gameEl.parentNode.insertBefore(marker, gameEl);
    const box = U.el('div', { class: 'expand' });
    const closeBtn = U.el('button', { class: 'ov__close', html: ICON_X, 'aria-label': 'Close', type: 'button' });
    box.append(closeBtn, gameEl);
    gameEl.classList.add('is-expanded');
    const api = layer(box, {
      onClose: () => {
        gameEl.classList.remove('is-expanded');
        marker.parentNode.insertBefore(gameEl, marker);
        marker.remove();
        U.emit('game:resized', gameEl);
      },
    });
    closeBtn.addEventListener('click', () => { SFX.play('click'); api.close(); });
    SFX.play('whoosh');
    U.emit('game:resized', gameEl);
    return api;
  }

  /* ---- leaderboards ------------------------------------------------------------ */
  function leaderboard(game = 'zip', highlightId = null) {
    const body = U.el('div');
    const tabs = U.el('div', { class: 'lb__tabs' });
    const table = U.el('div');
    let current = game;
    function render(g) {
      current = g;
      U.$$('.lb__tab', tabs).forEach(t => t.classList.toggle('is-on', t.dataset.g === g));
      const def = Store.LB.games[g];
      const list = Store.LB.top(g, 10);
      table.innerHTML = '';
      if (!list.length) {
        table.innerHTML = `<div class="lb__empty"><b>${def.icon}</b>No scores yet for ${esc(def.label)}.<br>Be the first on the board.</div>`;
        return;
      }
      const tbl = U.el('table', { class: 'lb__table' });
      list.forEach((e, i) => {
        const meta = def.unit !== 'time' && e.time ? U.fmtTime(e.time) : new Date(e.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const tr = U.el('tr', { class: e.id === highlightId ? 'lb__me' : '' });
        tr.innerHTML = `<td class="lb__rank r${i + 1}">${i + 1}</td><td class="lb__name">${esc(e.name)}</td><td class="lb__score">${def.fmt(e.score)}</td><td class="lb__meta">${meta}</td>`;
        tbl.append(tr);
      });
      table.append(tbl);
    }
    Object.entries(Store.LB.games).forEach(([g, def]) => {
      const t = U.el('button', { class: 'lb__tab', dataset: { g }, text: `${def.icon} ${def.label}`, type: 'button' });
      t.addEventListener('click', () => { SFX.play('click'); render(g); });
      tabs.append(t);
    });
    body.append(tabs, table);
    render(game);
    return modal({
      title: 'Leaderboards', body,
      actions: [{
        label: 'Reset this board', cls: 'btn--ghost btn--sm', close: false,
        onClick: (api, btn) => {
          if (btn.dataset.armed) { Store.LB.reset(current); render(current); btn.textContent = 'Reset this board'; delete btn.dataset.armed; }
          else { btn.dataset.armed = '1'; btn.textContent = 'Tap again to confirm'; setTimeout(() => { delete btn.dataset.armed; btn.textContent = 'Reset this board'; }, 2500); }
        },
      }],
    });
  }

  /* ---- end-of-game result + name entry ------------------------------------------ */
  function gameResult({ game, score, time, meta = {} }) {
    const def = Store.LB.games[game];
    U.emit('game:win', { game, score, time });
    const body = U.el('div');
    body.innerHTML = `<div class="result-hero"><div class="big">${def.fmt(score)}</div>
      <div class="sub">${def.unit === 'time' ? 'Your time' : 'Your score'}${time && def.unit !== 'time' ? ' · ' + U.fmtTime(time) : ''}</div>
      <div class="rank chip chip--gold" hidden></div></div>`;
    const form = U.el('form', { class: 'nameform' });
    const input = U.el('input', { type: 'text', maxlength: '18', placeholder: 'Your name for the leaderboard', value: Store.player.getName() });
    const btn = U.el('button', { class: 'btn btn--primary', text: 'Save score', type: 'submit' });
    form.append(input, btn);
    body.append(form);
    let submitted = null;
    const api = modal({
      title: `${def.icon} ${def.label} — well played!`, body, sound: 'chime',
      actions: [{ label: 'View leaderboard', cls: 'btn--ghost', close: false, onClick: () => { api.close(); leaderboard(game, submitted && submitted.entry.id); } }],
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (submitted) return;
      Store.player.setName(input.value.trim() || 'Anonymous');
      submitted = Store.LB.submit(game, score, { time, ...meta });
      const rank = body.querySelector('.rank');
      rank.hidden = false;
      rank.textContent = submitted.rank === 1 ? '🥇 New #1 on this device' : `Ranked #${submitted.rank}`;
      btn.textContent = 'Saved ✓'; btn.disabled = true; input.disabled = true;
      SFX.play('coin');
      if (submitted.rank === 1) Confetti.fromEl(rank, { count: 60, power: 9 });
    });
    setTimeout(() => input.focus(), 350);
    return api;
  }

  /* ---- achievements grid ----------------------------------------------------------- */
  function renderBadges(container) {
    container.innerHTML = '';
    container.classList.add('badges');
    container.classList.toggle('badges--light', container.dataset.badges === 'light');
    Store.ACH.list.forEach(a => {
      const on = Store.ACH.has(a.id);
      container.append(U.el('div', { class: 'badge' + (on ? ' is-on' : ''), title: a.text }, [
        U.el('div', { class: 'badge__icon', text: a.icon }),
        U.el('span', { text: a.title }),
      ]));
    });
  }
  function renderAllBadges() { U.$$('[data-badges]').forEach(renderBadges); }
  U.on('ach:unlock', def => {
    SFX.play('chime');
    toast({ title: def.title, text: def.text, icon: def.icon });
    renderAllBadges();
    U.$$('[data-ach-count]').forEach(n => n.textContent = Store.ACH.count());
  });

  function achievements() {
    const grid = U.el('div', { class: 'badges', style: 'font-size:14px; gap:16px 10px' });
    Store.ACH.list.forEach(a => {
      const on = Store.ACH.has(a.id);
      grid.append(U.el('div', { class: 'badge' + (on ? ' is-on' : ''), style: 'font-size:12px', title: a.text }, [
        U.el('div', { class: 'badge__icon', text: a.icon, style: 'width:56px;height:56px;font-size:26px' }),
        U.el('span', { text: a.title }),
      ]));
    });
    const wrap = U.el('div', {}, [U.el('p', { style: 'margin-bottom:14px;color:var(--ink-3)', text: `${Store.ACH.count()} of ${Store.ACH.list.length} unlocked. Explore, play and hold things to earn the rest.` }), grid]);
    return modal({ title: 'Your achievements', body: wrap });
  }

  return { esc, toast, modal, howto, tooltip, hideTooltip, popcard, expand, leaderboard, gameResult, renderBadges, renderAllBadges, achievements, isOpen, closeTop };
})();

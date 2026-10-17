/* mascot.js — Tally the owl: an SVG character drawn in code that lives behind the
   magazine's edge. It peeks out between page turns, follows your cursor with its
   eyes, blinks, waves when you finish a game, hops when you earn a badge, and
   gives page-specific hints when tapped. */
window.Mascot = (() => {
  const SVG = `
<svg viewBox="0 0 120 150" aria-hidden="true">
  <defs>
    <linearGradient id="owlBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E9D6A"/><stop offset="1" stop-color="#006341"/></linearGradient>
    <linearGradient id="owlBelly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7FBF8"/><stop offset="1" stop-color="#CFE6DA"/></linearGradient>
    <linearGradient id="owlFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9F4EE"/><stop offset="1" stop-color="#D3E8DB"/></linearGradient>
  </defs>
  <g class="owl-inner">
    <g class="wing wing-l"><path d="M18 76 C4 86 2 114 16 128 C28 118 32 98 30 76 Z" fill="#004A30"/></g>
    <path d="M44 140 l-6 8 M48 140 v9 M52 140 l6 8 M68 140 l-6 8 M72 140 v9 M76 140 l6 8" stroke="#C8A951" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path class="body" d="M60 26 C94 26 106 56 106 90 C106 122 86 140 60 140 C34 140 14 122 14 90 C14 56 26 26 60 26 Z" fill="url(#owlBody)"/>
    <path d="M60 74 C80 74 90 90 90 108 C90 126 78 136 60 136 C42 136 30 126 30 108 C30 90 40 74 60 74 Z" fill="url(#owlBelly)"/>
    <path d="M46 96 q7 7 14 0 M60 96 q7 7 14 0 M39 112 q7 7 14 0 M53 112 q7 7 14 0 M67 112 q7 7 14 0" stroke="#B9D9C8" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M60 32 C86 32 100 46 100 66 C100 86 84 96 60 96 C36 96 20 86 20 66 C20 46 34 32 60 32 Z" fill="url(#owlFace)"/>
    <ellipse cx="31" cy="78" rx="6" ry="4" fill="#F3B7B7" opacity=".55"/><ellipse cx="89" cy="78" rx="6" ry="4" fill="#F3B7B7" opacity=".55"/>
    <g class="eye eye-l"><circle cx="44" cy="62" r="14" fill="#fff"/><g class="pupil"><circle cx="44" cy="63" r="7" fill="#15201B"/><circle cx="47.5" cy="59.5" r="2.6" fill="#fff"/></g></g>
    <g class="eye eye-r"><circle cx="76" cy="62" r="14" fill="#fff"/><g class="pupil"><circle cx="76" cy="63" r="7" fill="#15201B"/><circle cx="79.5" cy="59.5" r="2.6" fill="#fff"/></g></g>
    <g class="eye-happy"><path d="M32 65 q12 -14 24 0 M64 65 q12 -14 24 0" stroke="#15201B" stroke-width="3.6" fill="none" stroke-linecap="round"/></g>
    <path class="beak" d="M53 72 L67 72 L60 84 Z" fill="#C8A951" stroke="#9A7B2C" stroke-width=".8" stroke-linejoin="round"/>
    <g class="wing wing-r"><path d="M102 76 C116 86 118 114 104 128 C92 118 88 98 90 76 Z" fill="#004A30"/></g>
    <g class="cap">
      <path d="M38 26 C38 19 82 19 82 26 L82 36 C82 44 38 44 38 36 Z" fill="#00351F"/>
      <path d="M60 4 L104 20 L60 36 L16 20 Z" fill="#00351F"/>
      <path d="M60 4 L104 20" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>
      <path d="M104 20 L104 40" stroke="#C8A951" stroke-width="2.4" stroke-linecap="round"/><circle cx="104" cy="42" r="3.6" fill="#C8A951"/>
    </g>
  </g>
</svg>`;

  const TIPS = {
    0: ['Drag the bottom-right corner to open the issue.', 'Tap the LAU mark five times. Trust me.'],
    1: ['Every line in the contents is a shortcut. Tap one.', 'Your badges fill in as you explore.'],
    2: ['Hold the applause button to clap for the Dean.', 'Tap the portrait to pop it out.'],
    3: ['Stop the marker inside the green zone to balance the books.', 'The counters run every time you arrive here.'],
    4: ['Hold the green circle until it pops.', 'Tap a #tag for a definition.', 'Pull the tab on the right edge.'],
    5: ['Hold the bar to unlock the 2030 forecast.', 'Vote in the poll to see what readers think.'],
    6: ['Tap a founder card to hear the pitch.', 'Slide out the tab for the incubator steps.'],
    7: ['Pick a side first, then tap PITCH as fast as you can.', 'Space bar counts as a pitch too.'],
    8: ['Expand a program and save the ones you like.'],
    9: ['Filter by field, then tap a card to read the abstract.'],
    10: ['Start on 1 and draw through every cell, in order.', 'Drag back over your line to erase.'],
    11: ['Pencil mode lets you note candidates. Hints cost 30 seconds.'],
    12: ['One crown per row, column and colour. Crowns never touch.'],
    13: ['Scratch the gold card for the term of the issue.'],
    14: ['Drag the handle to compare the campuses.', 'Tap a gold dot on the map.'],
    15: ['Scratch the silver card for your fortune.', 'Hold to subscribe. It is only a demo.'],
  };
  const GENERAL = ['Red pulses show what you can touch.', 'Every game has a “Play large” button.', 'The trophy in the toolbar lists every leaderboard.', 'Arrow keys turn pages too.', 'Use “Games” in the toolbar to jump straight to a puzzle.'];
  const WIN = ['Well played!', 'Hoo-ray! Nice one.', 'That was quick.', 'Leaderboard material.', 'The Dean would be proud.'];

  let root, owl, bubble, mode = 'none', state = 'hidden', busy = false, bubbleTimer = null, idleTimer = null, gazeRaf = null;
  let tipsSeen = new Set();
  const name = () => (CONFIG.mascot && CONFIG.mascot.name) || 'Tally';

  function init() {
    if (!CONFIG.mascot || CONFIG.mascot.enabled === false) return;
    tipsSeen = new Set(Store.get('tips', []));
    root = U.el('div', { class: 'mascot', id: 'mascot' });
    owl = U.el('button', { class: 'mascot__owl', type: 'button', 'aria-label': `${name()} the owl — tap for a hint`, html: SVG });
    root.append(owl);
    bubble = U.el('div', { class: 'mascot-bubble', id: 'mascot-bubble' });
    place();
    window.addEventListener('resize', U.debounce(place, 160));
    owl.addEventListener('click', onClick);
    document.addEventListener('pointermove', gaze, { passive: true });

    U.on('book:reveal', () => setTimeout(() => {
      peek();
      say(`Hoo! I'm <b>${name()}</b>. Tap me whenever you want a hint.`, 5000);
      SFX.play('hoot');
    }, 1700));
    U.on('book:fold', () => { clearTimeout(idleTimer); hide(); });            // duck as soon as a page starts to turn
    U.on('book:settle', () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => peek(), 650); });
    U.on('ach:unlock', def => celebrate(`Badge unlocked: <b>${UI.esc(def.title)}</b>`));
    U.on('game:win', () => wave(U.pick(WIN)));
    U.on('scratch:reveal', () => happy('Ooh, shiny.'));
    U.on('hold:complete', d => { if (d && d.action === 'applaud') happy('Hoo-ray for the Dean!'); });
    scheduleBlink();
  }

  function place() {
    const stage = U.$('#book-stage');
    const stageW = parseFloat(stage.style.width) || stage.getBoundingClientRect().width;
    const room = (window.innerWidth - stageW) / 2;
    const next = window.innerWidth < 600 ? 'off' : room >= 72 ? 'edge' : 'corner';
    if (next === mode) return;
    mode = next;
    root.classList.remove('mascot--edge', 'mascot--corner');
    bubble.classList.remove('mascot-bubble--edge', 'mascot-bubble--corner');
    if (mode === 'off') { root.remove(); bubble.remove(); return; }
    root.classList.add('mascot--' + mode);
    bubble.classList.add('mascot-bubble--' + mode);
    root.style.setProperty('--out', mode === 'edge' ? Math.min(96, Math.round(room / 112 * 100)) + '%' : '0%');
    if (mode === 'edge') stage.append(root, bubble); else document.body.append(root, bubble);
  }

  function setState(s) {
    state = s;
    root.classList.toggle('is-peek', s === 'peek');
    root.classList.toggle('is-out', s === 'out');
  }
  const hide = () => { setState('hidden'); hideBubble(); };
  const peek = () => { if (!busy) setState('peek'); };
  const out = () => setState('out');

  function say(html, ms = 3600) {
    bubble.innerHTML = html;
    bubble.classList.add('is-on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, ms);
  }
  const hideBubble = () => bubble.classList.remove('is-on');

  function celebrate(html) {
    busy = true; out();
    root.classList.add('is-happy', 'is-celebrate');
    say(html, 3800); SFX.play('hoot');
    setTimeout(() => { root.classList.remove('is-celebrate', 'is-happy'); busy = false; setState('peek'); }, 2100);
  }
  function wave(html) {
    busy = true; out();
    root.classList.add('is-happy', 'is-wave');
    say(html, 3200); SFX.play('hoot');
    setTimeout(() => { root.classList.remove('is-wave', 'is-happy'); busy = false; setState('peek'); }, 2100);
  }
  function happy(html) {
    root.classList.add('is-happy');
    say(html, 2800);
    setTimeout(() => root.classList.remove('is-happy'), 1800);
  }
  function onClick() {
    SFX.unlock(); SFX.play('hoot');
    out();
    root.classList.add('is-happy');
    say(nextTip(), 4500);
    setTimeout(() => { root.classList.remove('is-happy'); if (!busy) setState('peek'); }, 2400);
  }
  function nextTip() {
    const vis = window.Book && Book.visible ? Book.visible() : [];
    const pool = [];
    vis.forEach(i => (TIPS[i] || []).forEach(t => pool.push(t)));
    const fresh = pool.filter(t => !tipsSeen.has(t));
    const pick = fresh.length ? fresh[0] : U.pick(pool.length && Math.random() < .5 ? pool : GENERAL);
    tipsSeen.add(pick);
    Store.set('tips', [...tipsSeen].slice(-80));
    return pick;
  }

  /* pupils follow the pointer */
  function gaze(e) {
    if (!owl || !owl.isConnected || state === 'hidden' || gazeRaf) return;
    gazeRaf = requestAnimationFrame(() => {
      gazeRaf = null;
      const r = owl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height * .42;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260);
      const ox = (dx / d * 3.4 * k).toFixed(2), oy = (dy / d * 2.8 * k).toFixed(2);
      owl.querySelectorAll('.pupil').forEach(p => { p.style.transform = `translate(${ox}px, ${oy}px)`; });
    });
  }
  function scheduleBlink() {
    setTimeout(() => {
      if (root && root.isConnected && state !== 'hidden') {
        root.classList.add('is-blink'); setTimeout(() => root.classList.remove('is-blink'), 130);
        if (Math.random() < .25) setTimeout(() => { root.classList.add('is-blink'); setTimeout(() => root.classList.remove('is-blink'), 130); }, 230);
      }
      scheduleBlink();
    }, 2600 + Math.random() * 3600);
  }

  return { init, say, peek, hide, celebrate, wave, SVG };
})();

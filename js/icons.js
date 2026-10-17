/* icons.js — the magazine's own icon set, drawn as SVG paths (24×24 grid, 2px round
   strokes, currentColor). No emoji anywhere: every pictogram, medal, investor face
   and crown is drawn here so the whole issue shares one visual language.

   Icons.svg('rocket')          → inline <i class="icon"><svg …></svg></i>
   Icons.medal(1 | 2 | 3)       → gold / silver / bronze medal with the rank
   Icons.face(investor, mood)   → a drawn investor portrait, mood 0..3
   Icons.hydrate(root)          → replaces every <i data-icon="name"></i> in markup */
window.Icons = (() => {
  const P = {
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v6M11 11V5a1.5 1.5 0 0 1 3 0v7M14 12V7a1.5 1.5 0 0 1 3 0v8.5a5.5 5.5 0 0 1-11 0V11a1.5 1.5 0 0 1 3 0"/><path d="M20 4.5l1.5-1.5M20.5 8.5h2.2"/>',
    scale: '<path d="M12 3v18M6 21h12M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>',
    ballot: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M8 11V4h8v7M10.5 7.5h3"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5A2.5 2.5 0 0 0 12 8h-.5a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4H12a2.5 2.5 0 0 1-2.5-1.5M12 6.5V8M12 16v1.5"/>',
    zip: '<path d="M4 6h10a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h12"/><circle cx="4" cy="6" r="1.8" fill="currentColor"/><circle cx="20" cy="18" r="1.8" fill="currentColor"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z"/><path d="M6 21h12"/>',
    rocket: '<path d="M12 2.5c3 2 5 6 5 10l-2 3.5H9L7 12.5c0-4 2-8 5-10z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M9 16l-2.5 4 3.5-1 2 2.5 2-2.5 3.5 1L15 16"/>',
    bulb: '<path d="M9 18h6M10 21.5h4M8.2 13.2a5.2 5.2 0 1 1 7.6 0c-.8.9-1.3 1.6-1.3 2.8H9.5c0-1.2-.5-1.9-1.3-2.8z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7.5l9 6 9-6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    party: '<path d="M4 20l4.5-12L16 15.5z"/><path d="M10 8.5l1-2.2M14 5l.4-2.2M17.5 8l2.2-1M15.5 12l2.5.4"/><circle cx="19.5" cy="4" r="1.1" fill="currentColor"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    leaf: '<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z"/><path d="M5 21c4-6 8-9 12-11"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    'chart-bar': '<path d="M4 20V10M10 20V4M16 20v-7M2 20h20"/>',
    'chart-line': '<path d="M3 17l5-5 4 4 8-8M15 8h5v5"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    graduation: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.2V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.8M22 9v6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>',
    seedling: '<path d="M12 22v-8"/><path d="M12 14c0-4-3-7-8-7 0 5 3 8 8 7z"/><path d="M12 14c0-5 3-8 8-8 0 5-3 8-8 8"/>',
    pencil: '<path d="M3 21l3.6-.8L19 7.8a2 2 0 0 0 0-2.8l-1-1a2 2 0 0 0-2.8 0L2.8 16.4z"/><path d="M14 6l4 4"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    document: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    bank: '<path d="M3 9l9-5 9 5H3z"/><path d="M5 9v9M10 9v9M14 9v9M19 9v9M3 21h18"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M7 9l5 12 5-12"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4M15.5 11.5h.01M18.5 13.5h.01"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };

  function svg(name, cls) {
    const d = P[name] || P.sparkle;
    return `<i class="icon${cls ? ' ' + cls : ''}" data-ico="${name}"><svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true">${d}</svg></i>`;
  }

  const MEDAL = { 1: ['#C8A951', '#9A7B2C'], 2: ['#B8C0BC', '#7C8884'], 3: ['#C98B5A', '#8F5A33'] };
  function medal(n) {
    const [fill, edge] = MEDAL[n] || MEDAL[3];
    return `<i class="icon medal" title="Rank ${n}"><svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 1.5L10.8 9h2.4l2.3-7.5" fill="#006341"/>
      <path d="M8.5 1.5L10.8 9M15.5 1.5L13.2 9" stroke="#004A30" stroke-width="1" fill="none"/>
      <circle cx="12" cy="15" r="6.6" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>
      <circle cx="12" cy="15" r="4.6" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1"/>
      <text x="12" y="17.9" font-family="Inter, system-ui, sans-serif" font-size="8" font-weight="800" text-anchor="middle" fill="#fff">${n}</text>
    </svg></i>`;
  }

  /* three investors, four moods: 0 skeptical · 1 interested · 2 excited · 3 sold */
  const HAIR = [
    '<path d="M11 31c0-13 9-20 21-20s21 7 21 20c-4-5-10-8-21-8s-17 3-21 8z" fill="#0F3B2A"/><circle cx="24" cy="35" r="6" fill="none" stroke="#0F3B2A" stroke-width="2.2"/><circle cx="40" cy="35" r="6" fill="none" stroke="#0F3B2A" stroke-width="2.2"/><path d="M30 35h4" stroke="#0F3B2A" stroke-width="2.2"/>',
    '<circle cx="32" cy="9" r="6" fill="#0F3B2A"/><path d="M10 33c0-13 10-21 22-21s22 8 22 21c-3-5-9-8-22-8s-19 3-22 8z" fill="#0F3B2A"/><circle cx="10.5" cy="42" r="2" fill="#C8A951"/><circle cx="53.5" cy="42" r="2" fill="#C8A951"/>',
    '<path d="M12 30c1-11 8-17 20-17 8 0 15 3 19 9-6-2-12-2-19 1-7 3-13 3-20 7z" fill="#0F3B2A"/><path d="M29 57l3 6 3-6-3-2z" fill="#C8A951"/><path d="M30 55h4" stroke="#C8A951" stroke-width="2"/>',
  ];
  const BROWS = [
    '<path d="M19 28l9-2.5M36 29.5h9" />',
    '<path d="M19 28.5h9M36 28.5h9" />',
    '<path d="M19 27.5q4.5-3 9-1M36 26.5q4.5-2 9 1" />',
    '<path d="M19 26.5q4.5-3.5 9-1.5M36 25q4.5-2 9 1.5" />',
  ];
  const EYES = [
    '<circle cx="24" cy="35" r="2.2" fill="#0F3B2A"/><circle cx="40" cy="35" r="2.2" fill="#0F3B2A"/>',
    '<circle cx="24" cy="35" r="2.2" fill="#0F3B2A"/><circle cx="40" cy="35" r="2.2" fill="#0F3B2A"/>',
    '<circle cx="24" cy="35" r="2.6" fill="#0F3B2A"/><circle cx="40" cy="35" r="2.6" fill="#0F3B2A"/>',
    '<path d="M20.5 35q3.5-4.5 7 0M36.5 35q3.5-4.5 7 0" />',
  ];
  const MOUTH = [
    '<path d="M26 45.5q6 2 12-1.5" />',
    '<path d="M25 44q7 5 14 0" />',
    '<path d="M24 43q8 9 16 0z" fill="#0F3B2A" stroke="none"/><path d="M26.5 43.5h11" stroke="#fff" stroke-width="2"/>',
    '<path d="M23 42q9 11 18 0z" fill="#0F3B2A" stroke="none"/><path d="M26 42.5h12" stroke="#fff" stroke-width="2.2"/><path d="M52 24l1.3 2.7 2.7 1.3-2.7 1.3L52 32l-1.3-2.7L48 28l2.7-1.3z" fill="#C8A951" stroke="none"/><path d="M9 20l.9 1.9 1.9.9-1.9.9L9 25.6l-.9-1.9-1.9-.9 1.9-.9z" fill="#C8A951" stroke="none"/>',
  ];
  function face(i, mood) {
    const m = Math.max(0, Math.min(3, mood | 0));
    return `<svg class="face" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M17 60c3-6 9-9 15-9s12 3 15 9" fill="#E4F1EA" stroke="#0F3B2A" stroke-width="2.4"/>
      <circle cx="32" cy="36" r="21" fill="#F3EEE4" stroke="#0F3B2A" stroke-width="2.4"/>
      ${HAIR[i % HAIR.length]}
      <g fill="none" stroke="#0F3B2A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${BROWS[m]}${EYES[m]}${MOUTH[m]}</g>
      ${m >= 2 ? '<circle cx="17" cy="42" r="2.8" fill="#F3B7B7" opacity=".7"/><circle cx="47" cy="42" r="2.8" fill="#F3B7B7" opacity=".7"/>' : ''}
    </svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll('i[data-icon]').forEach(n => { n.outerHTML = svg(n.dataset.icon, n.className); });
  }

  return { svg, medal, face, hydrate, names: Object.keys(P) };
})();

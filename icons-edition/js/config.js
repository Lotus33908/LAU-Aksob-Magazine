/* config.js — one place to rename, re-brand and tune the magazine */
window.CONFIG = {
  magazine: {
    name: 'The Ledger',
    school: 'Adnan Kassar School of Business',
    university: 'Lebanese American University',
    issue: 'Issue 01',
    season: 'Fall 2026',
    edition: 'Preview edition',
  },

  /* Page geometry (nominal design size; the engine scales it) */
  book: { width: 560, height: 740, minWidth: 290, maxWidth: 620, flipMs: 950 },

  /* Hotspot flashes that reveal clickable areas after every page turn */
  hotspots: { enabled: true, perPageMax: 7, staggerMs: 110 },

  /* Sound: everything is synthesised with the Web Audio API (no files needed).
     To use real recordings instead, drop files in assets/sfx/ and map them here,
     e.g. files: { flip: 'assets/sfx/flip.mp3', tear: 'assets/sfx/tear.mp3' } */
  sounds: { enabled: true, volume: 0.32, files: {} },

  games: {
    pitchSeconds: 10,
    zipSize: 6,
    queensSize: 7,
    sudokuGivens: { easy: 42, medium: 34, hard: 28 },
  },

  /* Tally the owl: the hint-giving mascot that peeks from behind the book */
  mascot: { enabled: true, name: 'Tally' },

  /* Sample social-proof numbers (demo only — replace or set to 0) */
  seeds: {
    applause: 1207,
    poll: [41, 36, 23],
    /* "would you rather" base counts per question key (demo only) */
    wyr: { funding: [812, 530], campus: [644, 701] },
  },
};

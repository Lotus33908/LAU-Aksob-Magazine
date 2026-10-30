/* store.js — localStorage persistence: player name, leaderboards, achievements, progress */
window.Store = (() => {
  const PREFIX = 'ledger.';
  function get(k, def) {
    try { const v = localStorage.getItem(PREFIX + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {} }

  const player = {
    getName: () => get('player', ''),
    setName: n => set('player', String(n || '').trim().slice(0, 18)),
  };

  /* ---- leaderboards (per game, top 50 kept, top 10 shown) ---------------- */
  const GAMES = {
    zip:    { label: 'Zip',         icon: 'zip', better: 'lower',  unit: 'time',  fmt: v => U.fmtTime(v) },
    sudoku: { label: 'Sudoku',      icon: 'grid', better: 'lower',  unit: 'time',  fmt: v => U.fmtTime(v) },
    queens: { label: 'Queens',      icon: 'crown', better: 'lower',  unit: 'time',  fmt: v => U.fmtTime(v) },
    pitch:  { label: 'Pitch Rush',  icon: 'rocket', better: 'higher', unit: 'score', fmt: v => U.fmtNum(v) + ' pitches' },
    quiz:   { label: 'Riddles',     icon: 'bulb', better: 'higher', unit: 'score', fmt: v => v + ' / 6' },
  };
  const LB = {
    games: GAMES,
    all: game => get('lb.' + game, []),
    sortFn(game) {
      const g = GAMES[game];
      return (a, b) => {
        const d = g.better === 'lower' ? a.score - b.score : b.score - a.score;
        return d !== 0 ? d : (a.time || 0) - (b.time || 0);
      };
    },
    top(game, n = 10) { return LB.all(game).sort(LB.sortFn(game)).slice(0, n); },
    submit(game, score, meta = {}) {
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: player.getName() || 'Anonymous',
        score, time: meta.time || 0, meta, at: Date.now(),
      };
      const list = LB.all(game);
      list.push(entry);
      list.sort(LB.sortFn(game));
      const trimmed = list.slice(0, 50);
      set('lb.' + game, trimmed);
      const rank = trimmed.findIndex(e => e.id === entry.id) + 1;
      U.emit('lb:update', { game, entry, rank });
      return { entry, rank: rank || null, list: trimmed };
    },
    reset(game) { set('lb.' + game, []); U.emit('lb:update', { game }); },
  };

  /* ---- achievements --------------------------------------------------------- */
  const ACHIEVEMENTS = [
    { id: 'unwrap',   icon: 'scissors', title: 'Fresh off the press', text: 'Cut the wrap and pulled out the magazine.' },
    { id: 'flip',     icon: 'book', title: 'Page turner',         text: 'Turned your first page.' },
    { id: 'explorer', icon: 'compass', title: 'Explorer',            text: 'Visited every page of the issue.' },
    { id: 'applause', icon: 'hand', title: 'Standing ovation',    text: 'Held to applaud the Dean.' },
    { id: 'balance',  icon: 'scale', title: 'Books balanced',      text: 'Stopped the marker in the green zone.' },
    { id: 'curious',  icon: 'search', title: 'Curious mind',        text: 'Opened five pop-outs or tags.' },
    { id: 'voter',    icon: 'ballot', title: 'Voice heard',         text: 'Voted in a reader poll.' },
    { id: 'scratch',  icon: 'coin', title: 'Scratcher',           text: 'Scratched a card all the way through.' },
    { id: 'zip',      icon: 'zip', title: 'Line master',         text: 'Completed a Zip puzzle.' },
    { id: 'sudoku',   icon: 'grid', title: 'Grid guru',           text: 'Solved a Sudoku.' },
    { id: 'queens',   icon: 'crown', title: 'Crown holder',        text: 'Placed every queen.' },
    { id: 'pitch',    icon: 'rocket', title: 'Closer',              text: 'Scored 60+ in Pitch Rush.' },
    { id: 'quiz',     icon: 'bulb', title: 'Riddle master',       text: 'Solved every interview riddle in a round.' },
  ];
  const ACH = {
    list: ACHIEVEMENTS,
    all: () => get('ach', {}),
    has: id => !!get('ach', {})[id],
    count: () => Object.keys(get('ach', {})).length,
    unlock(id) {
      const a = get('ach', {});
      if (a[id]) return false;
      const def = ACHIEVEMENTS.find(x => x.id === id);
      if (!def) return false;
      a[id] = Date.now(); set('ach', a);
      U.emit('ach:unlock', def);
      return true;
    },
  };

  const counters = {
    inc(k, by = 1) { const v = (get('cnt.' + k, 0) || 0) + by; set('cnt.' + k, v); return v; },
    get: k => get('cnt.' + k, 0) || 0,
  };

  const progress = {
    visited: () => get('visited', []),
    mark(idx) { const v = get('visited', []); if (!v.includes(idx)) { v.push(idx); set('visited', v); } return v; },
  };

  /* wipe badges, page history, hints and votes — keeps leaderboards, name and sound setting */
  function resetProgress() {
    const keys = [];
    try { for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch (e) {}
    keys.filter(k => k && k.startsWith(PREFIX) && !k.startsWith(PREFIX + 'lb.') && k !== PREFIX + 'player' && k !== PREFIX + 'sound')
      .forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    U.emit('progress:reset');
  }

  return { get, set, player, LB, ACH, counters, progress, resetProgress };
})();

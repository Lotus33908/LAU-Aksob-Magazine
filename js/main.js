/* main.js — boot sequence and the bottom navigation bar */
document.addEventListener('DOMContentLoaded', () => {
  Confetti.init();
  Interactions.init();
  Scratch.init();

  Games.zip.mount(U.$('#game-zip'));
  Games.sudoku.mount(U.$('#game-sudoku'));
  Games.queens.mount(U.$('#game-queens'));
  Games.pitch.mount(U.$('#game-pitch'));
  Games.quiz.mount(U.$('#game-quiz'));

  Book.init();
  Mascot.init();

  /* ---- nav bar ------------------------------------------------------------ */
  const soundBtn = U.$('#nav-sound');
  const syncSound = () => {
    soundBtn.classList.toggle('is-off', !SFX.enabled);
    soundBtn.querySelector('.on').classList.toggle('hidden', !SFX.enabled);
    soundBtn.querySelector('.off').classList.toggle('hidden', SFX.enabled);
    soundBtn.title = SFX.enabled ? 'Sound on' : 'Sound off';
  };
  syncSound();
  soundBtn.addEventListener('click', () => { SFX.toggle(); SFX.unlock(); syncSound(); if (SFX.enabled) SFX.play('coin'); });

  U.$('#nav-contents').addEventListener('click', () => { SFX.play('click'); Book.goTo(1); });
  U.$('#nav-lb').addEventListener('click', () => { SFX.play('click'); UI.leaderboard('zip'); });
  U.$('#nav-ach').addEventListener('click', () => { SFX.play('click'); UI.achievements(); });
  U.$('#nav-full').addEventListener('click', () => {
    SFX.play('click');
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  });

  const gamesBtn = U.$('#nav-games'), pop = U.$('#games-pop');
  gamesBtn.addEventListener('click', e => { e.stopPropagation(); SFX.play('click'); pop.classList.toggle('is-open'); gamesBtn.classList.toggle('is-on', pop.classList.contains('is-open')); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#games-pop, #nav-games')) { pop.classList.remove('is-open'); gamesBtn.classList.remove('is-on'); } });
  U.$$('#games-pop [data-goto]').forEach(b => b.addEventListener('click', () => { pop.classList.remove('is-open'); gamesBtn.classList.remove('is-on'); }));

  U.on('ach:unlock', () => { const d = U.$('#nav-ach .nav__dot'); if (d) { d.hidden = false; setTimeout(() => d.hidden = true, 6000); } });

  /* ---- unlock audio on the first gesture anywhere ---------------------------- */
  const unlock = () => { SFX.unlock(); document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock);

  /* ---- intro, then the book -------------------------------------------------- */
  Wrap.init(() => {
    Book.reveal();
    const small = window.innerWidth < 600;
    setTimeout(() => UI.toast({
      kick: 'Welcome', title: `${CONFIG.magazine.name} — ${CONFIG.magazine.issue}`,
      text: small ? 'Swipe to turn pages. Use “Play large” inside any game. Best enjoyed on a tablet or desktop.' : 'Drag or click a page corner to flip. Red pulses show what is interactive.',
      icon: '📖', type: 'info', ms: small ? 6500 : 5000,
    }), 1500);
  });
});

/* sfx.js — subtle, procedurally synthesised sound effects (Web Audio API).
   No audio files are required. If CONFIG.sounds.files maps a name to a URL,
   that recording is played instead of the synthesised version. */
window.SFX = (() => {
  let ctx = null, master = null, noiseBuf = null;
  let enabled = true;
  const files = (window.CONFIG && CONFIG.sounds.files) || {};
  const fileCache = {};

  try { if (localStorage.getItem('ledger.sound') === '0') enabled = false; } catch (e) {}
  if (window.CONFIG && CONFIG.sounds.enabled === false) enabled = false;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 5;
    comp.attack.value = 0.003; comp.release.value = 0.22;
    master = ctx.createGain();
    master.gain.value = (window.CONFIG && CONFIG.sounds.volume) || 0.3;
    master.connect(comp); comp.connect(ctx.destination);
    const n = Math.floor(ctx.sampleRate * 2);
    noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  const now = () => ctx.currentTime;

  function env(t, a, d, peak) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(master);
    return g;
  }
  function tone({ type = 'sine', f = 440, f2 = null, t = 0, a = 0.005, d = 0.15, vol = 0.3 }) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    o.connect(env(t, a, d, vol));
    o.start(t); o.stop(t + a + d + 0.05);
  }
  function burst({ t = 0, dur = 0.2, type = 'bandpass', f = 1000, f2 = null, q = 1, vol = 0.3, a = 0.005, d = null }) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter();
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const dd = d != null ? d : Math.max(0.01, dur - a);
    s.connect(fl); fl.connect(env(t, a, dd, vol));
    s.start(t, Math.random() * 1.5); s.stop(t + a + dd + 0.1);
  }

  const synth = {
    /* paper */
    flip() {
      const t = now();
      burst({ t, dur: .3, f: 650, f2: 2300, q: .8, vol: .3, a: .03 });
      burst({ t: t + .06, dur: .22, f: 1900, f2: 900, q: 1.2, vol: .16, a: .02 });
      burst({ t: t + .21, dur: .05, type: 'highpass', f: 3800, vol: .1, a: .004 });
    },
    flipHard() {
      const t = now();
      burst({ t, dur: .17, type: 'lowpass', f: 520, f2: 200, vol: .38, a: .008 });
      tone({ t, f: 95, f2: 50, d: .18, vol: .32 });
      burst({ t: t + .02, dur: .12, f: 1200, f2: 2600, q: .7, vol: .1 });
    },
    thud() {
      const t = now();
      tone({ t, f: 72, f2: 38, d: .3, vol: .5 });
      burst({ t, dur: .12, type: 'lowpass', f: 240, vol: .28, a: .004 });
    },
    /* plastic */
    crinkle(density = 12, span = .4) {
      const t = now();
      for (let i = 0; i < density; i++) {
        burst({ t: t + Math.random() * span, dur: .015 + Math.random() * .03, type: 'highpass', f: 1800 + Math.random() * 4500, vol: .04 + Math.random() * .09, a: .002 });
      }
    },
    tear() {
      const t = now();
      tone({ t, type: 'square', f: 170, f2: 60, d: .05, vol: .08 });
      burst({ t, dur: .55, f: 500, f2: 2600, q: .6, vol: .24, a: .02 });
      synth.crinkle(24, .65);
      burst({ t: t + .1, dur: .5, type: 'lowpass', f: 420, f2: 120, vol: .2, a: .05 });
    },
    /* ui */
    pop() { const t = now(); tone({ t, f: 320, f2: 640, a: .01, d: .09, vol: .2 }); burst({ t, dur: .03, type: 'highpass', f: 4000, vol: .07, a: .002 }); },
    unpop() { const t = now(); tone({ t, f: 600, f2: 300, a: .01, d: .1, vol: .16 }); },
    open() { synth.whoosh(); },
    click() { const t = now(); tone({ t, type: 'triangle', f: 1800, f2: 1200, a: .002, d: .03, vol: .09 }); burst({ t, dur: .015, type: 'highpass', f: 3000, vol: .05, a: .001 }); },
    tick() { const t = now(); tone({ t, f: 1500, a: .002, d: .025, vol: .055 }); },
    charge(p = 0) { const t = now(); tone({ t, type: 'triangle', f: 300 + p * 520, a: .005, d: .06, vol: .07 }); },
    whoosh() { const t = now(); burst({ t, dur: .28, f: 350, f2: 1400, q: .9, vol: .15, a: .04 }); },
    coin() { const t = now(); tone({ t, f: 1245, a: .005, d: .08, vol: .11 }); tone({ t: t + .07, f: 1661, a: .005, d: .22, vol: .11 }); },
    chime() {
      const t = now();
      [659.25, 783.99, 987.77].forEach((f, i) => tone({ t: t + i * .085, type: 'triangle', f, a: .01, d: .4, vol: .13 }));
      burst({ t: t + .1, dur: .25, type: 'highpass', f: 6000, vol: .035, a: .05 });
    },
    win() {
      const t = now();
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        tone({ t: t + i * .07, type: 'triangle', f, a: .01, d: .5, vol: .12 });
        tone({ t: t + i * .07, type: 'sine', f: f * 2, a: .01, d: .25, vol: .035 });
      });
      burst({ t: t + .2, dur: .5, type: 'highpass', f: 5000, vol: .045, a: .1 });
    },
    fail() { const t = now(); tone({ t, type: 'triangle', f: 220, f2: 140, a: .01, d: .28, vol: .15 }); burst({ t, dur: .15, type: 'lowpass', f: 300, vol: .1, a: .01 }); },
    applause() {
      const t = now(), n = 36;
      for (let i = 0; i < n; i++) {
        const x = i / n, dens = Math.sin(x * Math.PI);
        burst({ t: t + x * 1.1 + Math.random() * .03, dur: .012 + Math.random() * .02, f: 1200 + Math.random() * 2200, q: 2, vol: (.035 + Math.random() * .07) * (.4 + dens), a: .002 });
      }
    },
    confetti() {
      const t = now();
      tone({ t, f: 520, f2: 260, a: .004, d: .07, vol: .2 });
      burst({ t, dur: .2, type: 'highpass', f: 5000, vol: .06, a: .003 });
      for (let i = 0; i < 4; i++) tone({ t: t + .05 + i * .045, type: 'triangle', f: 1200 + Math.random() * 1600, a: .003, d: .08, vol: .045 });
    },
    /* games */
    draw(i = 0) { const t = now(); tone({ t, type: 'sine', f: Math.min(1400, 420 * Math.pow(2, (i % 24) / 24)), a: .004, d: .05, vol: .065 }); },
    place() { const t = now(); burst({ t, dur: .03, type: 'lowpass', f: 900, vol: .16, a: .002 }); tone({ t, f: 520, f2: 380, a: .003, d: .06, vol: .11 }); },
    erase() { const t = now(); burst({ t, dur: .05, f: 700, vol: .1, a: .004 }); },
    hoot() {
      const t = now();
      tone({ t, type: 'sine', f: 540, f2: 430, a: .035, d: .16, vol: .12 });
      tone({ t: t + .21, type: 'sine', f: 490, f2: 400, a: .035, d: .22, vol: .1 });
    },
    scratch() { const t = now(); burst({ t, dur: .07, type: 'bandpass', f: 2400 + Math.random() * 2600, q: .7, vol: .05, a: .006 }); burst({ t: t + .02, dur: .04, type: 'highpass', f: 5000, vol: .025, a: .003 }); },
    go() { const t = now(); tone({ t, type: 'triangle', f: 880, a: .005, d: .22, vol: .16 }); },
    countdown() { const t = now(); tone({ t, type: 'triangle', f: 440, a: .005, d: .14, vol: .13 }); },
    timeup() { const t = now(); tone({ t, type: 'triangle', f: 660, a: .005, d: .2, vol: .13 }); tone({ t: t + .18, type: 'triangle', f: 440, a: .005, d: .35, vol: .13 }); },
  };

  /* continuous "cutting through plastic" noise driven by progress */
  let cut = null;
  function startCut() {
    if (!enabled || !ensure()) return;
    stopCut();
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 500; fl.Q.value = 1.4;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(fl); fl.connect(g); g.connect(master);
    s.start();
    g.gain.linearRampToValueAtTime(.14, now() + .08);
    cut = { s, fl, g };
  }
  function updateCut(p) { if (cut) cut.fl.frequency.setTargetAtTime(500 + p * 3200, now(), .03); }
  function stopCut() {
    if (!cut) return;
    const { s, g } = cut; cut = null;
    g.gain.setTargetAtTime(0, now(), .04);
    setTimeout(() => { try { s.stop(); } catch (e) {} }, 220);
  }

  function playFile(name) {
    let a = fileCache[name];
    if (!a) { a = new Audio(files[name]); a.preload = 'auto'; fileCache[name] = a; }
    const inst = a.cloneNode();
    inst.volume = (window.CONFIG && CONFIG.sounds.volume) || 0.3;
    inst.play().catch(() => {});
  }

  function play(name, ...args) {
    if (!enabled) return;
    if (files[name]) return playFile(name);
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const fn = synth[name];
    if (fn) { try { fn(...args); } catch (e) { /* never let audio break the UI */ } }
  }
  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem('ledger.sound', enabled ? '1' : '0'); } catch (e) {}
    if (!enabled) stopCut();
    U.emit('sfx:toggle', enabled);
  }

  return { play, unlock, setEnabled, toggle: () => setEnabled(!enabled), get enabled() { return enabled; }, startCut, updateCut, stopCut };
})();

/* games/quiz.js — "Business Riddles": six interview-style brain-teasers per round, with explanations */
window.Games = window.Games || {};

Games.quiz = (() => {
  const BANK = [
    { q: 'You have 8 identical-looking balls; one is slightly heavier. With a balance scale, what is the minimum number of weighings that guarantees you find it?', a: ['1', '2', '3', '4'], c: 1, why: 'Weigh 3 against 3. If they balance, weigh the remaining 2. If not, weigh any 2 of the heavier 3. Two weighings, always.' },
    { q: 'A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. What does the ball cost?', a: ['10 cents', '5 cents', '1 cent', '15 cents'], c: 1, why: 'Ball x, bat x + 1.00, so 2x + 1.00 = 1.10 and x = 5 cents. Most people blurt out 10.' },
    { q: 'Five machines make five widgets in five minutes. How long do 100 machines take to make 100 widgets?', a: ['100 minutes', '20 minutes', '5 minutes', '1 minute'], c: 2, why: 'Each machine makes one widget in five minutes, however many machines there are.' },
    { q: 'Lily pads on a lake double in area every day and cover the whole lake on day 48. On which day did they cover half of it?', a: ['Day 24', 'Day 47', 'Day 46', 'Day 36'], c: 1, why: 'Doubling means the day before full coverage it was half covered.' },
    { q: 'Three switches outside a closed room control one bulb inside. You may flip switches freely but enter the room only once. How do you find the right switch?', a: ['Flip them one at a time and listen for a click', 'Turn one on for ten minutes, turn it off, turn a second one on, then enter: a warm bulb means the first, a lit bulb the second', 'It cannot be done with a single visit', 'Flip all three at once and enter'], c: 1, why: 'Heat is the hidden second signal. Warm and dark: switch one. Lit: switch two. Cold and dark: switch three.' },
    { q: 'Three boxes are labelled Apples, Oranges and Mixed, and every label is wrong. You may draw one fruit from one box. Which box do you draw from to relabel all three correctly?', a: ['Apples', 'Oranges', 'Mixed', 'Any box works'], c: 2, why: 'The Mixed box cannot be mixed, so one fruit reveals its true contents. The other two labels then follow by elimination.' },
    { q: 'Four people must cross a bridge at night with one torch, at most two at a time, moving at the slower person’s pace. They need 1, 2, 7 and 10 minutes. What is the minimum total time?', a: ['19 minutes', '17 minutes', '20 minutes', '21 minutes'], c: 1, why: '1 and 2 cross (2), 1 returns (1), 7 and 10 cross together (10), 2 returns (2), 1 and 2 cross (2). Total 17: send the slow pair together.' },
    { q: 'A snail climbs 3 m each day and slips back 2 m each night. How many days does it take to reach the top of a 10 m wall?', a: ['10 days', '8 days', '7 days', '9 days'], c: 1, why: 'Net 1 m a day puts it at 7 m after seven full days; on day eight it climbs to 10 m and never slips back.' },
    { q: 'A clock shows 3:15. What is the angle between the hour and minute hands?', a: ['0°', '7.5°', '15°', '90°'], c: 1, why: 'The minute hand is at 90°. The hour hand has moved a quarter of the way from 3 to 4: 90° + 7.5°. The difference is 7.5°.' },
    { q: 'Ten coins lie on a table, five heads up. Blindfolded, split them into two piles with the same number of heads. How?', a: ['It is impossible blindfolded', 'Move any five coins into a second pile and flip every coin in it', 'Feel each coin for the raised face', 'Take two coins and flip one'], c: 1, why: 'If the five you moved contain k heads, the rest contain 5 − k. Flipping your five turns them into 5 − k heads too.' },
    { q: 'A farmer has 17 sheep. All but 9 run away. How many sheep are left?', a: ['8', '9', '17', '0'], c: 1, why: '“All but 9” means nine stayed. Interviewers use it to see if you listen before you calculate.' },
    { q: 'Two ropes each take exactly 60 minutes to burn, but they burn unevenly. How can you measure 45 minutes?', a: ['Fold one rope into quarters', 'Light rope A at both ends and rope B at one end; when A is gone, light B’s other end', 'Cut both ropes in half and light them', 'You cannot with uneven ropes'], c: 1, why: 'A burning from both ends lasts 30 minutes. B then has 30 minutes left; lit from both ends it lasts 15 more. 30 + 15 = 45.' },
    { q: 'A game show has three doors, one hiding a car. You pick door 1. The host, who knows where the car is, opens door 3 to show a goat and offers you door 2. Should you switch?', a: ['Yes, switching wins two times in three', 'No, it is now 50/50', 'No, staying wins two times in three', 'It makes no difference'], c: 0, why: 'Your first pick was right one time in three. The host’s reveal moves the remaining two thirds onto the other closed door.' },
    { q: 'Using the Rule of 72, roughly how long does money take to double at 6% a year?', a: ['6 years', '12 years', '18 years', '72 years'], c: 1, why: '72 ÷ 6 = 12. The rule is a quick mental approximation of compound growth.' },
    { q: 'You have a 3-litre jug and a 5-litre jug, unlimited water and no markings. How do you get exactly 4 litres?', a: ['Fill the 5, pour into the 3, empty the 3, pour the remaining 2 into the 3, refill the 5, then top up the 3: 4 litres remain in the 5', 'Fill the 3 twice into the 5', 'Fill the 5 and pour out half', 'Fill the 3, pour it into the 5, and repeat three times'], c: 0, why: 'The trick is leaving 2 litres in the 3-litre jug so the next top-up takes exactly 1 litre from the full 5.' },
    { q: 'How many times do a clock’s hour and minute hands overlap in 24 hours?', a: ['24', '22', '23', '12'], c: 1, why: 'The minute hand laps the hour hand once every 65 minutes and 27 seconds, which happens 22 times a day, not 24.' },
    { q: 'The classic interview question: why are manhole covers round?', a: ['Round is cheaper to cast', 'A round cover cannot fall through its own hole', 'Tradition from Roman roads', 'Round covers are lighter'], c: 1, why: 'A circle has the same width in every direction, so it can never be turned to drop through the opening.' },
    { q: 'A company’s revenue grew 50% one year and fell 50% the next. Compared with the start, revenue is now…', a: ['Exactly the same', '25% lower', '25% higher', '50% lower'], c: 1, why: '100 → 150 → 75. Percentages compound on different bases; a fall needs a bigger rebound to recover.' },
    { q: 'Two coins add up to 30 cents and one of them is not a nickel. What are the coins?', a: ['Two 15-cent coins', 'A quarter and a nickel', 'Three dimes', 'It is impossible'], c: 1, why: 'One of them is not a nickel; the other one is. Listen for the trick in the wording.' },
    { q: 'You are running a race and overtake the person in second place. What place are you in now?', a: ['First', 'Second', 'Third', 'Last'], c: 1, why: 'You took their place: second. First is still ahead of you.' },
  ];

  function mount(root) {
    let qs = [], idx = 0, score = 0, t0 = 0, answered = false;
    const sh = Games.shell({
      root, game: 'quiz', title: 'Business Riddles', icon: 'bulb',
      howto: ['Six brain-teasers of the kind asked in consulting and finance interviews.', 'Think it through, then pick an answer; the reasoning is shown after each one.', 'Score out of 6; time only breaks ties, so do not rush.'],
      tools: [{ label: 'Restart', onClick: () => intro() }],
    });
    const body = sh.body;

    function intro() {
      sh.timer.reset();
      body.innerHTML = `<div class="quiz__start"><p>Six riddles from the interview circuit. Take your time: the reasoning matters more than the clock.</p><button class="btn btn--primary" type="button" data-hot>Start the riddles</button></div>`;
      body.querySelector('button').addEventListener('click', () => { SFX.play('go'); start(); });
      sh.status('');
    }
    function start() {
      qs = U.shuffle(BANK).slice(0, 6); idx = 0; score = 0;
      sh.timer.start(); t0 = performance.now();
      render();
    }
    function render() {
      answered = false;
      const q = qs[idx];
      const order = U.shuffle([0, 1, 2, 3]);
      body.innerHTML = `<div class="quiz">
        <div class="quiz__prog">${qs.map((_, i) => `<i class="${i < idx ? (qs[i].ok ? 'is-on' : 'is-bad') : i === idx ? 'is-cur' : ''}"></i>`).join('')}</div>
        <div class="quiz__q">${idx + 1}. ${q.q}</div>
        <div class="quiz__opts">${order.map((o, k) => `<button class="quiz__opt" type="button" data-o="${o}"><span class="k">${'ABCD'[k]}</span><span>${q.a[o]}</span></button>`).join('')}</div>
        <div class="quiz__after"></div>
      </div>`;
      U.$$('.quiz__opt', body).forEach(b => b.addEventListener('click', () => answer(+b.dataset.o, b)));
      sh.status(`Question ${idx + 1} of ${qs.length}`);
    }
    function answer(o, btn) {
      if (answered) return;
      answered = true;
      const q = qs[idx]; q.ok = o === q.c;
      U.$$('.quiz__opt', body).forEach(b => { b.disabled = true; if (+b.dataset.o === q.c) b.classList.add('is-right'); });
      if (q.ok) { score++; SFX.play('coin'); Confetti.fromEl(btn, { count: 30, power: 7, spread: 70 }); }
      else { btn.classList.add('is-wrong'); SFX.play('fail'); }
      const after = body.querySelector('.quiz__after');
      after.innerHTML = `<div class="quiz__explain">${q.ok ? Icons.svg('check-circle', 'icon--ok') + ' Correct. ' : Icons.svg('x-circle', 'icon--bad') + ' Not quite. '}${q.why}</div><div class="quiz__next"><button class="btn btn--primary btn--sm" type="button">${idx + 1 < qs.length ? 'Next question →' : 'See my score'}</button></div>`;
      after.querySelector('button').addEventListener('click', () => { SFX.play('click'); idx++; idx < qs.length ? render() : finish(); });
    }
    function finish() {
      const time = sh.timer.stop();
      body.innerHTML = `<div class="quiz__result"><div class="big">${score}<small>/${qs.length}</small></div>
        <p>${score === qs.length ? 'Perfect. You would walk out of that interview with an offer.' : score >= 4 ? 'Strong. Interviewers care about the reasoning, and yours is sound.' : 'A fair start. Read each riddle twice; the trick is usually in the wording.'}<br>Time: ${U.fmtTime(time)}</p>
        <button class="btn btn--ghost btn--sm" type="button">Play again</button></div>`;
      body.querySelector('button').addEventListener('click', () => { SFX.play('click'); intro(); });
      sh.status('');
      if (score === qs.length) { Confetti.cannons(); SFX.play('win'); Store.ACH.unlock('quiz'); }
      else if (score >= 4) Confetti.fromEl(body, { count: 70, spread: 90, power: 11 });
      setTimeout(() => UI.gameResult({ game: 'quiz', score, time }), 900);
    }
    intro();
    return { start };
  }
  return { mount, BANK };
})();

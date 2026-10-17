/* games/quiz.js — "Business IQ": six timed multiple-choice questions with explanations */
window.Games = window.Games || {};

Games.quiz = (() => {
  const BANK = [
    { q: 'ROI stands for…', a: ['Return on Investment', 'Rate of Inflation', 'Revenue over Income', 'Risk of Insolvency'], c: 0, why: 'ROI compares the gain from an investment with its cost.' },
    { q: 'On a balance sheet, Assets always equal…', a: ['Revenue − Expenses', 'Liabilities + Equity', 'Cash + Inventory', 'Equity − Debt'], c: 1, why: 'The accounting equation: Assets = Liabilities + Shareholders’ Equity.' },
    { q: 'A “bull market” is a period when prices are…', a: ['Falling sharply', 'Flat for years', 'Generally rising', 'Frozen by regulators'], c: 2, why: 'Bulls charge upward; bears swipe downward.' },
    { q: 'Which is NOT one of the classic 4 Ps of marketing?', a: ['Product', 'Price', 'Promotion', 'Profit'], c: 3, why: 'The 4 Ps are Product, Price, Place and Promotion.' },
    { q: 'A company’s first sale of shares to the public is called a…', a: ['Leveraged buyout', 'Secondary offering', 'IPO', 'Stock split'], c: 2, why: 'IPO = Initial Public Offering.' },
    { q: '“Opportunity cost” means…', a: ['The price of a missed sale', 'The value of the next-best alternative you give up', 'Fees paid to a broker', 'The cost of opening a store'], c: 1, why: 'Every choice forgoes the next-best option; that forgone value is the opportunity cost.' },
    { q: 'GDP measures…', a: ['A government’s total debt', 'Total value of goods and services produced in a country', 'Average household income', 'The stock market’s size'], c: 1, why: 'Gross Domestic Product is the market value of all final goods and services produced in a period.' },
    { q: 'Which statement shows cash coming in and going out over a period?', a: ['Balance sheet', 'Income statement', 'Cash flow statement', 'Statement of equity'], c: 2, why: 'The cash flow statement tracks operating, investing and financing cash movements.' },
    { q: 'Diversification mainly reduces which kind of risk?', a: ['Systematic (market) risk', 'Unsystematic (company-specific) risk', 'Inflation risk', 'Currency risk'], c: 1, why: 'Spreading holdings dilutes company-specific shocks; market-wide risk remains.' },
    { q: 'A product with elastic demand means…', a: ['Sales barely change with price', 'Sales change a lot when price changes', 'It is sold only online', 'It has no substitutes'], c: 1, why: 'Elasticity measures how responsive quantity demanded is to a price change.' },
  ];

  function mount(root) {
    let qs = [], idx = 0, score = 0, t0 = 0, answered = false;
    const sh = Games.shell({
      root, game: 'quiz', title: 'Business IQ', icon: 'bulb',
      howto: ['Six quick questions from finance, marketing and economics.', 'Pick an answer; you will see why it is right.', 'Score out of 6, fastest time breaks ties.'],
      tools: [{ label: 'Restart', onClick: () => intro() }],
    });
    const body = sh.body;

    function intro() {
      sh.timer.reset();
      body.innerHTML = `<div class="quiz__start"><p>Six questions. One minute if you are sharp. Ready?</p><button class="btn btn--primary" type="button" data-hot>Start the quiz</button></div>`;
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
        <p>${score === qs.length ? 'Perfect score — dean’s list material.' : score >= 4 ? 'Strong result. A few more case studies and you are there.' : 'A solid start. The feature articles in this issue will help.'}<br>Time: ${U.fmtTime(time)}</p>
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

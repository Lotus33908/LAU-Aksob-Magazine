# The Ledger — AKSOB interactive magazine (icons edition)

This copy replaces every emoji with icons drawn as SVG in `js/icons.js` (one 24-grid line style, LAU green and gold), including drawn investor portraits in Pitch Rush and a drawn crown in Queens. Everything else matches the main edition.

An interactive, gamified digital magazine for the **Adnan Kassar School of Business** at the
Lebanese American University. Pure HTML, CSS and JavaScript: no build step, no backend.
Open `index.html` in a browser or publish the folder with GitHub Pages.

## What is in the box

| Experience | Where |
|---|---|
| Shrink-wrapped magazine: click once to pick up the scissors, then press and swipe along the top band to cut; the strip tears off and the issue is pulled out of its sleeve | intro |
| Pop-and-flap: hold a circle until it swells and pops, then a flap drops down with the answer | page 4 |
| Scratch cards (term of the issue, scratch-and-win fortune) and a "would you rather" poll with live percentages | pages 7, 13, back cover |
| Realistic page flipping (drag any corner, swipe, arrows, toolbar) with hard covers | whole book |
| Red translucent pulses on every clickable area after each page turn, plus a glossy sheen sweep | every page |
| Pop-out cards that fly out of the page and tilt with the pointer | Dean's portrait, research cards |
| Hold-to-fill ring and bar buttons (applaud, reveal the forecast, subscribe) | pages 2, 5, back cover |
| Flip cards, slide-out drawers, accordions, tag tooltips, reader poll, compare slider, RSVP and save buttons | pages 4 to 14 |
| Animated counters and meters that run when the page comes into view | page 3 |
| **Balance the Books** timing mini-game | page 3 |
| **Pitch Rush** rapid-tap game with investors whose mood changes with your meter | page 7 |
| **Zip** (draw one line through every cell, numbers in order), **Sudoku** (unique-solution generator, 3 levels, pencil marks, hints, keyboard), **Queens** (one crown per row, column and colour region) | pages 10 to 12 |
| **Business IQ** six-question quiz | page 13 |
| Leaderboards per game (top 10, stored on the device), achievements with toasts, hall of fame on the back cover | toolbar + back cover |
| Confetti in LAU green, white and gold; subtle synthesised sound effects with a mute toggle | everywhere |
| **Tally the owl**, an SVG mascot drawn in code ([js/mascot.js](js/mascot.js)): peeks from behind the book's edge, ducks while pages turn, follows the cursor with its eyes, blinks, waves after a game, hops for a badge, and gives page-specific hints when tapped (rename or disable in `CONFIG.mascot`) | everywhere |

## Editing the content

Everything editorial lives in `index.html`, one `<div class="page">` per page, in reading order.
Copy marked with a small **sample** chip is placeholder text to replace. Placeholder artwork uses
`<div class="ph" data-art="…">`; swap it for an `<img>` or set a `background-image` on the same element.

- Magazine name, issue and seasons: `js/config.js` (and the cover markup in `index.html`).
- Brand colours: the tokens at the top of `css/base.css` (`--lau-green`, `--gold`, …).
- Program names on page 8 are placeholders: verify them against the official AKSOB catalogue.
- Pages are designed at 560 × 740 and scale with container-query units (`cqw`), so keep page
  content within that aspect ratio; text that overflows is clipped like a printed page.

### Interactive building blocks

| Markup | Behaviour |
|---|---|
| `data-hot` on any element | gets a red pulse after the page turns |
| `<button class="hold" data-hold="1300" data-action="applaud\|reveal\|subscribe\|confetti" data-repeat="true">` | hold to fill the ring |
| `<button class="holdbar" data-hold="1600" data-action="reveal" data-target="#id">` | hold to fill a bar, then opens `#id` (a `.reveal-target`) |
| `.popcard` (optionally with a hidden `.popcard__full` block) | pops out into a big tilting card |
| `.flipcard` with `.flipcard__front` / `.flipcard__back` | flips on tap |
| `.drawer` + `.drawer__tab` + `.drawer__panel` | slides out from the page edge |
| `.acc` + `.acc__head` + `.acc__body` | accordion |
| `.tag` with `data-tip` and `data-tip-title` | tooltip bubble |
| `.counter[data-to]`, `.meter__fill[data-v]` | animate when visible |
| `.wyr[data-wyr="key"]` with two `.wyr__opt` buttons | "would you rather" poll; shows the split after voting (seed counts in `CONFIG.seeds.wyr`) |
| `.popflap[data-hold="1200"]` with `.popflap__btn` and `.popflap__flap` | hold the circle until it pops, then the flap drops with the answer; tap again to fold it back |
| `.scratch[data-foil="gold\|silver"]` with `.scratch__under` + `.scratch__canvas` | scratch card; clears itself past ~55 % (`data-fortune` draws a random fortune) |
| `[data-goto="n"]` | jumps to page n |
| `[data-confetti]`, `[data-share]`, `[data-expand="#game"]` | confetti, copy link, play a game large |

## Sound

All effects are synthesised in the browser with the Web Audio API (`js/sfx.js`): page flips,
plastic crinkle and tear, blade cut, pops, ticks, chimes, applause. No audio files are needed.
To use real recordings instead, drop files in `assets/sfx/` and map them in `js/config.js`:

```js
sounds: { files: { flip: 'assets/sfx/flip.mp3', tear: 'assets/sfx/tear.mp3' } }
```

Sound names: `flip flipHard thud crinkle tear pop unpop click tick charge whoosh coin chime win fail applause confetti draw place erase go countdown timeup`.

## Games and scores

Scores and achievements are kept in `localStorage` under the `ledger.` prefix, so each device has
its own leaderboard. The trophy button opens every board; "Reset this board" clears one game.
Game settings (round length, grid sizes, Sudoku givens) are in `js/config.js`.

## Screens

Desktop and tablet show a two-page spread; below about 600px the engine switches to a single
page. On phones the page is small by nature (it is a printed-page layout), so every game has a
"Play large" button that opens it full-width, and the welcome toast says so.

## Deploying

Push to GitHub and enable Pages for the `main` branch (root). The only external resource is
Google Fonts; the page-flip engine (`js/vendor/page-flip.browser.js`, MIT) is vendored.

## Credits

- Page flipping: [StPageFlip](https://github.com/Nodlik/StPageFlip) (MIT).
- Type: Playfair Display and Inter via Google Fonts.

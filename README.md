# ColoRogue site

The public page for ColoRogue, a hardcore deckbuilder roguelike.

Live: https://kodasdream.github.io/colorogue-site/

Plain HTML, CSS and vanilla JavaScript, served as a static GitHub Pages site. The page has no framework and loads no external scripts. Fonts come from Google Fonts (Ubuntu Sans, the game's typeface).

The animated sea behind the page, the title wordmark, and the leaderboard's board previews are drawn by the game's own render code. That code is bundled into one minified file, `js/game-render.js`, which is generated from the game repository (see below). The site repository copies no game source.

## Files

- `index.html`: the whole page.
- `css/site.css`: the styles. Colour and surface tokens are copied from the game's neutral system and palette.
- `js/site.js`: copy buttons for the Discord name, and the screenshot lightbox.
- `js/game-render.js`: generated bundle of the game's render code (about 740 KiB, IIFE, minified). Do not edit by hand.
- `src-bundle/`: the source for that bundle.
  - `entry.ts`: the entry module. It imports render code from the game repository by absolute path, sets up the sea, the wordmark, the board previews and the pokes, and handles reduced motion.
  - `build.mjs`: builds `js/game-render.js` with the game repository's esbuild.
  - `stubs/`: small replacements for game modules that the public page does not need (see below).
- `images/`: screenshots of the game.
- `favicon.svg`: the tab icon.

## What the bundle contains

- Sea background: falling tiles, rainbow waves, fish and swimmers, from `src/render/wave.ts` and `src/render/decor/live.ts`. Clicking the background swells the nearby pieces, as in the game.
- Wordmark: the title screen's `drawWordmark`, from `src/scenes/title.ts`.
- Leaderboard previews: the final board of each run, drawn with the game's `drawMiniBoard` from `src/scenes/stats.ts`, using the tiles in `src/core/leaderboard.ts`. Hover a row on desktop, or tap it on a phone, to open it. Tap the row again, Close, or press Escape to close a pinned preview.

Stubbed out in the bundle (`src-bundle/stubs/`):

- `samplestats.ts`: returns empty stats, so the developer's sample data is not published.
- `net-match.ts`: no current match and nothing to rejoin.
- `net-client.ts`: no saved identity.
- `credits.ts`: no credit list and no portraits, so the credits photographs are not published.

## Rebuilding the bundle

The build reads the game repository at `/home/desktop/ColoRogue-Claude` (sources and its `node_modules/esbuild`). Run:

    cd src-bundle
    export PATH=$HOME/.nvm/versions/node/v26.8.2/bin:$PATH
    node build.mjs

It writes `js/game-render.js` and prints its size. If the game repository moves, update `GAME_SRC` and the esbuild path in `build.mjs` and the absolute imports in `entry.ts`. Rebuild and commit `js/game-render.js` after any change to the game's render code.

## Updating

- Leaderboard: edit the table in `index.html`. The comment above it says where the data comes from in the game. The board previews read the same runs from the game's `src/core/leaderboard.ts`, so rebuild the bundle after changing runs there.
- Screenshots: replace the files in `images/`, keeping the same names, or change the `src` in `index.html`.

## Preview locally

Serve the folder with any static server, for example `python3 -m http.server 8000`, then open http://127.0.0.1:8000/. Opening `index.html` directly from disk also works, but the Google Fonts request and the bundle load depend on the browser's file access rules.

## Accessibility and motion

- The background and the wordmark are decorative (`aria-hidden`). The title text stays in the page as a visually hidden heading while the wordmark is live.
- With `prefers-reduced-motion: reduce`, the background stops after one static frame and does not react to clicks.
- Board buttons in the leaderboard are keyboard reachable, show their preview on focus, and report their state with `aria-expanded`.

# ColoRogue site

The public page for ColoRogue, a hardcore deckbuilder roguelike.

Live: https://kodasdream.github.io/colorogue-site/

Plain HTML, CSS and vanilla JavaScript, served as a static GitHub Pages site. The page has no framework, loads no external scripts or stylesheets, and makes no third-party requests. The Ubuntu Sans fonts (the game's typeface) are copied into `fonts/` and served from the site.

The animated sea behind the page, the title wordmark, the About tiles and the leaderboard's board previews are drawn by the game's own render code, and clicks on the sea play the game's own sound effects. That code is bundled into one minified file, `js/game-render.js`, which is generated from the game repository (see below). The site repository copies no game source.

## Files

- `index.html`: the whole page.
- `css/site.css`: the styles. Colour and surface tokens are copied from the game's neutral system and palette. There is no blur, glow or drop-shadow filter anywhere: surfaces are flat slabs with a soft shade.
- `fonts/`: Ubuntu Sans 400 to 800 and Ubuntu Sans Mono 600, the game's own files, with the Ubuntu Font Licence in `fonts/LICENCE-UbuntuSans.md`.
- `js/site.js`: copy buttons for the Discord name, and the screenshot lightbox.
- `js/game-render.js`: generated bundle of the game's render and sound code (about 710 KiB, IIFE, minified). Do not edit by hand.
- `src-bundle/`: the source for that bundle.
  - `entry.ts`: the entry module. It imports render code and the sound engine from the game repository by absolute path, sets up the sea, the wordmark, the About tiles, the board previews, the hover cards and the sounds, and handles reduced motion.
  - `build.mjs`: builds `js/game-render.js` with the game repository's esbuild.
  - `stubs/`: small replacements for game modules that the public page does not need (see below).
- `images/`: screenshots of the game.
- `favicon.png`: the tab icon, the game's rose tile showing 13, drawn by the game's `drawSquare` and cropped to 64 pixels.

## What the bundle contains

- **Sea background**: falling tiles, rainbow waves, fish and swimmers, from `src/render/wave.ts` and `src/render/decor/live.ts`. It is painted at one device pixel per CSS pixel and paces itself: 30 frames a second, stepping down to 20 and then 12 when a paint runs long, and back up when the page is quiet. Painting is the expensive part, so this keeps the page responsive on slow machines.
- **Wordmark**: the title screen's `drawWordmark`, from `src/scenes/title.ts`. It is painted before the sea, so it appears with the page rather than after it. The first paint waits for the fonts (1.5 s at most) and for the page's load event (3 s at most).
- **Background sounds**: a click on a background piece plays the game's own sound for it, through `AudioEngine.poke` from `src/audio/engine.ts`. The first press unlocks sound, because browsers allow audio only inside a gesture. The engine's music bus is kept at zero, so no soundtrack plays on the site; the engine still renders its sea bed once, silently. Clicks are ignored under reduced motion, so no sound plays then either.
- **About tiles**: the four tiles in the About stats are the game's tiles, drawn with `drawSquare` from `src/render/square.ts`.
- **Leaderboard previews**: each run's final board is drawn at the hall of fame's closer-look size (`drawHallDetail` in `src/scenes/stats.ts`): 168-unit tiles on a 188-unit pitch, so the modifier icons, boost chevrons and enchantment glow show as they do in the game, and the glow animates. Hover a row on desktop, or tap it on a phone, to open its board. Hover a tile on the board, or tap it on a phone, for the game's hover card for that tile (`tileSections` drawn with `drawInfoCard`). The card keeps the game's text and layout; on a short screen it is scaled down so the whole card fits. Tap the row again, press Close or Escape to close a pinned preview.

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

It writes `js/game-render.js` and prints its size. If the game repository moves, update `GAME_SRC` and the esbuild path in `build.mjs` and the absolute imports in `entry.ts`. Rebuild and commit `js/game-render.js` after any change to the game's render or sound code.

## Updating

- Leaderboard: edit the table in `index.html`. The comment above it says where the data comes from in the game. The board previews read the same runs from the game's `src/core/leaderboard.ts`, so rebuild the bundle after changing runs there.
- Screenshots: replace the files in `images/`, keeping the same names, or change the `src` in `index.html`.
- Cache: the stylesheet and scripts carry a `?v=` number in `index.html`. Bump it when their contents change, so browsers fetch the new files.

## Preview locally

Serve the folder with any static server, for example `python3 -m http.server 8000`, then open http://127.0.0.1:8000/. Opening `index.html` straight from disk shows the layout, but browsers may block the bundle's font and module loads from a file address, so use a server.

## Accessibility and motion

- The background, the wordmark and the About tiles are decorative (`aria-hidden`). The title text stays in the page as a visually hidden heading while the wordmark is live, and each About number is read out from visually hidden text beside its tile.
- With `prefers-reduced-motion: reduce`, the background stops after one static frame, does not react to clicks, and makes no sound. The board previews show a still frame.
- Board buttons in the leaderboard are keyboard reachable, show their preview on focus, and report their state with `aria-expanded`. The board's tiles and their hover cards are drawn on a canvas and need a pointer or a touch, so there is no keyboard route to a tile's card yet.

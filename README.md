# ColoRogue site

The public page for ColoRogue, a hardcore deckbuilder roguelike.

Live: https://kodasdream.github.io/colorogue-site/

Plain HTML, CSS and a little vanilla JavaScript. No build step, no frameworks, no external scripts. Fonts come from Google Fonts (Ubuntu Sans, the game's typeface).

## Files

- `index.html`: the whole page.
- `css/site.css`: the styles. The colour and surface tokens are copied from the game's neutral system and palette.
- `js/site.js`: copy buttons for the Discord name, and the screenshot lightbox.
- `images/`: screenshots of the game.
- `favicon.svg`: the tab icon.

## Updating

- Leaderboard: edit the table in `index.html`. The comment above it says where the data comes from in the game.
- Screenshots: replace the files in `images/`, keeping the same names, or change the `src` in `index.html`.

## Preview locally

Open `index.html` in a browser, or serve the folder with any static server, for example `python3 -m http.server 8000`.

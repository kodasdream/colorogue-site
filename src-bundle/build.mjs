// Builds js/game-render.js: the game's own drawing code, minified, for the site's background,
// wordmark and leaderboard boards. Run from anywhere:
//   node /home/desktop/ColoRogue-site/src-bundle/build.mjs
// It uses the game repository's esbuild (read only; nothing is written there).
import { build } from '/home/desktop/ColoRogue-Claude/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const GAME_SRC = '/home/desktop/ColoRogue-Claude/src';
const out = path.join(here, '..', 'js', 'game-render.js');

// Modules the site does not ship: dev-only sample data, networking, the credits photographs.
const STUBS = [
  [/(^|\/)dev\/samplestats$/, path.join(here, 'stubs', 'samplestats.ts')],
  [/(^|\/)net\/match$/, path.join(here, 'stubs', 'net-match.ts')],
  [/(^|\/)net\/client$/, path.join(here, 'stubs', 'net-client.ts')],
  [/(^|\/)ui\/credits$/, path.join(here, 'stubs', 'credits.ts')],
];

const stubPlugin = {
  name: 'site-stubs',
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => {
      if (!args.resolveDir.startsWith(GAME_SRC)) return undefined;
      for (const [re, file] of STUBS) if (re.test(args.path)) return { path: file };
      return undefined;
    });
  },
};

const result = await build({
  entryPoints: [path.join(here, 'entry.ts')],
  outfile: out,
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'none',
  charset: 'utf8',
  loader: {
    '.woff2': 'dataurl',
    '.webp': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.ogg': 'empty',
    '.mp3': 'empty',
    '.wav': 'empty',
  },
  plugins: [stubPlugin],
  metafile: true,
  logLevel: 'warning',
});

const bytes = (await import('node:fs')).statSync(out).size;
console.log(`wrote ${out}: ${(bytes / 1024).toFixed(0)} KiB`);
const inputs = Object.keys(result.metafile.inputs).filter((p) => p.includes('ColoRogue-Claude/src/'));
console.log(`${inputs.length} modules from the game and the site`);

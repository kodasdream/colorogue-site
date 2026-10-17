/**
 * The site's entry point. It is bundled into js/game-render.js by build.mjs.
 *
 * Nothing here is copied from the game. Every drawing call is the game's own
 * code, imported by absolute path from the private game repository:
 *
 *   - the title screen's background: the wave field (WaveBackground), the
 *     falling tiles and coins, the swimmers and seabed (decorBackground, called
 *     by WaveBackground.draw), the title's drifting tiles, and the veil over
 *     them (TitleScene.draw);
 *   - a click on that background swells the piece under it (decorPoke, then the
 *     title's pokeBackground, in the same order as src/app.ts);
 *   - the title screen's ColoRogue wordmark (TitleScene.drawWordmark);
 *   - a playtester's final board, drawn as the stats screen draws it
 *     (StatsScene.drawMiniBoard), from the tiles in src/core/leaderboard.ts.
 *
 * The scene methods are called through their prototypes with a stand-in
 * `this` that supplies only the fields those methods read. Nothing else from
 * the app (audio, saves, networking, the game loop) is imported.
 */
import { loadFonts } from '/home/desktop/ColoRogue-Claude/src/render/fonts';
import { WaveBackground } from '/home/desktop/ColoRogue-Claude/src/render/wave';
import { decorBeginScene, decorPoke } from '/home/desktop/ColoRogue-Claude/src/render/decor/live';
import { TitleScene } from '/home/desktop/ColoRogue-Claude/src/scenes/title';
import { StatsScene } from '/home/desktop/ColoRogue-Claude/src/scenes/stats';
import { drawPanel } from '/home/desktop/ColoRogue-Claude/src/render/widgets';
import { VH, VW } from '/home/desktop/ColoRogue-Claude/src/core/balance';
import { blankTile, CHROMATIC } from '/home/desktop/ColoRogue-Claude/src/core/colours';
import { LEADERBOARD } from '/home/desktop/ColoRogue-Claude/src/core/leaderboard';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const TitleProto = TitleScene.prototype as Any;
const StatsProto = StatsScene.prototype as Any;

/** The title screen's wordmark sits at (VW / 2, 404) on the design canvas (src/scenes/title.ts). */
const WORD_CX = VW / 2;
const WORD_CY = 404;
/** The part of the design the wordmark canvas shows: the word, its drop shadow and its bob. */
const WORD_WINDOW = { x: VW / 2 - 820, y: WORD_CY - 190, w: 1640, h: 380 };

/** Clicks on these are for the page, not for the sea behind it. */
const NO_POKE =
  'a, button, input, select, textarea, label, summary, dialog, table, .panel, .shot, .wordmark, .topbar, .board-preview, .card, .contact, .stats, .gallery, .lightbox';

const reducedQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
let reduced = !!reducedQuery?.matches;

/* ------------------------------------------------------------------ */
/* Layout: the design (VW x VH) covers the viewport                    */
/* ------------------------------------------------------------------ */

let W = 0;
let H = 0;
let dpr = 1;
/** The sea is soft and moves slowly, so it is drawn at no more than 1.5 device pixels per CSS pixel. */
let seaDpr = 1;
/** Design units to CSS pixels, and the offset of the design's origin. */
let scale = 1;
let offX = 0;
let offY = 0;

function layout(): void {
  W = window.innerWidth;
  H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  seaDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  // Cover, not fit: the sea is a backdrop, so it fills the page and is cropped rather than letterboxed.
  scale = Math.max(W / VW, H / VH);
  offX = (W - VW * scale) / 2;
  offY = (H - VH * scale) / 2;
}

/* ------------------------------------------------------------------ */
/* The sea: the title screen's own background                          */
/* ------------------------------------------------------------------ */

const wave = new WaveBackground();

/**
 * The title screen's state, the part its background needs. Its menu, wordmark
 * and corners are replaced by no-ops: the page has its own.
 */
const title: Any = {
  app: { time: 0, wave, hangingBadges: false, settings: { open: false, draw() {}, onMove() {} } },
  drifters: [] as Array<Record<string, unknown>>,
  helpT: 0,
  popupT: 0,
  popup: null,
  showHelp: false,
  showControls: false,
  controlsT: 0,
  profile: null,
  hanging: null,
  drawWordmark() {},
  drawMenu() {},
  drawCorners() {},
};

// The same nine drifting tiles the title screen starts with (TitleScene.enter).
for (let i = 0; i < 9; i++) {
  const tile = blankTile(1 + Math.floor(Math.random() * 9));
  tile.colour = CHROMATIC[i % CHROMATIC.length];
  title.drifters.push({
    x: (i * 0.11 + 0.06) * VW,
    y: Math.random() * VH,
    size: 88 + Math.random() * 76,
    vy: -10 - Math.random() * 16,
    tile,
    alpha: 0.5,
  });
}

const sea = document.querySelector<HTMLCanvasElement>('canvas.sea');
let time = 0;
let last = 0;
let running = false;

function paintSea(): void {
  if (!sea) return;
  const bw = Math.round(W * seaDpr);
  const bh = Math.round(H * seaDpr);
  if (sea.width !== bw || sea.height !== bh) {
    sea.width = bw;
    sea.height = bh;
  }
  const ctx = sea.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#eaeef6';
  ctx.fillRect(0, 0, bw, bh);
  ctx.setTransform(seaDpr * scale, 0, 0, seaDpr * scale, seaDpr * offX, seaDpr * offY);
  // WaveBackground.draw (the waves, then decorBackground), the drifters, and the veil.
  TitleProto.draw.call(title, ctx);
}

/* ------------------------------------------------------------------ */
/* The wordmark: the title screen's own drawWordmark                   */
/* ------------------------------------------------------------------ */

const wordmarks = Array.from(document.querySelectorAll<HTMLCanvasElement>('canvas[data-wordmark]'));

function paintWordmarks(t: number): void {
  for (const c of wordmarks) {
    const cw = c.clientWidth;
    const ch = c.clientHeight;
    if (!cw || !ch) continue;
    const bw = Math.round(cw * dpr);
    const bh = Math.round(ch * dpr);
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }
    const ctx = c.getContext('2d');
    if (!ctx) continue;
    const k = bw / WORD_WINDOW.w;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    ctx.setTransform(k, 0, 0, k, -WORD_WINDOW.x * k, -WORD_WINDOW.y * k);
    // drawWordmark does not read `this`, so no receiver is needed.
    TitleProto.drawWordmark.call(null, ctx, WORD_CX, WORD_CY, t);
    c.parentElement?.classList.add('is-live');
  }
}

/* ------------------------------------------------------------------ */
/* A click on the sea swells the piece under it                        */
/* ------------------------------------------------------------------ */

/** Counts the pieces the sea has swelled, so a test can see a click land. */
const seaStats = { pokes: 0, frames: 0, paintMs: 0 };
(window as Any).colorogueSea = seaStats;

function onPageClick(e: MouseEvent): void {
  if (reduced || !running) return;
  const target = e.target as Element | null;
  if (target && target.closest && target.closest(NO_POKE)) return;
  const x = (e.clientX - offX) / scale;
  const y = (e.clientY - offY) / scale;
  // The same order as src/app.ts: the sea's own pieces first, then the scene's drifters.
  const hit = decorPoke(x, y) ?? TitleProto.pokeBackground.call(title, x, y);
  if (hit) seaStats.pokes++;
}

/* ------------------------------------------------------------------ */
/* The leaderboard's board previews                                    */
/* ------------------------------------------------------------------ */

const table = document.querySelector<HTMLElement>('.board-table');
const preview = document.getElementById('board-preview') as HTMLElement | null;
const previewCanvas = preview?.querySelector<HTMLCanvasElement>('canvas') ?? null;
const previewCaption = preview?.querySelector<HTMLElement>('.bp-cap') ?? null;
const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('tr[data-run]'));

let shownRun = -1;
let shownRow: HTMLTableRowElement | null = null;
let pinnedRow: HTMLTableRowElement | null = null;

function paintPreview(t: number): void {
  if (!preview || preview.hidden || !previewCanvas || shownRun < 0) return;
  const run = LEADERBOARD[shownRun];
  if (!run || !run.tiles) return;
  const L = previewCanvas.clientWidth;
  if (!L) return;
  const bw = Math.round(L * dpr);
  if (previewCanvas.width !== bw || previewCanvas.height !== bw) {
    previewCanvas.width = bw;
    previewCanvas.height = bw;
  }
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, L, L);
  const m = 14;
  const r = { x: m, y: m, w: L - 2 * m, h: L - 2 * m };
  // The hall's own board well (drawHallDetail), then the final board as the hall draws it (drawMiniBoard).
  drawPanel(ctx, r, { radius: Math.round(r.w * 0.07), raised: 6, blur: 18 });
  StatsProto.drawMiniBoard.call({ t }, ctx, { tiles: run.tiles }, r);
}

function place(row: HTMLElement): void {
  if (!preview) return;
  const rr = row.getBoundingClientRect();
  const pw = preview.offsetWidth;
  const ph = preview.offsetHeight;
  const gap = 10;
  const edge = 12;
  let left = rr.left + rr.width * 0.25;
  left = Math.min(Math.max(left, edge), W - pw - edge);
  // Keep clear of the sticky top bar, so a pinned preview never covers the logo or the Play button.
  const bar = document.querySelector<HTMLElement>('.topbar');
  const topEdge = Math.max(edge, bar ? Math.round(bar.getBoundingClientRect().bottom) + 8 : edge);
  let top = rr.bottom + gap;
  if (top + ph > H - edge) top = rr.top - ph - gap;
  top = Math.min(Math.max(top, topEdge), Math.max(topEdge, H - ph - edge));
  preview.style.left = `${Math.round(left)}px`;
  preview.style.top = `${Math.round(top)}px`;
}

function setExpanded(row: HTMLTableRowElement | null, on: boolean): void {
  const btn = row?.querySelector<HTMLButtonElement>('.board-btn');
  if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
}

function showRow(row: HTMLTableRowElement, pinned: boolean): void {
  if (!preview) return;
  if (shownRow && shownRow !== row) setExpanded(shownRow, false);
  shownRow = row;
  shownRun = Number(row.dataset.run);
  const run = LEADERBOARD[shownRun];
  if (previewCaption && run) {
    previewCaption.textContent = `${run.player}, round ${run.round}, ${run.score}`;
  }
  preview.hidden = false;
  preview.classList.toggle('is-pinned', pinned);
  setExpanded(row, true);
  place(row);
  paintPreview(time);
}

function hidePreview(): void {
  if (!preview) return;
  setExpanded(shownRow, false);
  preview.hidden = true;
  preview.classList.remove('is-pinned');
  shownRow = null;
  shownRun = -1;
  pinnedRow = null;
}

function wirePreviews(): void {
  if (!preview || !table) return;
  for (const row of rows) {
    // A mouse hovers a row to see its board; touch and keyboard use the click (or Enter on the button).
    row.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse' && !pinnedRow) showRow(row, false);
    });
    row.addEventListener('pointerleave', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse' && !pinnedRow) hidePreview();
    });
    row.addEventListener('click', (e) => {
      // A click on the preview's own close button is not a click on the row.
      if ((e.target as Element).closest?.('.board-preview')) return;
      if (pinnedRow === row) {
        hidePreview();
      } else {
        pinnedRow = row;
        showRow(row, true);
      }
    });
    const btn = row.querySelector<HTMLButtonElement>('.board-btn');
    btn?.addEventListener('focus', () => {
      if (!pinnedRow) showRow(row, false);
    });
    btn?.addEventListener('blur', () => {
      if (!pinnedRow && shownRow === row) hidePreview();
    });
  }
  preview.querySelector<HTMLButtonElement>('.bp-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hidePreview();
  });
  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    if (!pinnedRow || !t) return;
    if (t.closest?.('.board-preview') || t.closest?.('tr[data-run]')) return;
    hidePreview();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shownRow) hidePreview();
  });
  const follow = () => {
    if (shownRow && preview && !preview.hidden) place(shownRow);
  };
  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', follow);
}

/* ------------------------------------------------------------------ */
/* The frame loop                                                      */
/* ------------------------------------------------------------------ */

function paintAll(): void {
  paintSea();
  paintWordmarks(time);
  paintPreview(time);
}

/** The sea moves slowly, so it is painted at 30 frames a second; the clock still runs every frame. */
const PAINT_EVERY = 1000 / 30;
let lastPaint = 0;

function step(now: number): void {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  time += dt;
  wave.update(dt);
  title.app.time = time;
  TitleProto.update.call(title, dt);
  if (now - lastPaint >= PAINT_EVERY - 1) {
    lastPaint = now;
    seaStats.frames++;
    const t0 = performance.now();
    paintAll();
    seaStats.paintMs += performance.now() - t0;
  }
  if (running) requestAnimationFrame(step);
}

function startMotion(): void {
  if (running) return;
  running = true;
  last = performance.now();
  lastPaint = 0;
  requestAnimationFrame(step);
}

function stopMotion(): void {
  running = false;
  time = 0;
  paintAll();
}

function applyMotionPreference(): void {
  reduced = !!reducedQuery?.matches;
  if (reduced) stopMotion();
  else startMotion();
}

function init(): void {
  layout();
  // The sea behind the page is the title screen's, so its scene is the title's.
  decorBeginScene('title');
  window.addEventListener('resize', () => {
    layout();
    if (!running) paintAll();
  });
  reducedQuery?.addEventListener?.('change', applyMotionPreference);
  document.addEventListener('click', onPageClick, false);
  wirePreviews();
  // The fonts must be registered before the first frame, or the canvas text falls back.
  loadFonts().then(() => {
    layout();
    if (reduced) {
      time = 0;
      paintAll();
    } else {
      startMotion();
    }
  });
  if (reduced) paintAll();
}

init();

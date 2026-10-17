/**
 * The site's entry point. It is bundled into js/game-render.js by build.mjs.
 *
 * Nothing here is copied from the game. Every drawing call and every sound is the game's own code,
 * imported by absolute path from the private game repository:
 *
 *   - the title screen's background: the wave field (WaveBackground), the falling tiles and coins,
 *     the swimmers and seabed (decorBackground), the title's drifting tiles, and the veil over them
 *     (TitleScene.draw);
 *   - a click on that background swells the piece under it and plays the sound the game plays for it
 *     (decorPoke, then the title's pokeBackground, then AudioEngine.poke, in the order of src/app.ts);
 *   - the title screen's ColoRogue wordmark (TitleScene.drawWordmark);
 *   - the About section's tiles, drawn by drawSquare;
 *   - a playtester's final board, drawn as the hall of fame draws its closer look (drawSquareMini at the
 *     hall's tile size, so the icons, boosts and enchantment glow show), and each tile's hover card
 *     (tileSections, drawn by drawInfoCard as the board draws it).
 *
 * The scene methods are called through their prototypes with a stand-in `this` that supplies only the
 * fields those methods read. The sound engine is used for its effects only: its music bus stays at zero,
 * so no soundtrack plays on the site.
 */
import { loadFonts } from '/home/desktop/ColoRogue-Claude/src/render/fonts';
import { WaveBackground } from '/home/desktop/ColoRogue-Claude/src/render/wave';
import { decorBeginScene, decorPoke } from '/home/desktop/ColoRogue-Claude/src/render/decor/live';
import { TitleScene } from '/home/desktop/ColoRogue-Claude/src/scenes/title';
import { AudioEngine } from '/home/desktop/ColoRogue-Claude/src/audio/engine';
import { drawInfoCard, drawPanel } from '/home/desktop/ColoRogue-Claude/src/render/widgets';
import { drawEmptyPlot, drawSquare, drawSquareMini } from '/home/desktop/ColoRogue-Claude/src/render/square';
import { tileSections } from '/home/desktop/ColoRogue-Claude/src/render/tilecard';
import { tileText } from '/home/desktop/ColoRogue-Claude/src/core/format';
import { tileTitle } from '/home/desktop/ColoRogue-Claude/src/core/run';
import { VH, VW } from '/home/desktop/ColoRogue-Claude/src/core/balance';
import { blankTile, CHROMATIC } from '/home/desktop/ColoRogue-Claude/src/core/colours';
import { LEADERBOARD } from '/home/desktop/ColoRogue-Claude/src/core/leaderboard';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const TitleProto = TitleScene.prototype as Any;

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
/** The sea is soft and moves slowly, so it is painted at one bitmap pixel per CSS pixel. */
const SEA_SCALE = 1;
let seaScale = SEA_SCALE;
/** Design units to CSS pixels, and the offset of the design's origin. */
let scale = 1;
let offX = 0;
let offY = 0;
/** The About tiles are drawn again after a resize or once the fonts are in. */
let tilesDirty = true;

function layout(): void {
  W = window.innerWidth;
  H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  seaScale = SEA_SCALE;
  // Cover, not fit: the sea is a backdrop, so it fills the page and is cropped rather than letterboxed.
  scale = Math.max(W / VW, H / VH);
  offX = (W - VW * scale) / 2;
  offY = (H - VH * scale) / 2;
  tilesDirty = true;
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
  const bw = Math.round(W * seaScale);
  const bh = Math.round(H * seaScale);
  if (sea.width !== bw || sea.height !== bh) {
    sea.width = bw;
    sea.height = bh;
  }
  const ctx = sea.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#eaeef6';
  ctx.fillRect(0, 0, bw, bh);
  ctx.setTransform(seaScale * scale, 0, 0, seaScale * scale, seaScale * offX, seaScale * offY);
  // WaveBackground.draw (the waves, then decorBackground), the drifters, and the veil.
  TitleProto.draw.call(title, ctx);
}

/* ------------------------------------------------------------------ */
/* Pacing: the sea steps down when a frame runs long                   */
/* ------------------------------------------------------------------ */

/** Frame intervals (ms) the sea steps through: 30, then 20, then 12 frames a second. */
const PACES = [30, 20, 12].map((fps) => 1000 / fps);
/** The first frames carry the font and cache warm-up, so they do not count towards the pace. */
const WARM_FRAMES = 2;
let pace = 0;
let warm = 0;
/** Moving averages of one paint's cost and of the gap between paints, in ms. */
let paintCost = 0;
let paintGap = 0;
/** Paints in a row that were cheap enough for the faster pace. */
let calm = 0;

function adapt(cost: number, gap: number): void {
  if (warm < WARM_FRAMES) {
    warm++;
    return;
  }
  paintCost = paintCost ? paintCost * 0.7 + cost * 0.3 : cost;
  paintGap = paintGap ? paintGap * 0.7 + gap * 0.3 : gap;
  const budget = PACES[pace];
  if (paintCost > 0.7 * budget || paintGap > 1.6 * budget) {
    if (pace < PACES.length - 1) pace++;
    calm = 0;
  } else if (pace > 0 && paintCost < 0.35 * PACES[pace - 1]) {
    // Only climb back once a faster pace has room for the paint, and for long enough to trust it.
    if (++calm > 45) {
      pace--;
      calm = 0;
    }
  } else {
    calm = 0;
  }
  seaStats.pace = pace;
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
/* The About tiles: the game's own tiles, drawn by drawSquare          */
/* ------------------------------------------------------------------ */

/** drawSquare keeps this much of a tile on each side for the body's shadow; the .stat-tile box is 1.6 tiles. */
const TILE_ROOM = 0.3;
const statTiles = Array.from(document.querySelectorAll<HTMLCanvasElement>('canvas[data-tile]'));

function paintStatTiles(): void {
  for (const c of statTiles) {
    const css = c.clientWidth;
    if (!css) continue;
    const bw = Math.round(css * dpr);
    if (c.width !== bw || c.height !== bw) {
      c.width = bw;
      c.height = bw;
    }
    const ctx = c.getContext('2d');
    if (!ctx) continue;
    const face = bw / (1 + 2 * TILE_ROOM);
    const at = face * TILE_ROOM;
    const tile = blankTile(Number(c.dataset.num));
    tile.colour = c.dataset.colour ?? 'white';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bw);
    drawSquare(ctx, at, at, face, tile, { noIcon: true });
  }
}

/* ------------------------------------------------------------------ */
/* A click on the sea swells the piece under it, and plays its sound  */
/* ------------------------------------------------------------------ */

/** Counts what the sea has done, so a test can see a click land and the frame rate hold. */
const seaStats = { pokes: 0, frames: 0, paintMs: 0, pace: 0, sounds: 0, unlockMs: 0 };
(window as Any).colorogueSea = seaStats;
// For the test harness: whether the sound engine is live, and that its music bus is silent.
Object.defineProperty(seaStats, 'sound', {
  enumerable: true,
  get: () => ({ live: !!audio?.live, state: (audio as Any)?.ctx?.state ?? null, musicGain: (audio as Any)?.musicBus?.gain.value ?? null }),
});

/**
 * The game's sound engine, for its effects only. Its sea bed starts on unlock, so the music bus is set to
 * zero before that: the bed renders but stays silent, and no soundtrack plays on the site.
 */
let audio: AudioEngine | null = null;

/** Browsers allow sound only inside a gesture, so the first press unlocks the engine (later presses resume it). */
function unlockSound(): void {
  if (audio) {
    audio.unlock();
    return;
  }
  audio = new AudioEngine();
  audio.musicVolume = 0;
  // The first unlock is the one that costs: it sets up the engine's sea bed, which then stays silent.
  const t0 = performance.now();
  audio.unlock();
  seaStats.unlockMs = performance.now() - t0;
  // A context made in a gesture can still start suspended (Safari does); resuming it here, inside the gesture, starts it.
  void (audio as Any).ctx?.resume?.();
}

function onPageClick(e: MouseEvent): void {
  if (reduced || !running) return;
  const target = e.target as Element | null;
  if (target && target.closest && target.closest(NO_POKE)) return;
  const x = (e.clientX - offX) / scale;
  const y = (e.clientY - offY) / scale;
  // The same order as src/app.ts: the sea's own pieces first, then the scene's drifters.
  const hit = decorPoke(x, y) ?? TitleProto.pokeBackground.call(title, x, y);
  if (!hit) return;
  seaStats.pokes++;
  if (audio) {
    audio.poke(hit.kind, hit.size);
    seaStats.sounds++;
  }
}

/* ------------------------------------------------------------------ */
/* The leaderboard's boards, with the game's hover cards               */
/* ------------------------------------------------------------------ */

/*
 * A board in the hall's own units (drawHallDetail): five tiles of 168 on a pitch of 188. Drawing at those
 * sizes is what makes the icons, the boost and the enchantment glow appear, as they do in the game; the
 * canvas then scales the whole board down to its CSS size.
 */
const TILE_U = 168;
const PITCH_U = 188;
/** Room round the board, so a tile's shadow and the panel's own shade both fit inside the canvas. */
const BOARD_AT_U = 96;
const PANEL_U = 30;
const SPAN_U = 4 * PITCH_U + TILE_U + 2 * BOARD_AT_U;
/** A hover card is drawn at the hall's card width, with room round it for its shadow. */
const CARD_U = 620;
const CARD_PAD_U = 24;
/** How long a pointer may be off a row or the board (the gap between them) before the preview closes. */
const HIDE_DELAY = 180;

const table = document.querySelector<HTMLElement>('.board-table');
const preview = document.getElementById('board-preview') as HTMLElement | null;
const previewCanvas = preview?.querySelector<HTMLCanvasElement>('canvas') ?? null;
const previewCaption = preview?.querySelector<HTMLElement>('.bp-cap') ?? null;
const tip = document.getElementById('board-tip') as HTMLCanvasElement | null;
const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('tr[data-run]'));
/** Measures a card before it is drawn: drawInfoCard returns the card's height. */
const measure = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;

let shownRun = -1;
let shownRow: HTMLTableRowElement | null = null;
let pinnedRow: HTMLTableRowElement | null = null;
/** The tile under the pointer (or tapped), or -1. Its card is on screen while it is set. */
let hovered = -1;
let hideTimer = 0;

function scheduleHide(): void {
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (!pinnedRow) hidePreview();
  }, HIDE_DELAY);
}

function cancelHide(): void {
  clearTimeout(hideTimer);
}

/** The tile of the shown board under a point, or -1. */
function tileAt(clientX: number, clientY: number): number {
  if (!previewCanvas) return -1;
  const r = previewCanvas.getBoundingClientRect();
  if (!r.width) return -1;
  const u = ((clientX - r.left) / r.width) * SPAN_U - BOARD_AT_U;
  const v = ((clientY - r.top) / r.height) * SPAN_U - BOARD_AT_U;
  const c = Math.floor(u / PITCH_U);
  const k = Math.floor(v / PITCH_U);
  if (c < 0 || c > 4 || k < 0 || k > 4) return -1;
  if (u - c * PITCH_U > TILE_U || v - k * PITCH_U > TILE_U) return -1;
  return k * 5 + c;
}

/** Where a tile of the shown board is on screen, in CSS pixels. */
function tileRect(i: number): { left: number; top: number; size: number } | null {
  if (!previewCanvas) return null;
  const r = previewCanvas.getBoundingClientRect();
  const k = r.width / SPAN_U;
  return {
    left: r.left + (BOARD_AT_U + (i % 5) * PITCH_U) * k,
    top: r.top + (BOARD_AT_U + Math.floor(i / 5) * PITCH_U) * k,
    size: TILE_U * k,
  };
}

/** The shown board, as the hall's closer look draws it (drawHallDetail): panel, tiles, and the hovered tile's highlight. */
function paintPreview(t: number): void {
  if (!preview || preview.hidden || !previewCanvas || shownRun < 0) return;
  const run = LEADERBOARD[shownRun];
  if (!run?.tiles) return;
  const L = previewCanvas.clientWidth;
  if (!L) return;
  const bw = Math.round(L * dpr);
  if (previewCanvas.width !== bw || previewCanvas.height !== bw) {
    previewCanvas.width = bw;
    previewCanvas.height = bw;
  }
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return;
  const k = bw / SPAN_U;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bw, bw);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  drawPanel(ctx, { x: PANEL_U, y: PANEL_U, w: SPAN_U - 2 * PANEL_U, h: SPAN_U - 2 * PANEL_U }, { radius: 56, raised: 14, blur: 30 });
  for (let i = 0; i < 25; i++) {
    const x = BOARD_AT_U + (i % 5) * PITCH_U;
    const y = BOARD_AT_U + Math.floor(i / 5) * PITCH_U;
    const tile = run.tiles[i];
    if (tile) drawSquareMini(ctx, x, y, TILE_U, tile, { t, snapshot: true, hotMod: i === hovered ? 0 : -1 });
    else drawEmptyPlot(ctx, x, y, TILE_U);
  }
}

/** The hovered tile's card, as the hall draws it: its title, its number and colour, then its sections. */
function paintTip(): void {
  if (!tip) return;
  const run = shownRun >= 0 ? LEADERBOARD[shownRun] : undefined;
  const sq = run && hovered >= 0 ? run.tiles?.[hovered] : undefined;
  if (!sq) {
    tip.hidden = true;
    return;
  }
  const title = tileTitle(sq);
  const sub = `Number ${tileText(sq.num)}  ·  ${sq.colour} tile  ·  ${sq.mods.length} of 4 modifier slots used`;
  const colour = sq.colour === 'white' ? 'azure' : sq.colour;
  const sections = tileSections(sq, null);
  const h = drawInfoCard(measure, 0, 0, CARD_U, title, sub, colour, sections, VH - 20);
  const cardW = CARD_U + 2 * CARD_PAD_U;
  const cardH = h + 2 * CARD_PAD_U;
  // The card is drawn at the game's width, at most 0.6 of its size, and smaller only as far as the screen needs,
  // so a long card (four modifiers) is seen whole rather than cut off at the bottom of the viewport.
  const s = Math.max(0.3, Math.min(0.6, (W - 24) / cardW, (H - 24) / cardH));
  const cssW = Math.round(cardW * s);
  const cssH = Math.round(cardH * s);
  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (tip.width !== bw || tip.height !== bh) {
    tip.width = bw;
    tip.height = bh;
  }
  tip.style.width = `${cssW}px`;
  tip.style.height = `${cssH}px`;
  const ctx = tip.getContext('2d');
  if (!ctx) return;
  const q = bw / cardW;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bw, bh);
  ctx.setTransform(q, 0, 0, q, 0, 0);
  drawInfoCard(ctx, CARD_PAD_U, CARD_PAD_U, CARD_U, title, sub, colour, sections, VH - 20);
  tip.hidden = false;
  placeTip();
}

/** Beside its tile, on whichever side has room, and never off the screen. */
function placeTip(): void {
  if (!tip || tip.hidden) return;
  const t = hovered >= 0 ? tileRect(hovered) : null;
  if (!t) return;
  const edge = 12;
  const gap = 12;
  const cw = tip.clientWidth;
  const ch = tip.clientHeight;
  let left = t.left + t.size + gap;
  if (left + cw > W - edge) left = t.left - gap - cw;
  left = Math.min(Math.max(left, edge), Math.max(edge, W - cw - edge));
  const top = Math.min(Math.max(t.top, edge), Math.max(edge, H - ch - edge));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

/** Moves the hover to a tile, or to none: the board's highlight and the card follow. */
function setHover(i: number): void {
  if (i === hovered) return;
  hovered = i;
  paintPreview(time);
  paintTip();
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
  hovered = -1;
  const run = LEADERBOARD[shownRun];
  if (previewCaption && run) {
    previewCaption.textContent = `${run.player}, round ${run.round}, ${run.score}`;
  }
  preview.hidden = false;
  preview.classList.toggle('is-pinned', pinned);
  setExpanded(row, true);
  place(row);
  paintPreview(time);
  paintTip();
}

function hidePreview(): void {
  if (!preview) return;
  cancelHide();
  setExpanded(shownRow, false);
  preview.hidden = true;
  preview.classList.remove('is-pinned');
  if (tip) tip.hidden = true;
  hovered = -1;
  shownRow = null;
  shownRun = -1;
  pinnedRow = null;
}

function wirePreviews(): void {
  if (!preview || !table || !previewCanvas) return;
  for (const row of rows) {
    // A mouse hovers a row to see its board, and can move onto the board to read its tiles. Touch and the
    // keyboard use the click (or Enter on the button).
    row.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType !== 'mouse') return;
      cancelHide();
      if (!pinnedRow) showRow(row, false);
    });
    row.addEventListener('pointerleave', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse' && !pinnedRow) scheduleHide();
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
  // The board: a mouse hovers a tile for its card; a tap on a tile shows its card until the next tap.
  preview.addEventListener('pointerenter', (e) => {
    if ((e as PointerEvent).pointerType === 'mouse') cancelHide();
  });
  preview.addEventListener('pointerleave', (e) => {
    if ((e as PointerEvent).pointerType !== 'mouse') return;
    setHover(-1);
    if (!pinnedRow) scheduleHide();
  });
  previewCanvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') setHover(tileAt(e.clientX, e.clientY));
  });
  previewCanvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const i = tileAt(e.clientX, e.clientY);
    setHover(i === hovered ? -1 : i);
  });
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
    if (shownRow && preview && !preview.hidden) {
      place(shownRow);
      placeTip();
    }
  };
  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', follow);
}

/* ------------------------------------------------------------------ */
/* The frame loop                                                      */
/* ------------------------------------------------------------------ */

function paintAll(): void {
  // The wordmark first: its fallback text is hidden only once it is drawn, so it should appear with the page.
  paintWordmarks(time);
  if (tilesDirty) {
    paintStatTiles();
    tilesDirty = false;
  }
  paintSea();
  paintPreview(time);
}

/** The clock runs every frame; the paint runs at the sea's current pace (PACES). */
let lastPaint = 0;

function step(now: number): void {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  time += dt;
  wave.update(dt);
  title.app.time = time;
  TitleProto.update.call(title, dt);
  const gap = now - lastPaint;
  if (gap >= PACES[pace] - 1) {
    lastPaint = now;
    seaStats.frames++;
    const t0 = performance.now();
    paintAll();
    const cost = performance.now() - t0;
    seaStats.paintMs += cost;
    adapt(cost, gap);
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
  document.addEventListener('pointerdown', unlockSound, { passive: true });
  // Audio is optional. A device that will not start rejects the engine's resume() with an audio error; that is not a page error.
  window.addEventListener('unhandledrejection', (e) => {
    if (/audio/i.test(String((e.reason as Any)?.message ?? ''))) e.preventDefault();
  });
  wirePreviews();
  // The fonts are registered before anything is drawn, or the canvas text falls back (never waiting longer than
  // 1.5 s). The first paint also waits for the page to load (or 3 s): painting earlier forces layout while images load.
  const cap = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const loaded = new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
  const fonts = Promise.race([loadFonts(), cap(1500)]);
  Promise.all([fonts, Promise.race([loaded, cap(3000)])]).then(() => {
    layout();
    if (reduced) {
      time = 0;
      paintAll();
    } else {
      startMotion();
    }
  });
}

init();

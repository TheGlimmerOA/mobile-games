# Mobile Key Stack v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a touch-controlled, Tetris-style falling-block game ("Key Stack") for phones and iPads, with a retro local high-score leaderboard, deployed as one game in a `mobile-games` GitHub Pages repo.

**Architecture:** One public repo (`mobile-games`) with a landing page and per-game subfolders. The game is `key-stack/index.html` (DOM, canvas rendering, input wiring, game loop) plus `key-stack/logic.js` (pure, DOM-free game rules) — the page loads `logic.js` as an ES module. Pure rules are unit-tested with Node's built-in test runner; browser-dependent behavior is verified manually against the spec's acceptance criteria.

**Tech Stack:** Vanilla HTML5 Canvas 2D, ES modules, `localStorage`, `node:test` (built-in, no dependencies). No build step.

**Spec:** `games/mobile-games/build-notes/key_stack_v1_spec.md`

## Global Constraints

- **Board:** exactly 10 columns × 18 rows.
- **Piece colors (verbatim):** `I #5aa0b8`, `O #b8a05a`, `T #8a7aa8`, `S #6a9a6a`, `Z #a86a6a`, `J #6a7aa8`, `L #a8855a`. Board bg `#10101a`, grid `#1f1f2e`, accent `#64c8ff`, text `#dcdcdc`.
- **No letters, no keyboard/arrow gameplay, no auto-place solver.** The only keyboard input is the dev hotkey (below).
- **Touch controls:** tap = rotate CW; swipe L/R = move; swipe down = hard drop.
- **Responsive full-screen:** board fills the screen, large/legible on phone and iPad, retina-crisp (`devicePixelRatio`), safe-area aware, no page scroll/zoom during play. (Spec §6.)
- **Leaderboard:** local per-device (`localStorage`), top 10, 3-initial entry (`A–Z`, space, `.`), default `AAA`; qualifies when table not full or score strictly beats the lowest; ties place newcomer below incumbent; storage failures never crash the game. (Spec §11.)
- **Dev hotkey:** `Ctrl+Shift+F` / `Cmd+Shift+F` toggles a 5× fall-speed multiplier. (Spec §8.)
- **Do NOT edit** `games/keyboard-commander-web/index.html` — read-only reference for colors/shapes.
- Commit after every step that changes files. This repo is created in Task 1.

---

## File Structure

```
mobile-games/
  index.html            landing page: lists/links the games in the line
  README.md
  .nojekyll             tell GitHub Pages to serve files as-is
  package.json          {"type":"module","scripts":{"test":"node --test"}} — no deps
  key-stack/
    index.html          the game: DOM, canvas, render, input, loop; imports logic.js
    logic.js            pure DOM-free rules (constants, pieces, board, gestures, leaderboard)
    logic.test.js       node:test unit tests for logic.js
```

- `logic.js` holds everything testable without a DOM. `index.html` holds everything that needs the DOM/canvas/touch/`localStorage`.
- `logic.js` uses `export`; the page imports it via `<script type="module">`, Node imports it in `logic.test.js`. Same file, both worlds, no build step.

---

## Task 1: Repo scaffold + test harness

**Files:**
- Create: `mobile-games/package.json`, `mobile-games/.nojekyll`, `mobile-games/README.md`
- Create: `mobile-games/key-stack/logic.js` (stub), `mobile-games/key-stack/logic.test.js` (smoke test)

**Interfaces:**
- Produces: a runnable `npm test` (aka `node --test`) harness; an ES-module `logic.js` others import.

- [ ] **Step 1: Create the repo folder and init git**

```bash
cd games/mobile-games
git init
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "mobile-games",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 3: Create `.nojekyll` (empty file) and a minimal `README.md`**

`.nojekyll` is empty. `README.md`:

```markdown
# Glimmer Learning — Mobile Games

Touch-friendly web games for glimmerlearning.com, hosted on GitHub Pages.

- **Key Stack** — `key-stack/` — a Tetris-style falling-block game. Live: `/mobile-games/key-stack/`.

Landing page: `index.html` (lists the games).
```

- [ ] **Step 4: Create a stub `key-stack/logic.js`**

```js
// Pure, DOM-free game rules for Key Stack. Imported by index.html (browser)
// and logic.test.js (Node). No DOM, no localStorage, no canvas in this file.
export const VERSION = '1.0.0';
```

- [ ] **Step 5: Create `key-stack/logic.test.js` smoke test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION } from './key-stack/logic.js';

test('logic module loads', () => {
  assert.equal(typeof VERSION, 'string');
});
```

- [ ] **Step 6: Run the harness**

Run: `node --test`
Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: scaffold mobile-games repo and test harness"
```

---

## Task 2: Constants + pieces + rotation (logic.js)

**Files:**
- Modify: `mobile-games/key-stack/logic.js`
- Test: `mobile-games/key-stack/logic.test.js`

**Interfaces:**
- Produces: `COLS=10`, `ROWS=18`, `COLORS`, `BOARD_BG`, `GRID`, `ACCENT`, `TEXT`, `TETRO`, `NAMES`, `rotate(shape) -> shape`.

- [ ] **Step 1: Write failing tests for rotation**

Append to `logic.test.js`:

```js
import { rotate, TETRO, NAMES, COLS, ROWS, COLORS } from './key-stack/logic.js';

test('board is 10x18', () => {
  assert.equal(COLS, 10);
  assert.equal(ROWS, 18);
});

test('seven tetrominoes with colors', () => {
  assert.deepEqual(NAMES.sort(), ['I','J','L','O','S','T','Z']);
  for (const n of NAMES) assert.match(COLORS[n], /^#[0-9a-f]{6}$/);
});

test('rotate T clockwise', () => {
  // T = [[1,1,1],[0,1,0]] rotated CW -> [[0,1],[1,1],[0,1]]
  assert.deepEqual(rotate(TETRO.T), [[0,1],[1,1],[0,1]]);
});

test('rotate O is unchanged', () => {
  assert.deepEqual(rotate(TETRO.O), [[1,1],[1,1]]);
});

test('rotate four times returns original I', () => {
  let s = TETRO.I;
  for (let i = 0; i < 4; i++) s = rotate(s);
  assert.deepEqual(s, TETRO.I);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test`
Expected: FAIL — `rotate`, `TETRO`, etc. are not exported.

- [ ] **Step 3: Implement constants, pieces, rotation in `logic.js`**

Replace the stub body (keep `VERSION`) with:

```js
export const COLS = 10;
export const ROWS = 18;

export const COLORS = {
  I: '#5aa0b8', O: '#b8a05a', T: '#8a7aa8', S: '#6a9a6a',
  Z: '#a86a6a', J: '#6a7aa8', L: '#a8855a',
};
export const BOARD_BG = '#10101a';
export const GRID = '#1f1f2e';
export const ACCENT = '#64c8ff';
export const TEXT = '#dcdcdc';

export const TETRO = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[1,1,1],[0,1,0]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
};
export const NAMES = Object.keys(TETRO);

// Clockwise rotation via transpose + reverse-rows.
export function rotate(shape) {
  const h = shape.length, w = shape[0].length;
  const out = Array.from({ length: w }, () => Array(h).fill(0));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      out[x][h - 1 - y] = shape[y][x];
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add key-stack/logic.js key-stack/logic.test.js
git commit -m "feat: pieces, colors, and clockwise rotation"
```

---

## Task 3: Board + collision (logic.js)

**Files:**
- Modify: `key-stack/logic.js`, `key-stack/logic.test.js`

**Interfaces:**
- Produces: `emptyGrid() -> grid` (2D array of `null`/name), `canFit(grid, shape, px, py) -> bool`, `dropY(grid, shape, px, py) -> number`.
- Grid cells hold `null` (empty) or a piece-name string (locked, colored).

- [ ] **Step 1: Write failing tests**

```js
import { emptyGrid, canFit, dropY } from './key-stack/logic.js';

test('emptyGrid is ROWS x COLS of null', () => {
  const g = emptyGrid();
  assert.equal(g.length, ROWS);
  assert.equal(g[0].length, COLS);
  assert.ok(g.every(row => row.every(c => c === null)));
});

test('canFit within empty board', () => {
  assert.equal(canFit(emptyGrid(), TETRO.O, 0, 0), true);
});

test('canFit rejects out of left wall', () => {
  assert.equal(canFit(emptyGrid(), TETRO.O, -1, 0), false);
});

test('canFit rejects out of right wall', () => {
  assert.equal(canFit(emptyGrid(), TETRO.O, COLS - 1, 0), false);
});

test('canFit rejects below floor', () => {
  assert.equal(canFit(emptyGrid(), TETRO.O, 0, ROWS - 1), false);
});

test('canFit rejects overlap with locked cell', () => {
  const g = emptyGrid();
  g[5][0] = 'T';
  assert.equal(canFit(g, TETRO.O, 0, 4), false);
});

test('dropY lands O on empty floor', () => {
  // O is 2 tall; bottom row index for top-left is ROWS-2.
  assert.equal(dropY(emptyGrid(), TETRO.O, 0, 0), ROWS - 2);
});

test('dropY stacks on top of a locked cell', () => {
  const g = emptyGrid();
  g[ROWS - 1][0] = 'T';
  g[ROWS - 1][1] = 'T';
  assert.equal(dropY(g, TETRO.O, 0, 0), ROWS - 3);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test`
Expected: FAIL — functions undefined.

- [ ] **Step 3: Implement**

Append to `logic.js`:

```js
export function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function canFit(grid, shape, px, py) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[0].length; x++) {
      if (!shape[y][x]) continue;
      const gx = px + x, gy = py + y;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
      if (gy >= 0 && grid[gy][gx]) return false;
    }
  }
  return true;
}

// Lowest y (>= py) at which the shape still fits.
export function dropY(grid, shape, px, py) {
  let y = py;
  while (canFit(grid, shape, px, y + 1)) y += 1;
  return y;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add key-stack/logic.js key-stack/logic.test.js
git commit -m "feat: board grid, collision, and drop position"
```

---

## Task 4: Lock + line clear (logic.js)

**Files:**
- Modify: `key-stack/logic.js`, `key-stack/logic.test.js`

**Interfaces:**
- Produces: `lockPiece(grid, shape, name, px, py) -> newGrid`, `fullRows(grid) -> number[]` (descending), `clearRows(grid, rows) -> newGrid`. All return new grids; inputs are not mutated.

- [ ] **Step 1: Write failing tests**

```js
import { lockPiece, fullRows, clearRows } from './key-stack/logic.js';

test('lockPiece stamps the name and does not mutate input', () => {
  const g = emptyGrid();
  const out = lockPiece(g, TETRO.O, 'O', 0, ROWS - 2);
  assert.equal(out[ROWS - 1][0], 'O');
  assert.equal(out[ROWS - 1][1], 'O');
  assert.equal(g[ROWS - 1][0], null, 'original grid untouched');
});

test('fullRows finds a completed bottom row', () => {
  const g = emptyGrid();
  for (let x = 0; x < COLS; x++) g[ROWS - 1][x] = 'I';
  assert.deepEqual(fullRows(g), [ROWS - 1]);
});

test('fullRows returns empty when no row is full', () => {
  const g = emptyGrid();
  g[ROWS - 1][0] = 'I';
  assert.deepEqual(fullRows(g), []);
});

test('clearRows removes rows and shifts down', () => {
  const g = emptyGrid();
  for (let x = 0; x < COLS; x++) g[ROWS - 1][x] = 'I';
  g[ROWS - 2][3] = 'T'; // a floating cell above the cleared row
  const out = clearRows(g, [ROWS - 1]);
  assert.equal(out[ROWS - 1][3], 'T', 'cell above shifted down by one');
  assert.ok(out[0].every(c => c === null), 'new empty row on top');
});

test('clearRows handles multiple rows', () => {
  const g = emptyGrid();
  for (let x = 0; x < COLS; x++) { g[ROWS - 1][x] = 'I'; g[ROWS - 2][x] = 'I'; }
  const out = clearRows(g, fullRows(g));
  assert.ok(out.every(row => row.every(c => c === null)));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `logic.js`:

```js
export function lockPiece(grid, shape, name, px, py) {
  const g = grid.map(r => r.slice());
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[0].length; x++) {
      if (!shape[y][x]) continue;
      const gx = px + x, gy = py + y;
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) g[gy][gx] = name;
    }
  }
  return g;
}

// Completed row indices, top-to-bottom order reversed (highest index first).
export function fullRows(grid) {
  const rows = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(c => c)) rows.push(y);
  }
  return rows;
}

export function clearRows(grid, rows) {
  const g = grid.map(r => r.slice());
  const sorted = rows.slice().sort((a, b) => b - a); // descending so splices don't shift
  for (const y of sorted) {
    g.splice(y, 1);
    g.unshift(Array(COLS).fill(null));
  }
  return g;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add key-stack/logic.js key-stack/logic.test.js
git commit -m "feat: lock piece and line clear"
```

---

## Task 5: Gesture classification + speed ramp (logic.js)

**Files:**
- Modify: `key-stack/logic.js`, `key-stack/logic.test.js`

**Interfaces:**
- Produces:
  - `classifyGesture(dx, dy, cellW, tapMax=12) -> {type}` where `type` is `'tap' | 'move' | 'harddrop' | 'none'`; a `'move'` result also has `dir` (`-1`/`1`) and `cols` (>=1).
  - `fallInterval(elapsedSec, testMult=1) -> number` seconds per row.

- [ ] **Step 1: Write failing tests**

```js
import { classifyGesture, fallInterval } from './key-stack/logic.js';

test('small movement is a tap', () => {
  assert.equal(classifyGesture(3, -4, 30).type, 'tap');
});

test('rightward swipe moves right, columns scale with distance', () => {
  const r = classifyGesture(65, 5, 30); // ~2 cells at cellW 30
  assert.equal(r.type, 'move');
  assert.equal(r.dir, 1);
  assert.equal(r.cols, 2);
});

test('leftward swipe moves left at least one column', () => {
  const r = classifyGesture(-20, 3, 30);
  assert.equal(r.type, 'move');
  assert.equal(r.dir, -1);
  assert.ok(r.cols >= 1);
});

test('downward swipe is hard drop', () => {
  assert.equal(classifyGesture(5, 80, 30).type, 'harddrop');
});

test('upward swipe is none (no gameplay action)', () => {
  assert.equal(classifyGesture(4, -80, 30).type, 'none');
});

test('fallInterval starts near 0.9 and floors at 0.25', () => {
  assert.ok(Math.abs(fallInterval(0) - 0.9) < 1e-9);
  assert.ok(fallInterval(1000) >= 0.25 - 1e-9);
  assert.ok(fallInterval(1000) <= 0.26);
});

test('fallInterval respects the test multiplier', () => {
  assert.ok(Math.abs(fallInterval(0, 5) - 0.18) < 1e-9);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `logic.js`:

```js
// Classify a touch by net displacement (evaluated on touchend). dead-zone = tapMax px.
export function classifyGesture(dx, dy, cellW, tapMax = 12) {
  if (Math.abs(dx) < tapMax && Math.abs(dy) < tapMax) return { type: 'tap' };
  if (Math.abs(dx) >= Math.abs(dy)) {
    const cols = Math.max(1, Math.round(Math.abs(dx) / cellW));
    return { type: 'move', dir: dx > 0 ? 1 : -1, cols };
  }
  if (dy > 0) return { type: 'harddrop' };
  return { type: 'none' }; // upward swipe: unused in gameplay
}

// Seconds per row. Ramps 0.9 -> 0.25 over ~12s of play; testMult speeds it up.
export function fallInterval(elapsedSec, testMult = 1) {
  const ramp = Math.min(1, elapsedSec / 12);
  const iv = Math.max(0.25, 0.9 - ramp * 0.65);
  return iv / testMult;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add key-stack/logic.js key-stack/logic.test.js
git commit -m "feat: gesture classification and speed ramp"
```

---

## Task 6: Leaderboard logic (logic.js)

**Files:**
- Modify: `key-stack/logic.js`, `key-stack/logic.test.js`

**Interfaces:**
- Produces:
  - `LB_SIZE = 10`.
  - `qualifies(scores, score) -> bool` (`scores` is a descending array of `{initials, score}`).
  - `insertScore(scores, entry) -> newScores` (sorted desc, capped at `LB_SIZE`, newcomer below ties).
  - `sanitizeInitials(str) -> string` (upper-case, 3 chars from `A–Z . space`, padded with `A`).
  - `seedScores() -> {initials, score}[]` (a default non-empty top-10 table).

- [ ] **Step 1: Write failing tests**

```js
import { LB_SIZE, qualifies, insertScore, sanitizeInitials, seedScores } from './key-stack/logic.js';

const full = Array.from({ length: 10 }, (_, i) => ({ initials: 'AAA', score: 100 - i * 10 })); // 100..10

test('qualifies when table not full', () => {
  assert.equal(qualifies([], 1), true);
});

test('does not qualify with a zero score', () => {
  assert.equal(qualifies([], 0), false);
});

test('qualifies when beating the lowest on a full table', () => {
  assert.equal(qualifies(full, 11), true);
});

test('does not qualify when equal to the lowest on a full table', () => {
  assert.equal(qualifies(full, 10), false);
});

test('insertScore keeps sorted, caps at 10', () => {
  const out = insertScore(full, { initials: 'MAY', score: 55 });
  assert.equal(out.length, LB_SIZE);
  for (let i = 1; i < out.length; i++) assert.ok(out[i - 1].score >= out[i].score);
  assert.ok(out.some(e => e.initials === 'MAY' && e.score === 55));
});

test('tie places newcomer below the incumbent', () => {
  const base = [{ initials: 'OLD', score: 50 }];
  const out = insertScore(base, { initials: 'NEW', score: 50 });
  assert.deepEqual(out.map(e => e.initials), ['OLD', 'NEW']);
});

test('sanitizeInitials upper-cases, filters, pads to 3', () => {
  assert.equal(sanitizeInitials('m'), 'MAA');
  assert.equal(sanitizeInitials('may'), 'MAY');
  assert.equal(sanitizeInitials('m@y!'), 'MYA'); // '@' and '!' dropped, padded
  assert.equal(sanitizeInitials(''), 'AAA');
  assert.equal(sanitizeInitials('abcd'), 'ABC'); // truncated to 3
});

test('seedScores returns a valid descending top-10', () => {
  const s = seedScores();
  assert.equal(s.length, LB_SIZE);
  for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].score >= s[i].score);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test`
Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `logic.js`:

```js
export const LB_SIZE = 10;

export function qualifies(scores, score) {
  if (score <= 0) return false;
  if (scores.length < LB_SIZE) return true;
  return score > scores[scores.length - 1].score;
}

export function insertScore(scores, entry) {
  const list = scores.slice();
  // Insert before the first entry with a strictly smaller score (so ties go below).
  let i = list.findIndex(e => e.score < entry.score);
  if (i === -1) i = list.length;
  list.splice(i, 0, entry);
  return list.slice(0, LB_SIZE);
}

const ALLOWED = /[A-Z. ]/;
export function sanitizeInitials(str) {
  const chars = String(str).toUpperCase().split('').filter(c => ALLOWED.test(c));
  while (chars.length < 3) chars.push('A');
  return chars.slice(0, 3).join('');
}

export function seedScores() {
  const names = ['GLM', 'MAY', 'ACE', 'BOT', 'KEY', 'ZAP', 'FOX', 'JET', 'OWL', 'AAA'];
  return names.map((initials, i) => ({ initials, score: 100 - i * 10 }));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add key-stack/logic.js key-stack/logic.test.js
git commit -m "feat: leaderboard qualify/insert, initials, seed"
```

---

## Task 7: Page shell + responsive retina canvas

**Files:**
- Create: `key-stack/index.html`

**Interfaces:**
- Produces: a full-screen `<canvas id="game">`, a `layout` object recomputed on resize with `{cell, boardX, boardY, boardW, boardH, dpr}`, and a `resize()` that sizes the canvas backing store to `cssW*dpr × cssH*dpr` and scales the context by `dpr`.

- [ ] **Step 1: Create `key-stack/index.html` with the shell**

This step establishes the page, the canvas, the responsive sizing math (spec §6), and a placeholder render that draws the empty board so sizing is verifiable. Later tasks add real rendering, loop, input, leaderboard.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Key Stack</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; height: 100%; background: #10101a; overflow: hidden; }
  body {
    /* Lock out scroll/zoom gestures during play. */
    touch-action: none;
    -webkit-user-select: none; user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  #game { display: block; width: 100vw; height: 100dvh; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<script type="module">
import {
  COLS, ROWS, COLORS, BOARD_BG, GRID, ACCENT, TEXT,
  TETRO, NAMES, rotate, emptyGrid, canFit, dropY,
  lockPiece, fullRows, clearRows, classifyGesture, fallInterval,
  LB_SIZE, qualifies, insertScore, sanitizeInitials, seedScores,
} from './logic.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// UI band above the board reserves room for score + next-piece.
const HEADER_FRAC = 0.14;   // fraction of height reserved for the header
const MAX_CELL = 64;        // cap so the board isn't comically blocky on big tablets

const layout = { cell: 20, boardX: 0, boardY: 0, boardW: 0, boardH: 0, headerH: 0, dpr: 1, cssW: 0, cssH: 0 };

function resize() {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels, crisp on retina

  const headerH = Math.round(cssH * HEADER_FRAC);
  const usableH = cssH - headerH;
  const cell = Math.min(
    Math.floor(cssW / COLS),
    Math.floor(usableH / ROWS),
    MAX_CELL
  );
  const boardW = cell * COLS;
  const boardH = cell * ROWS;
  Object.assign(layout, {
    cell, boardW, boardH, headerH, dpr, cssW, cssH,
    boardX: Math.floor((cssW - boardW) / 2),
    boardY: headerH + Math.floor((usableH - boardH) / 2),
  });
}

function drawBoardFrame() {
  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(0, 0, layout.cssW, layout.cssH);
  const { cell, boardX, boardY } = layout;
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(boardX + c * cell, boardY);
    ctx.lineTo(boardX + c * cell, boardY + layout.boardH);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(boardX, boardY + r * cell);
    ctx.lineTo(boardX + layout.boardW, boardY + r * cell);
    ctx.stroke();
  }
}

window.addEventListener('resize', () => { resize(); drawBoardFrame(); });
window.addEventListener('orientationchange', () => { resize(); drawBoardFrame(); });
resize();
drawBoardFrame();

// Expose for later tasks / manual poking.
window.__ks = { layout, resize };
</script>
</body>
</html>
```

- [ ] **Step 2: Manual verification — sizing**

Run a local server from `mobile-games/`: `python -m http.server 8000` (or `npx serve`), open `http://localhost:8000/key-stack/`.
Expected: a centered 10×18 grid that fills most of the viewport height. Resize the window narrow (phone-like) and wide (tablet-like) and rotate via devtools device toolbar — the board always fits fully on screen, never clipped, never requiring scroll. Grid lines are crisp (no blur) on a retina/2× display.

- [ ] **Step 3: Commit**

```bash
git add key-stack/index.html
git commit -m "feat: responsive retina canvas shell and board frame"
```

---

## Task 8: Rendering — locked cells, active piece, next-piece, score

**Files:**
- Modify: `key-stack/index.html`

**Interfaces:**
- Consumes: `layout`, `logic.js` colors.
- Produces: a `G` game-state object `{ grid, piece, name, px, py, next, score, best, state }` and a `render()` that draws the frame, locked cells, active piece, header (score + next preview). `state` is `'start' | 'play' | 'over' | 'entry' | 'board'`.

- [ ] **Step 1: Add state + cell drawing + render**

Inside the `<script type="module">`, after `resize()` setup, add:

```js
const G = {
  grid: emptyGrid(),
  piece: TETRO.T, name: 'T', px: 3, py: 0,
  next: 'O',
  score: 0, best: 0,
  state: 'start',
  startedAt: 0,
};

function drawCell(gx, gy, name) {
  const { cell, boardX, boardY } = layout;
  const x = boardX + gx * cell, y = boardY + gy * cell;
  ctx.fillStyle = COLORS[name] || ACCENT;
  ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
  // subtle inset highlight (reads well at large sizes)
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(x + 1, y + 1, cell - 2, Math.max(2, cell * 0.12));
}

function drawPiece(shape, name, px, py) {
  for (let y = 0; y < shape.length; y++)
    for (let x = 0; x < shape[0].length; x++)
      if (shape[y][x] && py + y >= 0) drawCell(px + x, py + y, name);
}

function drawHeader() {
  const { headerH, cssW, cell } = layout;
  const pad = Math.round(headerH * 0.18);
  const fs = Math.max(16, Math.round(headerH * 0.34));
  ctx.fillStyle = TEXT;
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${fs}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`LINES ${G.score}`, pad, headerH / 2);
  // Next-piece preview, right-aligned in the header.
  const shape = TETRO[G.next];
  const nc = Math.max(8, Math.round(cell * 0.55));
  const pw = shape[0].length * nc, ph = shape.length * nc;
  const nx = cssW - pad - pw, ny = (headerH - ph) / 2;
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'right';
  ctx.font = `500 ${Math.round(fs * 0.7)}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.fillText('NEXT', cssW - pad, headerH * 0.22);
  for (let y = 0; y < shape.length; y++)
    for (let x = 0; x < shape[0].length; x++)
      if (shape[y][x]) {
        ctx.fillStyle = COLORS[G.next];
        ctx.fillRect(nx + x * nc + 1, ny + y * nc + 1, nc - 2, nc - 2);
      }
}

function render() {
  drawBoardFrame();
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (G.grid[y][x]) drawCell(x, y, G.grid[y][x]);
  if (G.state === 'play') drawPiece(G.piece, G.name, G.px, G.py);
  drawHeader();
}
```

- [ ] **Step 2: Temporarily force a visible scene and verify**

Temporarily set `G.state = 'play';` and put a few locked cells for a visual check, then call `render()` instead of `drawBoardFrame()` at the end of the script:

```js
G.grid[ROWS - 1][0] = 'L'; G.grid[ROWS - 1][1] = 'L'; G.state = 'play';
render();
```

Manual: reload the local server page.
Expected: header shows `LINES 0` and a `NEXT` preview (O piece); a T piece near the top; two L cells at the bottom-left. Colors match the spec palette.

- [ ] **Step 3: Remove the temporary scene**

Delete the two temp lines from Step 2 (leave `render()` as the final call; state returns to `'start'`). Rendering for real states comes next task.

- [ ] **Step 4: Commit**

```bash
git add key-stack/index.html
git commit -m "feat: render locked cells, active piece, header, next preview"
```

---

## Task 9: Game loop, gravity, spawn, lock, line-clear, top-out

**Files:**
- Modify: `key-stack/index.html`

**Interfaces:**
- Consumes: `logic.js` rules, `G`, `render()`.
- Produces: `spawn()`, `step(now)` gravity, `hardDrop()`, `tryMove(dcol)`, `tryRotate()`, and a `requestAnimationFrame` loop. Sets `G.state='over'` on top-out.

- [ ] **Step 1: Add spawning, movement, gravity, and the loop**

Add to the script:

```js
let testMult = 1;                 // toggled by the dev hotkey (Task 12)
let lastFall = 0;                 // seconds accumulator baseline
const nowSec = () => performance.now() / 1000;

function randName() { return NAMES[Math.floor(Math.random() * NAMES.length)]; }

function spawn() {
  G.name = G.next;
  G.next = randName();
  G.piece = TETRO[G.name];
  G.px = Math.floor((COLS - G.piece[0].length) / 2);
  G.py = 0;
  if (!canFit(G.grid, G.piece, G.px, G.py)) {
    endRound();
  }
}

function startRound() {
  G.grid = emptyGrid();
  G.score = 0;
  G.next = randName();
  G.state = 'play';
  G.startedAt = nowSec();
  lastFall = nowSec();
  spawn();
}

function tryMove(dcol) {
  if (G.state !== 'play') return;
  if (canFit(G.grid, G.piece, G.px + dcol, G.py)) G.px += dcol;
}

function tryRotate() {
  if (G.state !== 'play') return;
  const r = rotate(G.piece);
  if (canFit(G.grid, r, G.px, G.py)) G.piece = r;
}

function lockAndResolve() {
  G.grid = lockPiece(G.grid, G.piece, G.name, G.px, G.py);
  const rows = fullRows(G.grid);
  if (rows.length) {
    G.grid = clearRows(G.grid, rows);
    G.score += rows.length;
  }
  spawn();
  lastFall = nowSec();
}

function hardDrop() {
  if (G.state !== 'play') return;
  G.py = dropY(G.grid, G.piece, G.px, G.py);
  lockAndResolve();
}

function step() {
  if (G.state !== 'play') return;
  const t = nowSec();
  const iv = fallInterval(t - G.startedAt, testMult);
  if (t - lastFall >= iv) {
    lastFall = t;
    if (canFit(G.grid, G.piece, G.px, G.py + 1)) G.py += 1;
    else lockAndResolve();
  }
}

function endRound() {
  G.best = Math.max(G.best, G.score);
  G.state = 'over'; // Task 11 turns this into leaderboard flow
}

function frame() {
  step();
  render();
  requestAnimationFrame(frame);
}

// For now, auto-start so the loop is verifiable; Task 10 adds the start screen.
startRound();
requestAnimationFrame(frame);
```

Remove the standalone `render();` call from Task 8's end (the loop now drives rendering).

- [ ] **Step 2: Add temporary keyboard driving for desktop verification**

Temporarily add, so the loop can be exercised before touch input exists:

```js
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') tryMove(-1);
  else if (e.key === 'ArrowRight') tryMove(1);
  else if (e.key === 'ArrowUp') tryRotate();
  else if (e.key === ' ') hardDrop();
});
```

- [ ] **Step 3: Manual verification — gameplay**

Reload the page. Use arrow keys + space.
Expected: piece falls on a timer and speeds up over ~12s; left/right move and up rotate respect walls/stack; space hard-drops and locks; completing a bottom row clears it and increments `LINES`; filling to the top ends the round (piece stops spawning, `state` becomes `over`). No console errors.

- [ ] **Step 4: Remove the temporary keyboard block**

Delete the Step 2 keyboard listener (touch input replaces it in Task 10; the dev hotkey is added in Task 12). Leave `startRound()` auto-start for now.

- [ ] **Step 5: Commit**

```bash
git add key-stack/index.html
git commit -m "feat: game loop, gravity, spawn, lock, line-clear, top-out"
```

---

## Task 10: Touch input + start/over overlays

**Files:**
- Modify: `key-stack/index.html`

**Interfaces:**
- Consumes: `classifyGesture`, `tryMove`, `tryRotate`, `hardDrop`, `startRound`, `G`.
- Produces: touch handlers that classify on `touchend`; `drawOverlay(title, lines)`; start screen (`state='start'`) and game-over screen (`state='over'`) with tap-to-continue; guards so the round-ending tap can't immediately restart.

- [ ] **Step 1: Replace auto-start with a start screen**

Remove the auto `startRound();` from Task 9. Set initial `G.state = 'start'`. Add overlay drawing and hook it into `render()`:

```js
function drawOverlay(title, lines) {
  ctx.fillStyle = 'rgba(16,16,26,0.82)';
  ctx.fillRect(0, 0, layout.cssW, layout.cssH);
  ctx.textAlign = 'center';
  ctx.fillStyle = ACCENT;
  const tfs = Math.max(28, Math.round(layout.cssH * 0.06));
  ctx.font = `700 ${tfs}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.fillText(title, layout.cssW / 2, layout.cssH * 0.32);
  ctx.fillStyle = TEXT;
  const lfs = Math.max(16, Math.round(layout.cssH * 0.03));
  ctx.font = `500 ${lfs}px "SF Mono", Consolas, Menlo, monospace`;
  lines.forEach((ln, i) => ctx.fillText(ln, layout.cssW / 2, layout.cssH * 0.46 + i * lfs * 1.6));
}
```

In `render()`, after the existing drawing, append:

```js
  if (G.state === 'start') drawOverlay('KEY STACK', ['Tap to play', '', 'Swipe = move · Tap = rotate', 'Swipe down = drop']);
  if (G.state === 'over')  drawOverlay('GAME OVER', [`Lines: ${G.score}`, `Best: ${G.best}`, '', 'Tap to play again']);
```

- [ ] **Step 2: Add touch handlers**

```js
let touchStart = null;      // {x, y, t}
let overGuardUntil = 0;     // ignore taps briefly after game over

function ptFromEvent(ev) {
  const r = canvas.getBoundingClientRect();
  const t = ev.changedTouches ? ev.changedTouches[0] : ev;
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}

canvas.addEventListener('touchstart', (ev) => {
  ev.preventDefault();
  const p = ptFromEvent(ev);
  touchStart = { x: p.x, y: p.y, t: nowSec() };
}, { passive: false });

canvas.addEventListener('touchend', (ev) => {
  ev.preventDefault();
  if (!touchStart) return;
  const p = ptFromEvent(ev);
  const dx = p.x - touchStart.x, dy = p.y - touchStart.y;
  touchStart = null;

  if (G.state === 'start') { startRound(); return; }
  if (G.state === 'over')  { if (nowSec() >= overGuardUntil) { G.state = 'start'; } return; }
  if (G.state !== 'play') return;

  const g = classifyGesture(dx, dy, layout.cell);
  if (g.type === 'tap') tryRotate();
  else if (g.type === 'move') { for (let i = 0; i < g.cols; i++) tryMove(g.dir); }
  else if (g.type === 'harddrop') hardDrop();
}, { passive: false });
```

Update `endRound()` to set the guard: add `overGuardUntil = nowSec() + 0.8;` inside it.

- [ ] **Step 3: Start the loop without starting a round**

At the end of the script, ensure only the loop runs:

```js
requestAnimationFrame(frame);
```

- [ ] **Step 4: Manual verification — touch flow (devtools touch emulation)**

Open the page with device-toolbar touch emulation on.
Expected: Start overlay → tap starts a round → tap rotates, horizontal drag moves (multiple columns for a long drag), downward drag hard-drops → filling to top shows GAME OVER with score/best → a fresh tap (after a brief moment) returns to Start. No page scroll or zoom occurs while dragging.

- [ ] **Step 5: Commit**

```bash
git add key-stack/index.html
git commit -m "feat: touch controls and start/game-over overlays"
```

---

## Task 11: Leaderboard — persistence, qualify flow, initials entry, table

**Files:**
- Modify: `key-stack/index.html`

**Interfaces:**
- Consumes: `qualifies`, `insertScore`, `sanitizeInitials`, `seedScores`, `LB_SIZE`, leaderboard from storage.
- Produces: `loadScores()`/`saveScores()` (storage-safe), `state='entry'` (initials entry) and `state='board'` (table) screens, and their touch handling. Game-over routes to `entry` when qualifying, else to `board`.

- [ ] **Step 1: Add storage-safe load/save**

```js
const LB_KEY = 'keystack.highscores';
let scores = loadScores();

function loadScores() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return seedScores();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedScores();
    const clean = parsed
      .filter(e => e && typeof e.score === 'number' && typeof e.initials === 'string')
      .map(e => ({ initials: sanitizeInitials(e.initials), score: e.score | 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, LB_SIZE);
    return clean.length ? clean : seedScores();
  } catch { return seedScores(); }  // private mode / blocked storage
}

function saveScores() {
  try { localStorage.setItem(LB_KEY, JSON.stringify(scores)); } catch { /* in-memory only */ }
}
```

- [ ] **Step 2: Add initials-entry state**

```js
const ENTRY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ. '; // wraps; space and '.' allowed
const entry = { slots: ['A', 'A', 'A'], active: 0, score: 0 };
let entryButtons = [];  // hit-boxes rebuilt each render: {x,y,w,h,action}

function beginEntry(score) {
  entry.slots = ['A', 'A', 'A'];
  entry.active = 0;
  entry.score = score;
  G.state = 'entry';
}

function cycleSlot(dir) {
  const i = ENTRY_CHARS.indexOf(entry.slots[entry.active]);
  const n = (i + dir + ENTRY_CHARS.length) % ENTRY_CHARS.length;
  entry.slots[entry.active] = ENTRY_CHARS[n];
}

function submitEntry() {
  const initials = sanitizeInitials(entry.slots.join(''));
  scores = insertScore(scores, { initials, score: entry.score });
  saveScores();
  G.state = 'board';
}
```

- [ ] **Step 3: Draw entry + board screens (and their buttons)**

```js
function drawButton(x, y, w, h, label) {
  ctx.fillStyle = 'rgba(100,200,255,0.08)';
  ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = TEXT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(h * 0.5)}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function drawEntry() {
  drawOverlay('NEW HIGH SCORE!', [`Lines: ${entry.score}`, 'Enter your initials']);
  entryButtons = [];
  const cw = Math.max(56, Math.round(layout.cssW * 0.16));
  const gap = Math.round(cw * 0.25);
  const totalW = cw * 3 + gap * 2;
  const x0 = (layout.cssW - totalW) / 2;
  const midY = layout.cssH * 0.58;
  const bh = Math.round(cw * 0.7);
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * (cw + gap);
    // up / down buttons
    drawButton(x, midY - bh - cw, cw, bh, '▲');
    drawButton(x, midY + cw, cw, bh, '▼');
    entryButtons.push({ x, y: midY - bh - cw, w: cw, h: bh, action: 'up', slot: i });
    entryButtons.push({ x, y: midY + cw, w: cw, h: bh, action: 'down', slot: i });
    // the letter box (tap to select this slot)
    ctx.fillStyle = i === entry.active ? 'rgba(100,200,255,0.18)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(x, midY - cw / 2, cw, cw);
    ctx.strokeStyle = i === entry.active ? ACCENT : GRID; ctx.lineWidth = 2;
    ctx.strokeRect(x, midY - cw / 2, cw, cw);
    ctx.fillStyle = TEXT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(cw * 0.6)}px "SF Mono", Consolas, Menlo, monospace`;
    ctx.fillText(entry.slots[i] === ' ' ? '␣' : entry.slots[i], x + cw / 2, midY);
    entryButtons.push({ x, y: midY - cw / 2, w: cw, h: cw, action: 'select', slot: i });
  }
  // DONE button
  const dw = totalW, dh = Math.round(bh * 1.1), dy = midY + cw + bh + gap;
  drawButton(x0, dy, dw, dh, 'DONE');
  entryButtons.push({ x: x0, y: dy, w: dw, h: dh, action: 'done' });
}

function drawBoard() {
  ctx.fillStyle = BOARD_BG; ctx.fillRect(0, 0, layout.cssW, layout.cssH);
  ctx.fillStyle = ACCENT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tfs = Math.max(26, Math.round(layout.cssH * 0.055));
  ctx.font = `700 ${tfs}px "SF Mono", Consolas, Menlo, monospace`;
  ctx.fillText('HIGH SCORES', layout.cssW / 2, layout.cssH * 0.1);
  const rfs = Math.max(15, Math.round(layout.cssH * 0.032));
  ctx.font = `500 ${rfs}px "SF Mono", Consolas, Menlo, monospace`;
  const x0 = layout.cssW * 0.5 - Math.min(layout.cssW * 0.42, 220);
  const x1 = layout.cssW * 0.5 + Math.min(layout.cssW * 0.42, 220);
  const top = layout.cssH * 0.2;
  scores.forEach((e, i) => {
    const y = top + i * rfs * 1.7;
    const isNew = e.score === entry.score && e.initials === sanitizeInitials(entry.slots.join(''));
    ctx.fillStyle = isNew ? ACCENT : TEXT;
    ctx.textAlign = 'left';  ctx.fillText(`${String(i + 1).padStart(2, ' ')}  ${e.initials}`, x0, y);
    ctx.textAlign = 'right'; ctx.fillText(String(e.score), x1, y);
  });
  ctx.fillStyle = TEXT; ctx.textAlign = 'center';
  ctx.fillText('Tap to play again', layout.cssW / 2, layout.cssH * 0.92);
}
```

In `render()`, add:

```js
  if (G.state === 'entry') drawEntry();
  if (G.state === 'board') drawBoard();
```

- [ ] **Step 4: Route game-over through the leaderboard and wire entry/board taps**

Change `endRound()` so it decides the next screen:

```js
function endRound() {
  G.best = Math.max(G.best, G.score);
  overGuardUntil = nowSec() + 0.8;
  if (qualifies(scores, G.score)) beginEntry(G.score);
  else G.state = 'board';
}
```

Extend the `touchend` handler to service the new states. Add these branches **before** the `if (G.state !== 'play') return;` line:

```js
  if (G.state === 'entry') {
    const p2 = ptFromEvent(ev);
    // Swipe up/down on the active slot cycles its letter; tap on a button acts.
    if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { cycleSlot(dy < 0 ? 1 : -1); return; }
    for (const b of entryButtons) {
      if (p2.x >= b.x && p2.x <= b.x + b.w && p2.y >= b.y && p2.y <= b.y + b.h) {
        if (b.action === 'select') entry.active = b.slot;
        else if (b.action === 'up')   { entry.active = b.slot; cycleSlot(1); }
        else if (b.action === 'down') { entry.active = b.slot; cycleSlot(-1); }
        else if (b.action === 'done') submitEntry();
        return;
      }
    }
    return;
  }
  if (G.state === 'board') { if (nowSec() >= overGuardUntil) G.state = 'start'; return; }
```

- [ ] **Step 5: Update the start overlay to show the top score**

In the `state==='start'` overlay call, change the lines to include the record:

```js
  if (G.state === 'start') drawOverlay('KEY STACK', [`Best: ${scores[0] ? scores[0].score : 0}`, 'Tap to play', 'Swipe = move · Tap = rotate', 'Swipe down = drop']);
```

- [ ] **Step 6: Manual verification — leaderboard**

With touch emulation: play until a qualifying score (seed top is 100; with the dev hotkey off, a few line clears beat the low seeds). Expected: on game over with a qualifying score, the initials screen appears; ▲/▼ and swipe-up/down change letters, tapping a box selects it, DONE submits; the table then shows your entry highlighted at the correct rank. Reload the page → the table persists (your entry is still there). A non-qualifying score (0 lines) goes straight to the table, no entry prompt. In a private window, play still works and simply doesn't persist.

- [ ] **Step 7: Commit**

```bash
git add key-stack/index.html
git commit -m "feat: local leaderboard with initials entry and persistence"
```

---

## Task 12: Line-clear fanfare + dev hotkey

**Files:**
- Modify: `key-stack/index.html`

**Interfaces:**
- Consumes: `G`, render.
- Produces: a brief line-clear flash/particle effect on clear; `Ctrl/Cmd+Shift+F` toggling `testMult` between 1 and 5.

- [ ] **Step 1: Add a lightweight clear flash**

Add a particle array and spawn on clear. In `lockAndResolve()`, when `rows.length`, before clearing, record flash rows:

```js
let particles = [];
let flash = null; // { rows:[...], until }

function spawnFlash(rows) {
  flash = { rows: rows.slice(), until: nowSec() + 0.25 };
  const { cell, boardX, boardY } = layout;
  for (const ry of rows) for (let x = 0; x < COLS; x++) {
    particles.push({ x: boardX + (x + 0.5) * cell, y: boardY + (ry + 0.5) * cell,
                     vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 0.4 });
  }
}

function updateParticles(dt) {
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 0.4);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;
}
```

Call `spawnFlash(rows)` in `lockAndResolve()` right before `G.grid = clearRows(...)`. In `frame()`, compute `dt` and call `updateParticles(dt)`; in `render()` call `drawParticles()` after locked cells. (Track `let lastFrame = nowSec();` and `const dt = Math.min(0.05, t - lastFrame); lastFrame = t;` inside `frame()`.)

- [ ] **Step 2: Add the dev hotkey**

```js
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
    e.preventDefault();
    testMult = testMult === 1 ? 5 : 1;
  }
});
```

- [ ] **Step 3: Manual verification**

Reload. Clear a line → brief particle burst appears at the cleared row. Press `Ctrl+Shift+F` → pieces fall noticeably faster; press again → back to normal. Touch play is unaffected.

- [ ] **Step 4: Commit**

```bash
git add key-stack/index.html
git commit -m "feat: line-clear fanfare and dev speed hotkey"
```

---

## Task 13: Landing page

**Files:**
- Create: `mobile-games/index.html`

**Interfaces:**
- Produces: a small mobile-friendly page listing/linking Key Stack at `key-stack/`.

- [ ] **Step 1: Create `mobile-games/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Glimmer Learning — Mobile Games</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; background: #10101a; color: #dcdcdc;
         font-family: "SF Mono", Consolas, Menlo, monospace;
         display: flex; flex-direction: column; align-items: center; justify-content: center;
         padding: env(safe-area-inset-top) 20px env(safe-area-inset-bottom); box-sizing: border-box; }
  h1 { color: #64c8ff; font-size: clamp(28px, 8vw, 48px); margin: 0 0 8px; text-align: center; }
  p  { color: #6a7480; margin: 0 0 32px; text-align: center; }
  .card { display: block; width: min(92vw, 380px); text-decoration: none; color: #dcdcdc;
          border: 2px solid #64c8ff; border-radius: 14px; padding: 22px 20px; margin: 10px 0;
          background: rgba(100,200,255,0.06); }
  .card h2 { margin: 0 0 6px; font-size: clamp(20px, 6vw, 26px); }
  .card span { color: #6a7480; font-size: 14px; }
</style>
</head>
<body>
  <h1>Mobile Games</h1>
  <p>Glimmer Learning — tap to play</p>
  <a class="card" href="key-stack/">
    <h2>Key Stack</h2>
    <span>Stack the falling blocks. Swipe to move, tap to rotate.</span>
  </a>
</body>
</html>
```

- [ ] **Step 2: Manual verification**

Open `http://localhost:8000/` → landing page renders; tapping the card opens `key-stack/`. Looks clean on a narrow (phone) viewport.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: mobile-games landing page"
```

---

## Task 14: Deploy + device QA pass

**Files:** none (deployment + verification).

- [ ] **Step 1: Create the GitHub repo and push**

```bash
gh repo create mobile-games --public --source=. --remote=origin --push
```

(Or create the repo in the GitHub UI and `git remote add origin … && git push -u origin main`.)

- [ ] **Step 2: Enable GitHub Pages**

In the repo: Settings → Pages → Build and deployment → Deploy from a branch → `main` / root → Save. Wait for the Pages deploy to go green.

- [ ] **Step 3: Device QA against the spec acceptance criteria (spec §10)**

On **iOS Safari** and **Android Chrome**, at `https://theglimmeroa.github.io/mobile-games/key-stack/`, verify each:

1. Pieces spawn, fall, speed up; board is 10×18.
2. Tap rotates; swipe L/R moves; swipe-down hard-drops; taps never misread as swipes.
3. Rows clear with the flash; stack shifts (incl. multi-row).
4. Score (LINES) increments and is clearly visible.
5. Top-out → game over → fresh tap restarts.
6. Next-piece preview visible and correct.
7. **Board fills the screen, large/legible** on a phone (portrait) and an iPad; no scroll/zoom needed; landscape not clipped.
8. No page scroll/zoom/pull-to-refresh leaks; rendering crisp.
9. `Ctrl+Shift+F` speed toggle works on desktop; touch unaffected.
10. Qualifying score → 3-initial entry (swipe + buttons) → correct rank → persists across reload; non-qualifying → straight to table; blocked storage doesn't crash.
11. Reachable at the public URL.

Record any failures and fix in a follow-up task before sign-off.

- [ ] **Step 4: Landing page link check**

Verify `https://theglimmeroa.github.io/mobile-games/` lists Key Stack and links into the game.

- [ ] **Step 5: Tag the release**

```bash
git tag key-stack-v1
git push --tags
```

---

## Self-Review

**Spec coverage:**
- §2 colors/board → Task 2 (Global Constraints copy verbatim). ✓
- §3 mechanic (pieces, rotation, gravity, collision, lock, line clear, top-out, scoring) → Tasks 2–4, 9. ✓
- §3.2 speed ramp → Task 5 (`fallInterval`). ✓
- §4 controls (tap/swipe/hard-drop, touchend classification, no scroll/zoom) → Tasks 5, 10. ✓
- §5 flow (start → play → over → qualify → entry → board → restart; guards) → Tasks 10, 11. ✓
- §6 responsive full-screen, retina, safe-area, orientation → Task 7 (+ manual checks in 7/14). ✓
- §7 rendering/draw order, next-piece → Task 8. ✓
- §8 dev hotkey → Task 12. ✓
- §9 repo layout, landing page, single-file-per-game → Tasks 1, 13, 14. ✓
- §11 leaderboard (top 10, 3 initials, qualify, ties, seed, storage-safe, touch entry, display, persist) → Tasks 6, 11. ✓
- §10 acceptance criteria → Task 14 device QA. ✓
- §11.5 optional reset — intentionally deferred (nice-to-have). Noted.

**Placeholder scan:** No TBD/TODO; every code step has real code; manual steps state exact expected observations. ✓

**Type consistency:** `emptyGrid` cells are `null`|name throughout; `classifyGesture` returns `{type, dir?, cols?}` used consistently in Task 10; `insertScore`/`qualifies` take a descending `{initials,score}[]` consistently in Task 11; `fallInterval(elapsed, testMult)` signature matches its call in `step()`. ✓

---

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Which approach?

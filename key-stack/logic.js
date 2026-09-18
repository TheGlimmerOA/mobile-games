// Pure, DOM-free game rules for Key Stack. Imported by index.html (browser)
// and logic.test.js (Node). No DOM, no localStorage, no canvas in this file.
export const VERSION = '1.0.0';

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

// Completed row indices, highest index (bottom) first.
export function fullRows(grid) {
  const rows = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(c => c)) rows.push(y);
  }
  return rows;
}

export function clearRows(grid, rows) {
  const g = grid.map(r => r.slice());
  const sorted = rows.slice().sort((a, b) => b - a); // descending: remove bottom-up so higher indices stay valid
  for (const y of sorted) g.splice(y, 1);
  for (let i = 0; i < sorted.length; i++) g.unshift(Array(COLS).fill(null));
  return g;
}

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

// ---- Leaderboard (local, top 10, 3 initials) --------------------------------

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

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

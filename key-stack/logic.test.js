import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION } from './logic.js';

test('logic module loads', () => {
  assert.equal(typeof VERSION, 'string');
});

import { rotate, TETRO, NAMES, COLS, ROWS, COLORS } from './logic.js';

test('board is 10x18', () => {
  assert.equal(COLS, 10);
  assert.equal(ROWS, 18);
});

test('seven tetrominoes with colors', () => {
  assert.deepEqual(NAMES.slice().sort(), ['I','J','L','O','S','T','Z']);
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

import { emptyGrid, canFit, dropY } from './logic.js';

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
  assert.equal(dropY(emptyGrid(), TETRO.O, 0, 0), ROWS - 2);
});

test('dropY stacks on top of a locked cell', () => {
  const g = emptyGrid();
  g[ROWS - 1][0] = 'T';
  g[ROWS - 1][1] = 'T';
  assert.equal(dropY(g, TETRO.O, 0, 0), ROWS - 3);
});

import { lockPiece, fullRows, clearRows } from './logic.js';

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
  g[ROWS - 2][3] = 'T';
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

import { classifyGesture, fallInterval } from './logic.js';

test('small movement is a tap', () => {
  assert.equal(classifyGesture(3, -4, 30).type, 'tap');
});

test('rightward swipe moves right, columns scale with distance', () => {
  const r = classifyGesture(65, 5, 30);
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

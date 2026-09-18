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

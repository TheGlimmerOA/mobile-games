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

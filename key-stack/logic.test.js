import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION } from './logic.js';

test('logic module loads', () => {
  assert.equal(typeof VERSION, 'string');
});

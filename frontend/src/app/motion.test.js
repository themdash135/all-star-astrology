import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeMotionSetting, shouldReduceMotion } from './motion.js';

test('normalizeMotionSetting defaults invalid values to system', () => {
  assert.equal(normalizeMotionSetting('invalid'), 'system');
});

test('normalizeMotionSetting preserves supported values', () => {
  assert.equal(normalizeMotionSetting('reduce'), 'reduce');
  assert.equal(normalizeMotionSetting('full'), 'full');
});

test('shouldReduceMotion honors explicit reduce setting', () => {
  assert.equal(shouldReduceMotion('reduce', false), true);
});

test('shouldReduceMotion follows the system preference when requested', () => {
  assert.equal(shouldReduceMotion('system', true), true);
  assert.equal(shouldReduceMotion('system', false), false);
});

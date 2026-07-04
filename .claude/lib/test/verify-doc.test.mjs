import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasHeadlessChrome, sidecarByteIdentical } from '../verify-doc.mjs';

test('capability check returns a boolean and never throws', () => {
  assert.equal(typeof hasHeadlessChrome(), 'boolean');
});

test('sidecar byte-check is false when file absent', () => {
  assert.equal(sidecarByteIdentical('/nonexistent', '/also/nope'), false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runGate } from '../gate.mjs';

const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');
const opts = { accentHex: '#4338CA', sidecarPresent: true };

test('clean doc passes all checks', () => {
  const r = runGate(read('doc-pass.dc.html'), opts);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
});

test('duplicate section id fails', () => {
  const r = runGate(read('doc-dup-id.dc.html'), opts);
  assert.equal(r.ok, false);
  assert.ok(r.checks.find(c => c.name === 'unique-ids' && !c.ok));
});

test('missing keep-all fails', () => {
  const r = runGate(read('doc-no-keepall.dc.html'), opts);
  assert.equal(r.ok, false);
  assert.ok(r.checks.find(c => c.name === 'keep-all' && !c.ok));
});

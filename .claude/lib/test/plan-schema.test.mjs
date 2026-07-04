import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePlan, parsePlan } from '../plan-schema.mjs';

const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');

test('valid plan passes and parses all fields', () => {
  const md = read('plan-valid.md');
  const res = validatePlan(md);
  assert.equal(res.ok, true, res.errors.join('; '));
  const p = parsePlan(md);
  assert.equal(p.header.hasAsIs, true);
  assert.equal(p.sections.length, 2);
  assert.ok(p.sections[0].sourceSpan.length > 0);
});

test('section missing source-span fails validation', () => {
  const res = validatePlan(read('plan-missing-source-span.md'));
  assert.equal(res.ok, false);
  assert.match(res.errors.join('\n'), /source-span/);
});

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

const known = ['kpi-row', 'card-grid', 'state-machine', 'pipeline'];
const shapeMap = { 'headline-metric': ['kpi-row'], 'data-flow': ['pipeline'], 'peer-list': ['card-grid'] };

test('pasted components: unknown data-component and leftover slots fail; comments are ignored', () => {
  const ok = runGate(read('doc-components.dc.html'), { ...opts, knownComponents: known });
  assert.equal(ok.ok, true, JSON.stringify(ok.checks.filter(c => !c.ok)));
  const html = read('doc-components.dc.html').replace('<span>120</span>', '<span>⟦120⟧</span>').replace('"card-grid"', '"cards"');
  const bad = runGate(html, { ...opts, knownComponents: known });
  assert.ok(bad.checks.find(c => c.name === 'slots-filled' && !c.ok));
  assert.ok(bad.checks.find(c => c.name === 'known-components' && !c.ok && /cards/.test(c.detail)));
});

test('plan-shapes: a figure shape rendered as cards fails, the right component passes', () => {
  const html = read('doc-components.dc.html');
  const plan = (s2) => ({ sections: [{ title: '지표', shape: 'headline-metric' }, { title: '흐름', shape: s2 }] });
  const fail = runGate(html, { ...opts, plan: plan('data-flow'), shapeMap });
  const row = fail.checks.find(c => c.name === 'plan-shapes');
  assert.equal(row.ok, false);
  assert.match(row.detail, /s2 \(shape data-flow\) needs pipeline; found card-grid/);
  const pass = runGate(html, { ...opts, plan: plan('peer-list'), shapeMap });
  assert.equal(pass.checks.find(c => c.name === 'plan-shapes').ok, true);
});

test('plan-alignment fails when plan and document section counts differ', () => {
  const r = runGate(read('doc-components.dc.html'), { ...opts, plan: { sections: [{ shape: 'none' }] }, shapeMap });
  assert.ok(r.checks.find(c => c.name === 'plan-alignment' && !c.ok));
});

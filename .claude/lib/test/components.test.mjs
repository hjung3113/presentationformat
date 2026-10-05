import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { listTemplates, listStyles, buildStyle, staleFiles, shapeMap, CORE_DIR } from '../components.mjs';

const CORE = join(CORE_DIR, '..');

test('every template renders in every style with no unresolved token', () => {
  for (const style of listStyles()) {
    const files = buildStyle(style); // throws if a style lacks a token a template names
    for (const [rel, body] of Object.entries(files))
      assert.doesNotMatch(body, /⟨[rf]?:?[\w-]+⟩/, `${style}/${rel} still has a ⟨role⟩ placeholder`);
  }
});

test('committed component outputs are up to date (run components.mjs build)', () => {
  assert.deepEqual(staleFiles(), []);
});

test('core/ carries zero HEX (templates name roles only)', () => {
  const files = ['components.md', 'runtime-spec.md', ...readdirSync(CORE_DIR).map(f => join('components', f))];
  for (const f of files)
    assert.doesNotMatch(readFileSync(join(CORE, f), 'utf8'), /#[0-9a-fA-F]{6}\b/, `HEX literal in core/${f}`);
});

test('core/components.md §1 shape table matches the templates\' @shape metadata exactly', () => {
  const md = readFileSync(join(CORE, 'components.md'), 'utf8');
  const sec = md.slice(md.indexOf('## 1.'), md.indexOf('## 2.'));
  const rows = [...sec.matchAll(/^\| `([\w-]+)` \|[^|]*\| (?:`([\w-]+)`|—[^|]*) \|/gm)].map(m => [m[1], m[2] || null]);
  const fromDoc = Object.fromEntries(rows);
  const fromTemplates = Object.fromEntries(Object.entries(shapeMap()).map(([s, c]) => [s, c[0]]));
  assert.equal(fromDoc.none, null);
  delete fromDoc.none;
  assert.deepEqual(fromDoc, fromTemplates);
});

test('every template root carries its data-component marker and documents how to fill', () => {
  for (const t of listTemplates()) {
    assert.match(t.src, new RegExp(`<div data-component="${t.meta.component}"`));
    if (t.meta.kind !== 'content') assert.ok(t.meta.data, `${t.file} lacks @data (figure-data format)`);
  }
});

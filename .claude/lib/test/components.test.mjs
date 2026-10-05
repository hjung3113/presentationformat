import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listTemplates, listStyles, buildStyle, staleFiles, shapeMap, parseMeta, parseDataKeys, CORE_DIR } from '../components.mjs';

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

test('parseDataKeys: key[?]: segments split on " | "; first key is never optional; annotations and prose segments are tolerated', () => {
  assert.deepEqual(parseDataKeys('bars: 라벨=값 | unit?: 건 | highlight?: 라벨(선택) | 진척 % | 메모 한 줄'),
    [{ key: 'bars', optional: false }, { key: 'unit', optional: true }, { key: 'highlight', optional: true }]);
  assert.deepEqual(parseDataKeys('layers (위→아래): 레이어명: 모듈 | links: 연결 | optional: 레이어명'),
    [{ key: 'layers', optional: false }, { key: 'links', optional: false }, { key: 'optional', optional: false }]);
  assert.deepEqual(parseDataKeys('first?: x | second: y'), [{ key: 'first', optional: false }, { key: 'second', optional: false }]);
  assert.deepEqual(parseDataKeys('variant: KEY|OK|WARN|NOTE · 한 문장'), [{ key: 'variant', optional: false }]);
  assert.deepEqual(parseDataKeys(undefined), []);
});

test('parseMeta exposes dataKeys; listTemplates/shapeMap accept an injected templates dir', () => {
  const src = '<!--\n@component zed\n@kind chart\n@shape quantity trend\n@title T\n@use U\n@data rows: a | gap?: b\n-->\n<div data-component="zed"></div>\n';
  assert.deepEqual(parseMeta(src).dataKeys, [{ key: 'rows', optional: false }, { key: 'gap', optional: true }]);
  const dir = mkdtempSync(join(tmpdir(), 'tpl-'));
  try {
    writeFileSync(join(dir, 'zed.html'), src);
    const ts = listTemplates(dir);
    assert.deepEqual(ts.map(t => t.meta.component), ['zed']);
    assert.deepEqual(shapeMap(ts), { quantity: ['zed'], trend: ['zed'] });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('every figure/chart/report template has a @data whose first segment is a required `key:` (what /plan matches figure-data against)', () => {
  for (const t of listTemplates().filter(t => t.meta.kind !== 'content')) {
    const first = t.meta.dataKeys[0];
    assert.ok(first, `${t.file}: @data must open with "key:"`);
    assert.equal(first.optional, false, `${t.file}: first @data key must not be optional`);
  }
});

// Contract C4: the required first key of every component's @data line.
test('first @data keys match the plan-schema contract (C4)', () => {
  const want = {
    'before-after': 'before', 'process-row': 'steps', activity: 'start', swimlane: 'lanes', 'state-machine': 'states',
    sequence: 'participants', 'layer-map': 'layers', pipeline: 'stages', tree: 'root', 'er-relations': 'entities',
    'class-diagram': 'parent', 'hub-spoke': 'hub', 'use-case': 'system', 'screen-map': 'layout', 'forbidden-path': 'allowed',
    'bar-chart': 'bars', 'hbar-chart': 'rows', 'stacked-bar': 'parts', 'kpi-row': 'tiles', 'status-board': 'rows',
    timeline: 'items', gantt: 'periods', 'risk-matrix': 'risks', 'decision-block': 'question', 'decision-table': 'conditions',
    matrix: 'columns', 'card-grid': 'items', callout: 'variant', table: 'columns',
  };
  const got = Object.fromEntries(listTemplates().map(t => [t.meta.component, t.meta.dataKeys[0]?.key]));
  assert.deepEqual(got, want);
});

// The shared "planned" look: a not-built thing is drawn muted + dashed + a state chip and marked [planned] in
// figure-data — one rule (core/components.md §4), five components.
const PLANNED = ['layer-map', 'pipeline', 'tree', 'timeline', 'sequence'];
test('planned look: every figure that supports [planned] documents it in @data and ships a muted dashed VARIANT planned', () => {
  assert.match(readFileSync(join(CORE, 'components.md'), 'utf8'), /never gets the built look/);
  const by = Object.fromEntries(listTemplates().map(t => [t.meta.component, t]));
  for (const id of PLANNED) {
    assert.ok(by[id].meta.data.includes('[planned]'), `${id} @data does not document the [planned] marker`);
    assert.match(by[id].src, /<!-- VARIANT planned[^>]*-->/, `${id} has no VARIANT planned block`);
    assert.match(by[id].src, /border:\d(?:\.\d)?px dashed ⟨muted-300⟩/, `${id} planned look is not muted dashed`);
  }
});

test('variant markers promised in HOW TO FILL are in the @data line /plan reads (matrix cells, state neutral, screen-map extras)', () => {
  const by = Object.fromEntries(listTemplates().map(t => [t.meta.component, t.meta.data]));
  for (const [id, marks] of Object.entries({ 'state-machine': ['[neutral]'], 'screen-map': ['[above]', '[below]'], matrix: ['—', '✓ 한정어'] }))
    for (const m of marks) assert.ok(by[id].includes(m), `${id} @data lacks ${m}`);
});

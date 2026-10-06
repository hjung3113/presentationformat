import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listTemplates, listStyles, buildStyle, staleFiles, shapeMap, parseMeta, parseDataKeys, loadTokens, stripSlots, CORE_DIR } from '../components.mjs';
import { figureChecks, zoneRoles, markup, elementsWith, htmlOf, attrOf } from '../figures.mjs';
import { findHeadlessChrome } from '../verify-doc.mjs';

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

test('parseMeta accepts hyphenated @keys: `@limits-x` is read into limitsX (and stays a string under meta[\'limits-x\'])', () => {
  const head = '<!--\n@component zed\n@kind chart\n@title T\n@use U\n@limits 막대 3–8\n';
  const meta = parseMeta(`${head}@limits-x bars=3..8 bars-per-row=1..2\n-->\n<div data-component="zed"></div>\n`);
  assert.equal(meta.limits, '막대 3–8');
  assert.equal(meta['limits-x'], 'bars=3..8 bars-per-row=1..2');
  assert.deepEqual(meta.limitsX, { bars: { min: 3, max: 8 }, 'bars-per-row': { min: 1, max: 2 } });
  assert.deepEqual(parseMeta(`${head}-->\n<div data-component="zed"></div>\n`).limitsX, {});
  assert.throws(() => parseMeta(`${head}@limits-x bars=8..3\n-->\n<div data-component="zed"></div>\n`), /min above max/);
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
const PLANNED = ['layer-map', 'pipeline', 'tree', 'timeline', 'sequence', 'before-after']; // before-after: a planned cell in the TO-BE zone only
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
  for (const [id, marks] of Object.entries({ 'state-machine': ['[neutral]'], 'screen-map': ['[above]', '[below]'], matrix: ['—', '✓ 한정어'], 'before-after': ['[planned]', '[full]'] }))
    for (const m of marks) assert.ok(by[id].includes(m), `${id} @data lacks ${m}`);
});

// ---- label language: every fixed label is a ⟦slot⟧, so a Korean document can replace it (core/components.md §4) ----
const bodyOf = (src) => src.replace(/^<!--[\s\S]*?-->\s*/, '');
test('no template carries a hard-coded English label outside a ⟦slot⟧ (label language is a choice, not baked in)', () => {
  for (const t of listTemplates()) {
    const body = bodyOf(t.src).replace(/<!--[\s\S]*?-->/g, '');
    for (const m of body.matchAll(/>([^<>]+)</g)) {
      const text = m[1].replace(/⟦[^⟧]*⟧/g, '').replace(/&#?\w+;/g, '').trim();
      assert.doesNotMatch(text, /[A-Za-z]{2,}/, `${t.file}: hard-coded English text "${text}" — make it a ⟦slot⟧ with the English default as its example`);
    }
  }
});

// ---- text-safe muted ink (core/components.md §4): informative text never uses a faint muted role ----
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

test('templates set informative text in ⟨muted-text⟩; the faint roles carry only n/a dashes and spacers', () => {
  for (const t of listTemplates()) {
    for (const m of bodyOf(t.src).matchAll(/(?<![-\w])color:⟨muted-(?:400|500)⟩;[^"]*">([^<]*)/g))
      assert.match(m[1], /^(⟦—⟧|&nbsp;)/, `${t.file}: faint muted text color on "${m[1].slice(0, 30)}" — use ⟨muted-text⟩`);
  }
});

test('every style defines muted-text at >=4.5:1 on white, and its mono stack falls back to the style\'s Korean body font', () => {
  for (const style of listStyles()) {
    const { colors, fontStacks } = loadTokens(style);
    assert.ok(colors['muted-text'], `${style}: no muted-text color`);
    const ratio = contrast(colors['muted-text'], colors.white);
    assert.ok(ratio >= 4.5, `${style}: muted-text ${colors['muted-text']} is ${ratio.toFixed(2)}:1 on white (<4.5)`);
    // the Korean body font is the last named family of the body stack before the generic one
    const families = (s) => s.split(',').map(f => f.trim().replace(/^'|'$/g, '')).filter(f => !/^(sans-serif|serif|monospace)$/.test(f));
    const korean = families(fontStacks.body).at(-1);
    assert.ok(families(fontStacks.mono).includes(korean), `${style}: mono stack ${fontStacks.mono} lacks the Korean body font ${korean}`);
    assert.match(fontStacks.mono, /,monospace$/, `${style}: mono stack must end in the generic family`);
  }
});

// ---- documented variants (system gaps found building the v3 pitch) ----
const tpl = (id) => listTemplates().find(t => t.meta.component === id);
const live = (t) => bodyOf(t.src).replace(/<!--[\s\S]*?-->/g, '');

test('before-after: the planned cell lives in the TO-BE column only and a full-width key cell spans the grid (grid-column:1 / -1)', () => {
  const t = tpl('before-after');
  const [asIs, toBe] = bodyOf(t.src).split('<!-- TO-BE column -->');
  assert.match(toBe, /<!-- VARIANT planned cell \(\[planned\]\)[^>]*-->\s*<div[^>]*border:1px dashed ⟨muted-300⟩[^>]*>⟦예정 요소⟧ <span[^>]*font:700 11px/);
  assert.doesNotMatch(asIs, /VARIANT planned|border:1px dashed ⟨muted-300⟩/); // the AS-IS zone has no planned things
  assert.match(toBe, /<!-- VARIANT full-width key cell \(\[full\]\)[^>]*-->\s*<div style="grid-column:1 \/ -1;/);
  assert.match(t.src, /HOW TO FILL[\s\S]*\[planned\][\s\S]*core\/components\.md §4[\s\S]*\[full\]/); // the cross-component rule is named
  assert.match(readFileSync(join(CORE, 'components.md'), 'utf8'), /`before-after` \(a planned cell inside the\s+\*\*TO-BE\*\* zone only/);
});

test('swimlane: a ← lane move carries the positive (green) tag as live markup, next to the neutral ← label and the → tag', () => {
  const body = live(tpl('swimlane'));
  // a connector row starts at a `grid-column:A / B; margin:…` div and ends where the next grid row begins
  const rows = body.split(/(?=<div style="grid-column:\d \/ \d; margin:)/).slice(1).map(c => c.split('<div style="display:grid')[0]);
  const left = rows.filter(r => r.includes('right:-1px; top:0; height:12px')); // ← : the upper stem is on the right
  const right = rows.filter(r => r.includes('left:-1px; top:0; height:12px'));
  assert.ok(left.some(r => r.includes('color:⟨ok⟩; background:⟨ok-bg⟩')), '← with a green tag');
  assert.ok(left.some(r => /color:⟨muted-text⟩; background:⟨white⟩; padding:2px 5px/.test(r)), '← with a neutral label');
  assert.ok(right.some(r => r.includes('color:⟨ok⟩; background:⟨ok-bg⟩')), '→ with a green tag');
  assert.match(tpl('swimlane').src, /←변형 모두 초록 태그와 회색 글자 라벨/);
});

test('use-case: the system-box label is a ⟦slot⟧ covered by the label-language table; up to 5 goals per actor, with the wrapping rule', () => {
  const t = tpl('use-case');
  assert.match(live(t), />⟦SYSTEM⟧ · ⟦시스템 이름⟧</);
  assert.match(t.meta.limits, /행위자당 유스케이스 1–5/);
  assert.match(t.src, /flex-wrap:wrap[\s\S]*3 \+ 2/);
  assert.match(live(t), /⟦유스케이스 C5⟧/); // the live example shows the maximum of 5 goals
  const row = readFileSync(join(CORE, 'components.md'), 'utf8').match(/^\s*\| `use-case` system box \| (.*?) \| (.*?) \|$/m);
  assert.ok(row, 'label-language table has a use-case row');
  assert.match(row[1], /SYSTEM/);
  assert.match(row[2], /시스템/);
});

test('table: two cell variants (first-column detail line, stacked lines with a muted separator), appendix tables up to 10 rows and a definition-list variant', () => {
  const t = tpl('table');
  assert.match(t.src, /<!-- VARIANT first-column detail line[^>]*-->\s*<div[^>]*>\s*<div[^>]*>⟦핵심어 B⟧<span style="display:block; font:400 12px\/1\.5 ⟨f:body⟩; color:⟨muted-text⟩/);
  assert.match(t.src, /<!-- VARIANT stacked cell[^>]*-->[\s\S]*⟦값 줄 1⟧<div style="border-top:1px solid ⟨border-row⟩;[^"]*">⟦값 줄 2⟧<\/div>/);
  assert.match(t.src, /<!-- VARIANT definition list[\s\S]*?<div data-component="table" style="display:grid; grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,380px\),1fr\)\); gap:0 40px; overflow-wrap:anywhere;">/);
  assert.match(t.src, /본문 표는 7행까지[\s\S]*부록\(sref\)[\s\S]*10행/);
  assert.match(t.meta.limits, /10행/);
  assert.match(readFileSync(join(CORE, 'components.md'), 'utf8'), /appendix glossary or source table may be longer/);
});

// ---- narrow widths (core/components.md §4 "Narrow widths"): static guards for what the 390px gallery probe verifies in a browser ----
// A grid track is `Nfr`, i.e. minmax(auto, Nfr): its automatic minimum is the widest unbreakable run, so it widens past its frame.
// Only a minmax(...) track (a floor, or 0) keeps a fr track in bounds.
const withoutMinmax = (value) => {
  let out = '';
  for (let i = 0; i < value.length;) {
    if (value.startsWith('minmax(', i)) {
      let depth = 0, j = i + 'minmax'.length;
      for (; j < value.length; j++) { if (value[j] === '(') depth++; else if (value[j] === ')' && --depth === 0) break; }
      i = j + 1;
    } else out += value[i++];
  }
  return out;
};

test('narrow width: no template has a bare `Nfr` grid track outside minmax() (comments included: a pasted variant must not reintroduce one)', () => {
  for (const t of listTemplates()) {
    for (const m of bodyOf(t.src).matchAll(/grid-template-columns:([^;"]*)/g))
      assert.doesNotMatch(withoutMinmax(m[1]), /\d(?:\.\d+)?fr\b/, `${t.file}: bare fr track in "${m[1].trim()}" — wrap it in minmax(0,Nfr) or a floored minmax(Npx,Nfr)`);
  }
});

test('narrow width: every template root carries overflow-wrap:anywhere, and a root that scrolls (overflow-x:auto) has a min-width:min-content box inside it', () => {
  for (const t of listTemplates()) {
    const root = live(t).match(/^<div data-component="[\w-]+"(?: style="([^"]*)")?>/);
    assert.ok(root && root[1] && /overflow-wrap:anywhere;/.test(root[1]), `${t.file}: root lacks overflow-wrap:anywhere`);
    const body = live(t);
    if (/overflow-x:auto/.test(root[1])) assert.match(body, /min-width:min-content;/, `${t.file}: scrolls but has no min-width:min-content box to scroll`);
  }
});

// ---- figure markers (core/components.md §3, §4): data-value / data-item / data-zone read by figures.mjs, data-state by facts.mjs (`planned:unmarked`) ----
const MARKERS = {
  'data-value': { 'bar-chart': 5, 'hbar-chart': 4, 'stacked-bar': 4, 'status-board': 4 }, // a bar, row or segment — not the 대기 row
  'data-item': { 'card-grid': 4, 'process-row': 4, pipeline: 3, 'kpi-row': 6 },            // a card, step, stage column or tile — not an arrow cell
  'data-zone': { 'before-after': 2, gantt: 4, 'layer-map': 1 },                              // both sides · legacy + new bars (two rows) · the legacy layer
  'data-state': { 'layer-map': 3, pipeline: 1, tree: 2, timeline: 2, sequence: 1, 'before-after': 1 }, // planned module · state-chip module · state-chip layer row · planned node · planned child + leaf · both planned rows · planned frame · planned cell
};

test('data-state: a planned variant says planned, a built-with-caveat (state chip) variant says caveat, on the element that holds the variant', () => {
  const states = (id) => [...live(tpl(id)).matchAll(/ data-state="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(states('layer-map'), ['planned', 'caveat', 'caveat']);
  for (const id of ['pipeline', 'tree', 'timeline', 'sequence', 'before-after']) assert.ok(states(id).length && states(id).every(v => v === 'planned'), id);
  for (const t of listTemplates()) // appended after style="…", never before it (components.test pins tag heads)
    for (const m of live(t).matchAll(/<\w+ ([^>]*)>/g)) if (/data-state/.test(m[1])) assert.match(m[1], /^style="[^"]*" (?:data-[\w-]+(?:="[^"]*")? )*data-state="\w+"$/, t.file);
});

test('figure markers: every style renders each template with exactly the markers its HOW TO FILL promises, and the figure checks find nothing in any template or gallery', () => {
  for (const t of listTemplates())
    for (const [attr, counts] of Object.entries(MARKERS))
      if (counts[t.meta.component]) assert.ok(t.src.slice(0, t.src.indexOf('-->')).includes(attr), `${t.file}: HOW TO FILL does not tell the author to keep ${attr}`);
  for (const style of listStyles()) {
    const { colors } = loadTokens(style);
    const opts = { accentHex: colors.accent, zoneRoles: zoneRoles(colors) };
    const files = buildStyle(style);
    for (const t of listTemplates()) {
      const html = stripSlots(files[join('components', `${t.meta.component}.html`)].replace(/<!--[\s\S]*?-->/g, ''));
      for (const [attr, counts] of Object.entries(MARKERS))
        assert.equal((html.match(new RegExp(` ${attr}(?=[\\s>=])`, 'g')) || []).length, counts[t.meta.component] || 0, `${style}/${t.file}: ${attr} count`);
      const r = figureChecks(html, opts);
      assert.deepEqual(r.checks.filter(c => !c.ok), [], `${style}/${t.file}`);
      assert.deepEqual(r.warnings.filter(w => !w.level), [], `${style}/${t.file}`);
      assert.deepEqual(r.notes, [], `${style}/${t.file}: a template must carry every marker its figure kind reads`);
    }
    const gallery = figureChecks(stripSlots(files['components.gallery.dc.html']), opts);
    assert.deepEqual(gallery.checks.map(c => [c.name, c.ok, c.detail]), [
      ['chart-proportions', true, '4 chart(s), 17 value(s) drawn at the size they show'],
      ['zone-colors', true, '7 zone(s) checked'],
    ], style);
    assert.deepEqual(gallery.notes, [], style);
  }
});

// ---- the 390px matrix and the before-after pivot (core/components.md §4 "Narrow widths") ----

test('matrix: a column floor leaves room for text (padding included) and 4+ columns scroll inside the matrix at the 343px a phone leaves the sheet', () => {
  const body = live(tpl('matrix'));
  const floors = [...body.matchAll(/repeat\((\d+),minmax\((\d+)px,1fr\)\)/g)];
  assert.ok(floors.length, 'the matrix has repeat(C,minmax(Npx,1fr)) tracks');
  const label = Number(body.match(/grid-template-columns:minmax\((\d+)px,1\.4fr\)/)[1]);
  for (const [, , floor] of floors) {
    assert.ok(Number(floor) >= 72, `a ${floor}px column leaves under 52px of text next to its 10px side padding`);
    for (const columns of [4, 5]) assert.ok(label + columns * Number(floor) > 343, `${columns} columns of ${floor}px must overflow the 343px sheet so the matrix scrolls instead of squeezing`);
  }
  assert.match(tpl('matrix').src, /HOW TO FILL[\s\S]*repeat\(C,minmax\(72px,1fr\)\)/); // the instruction names the same floor
});

test('before-after: the pivot is pasted twice — → while both columns fit one row, ↓ on its own row when they stack — and the switch point is 2 × column basis + pivot', () => {
  const body = live(tpl('before-after'));
  const basis = [...body.matchAll(/flex:1 1 (\d+)px; min-width:0;" data-zone/g)].map(m => Number(m[1]));
  assert.deepEqual(basis, [260, 260]);
  assert.match(body, /align-items:stretch; container-type:inline-size;">/); // the row is the container 100cqw measures
  const side = body.match(/flex:0 0 clamp\(0px,calc\(\(100cqw - (\d+)px\) \* 999\),(\d+)px\);[^"]*"><div style="width:36px; max-width:100%;[^"]*font:400 clamp\(0px,calc\(\(100cqw - (\d+)px\) \* 999\),17px\)[^"]*">→<\/div>/);
  const stacked = body.match(/flex:0 0 clamp\(0px,calc\(\((\d+)px - 100cqw\) \* 999\),100cqw\);[^"]*"><div style="width:36px; max-width:100%;[^"]*font:400 clamp\(0px,calc\(\((\d+)px - 100cqw\) \* 999\),17px\)[^"]*">↓<\/div>/);
  assert.ok(side && stacked, 'both pivots collapse their box and their glyph (font-size) to 0px outside their layout — nothing is clipped, so the figure-overflow probe stays quiet');
  const switchAt = 2 * basis[0] + Number(side[2]);
  assert.deepEqual([Number(side[1]) + 1, Number(side[3]) + 1], [switchAt, switchAt]); // → is 0 up to 569px, 50px from 570px
  assert.deepEqual([Number(stacked[1]), Number(stacked[2])], [switchAt, switchAt]); // ↓ is 100cqw wide up to 569px, 0 from 570px
  assert.doesNotMatch(body, /flex:0 0 50px|overflow:hidden/); // no fixed always-→ pivot, no clipping trick
  assert.match(tpl('before-after').src, /HOW TO FILL[\s\S]*container-type:inline-size/); // the contract is written down
});

test('before-after pivot in a browser: ↓ sits on its own row between the stacked columns and → is 0px wide; side by side it is the other way round', (t) => {
  const chrome = findHeadlessChrome();
  if (!chrome) return t.skip('no headless browser');
  const fig = stripSlots(buildStyle('feedbackops-light')['components/before-after.html'].replace(/<!--[\s\S]*?-->/g, ''));
  const rows = [285, 400, 560, 570, 1000]; // the row inside the figure's 28px padding and 1px border
  const page = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${rows.map(w => `<div class="f" style="width:${w + 58}px">${fig}</div>`).join('')}<pre id="out"></pre><script>
    document.getElementById('out').textContent = JSON.stringify([...document.querySelectorAll('.f')].map(f => {
      const row = f.querySelector('[data-component] > div'), r = (e) => e.getBoundingClientRect();
      const [asIs, ...rest] = [...row.children], toBe = rest.pop();
      const pivot = (glyph) => rest.find(e => e.textContent.trim() === glyph);
      return { row: Math.round(r(row).width), arrow: Math.round(r(pivot('→')).width), down: Math.round(r(pivot('↓')).width),
        order: [r(asIs).top, r(pivot('↓')).top, r(toBe).top].map(Math.round) };
    }));
  </script></body></html>`;
  const dir = mkdtempSync(join(tmpdir(), 'ba-'));
  try {
    writeFileSync(join(dir, 'p.html'), page);
    let out;
    try { out = execFileSync(chrome, ['--headless=new', ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), '--disable-gpu', '--dump-dom', `file://${join(dir, 'p.html')}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 }); }
    catch (e) { return t.skip(`browser cannot run here: ${e.message.split('\n')[0]}`); }
    const got = JSON.parse(out.match(/<pre id="out">([\s\S]*?)<\/pre>/)[1].replace(/&quot;/g, '"'));
    for (const g of got) {
      if (g.row < 570) {
        assert.equal(g.arrow, 0, `row ${g.row}: → is hidden`);
        assert.equal(g.down, g.row, `row ${g.row}: ↓ takes the row`);
        assert.ok(g.order[0] < g.order[1] && g.order[1] < g.order[2], `row ${g.row}: ↓ sits between the stacked columns (${g.order})`);
      } else {
        assert.deepEqual([g.arrow, g.down], [50, 0], `row ${g.row}`);
        assert.equal(g.order[0], g.order[2], `row ${g.row}: the columns share a row`);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---- documents built from the components keep the planned marker (core/components.md §4 "Figure markers") ----

test('documents: every element drawn in the planned look (muted dashed box on the fill tint; a timeline row with the dashed empty marker) carries data-state="planned"', () => {
  const { colors } = loadTokens('feedbackops-light');
  const box = `background:${colors['fill-50']}; border:1px dashed ${colors['muted-300']};`;
  const ring = `border:2px dashed ${colors['muted-300']}`;
  for (const file of ['presentations/platform-pitch/platform-pitch.dc.html', 'presentations/platform-guide/platform-guide.dc.html']) {
    const mk = markup(readFileSync(join(CORE, '..', file), 'utf8'));
    const looks = elementsWith(mk, 'style').filter(el => el.value.includes(box) || (el.value.includes('96px 28px') && htmlOf(mk, el).includes(ring)));
    assert.ok(looks.length, `${file} draws planned things`);
    for (const el of looks) assert.equal(attrOf(el.attrs, 'data-state'), 'planned', `${file}: <${el.name}> "${htmlOf(mk, el).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30)}" has the planned look but no data-state="planned"`);
  }
});

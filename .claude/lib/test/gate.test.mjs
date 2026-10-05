import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePlan } from '../plan-schema.mjs';
import { shapeMap as shapeMapReal } from '../components.mjs';
import { runGate, findClassSelector, untracedNumbers, gridInconsistencies, usedHexes } from '../gate.mjs';

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
  const plan = (s2) => ({ sections: [{ id: 's1', title: '1. 지표', shape: 'headline-metric' }, { id: 's2', title: '2. 흐름', shape: s2 }] });
  const fail = runGate(html, { ...opts, plan: plan('data-flow'), shapeMap });
  const row = fail.checks.find(c => c.name === 'plan-shapes');
  assert.equal(row.ok, false);
  assert.match(row.detail, /s2 \(shape data-flow\) needs pipeline; found card-grid/);
  const pass = runGate(html, { ...opts, plan: plan('peer-list'), shapeMap });
  assert.equal(pass.checks.find(c => c.name === 'plan-shapes').ok, true);
});

const check = (r, name) => r.checks.find(c => c.name === name);
// A minimal passing document around `body`; `style` goes into the single global <style>.
const page = (body, style = 'body { word-break: keep-all; }') =>
  `<!DOCTYPE html><html><head><style>${style}</style></head><body><i style="color:#4338CA"></i>${body}</body></html>`;

test('accent-present ignores hex case', () => {
  assert.equal(check(runGate(page(''), { ...opts, accentHex: '#4338ca' }), 'accent-present').ok, true);
  assert.equal(check(runGate(page(''), { ...opts, accentHex: '#111111' }), 'accent-present').ok, false);
});

test('plan-alignment is by id: sN ↔ numbered title, sref ↔ unnumbered; extra or missing ids fail', () => {
  const html = page('<section id="s1"></section><section id="s2"></section><section id="sref"></section>');
  const p = (...ids) => ({ sections: ids.map(id => ({ id, shape: 'none' })) });
  const run = (plan) => check(runGate(html, { ...opts, plan, shapeMap }), 'plan-alignment');
  assert.equal(run(p('s1', 's2', 'sref')).ok, true);
  assert.equal(run(p('s1', 's2')).ok, true); // a document appendix the plan does not list is fine
  assert.match(run(p('s1', 's2', 's3')).detail, /missing: s3/);
  assert.match(run(p('s1')).detail, /not in plan: s2/);
  assert.match(run(p('s1', 's2', 'sref', 'sref2')).detail, /missing: sref2/);
});

test('plan-shapes looks a section up by id, not by position', () => {
  const html = page('<section id="s2"><div data-component="pipeline"></div></section><section id="s1"><div data-component="kpi-row"></div></section>');
  const plan = { sections: [{ id: 's1', shape: 'headline-metric' }, { id: 's2', shape: 'data-flow' }] };
  assert.equal(check(runGate(html, { ...opts, plan, shapeMap }), 'plan-shapes').ok, true);
});

test('inline-only: class selectors are caught in lists, element lists and @media; allowed globals stay allowed', () => {
  const bad = ['.a { color:red }', '.a, .b { color:red }', 'div, .x{ color:red }', '@media (max-width:820px) { .nav-scroll a { flex:0 0 auto } }',
    '@media print { p, .y { color:#000 } }', 'div.card { color:red }'];
  for (const css of bad) assert.ok(findClassSelector(css), css);
  const ok = ['body { word-break: keep-all; margin:0 }', 'p, h1, h2, div, span, li, a { word-break: keep-all }', '*::selection { background:#C7D2FE }',
    '.nav-scroll::-webkit-scrollbar { height:0 }', '@font-face { font-family:X; src:url(a.woff2) }', '[data-component] { break-inside:avoid }',
    '@media print { [data-component] { break-inside:avoid } div[style*="a.b"] { padding:0 } }', '@keyframes k { 0.5% { opacity:.5 } }'];
  for (const css of ok) assert.equal(findClassSelector(css), null, css);
  const r = runGate(page('', 'body { word-break: keep-all; }\n@media print { .sheet, [data-component] { x:y } }'), opts);
  const row = check(r, 'inline-only');
  assert.equal(row.ok, false);
  assert.match(row.detail, /\.sheet/);
});

test('no-role-placeholders fails on a leftover ⟨role⟩ and ignores comments', () => {
  const ok = runGate(page('<!-- ⟨accent⟩ is fine here --><p>x</p>'), opts);
  assert.equal(check(ok, 'no-role-placeholders').ok, true);
  const bad = runGate(page('<div style="color:⟨accent⟩"></div><div style="border:1px solid ⟨border⟩"></div>'), opts);
  const row = check(bad, 'no-role-placeholders');
  assert.equal(row.ok, false);
  assert.match(row.detail, /2 left, e\.g\. ⟨accent⟩/);
});

test('palette: every hex in style/<style> text must be in the style set (case- and shorthand-insensitive); comments, scripts, entities, fragments are ignored', () => {
  const paletteHexes = ['#4338CA', '#FFFFFF', '#eef0f7'];
  const run = (body, style) => check(runGate(page(body, style), { ...opts, paletteHexes }), 'palette');
  assert.equal(run('<p style="color:#4338ca; background:#fff; border:1px solid #EEF0F7"></p>').ok, true);
  const bad = run('<p style="color:#123456"></p>', 'body { word-break: keep-all; background:#ABCDEF; }');
  assert.equal(bad.ok, false);
  assert.match(bad.detail, /2 color\(s\).*#ABCDEF.*#123456|2 color\(s\).*#123456.*#ABCDEF/);
  const quiet = '<!-- #123456 --><script>const c = "#abcdef";</script><p>&#123456; &#x27;</p><a href="#fade12" id="c0ffee">x</a><svg><rect fill="url(#abc)"></rect></svg>';
  assert.equal(run(quiet).ok, true);
  assert.equal(check(runGate(page('<p style="color:#123456"></p>'), opts), 'palette'), undefined); // not run without a style
  assert.deepEqual(usedHexes('<p style="color:#12345678; x:#abcd">').map(h => h.norm), ['#123456', '#AABBCC']);
});

test('grid-consistency: repeat(M,1fr) must equal N wherever a component uses calc(100% / N)', () => {
  const comp = (inner) => `<div data-component="gantt"><div>${inner}</div></div>`;
  const run = (html) => check(runGate(page(html), opts), 'grid-consistency');
  assert.equal(run(comp('<i style="background-size:calc(100% / 6) 100%"></i><b style="grid-template-columns:150px repeat(6,1fr)"></b>')).ok, true);
  assert.equal(run(comp('<i style="background-size:calc(100%/6) 100%"></i><b style="grid-template-columns:repeat( 6 , minmax(0, 1fr))"></b>')).ok, true);
  const bad = run(comp('<i style="background-size:calc(100% / 7) 100%"></i><b style="grid-template-columns:repeat(6,1fr)"></b><u style="grid-template-columns:repeat(7,1fr)"></u>'));
  assert.equal(bad.ok, false);
  assert.match(bad.detail, /gantt: calc\(100%\/N\) N=7 but repeat\(M,1fr\) M=6,7/);
  // no calc → nothing to compare; a repeat outside any component is ignored
  assert.equal(run(comp('<b style="grid-template-columns:repeat(3,1fr)"></b>')).ok, true);
  assert.equal(run('<div style="background-size:calc(100% / 4)"></div><div data-component="x"><b style="grid-template-columns:repeat(2,1fr)"></b></div>').ok, true);
});

test('grid-consistency: a nested component is judged on its own, and tag balancing survives sibling roots', () => {
  const inner = '<div data-component="timeline"><i style="grid-template-columns:repeat(3,1fr)"></i></div>';
  const nested = `<div data-component="gantt"><i style="background-size:calc(100% / 6)"></i><b style="grid-template-columns:repeat(6,1fr)"></b>${inner}</div>`;
  assert.deepEqual(gridInconsistencies(nested), []);
  const sibling = `<div data-component="gantt"><div><i style="background-size:calc(100% / 6)"></i></div></div><div data-component="x"><b style="grid-template-columns:repeat(2,1fr)"></b></div>`;
  assert.deepEqual(gridInconsistencies(sibling), []);
  const comment = '<div data-component="gantt"><!-- repeat(9,1fr) --><i style="background-size:calc(100% / 6)"></i></div>';
  assert.deepEqual(gridInconsistencies(comment), []);
});

// ----- numbers-traced -----
const secs = (inner, hero = '') => page(`${hero}<section id="s1">${inner}</section>`);
const traced = 'plan: 처리량 120 files/min, 지연 30분, 18일, 1,200건, 3.5배';

test('untracedNumbers: only numerals absent from the plan/facts text are reported, with context', () => {
  const html = secs('<p>처리량은 120 files/min, 지연 30분, 도입 74% 효과, 1200건, 3.5배, 18일</p><p>47건 미처리</p>');
  const out = untracedNumbers(html, traced);
  assert.deepEqual(out.map(o => o.num), ['74', '47']);
  assert.match(out[0].ctx, /도입 74% 효과/);
  assert.deepEqual(untracedNumbers(html, `${traced} 74 47`), []);
});

test('untracedNumbers: eyebrows, step badges, list markers, ids, comments, scripts, styles and attributes are not visible numbers', () => {
  const html = secs(
    '<div>02 · ARCHITECTURE</div><span>7</span><span>12</span><p>3. 첫째 항목</p><p>→ s4 참조</p>' +
    '<!-- 999 --><script>const x = 555;</script><style>a{margin:4242px}</style><p data-n="888" style="width:777px">본문</p>' +
    '<helmet><style>b{top:666px}</style></helmet>');
  assert.deepEqual(untracedNumbers(html, ''), []);
});

test('untracedNumbers: hero text before the first <section> is checked in full, including 1–2 digit tokens', () => {
  const hero = '<div><div style="font:700 30px">9</div><div>독립 시스템</div></div>';
  assert.deepEqual(untracedNumbers(secs('<p>x</p>', hero), 'a 3 b').map(o => o.num), ['9']);
  assert.deepEqual(untracedNumbers(secs('<p>x</p>', hero), 'cover-tokens: 9=독립 시스템'), []);
});

test('untracedNumbers: ledger ids, line refs and plan heading numbers trace nothing; cited ledger ids are not values', () => {
  const plan = '## 3. 구조\n- payload: 근거 [F03] [F12–F14], Q01, C04, docs/a.md L7-40';
  assert.deepEqual(untracedNumbers(secs('<p>3단계 · 12곳 · 40건 · 7개</p>'), plan).map(o => o.num), ['3', '12', '40', '7']);
  assert.deepEqual(untracedNumbers(secs('<p>근거 F03 · Q01 · C04</p>'), ''), []);
});

test('untracedNumbers: thousands commas and leading zeros normalize; entities are not numbers', () => {
  const html = secs('<p>1,200건 · 2026년 10월 05일 &#39;x&#39; &amp; 1,2</p>');
  assert.deepEqual(untracedNumbers(html, '1200 2026-10-5 1 2'), []);
  assert.deepEqual(untracedNumbers(html, '1200 2026-10-5').map(o => o.num), ['1', '2']);
});

test('numbers-traced check: runs only with a plan, reads plan + facts, fails on a missing facts file', () => {
  const html = secs('<p>도입 후 74건</p>');
  const plan = { sections: [{ id: 's1', shape: 'none' }] };
  const base = { ...opts, plan, shapeMap };
  assert.equal(check(runGate(html, base), 'numbers-traced'), undefined);
  const miss = check(runGate(html, { ...base, planText: 'no digits here' }), 'numbers-traced');
  assert.equal(miss.ok, false);
  assert.match(miss.detail, /1 number\(s\) not in the plan or facts: 74 …/);
  assert.equal(check(runGate(html, { ...base, planText: 'plan', factsText: '| F01 | 건수 | 74 |' }), 'numbers-traced').ok, true);
  const noFacts = check(runGate(html, { ...base, planText: 'plan', factsError: 'facts file named by the plan header cannot be read: /x/facts.md' }), 'numbers-traced');
  assert.equal(noFacts.ok, false);
  assert.match(noFacts.detail, /cannot be read: \/x\/facts\.md/);
});

test('numbers-traced lists at most 8 untraced numbers', () => {
  const html = secs(`<p>${Array.from({ length: 12 }, (_, i) => 100 + i).join(' ')}</p>`);
  const row = check(runGate(html, { ...opts, plan: { sections: [] }, shapeMap, planText: 'x' }), 'numbers-traced');
  assert.match(row.detail, /^12 number\(s\)/);
  assert.equal(row.detail.split(' ; ').length, 8);
});

// Calibration: the worked example (light brief) with its plan — every number traced, no placeholders, palette clean.
test('worked example (feedbackops-light brief) passes every plan-aware check; mutating it makes numbers-traced fire', () => {
  const html = read('example-brief/brief.dc.html');
  const planText = read('example-brief/content-plan.md');
  const plan = parsePlan(planText);
  const palette = [...readFileSync(new URL('../../../styles/feedbackops-light/design.md', import.meta.url), 'utf8').matchAll(/#[0-9a-fA-F]{6}\b/g)].map(m => m[0]);
  const o = { accentHex: '#1428A0', sidecarPresent: true, plan, shapeMap: shapeMapReal(), planText, paletteHexes: palette };
  const r = runGate(html, o);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
  for (const n of ['plan-alignment', 'plan-shapes', 'numbers-traced', 'palette', 'grid-consistency', 'no-role-placeholders']) assert.ok(check(r, n), n);
  const bad = runGate(html.replace('일부 Phase 1 항목은', '일부 Phase 1 항목은 처리량 74% ▲12p 향상, 미처리 VOC 47건,'), o);
  assert.match(check(bad, 'numbers-traced').detail, /74 .*12 .*47|74 .*47 .*12/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePlan, parsePlan, parseCoverTokens, labelLanguage, COUNT_LIMITS, useCaseGoals, layerModules, tableRowCount } from '../plan-schema.mjs';
import { listTemplates, parseLimitsX } from '../components.mjs';
import { COUNTERS } from '../figure-counts.mjs';

const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');
const planDir = fileURLToPath(new URL('./fixtures/', import.meta.url));

const CLI = fileURLToPath(new URL('../plan-schema.mjs', import.meta.url));
const fixture = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
// Run the CLI and capture {status, stdout, stderr} without throwing on non-zero exit.
function runCli(...args) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (e) {
    return { status: e.status, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

// A plan with a valid header and the given section blocks; `over` replaces/removes header keys.
const HEADER = {
  'doc-type': 'explainer',
  audience: 'developer',
  'reader-action': '결정한다',
  'has-as-is': 'false',
  'metrics-mode': 'absent',
  'act-structure': 'flat',
  'narrative-lens': 'architecture-first',
  'source-ref': 'docs/a.md@abc',
  title: '제목',
  thesis: '한 문장. [docs/a.md L1]',
  'cover-tokens': '3=시스템 [docs/a.md L1] ; 1=정본 [docs/a.md L2]',
};
const sec = (n, shape, figureData = 'none', span = 'docs/a.md L1-9') =>
  `## ${n}. 섹션 ${n}\n- intent: 의도\n- shape: ${shape}\n- payload: 내용\n- figure-data: ${figureData}\n- source-span: ${span}\n`;
const plan = (sections, over = {}) => {
  const h = { ...HEADER, ...over };
  return `---\n${Object.entries(h).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${sections.join('\n')}`;
};
const errs = (md, opts) => validatePlan(md, opts).errors.join('\n');

// ---- templates injected so figure-data rules are tested independent of the real library ----
const tpl = (component, kind, shape, data) =>
  `<!--\n@component ${component}\n@kind ${kind}\n@order 1\n@shape ${shape}\n@title T\n@use U\n${data ? `@data ${data}\n` : ''}-->\n<div data-component="${component}"></div>\n`;
function synthTemplates() {
  const dir = mkdtempSync(join(tmpdir(), 'tpl-'));
  const files = {
    'bar.html': tpl('bar', 'chart', 'quantity', 'bars: 라벨=값, 라벨=값 … | unit?: 건 | highlight?: 라벨'),
    'flow.html': tpl('flow', 'figure', 'data-flow', 'stages: 수집[A] → 처리[B] | arrow-labels: 근거'),
    'layers.html': tpl('layers', 'figure', 'layered-structure', 'layers (위→아래): 레이어명: 모듈 | links: 연결 | external: 이름'),
    'cards.html': tpl('cards', 'content', 'peer-list', 'items: 번호 · 제목'),
    'tbl.html': tpl('tbl', 'content', 'text-table', 'columns: 열1, 열2, 열3 | rows: 값 · 값 · 값 …'),
  };
  for (const [f, src] of Object.entries(files)) writeFileSync(join(dir, f), src);
  const templates = listTemplates(dir);
  rmSync(dir, { recursive: true, force: true });
  return templates;
}
const templates = synthTemplates();

test('valid plan passes and parses all fields', () => {
  const md = read('plan-valid.md');
  const res = validatePlan(md);
  assert.equal(res.ok, true, res.errors.join('; '));
  const p = parsePlan(md);
  assert.equal(p.header.hasAsIs, true);
  assert.equal(p.header.narrativeLens, 'architecture-first');
  assert.equal(p.header.audience, 'developer');
  assert.equal(p.header.title, '로그 수집기 병렬화');
  assert.match(p.header.thesis, /30분에서 3분/);
  assert.deepEqual(p.header.coverTokens.map(t => [t.value, t.label, t.cite]),
    [['120', 'files/min 현행 처리량', 'docs/source.md L1-20'], ['30', '분 피크 지연', 'docs/source.md L1-20']]);
  assert.equal(p.sections.length, 2);
  assert.deepEqual(p.sections.map(s => s.id), ['s1', 's2']);
  assert.ok(p.sections[0].sourceSpan.length > 0);
});

test('text-table fixtures: columns/rows plan is valid (eyebrow and a ~합니다 thesis are accepted), `none` fails through the CLI', () => {
  const ok = runCli(fixture('plan-text-table.md'));
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(parsePlan(read('plan-text-table.md')).header.eyebrow, 'PROPOSAL · 관리자용');
  const bad = runCli(fixture('plan-text-table-none.md'));
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /shape "text-table" needs figure-data/);
});

test('header: `eyebrow` is optional, kept verbatim, and rejected only as a template placeholder', () => {
  const run = (v) => validatePlan(plan([sec(1, 'none')], { eyebrow: v }), { templates });
  assert.equal(run(null).ok, true); // key absent
  assert.equal(parsePlan(plan([sec(1, 'none')], { eyebrow: null })).header.eyebrow, '');
  assert.equal(run('PROPOSAL · 관리자용').ok, true);
  assert.equal(parsePlan(plan([sec(1, 'none')], { eyebrow: 'PROPOSAL · 관리자용' })).header.eyebrow, 'PROPOSAL · 관리자용');
  assert.equal(run('').ok, true); // empty = absent (the fallback applies), not an error
  assert.match(run('<DOC-TYPE> · <audience>').errors.join('\n'), /header eyebrow is still a template placeholder/);
});

test('header: `labels` is an optional en | ko enum; labelLanguage() defaults from audience and honours the override', () => {
  const run = (v) => validatePlan(plan([sec(1, 'none')], { labels: v }), { templates });
  assert.equal(run(null).ok, true); // key absent
  assert.equal(run('').ok, true); // empty = absent (the audience default applies), not an error
  for (const ok of ['en', 'ko']) assert.equal(run(ok).ok, true, ok);
  assert.match(run('fr').errors.join('\n'), /header labels "fr" is not one of: en, ko/);
  assert.match(run('<en | ko>').errors.join('\n'), /header labels is still a template placeholder/);
  assert.equal(parsePlan(plan([sec(1, 'none')], { labels: 'ko' })).header.labels, 'ko');
  assert.equal(parsePlan(plan([sec(1, 'none')], { labels: null })).header.labels, '');
  const lang = (over) => labelLanguage(parsePlan(plan([sec(1, 'none')], over)).header);
  assert.equal(lang({ audience: 'developer' }), 'en'); // engineering docs keep English category labels
  assert.equal(lang({ audience: 'executive' }), 'ko');
  assert.equal(lang({ audience: 'user' }), 'ko');
  assert.equal(lang({ audience: 'executive', labels: 'en' }), 'en'); // the key overrides the audience default
  assert.equal(lang({ audience: 'developer', labels: 'ko' }), 'ko');
  // the plan template carries the optional key, as a placeholder (so an unfilled template stays invalid)
  const tpath = fileURLToPath(new URL('../../skills/build/content-plan.template.md', import.meta.url));
  assert.match(readFileSync(tpath, 'utf8'), /^labels: <optional — en \| ko/m);
});

test('section ids: numbered titles → sN, an unnumbered title → sref; duplicates are an error', () => {
  const md = plan([sec(1, 'none'), sec(3, 'none'), '## 부록 — 용어\n- intent: i\n- shape: none\n- payload: p\n- figure-data: none\n- source-span: docs/a.md L1\n']);
  assert.deepEqual(parsePlan(md).sections.map(s => s.id), ['s1', 's3', 'sref']);
  assert.equal(validatePlan(md, { templates }).ok, true);
  const two = md + '\n## 용어 2\n- intent: i\n- shape: none\n- payload: p\n- figure-data: none\n- source-span: docs/a.md L1\n';
  assert.match(errs(two, { templates }), /duplicates section id sref/);
});

test('section missing source-span fails validation', () => {
  const res = validatePlan(read('plan-missing-source-span.md'));
  assert.equal(res.ok, false);
  assert.match(res.errors.join('\n'), /source-span/);
});

test('CLI exits 0 on a valid plan', () => {
  const r = runCli(fixture('plan-valid.md'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /content-plan OK/);
});

test('CLI exits 1 and lists errors on an invalid plan', () => {
  const r = runCli(fixture('plan-missing-source-span.md'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /INVALID/);
  assert.match(r.stderr, /source-span/);
});

test('CLI exits 2 on usage error (missing arg) and unreadable file', () => {
  assert.equal(runCli().status, 2);
  assert.equal(runCli('/no/such/plan.md').status, 2);
});

test('valid plan carries a known shape per section and a doc-type', () => {
  const p = parsePlan(read('plan-valid.md'));
  assert.deepEqual(p.sections.map(s => s.shape), ['headline-metric', 'data-flow']);
  assert.equal(p.header.docType, 'explainer');
});

test('unknown shape and missing figure-data for a figure shape both fail', () => {
  const res = validatePlan(read('plan-bad-shape.md'));
  assert.equal(res.ok, false);
  const msg = res.errors.join('\n');
  assert.match(msg, /shape "flowchart" is not in the vocabulary/);
  assert.match(msg, /shape "lifecycle" needs figure-data/);
});

test('a section without a shape fails', () => {
  const md = read('plan-valid.md').replace('- shape: data-flow\n', '');
  const res = validatePlan(md);
  assert.equal(res.ok, false);
  assert.match(res.errors.join('\n'), /section 2 .* missing shape/);
});

// ---- field parsing ----

test('an empty field stays empty: it does not capture the next line', () => {
  const res = validatePlan(read('plan-empty-figure-data.md'));
  assert.equal(res.ok, false);
  assert.match(res.errors.join('\n'), /shape "lifecycle" needs figure-data/);
  const p = parsePlan(read('plan-empty-figure-data.md'));
  assert.equal(p.sections[0].figureData, '');
  assert.match(p.sections[0].sourceSpan, /docs\/source\.md L10-20/);
  const noIntent = plan(['## 1. x\n- intent:\n- shape: none\n- payload: p\n- figure-data: none\n- source-span: docs/a.md L1\n']);
  assert.match(errs(noIntent, { templates }), /section 1 .* missing intent/);
});

test('a value continues on following lines indented by ≥2 spaces', () => {
  const md = plan(['## 1. x\n- intent: 의도\n- shape: data-flow\n- payload: 내용\n- figure-data:\n  stages: 수집[A] → 처리[B]\n  | arrow-labels: 근거\n- source-span: docs/a.md\n  L1-9\n']);
  const s = parsePlan(md).sections[0];
  assert.equal(s.figureData, 'stages: 수집[A] → 처리[B] | arrow-labels: 근거');
  assert.equal(s.sourceSpan, 'docs/a.md L1-9');
  assert.equal(validatePlan(md, { templates }).ok, true);
});

// ---- header ----

test('header: every contract key is required, enums are checked, pitch needs a facts file', () => {
  for (const k of Object.keys(HEADER))
    assert.match(errs(plan([sec(1, 'none')], { [k]: null }), { templates }), new RegExp(`header missing key: ${k}`));
  assert.match(errs(plan([sec(1, 'none')], { audience: 'boss' }), { templates }), /audience "boss" is not one of: executive, user, developer/);
  assert.match(errs(plan([sec(1, 'none')], { 'has-as-is': 'yes' }), { templates }), /has-as-is "yes"/);
  assert.match(errs(plan([sec(1, 'none')], { 'doc-type': 'memo' }), { templates }), /doc-type "memo"/);
  assert.match(errs(plan([sec(1, 'none')], { title: '' }), { templates }), /header key title is empty/);
});

test('header: doc-type pitch requires facts, and the file must exist relative to the plan', () => {
  assert.match(errs(read('plan-pitch-no-facts.md')), /header missing key: facts \(required for doc-type pitch\)/);
  assert.equal(validatePlan(read('plan-pitch-facts.md'), { planDir }).ok, true);
  const gone = plan([sec(1, 'none')], { 'doc-type': 'pitch', facts: 'no-such-facts.md' });
  assert.match(errs(gone, { planDir, templates }), /facts file not found: .*no-such-facts\.md/);
  assert.equal(parsePlan(read('plan-pitch-facts.md')).header.facts, 'facts-sample.md');
});

test('header: template placeholders are rejected, in the header and in section values', () => {
  const msg = errs(read('plan-placeholder-header.md'));
  for (const k of ['doc-type', 'audience', 'reader-action', 'has-as-is', 'source-ref', 'title', 'thesis', 'cover-tokens'])
    assert.match(msg, new RegExp(`header ${k} is still a template placeholder`));
  const body = plan(['## <N. 제목>\n- intent: <one line>\n- shape: none\n- payload: <a | b>\n- figure-data: none\n- source-span: <docs/x.md L1>\n']);
  const m = errs(body, { templates });
  assert.match(m, /title is still a template placeholder/);
  assert.match(m, /intent is still a template placeholder/);
  assert.match(m, /payload is still a template placeholder/);
  assert.match(m, /source-span is still a template placeholder/);
  // a value that merely contains a less-than sign is data, not a placeholder
  assert.equal(validatePlan(plan([sec(1, 'none').replace('payload: 내용', 'payload: 지연 <5분이면 정상, x < y')]), { templates }).ok, true);
});

test('the unfilled plan template is never a valid plan', () => {
  const tpath = fileURLToPath(new URL('../../skills/build/content-plan.template.md', import.meta.url));
  if (!existsSync(tpath)) return;
  const res = validatePlan(readFileSync(tpath, 'utf8').replace(/shape: <[^>]*>/g, 'shape: none'));
  assert.equal(res.ok, false);
});

test('cover-tokens: 2–4 items, each `값=라벨 [cite]`; as-of must be a real YYYY-MM-DD date', () => {
  const run = (v) => errs(plan([sec(1, 'none')], { 'cover-tokens': v }), { templates });
  assert.match(run('3=시스템 [F01]'), /needs 2–4 tokens.*\(found 1\)/);
  assert.match(run('1=a [F1] ; 2=b [F2] ; 3=c [F3] ; 4=d [F4] ; 5=e [F5]'), /found 5/);
  assert.match(run('3=시스템 [F01] ; 1=정본'), /item "1=정본" must look like/);
  assert.match(run('3 시스템 [F01] ; 1=정본 [F02]'), /item "3 시스템 \[F01\]" must look like/);
  assert.equal(run('3=시스템 [F01] ; 1=정본 [PRODUCT.md L12] ;'), '');
  assert.deepEqual(parseCoverTokens('3=독립 시스템 [F01] ; MVP=범위 [roadmap.md L3]').map(t => t.value), ['3', 'MVP']);
  const asOf = (v) => errs(plan([sec(1, 'none')], { 'as-of': v }), { templates });
  assert.equal(asOf('2026-10-05'), '');
  assert.match(asOf('2026/10/05'), /as-of "2026\/10\/05" must be YYYY-MM-DD/);
  assert.match(asOf('2026-13-40'), /must be YYYY-MM-DD/);
});

// ---- source-span ----

test('source-span must look like a citation', () => {
  const run = (span) => errs(plan([sec(1, 'none', 'none', span)]), { templates });
  for (const bad of ['source', '출처 참고', '위 문서']) assert.match(run(bad), /source-span ".*" is not a citation/, bad);
  for (const ok of ['docs/source.md L12-40', 'README.md', 'src/a.ts', 'L12', '[F03]', 'FeedbackOps@87948f3', 'PRODUCT.md L12; docs/x.md L3'])
    assert.equal(run(ok), '', ok);
});

// ---- figure-data first key + arrows (synthetic templates) ----

test('figure-data must contain the component\'s first @data key; annotated keys and optional keys are fine', () => {
  const run = (shape, fd) => errs(plan([sec(1, shape, fd)]), { templates });
  assert.match(run('quantity', 'unit: 건 | 값: 3'), /must contain the key "bars:" \(bar format/);
  assert.equal(run('quantity', 'bars: A=3, B=5'), '');
  assert.equal(run('quantity', 'unit: 건 | bars: A=3, B=5'), '');
  assert.match(run('quantity', 'sidebars: A=3'), /must contain the key "bars:"/);
  assert.equal(run('layered-structure', 'layers (위→아래): 앱: A | 코어: B'), '');
  assert.equal(run('layered-structure', 'layers: 앱: A | 코어: B'), ''); // key annotation in @data does not demand an arrow
  assert.match(run('layered-structure', 'links: A ↕ B'), /key "layers:"/);
  // peer-list is a content component: no figure-data rules
  assert.equal(run('peer-list', 'none'), '');
});

test('text-table is the one content shape that needs figure-data: columns first, like a figure', () => {
  const run = (fd) => errs(plan([sec(1, 'text-table', fd)]), { templates });
  for (const none of ['none', '', 'n/a'])
    assert.match(run(none), /section 1 .* shape "text-table" needs figure-data/, none);
  assert.match(run('rows: A · B · C'), /must contain the key "columns:" \(tbl format/);
  assert.equal(run('columns: 문제, 해결, 효과 | rows: 수작업 · 자동화 · 시간 절감'), '');
  assert.equal(run('columns: 항목, 값'), ''); // only the first key is mandatory, as for every component
  // the real library: a text-table section without columns/rows is rejected, with them it passes
  const real = (fd) => validatePlan(plan([sec(1, 'text-table', fd)])).errors.join('\n');
  assert.match(real('none'), /shape "text-table" needs figure-data in its component's format/);
  assert.match(real('rows: a · b'), /key "columns:" \(table format/);
  assert.equal(real('columns: 문제, 해결 | rows: 가 · 나'), '');
  // peer-list stays figure-data-free
  assert.equal(errs(plan([sec(1, 'peer-list')]), { templates }), '');
});

test('arrow rule: a flow component\'s figure-data must show at least one arrow (→ ⇢ -> --> ↻ (self))', () => {
  const run = (fd) => errs(plan([sec(1, 'data-flow', fd)]), { templates });
  assert.match(run('stages: 수집 | 처리'), /shows no flow/);
  for (const ok of ['stages: 수집 → 처리', 'stages: 수집 -> 처리', 'stages: 수집 --> 처리', 'stages: 수집 ⇢ 처리', 'stages: 수집 ↻ 처리', 'stages: 수집 (self) 처리'])
    assert.equal(run(ok), '', ok);
  assert.match(run('arrow-labels: 근거 → 연결'), /key "stages:"/); // key check comes first
});

test('ASCII-arrow sequence figure-data is accepted by the real library', () => {
  const res = validatePlan(read('plan-ascii-arrows.md'));
  assert.equal(res.ok, true, res.errors.join('; '));
  const noArrow = read('plan-ascii-arrows.md').replace(/messages:.*\n/, 'messages: 사용자와 API 로그인 | 조회\n');
  assert.match(errs(noArrow), /shows no flow/);
});

// ---- warnings ----

test('executive plans warn on developer shapes, a non-opening metric/decision and a non-final decision', () => {
  const res = validatePlan(read('plan-executive.md'));
  assert.equal(res.ok, true, res.errors.join('; '));
  const w = res.warnings.join('\n');
  assert.match(w, /developer-grade shapes: s2=interaction/);
  assert.match(w, /open with headline-metric or decision \(first numbered section is "peer-list"\)/);
  assert.match(w, /end with a decision section/);
  assert.deepEqual(validatePlan(read('plan-valid.md')).warnings, []);
});

test('executive plans with more than 12 numbered sections warn (and suggest acts); up to 12, and non-executive plans, do not', () => {
  const many = (n, over) => plan(Array.from({ length: n }, (_, i) => sec(i + 1, i === 0 || i === n - 1 ? 'decision' : 'peer-list', i === 0 || i === n - 1 ? 'question: 승인?' : 'none')), over);
  const warns = (md) => validatePlan(md, { templates: [...templates, ...synthDecision()] }).warnings.join('\n');
  assert.match(warns(many(13, { audience: 'executive' })), /13 numbered sections \(>12\) — group them into acts \(act-structure: act-grouped/);
  assert.doesNotMatch(warns(many(12, { audience: 'executive' })), /numbered sections/); // 8–12 sections used to warn
  assert.doesNotMatch(warns(many(8, { audience: 'executive' })), /numbered sections/);
  assert.doesNotMatch(warns(many(13, {})), /numbered sections/);
});

function synthDecision() {
  const dir = mkdtempSync(join(tmpdir(), 'tpl-'));
  writeFileSync(join(dir, 'decision.html'), tpl('decision', 'report', 'decision', 'question: 질문 | options: A, B'));
  const t = listTemplates(dir);
  rmSync(dir, { recursive: true, force: true });
  return t;
}

test('more than two `decision` sections warn (non-blocking)', () => {
  const md = plan([1, 2, 3].map(n => sec(n, 'decision', 'question: 승인?')));
  const res = validatePlan(md, { templates: [...templates, ...synthDecision()] });
  assert.equal(res.ok, true, res.errors.join('; '));
  assert.match(res.warnings.join('\n'), /3 sections have shape "decision" \(s1,s2,s3\)/);
});

// ---- countable limits: goals per actor, modules per layer, table rows (non-blocking, real component library) ----

const countWarns = (shape, fd, n = 1) => {
  const res = validatePlan(plan([sec(n, shape, fd)]));
  assert.equal(res.ok, true, res.errors.join('; ')); // always a warning, never an error
  return res.warnings.join('\n');
};
const goals = (n) => Array.from({ length: n }, (_, i) => `목표${i + 1}`).join(', ');

test('use-case: more than 5 goals for one actor warns, naming the actor; 5 does not; parenthesised commas stay in one goal', () => {
  const fd = (n) => `system: 도구 | actors: 문의자: ${goals(3)} ‖ 담당 개발자: ${goals(n)} ‖ 팀장(검토, 승인): 요청 검토`;
  assert.match(countWarns('actor-goals', fd(6)), /^s1 \(actor-goals\): "담당 개발자" has 6 goals \(>5\) — use-case shows 1–5 per actor/);
  assert.doesNotMatch(countWarns('actor-goals', fd(5)), /goals/);
  assert.deepEqual(useCaseGoals('system: X | actors: A: 가(나, 다), 라 ‖ B: 마'), [{ name: 'A', n: 2 }, { name: 'B', n: 1 }]);
  assert.equal(countWarns('actor-goals', fd(7)).split('\n').length, 1); // one warning per offending actor
});

test('layer-map: more than 5 modules in one layer warns; tags, a bare `key` marker and parenthesised commas do not count as modules', () => {
  const layer = (n) => `업무 화면 [state: 시험용 데이터]: ${Array.from({ length: n }, (_, i) => `모듈${i + 1}(설명, 둘)`).join(', ')}`;
  const w = countWarns('layered-structure', `layers: ${layer(6)} ‖ 공통 기반 [key]: 가, 나 | links: 업무 화면 ↕ 공통 기반 = 호출`);
  assert.match(w, /^s1 \(layered-structure\): layer "업무 화면" has 6 modules \(>5\) — layer-map shows 1–5 per layer/);
  assert.doesNotMatch(countWarns('layered-structure', `layers: ${layer(5)}, key ‖ 공통 기반: 가, 나 [planned] | links: a ↕ b = c`), /modules/); // 5 + a `key` marker = 5 modules
  // the older format separates layers with " | " until links/external
  assert.deepEqual(layerModules('layers (위→아래): 독립: A, B | Integration [optional, key]: C, D(e, f) | Core: G | links: x ↕ y = z | external: AD'),
    [{ name: '독립', n: 2 }, { name: 'Integration', n: 2 }, { name: 'Core', n: 1 }]);
});

test('text-table: a body table warns above 7 rows, the sref appendix above 10; rows are `;`-separated', () => {
  const rows = (n) => Array.from({ length: n }, (_, i) => `항목${i + 1} · 설명(가; 나)`).join(' ; ');
  const fd = (n) => `columns: 항목, 설명 | rows: ${rows(n)}`;
  assert.match(countWarns('text-table', fd(8)), /^s1 \(text-table\): table has 8 rows \(>7\)/);
  assert.match(countWarns('text-table', fd(11)), /^s1 \(text-table\): table has 11 rows \(>7\)/); // the body limit, not the appendix one
  assert.doesNotMatch(countWarns('text-table', fd(7)), /rows/);
  assert.equal(tableRowCount(fd(12)), 12);
  const appendix = (n) => validatePlan(plan([sec(1, 'none'), `## 부록 — 용어\n- intent: i\n- shape: text-table\n- payload: p\n- figure-data: ${fd(n)}\n- source-span: docs/a.md L1\n`]));
  for (const n of [8, 10]) {
    const res = appendix(n); // an appendix table may run to 10 rows
    assert.equal(res.ok, true, res.errors.join('; '));
    assert.deepEqual(res.warnings, [], `${n} appendix rows`);
  }
  const over = appendix(11);
  assert.equal(over.ok, true, over.errors.join('; ')); // still only a warning
  assert.match(over.warnings.join('\n'), /^sref \(text-table\): appendix table has 11 rows \(>10\)/);
});

// ---- @limits-x: the machine-readable limits every countable template states beside its @limits prose ----

test('COUNT_LIMITS derives from @limits-x (a body table runs to 7 rows, an appendix table to 10)', () => {
  assert.deepEqual(COUNT_LIMITS, { goalsPerActor: 5, modulesPerLayer: 5, tableRows: 7, appendixTableRows: 10 });
  const by = Object.fromEntries(listTemplates().map(t => [t.meta.component, t.meta.limitsX]));
  assert.deepEqual(by.table, { columns: { min: 2, max: 4 }, rows: { min: 3, max: 7 }, 'appendix-rows': { min: 3, max: 10 } });
  assert.equal(by['use-case']['goals-per-actor'].max, COUNT_LIMITS.goalsPerActor);
  assert.equal(by['layer-map']['modules-per-layer'].max, COUNT_LIMITS.modulesPerLayer);
});

test('drift: every @limits-x range reads min–max in the template\'s @limits prose, every prose range is an @limits-x range, every key has a counter', () => {
  const NO_LIMITS_X = new Set(['callout']); // "섹션당 0–2" — a content aside, nothing to count in a figure-data
  const ids = new Set();
  for (const t of listTemplates()) {
    const id = t.meta.component;
    ids.add(id);
    const keys = Object.keys(t.meta.limitsX);
    if (NO_LIMITS_X.has(id)) { assert.deepEqual(keys, [], `${id} states no countable limit`); continue; }
    assert.ok(keys.length, `${id}: @limits-x is missing`);
    const prose = new Set([...(t.meta.limits || '').matchAll(/(\d+)[–-](\d+)/g)].map(m => `${m[1]}..${m[2]}`));
    const machine = new Set(Object.values(t.meta.limitsX).map(r => `${r.min}..${r.max}`));
    for (const r of machine) assert.ok(prose.has(r), `${id}: @limits-x range ${r} is not written ${r.replace('..', '–')} in @limits "${t.meta.limits}"`);
    for (const r of prose) assert.ok(machine.has(r), `${id}: @limits states ${r.replace('..', '–')} but no @limits-x key has it`);
    for (const key of keys) assert.equal(typeof COUNTERS[id]?.[key]?.count, 'function', `${id}: @limits-x key "${key}" has no counter in figure-counts.mjs`);
    for (const key of Object.keys(COUNTERS[id] || {})) assert.ok(key in t.meta.limitsX, `${id}: counter "${key}" has no @limits-x key`);
  }
  for (const id of Object.keys(COUNTERS)) assert.ok(ids.has(id), `figure-counts.mjs has counters for unknown component "${id}"`);
});

test('parseLimitsX: key=min..max tokens; malformed, inverted and repeated tokens throw', () => {
  assert.deepEqual(parseLimitsX('layers=2..5 modules-per-layer=1..5'), { layers: { min: 2, max: 5 }, 'modules-per-layer': { min: 1, max: 5 } });
  assert.deepEqual(parseLimitsX(undefined), {});
  for (const bad of ['layers=2-5', 'layers=5..2', 'layers=1..3 layers=1..4', 'Layers=1..2', 'layers=..3'])
    assert.throws(() => parseLimitsX(bad), /@limits-x/, bad);
});

// One at-limit and one over-limit figure-data per counter. gen(n) builds a figure-data holding n of the counted thing and
// nothing else over a limit; `who` is the warning's subject, `unit` its noun. A label starts with `component.key`.
const list = (n, f = (i) => `항목${i}`, sep = ', ') => Array.from({ length: n }, (_, i) => f(i + 1)).join(sep);
const CIRCLED = '①②③④⑤⑥⑦⑧';
const COUNT_CASES = [
  // [label, shape, gen(n), max, who, unit, warnings at max+1 (default 1)]
  ['activity.decisions', 'branching-flow', (n) => `start: 시작 | actions: 가 → 나 | decision: ${list(n, (i) => `질문${i}?`, ' ‖ ')} | outcomes: [예] 가(target), [아니오] 나(negative, 사유)`, 2, 'activity', 'decisions'],
  ['activity.outcomes', 'branching-flow', (n) => `start: 시작 | actions: 가 → 나 | decision: 질문? | outcomes: ${list(n, (i) => `[라벨${i}] 결말${i}(negative, 사유 ${i})`)}`, 5, 'activity', 'outcomes'],
  ['bar-chart.bars (a thousands comma is not a separator)', 'quantity', (n) => `bars: ${list(n, (i) => `항목${i}=1,${200 + i}`)} | unit?: 건`, 8, 'bar-chart', 'bars'],
  ['before-after.nodes-per-side (before side)', 'before-after', (n) => `before: ${list(n)} | after: 루트 / 가, 나`, 6, 'before side', 'nodes'],
  ['before-after.nodes-per-side (after side: the root before " / " is not one of them)', 'before-after', (n) => `before: 가, 나 | after: 루트 / ${list(n)}`, 6, 'after side', 'nodes'],
  ['before-after.tags-per-side', 'before-after', (n) => `before: 가, 나 | after: 루트 / 가, 나 | before-tags: ${list(n)}`, 3, 'before side', 'tags'],
  ['card-grid.items', 'peer-list', (n) => `items: ${list(n, (i) => `${i} · 제목${i} · 설명`, ' ; ')}`, 6, 'card-grid', 'cards'],
  ['class-diagram.children', 'code-structure', (n) => `parent: «interface» 기반(+메서드) | children: ${list(n, (i) => `하위${i}(+속성)`)}`, 4, 'class-diagram', 'child classes'],
  ['class-diagram.members-per-class', 'code-structure', (n) => `parent: «interface» 기반(+메서드) | children: 하위1(${list(n, (i) => `+멤버${i}`)}), 하위2(+속성)`, 4, 'class "하위1"', 'members'],
  ['decision-block.options', 'decision', (n) => `question: 질문 | options: ${list(n, (i) => `옵션${i}(+장점, −단점)`)} | recommend: 옵션1`, 3, 'decision-block', 'options'],
  ['decision-block.pros-cons', 'decision', (n) => `question: 질문 | options: A(${list(n, (i) => `+장점${i}`)}, −단점), B(+장점) | recommend: A`, 3, 'option "A" pros', 'lines'],
  ['decision-table.conditions', 'rule-table', (n) => `conditions: ${list(n)} | rules: 예 → 승인(positive) ; 아니오 → 반려(negative) ; — → 기록(neutral)`, 4, 'decision-table', 'condition columns'],
  ['decision-table.rules', 'rule-table', (n) => `conditions: 가, 나 | rules: ${list(n, (i) => `예/${i} → 결과${i}(neutral)`, ' ; ')}`, 7, 'decision-table', 'rules'],
  ['er-relations.entities', 'entity-relations', (n) => `entities: ${list(n, (i) => `E${i}(id, 이름)`)} | relations: A 1—N B "소유" [owned] · B 1—N C "연결" [link]`, 6, 'er-relations', 'entities'],
  ['er-relations.relations (counted by cardinality pairs, whatever separates them)', 'entity-relations', (n) => `entities: A, B | relations: ${list(n, (i) => `A${i} ${i % 2 ? '1—N' : '0..1—0..N'} B${i} "관계${i}" [owned]`, ' · ')}`, 7, 'er-relations', 'relations'],
  ['forbidden-path.allowed (the alternatives after the arrow)', 'forbidden-path', (n) => `allowed: 출발 → ${list(n, (i) => `대안${i}(이유, 둘)`)} | forbidden: 출발 ✕ 도착 (이유)`, 4, 'forbidden-path', 'allowed paths'],
  ['forbidden-path.forbidden', 'forbidden-path', (n) => `allowed: 출발 → 대안 | forbidden: ${list(n, (i) => `출발 ✕ 도착${i} (이유)`, ' ; ')}`, 2, 'forbidden-path', 'forbidden paths'],
  ['gantt.periods', 'schedule', (n) => `periods: ${list(n, (i) => `${i}월`)} | rows: 가 = 1–2 (core) ; 나 = 1–3 (planned) ; 다 = 2–3 (core)`, 12, 'gantt', 'period columns'],
  ['gantt.rows (`;` separated)', 'schedule', (n) => `periods: 1월, 2월, 3월 | rows: ${list(n, (i) => `작업${i} = 1–2 (core)`, ' ; ')}`, 8, 'gantt', 'rows'],
  ['gantt.rows (` · ` separated, counted by " = ")', 'schedule', (n) => `periods: 1월, 2월, 3월 | rows: ${list(n, (i) => `Core·작업${i} = 1–2 (core)`, ' · ')}`, 8, 'gantt', 'rows'],
  ['gantt.bars-per-row', 'schedule', (n) => `periods: 1월, 2월, 3월, 4월, 5월 | rows: 가 = 1–2 (legacy) ${'+ 3–4 (core) '.repeat(n - 1)}; 나 = 1–2 (core) ; 다 = 2–3 (core)`, 2, 'row "가"', 'bars'],
  ['hbar-chart.rows', 'progress', (n) => `rows: ${list(n, (i) => `항목${i}=${i * 10}`)}`, 8, 'hbar-chart', 'rows'],
  ['hub-spoke.spokes', 'hub', (n) => `hub: 허브(설명) | left: ${list(Math.min(n, 4))} | right: ${list(Math.max(0, n - 4))}`, 8, 'hub-spoke', 'spokes', 2], // 9 spokes cannot sit within 4 per side: the side limit warns too
  ['hub-spoke.spokes-per-side', 'hub', (n) => `hub: 허브(설명) | left: ${list(n, (i) => `대상${i}(연결)`)} | right: 가(연결)`, 4, 'left side', 'spokes'],
  ['kpi-row.tiles', 'headline-metric', (n) => `tiles: ${list(n, (i) => `라벨${i}=${i} 건 · 설명`, ' ; ')}`, 4, 'kpi-row', 'tiles'],
  ['layer-map.layers', 'layered-structure', (n) => `layers: ${list(n, (i) => `층${i}: 모듈`, ' ‖ ')} | links: a ↕ b = c`, 5, 'layer-map', 'layers'],
  ['matrix.columns', 'capability-matrix', (n) => `columns: ${list(n)} | rows: 가: ✓ ✕ ; 나: ✓ ✕ ; 다: — ✓`, 5, 'matrix', 'columns'],
  ['matrix.rows', 'capability-matrix', (n) => `columns: 가, 나 | rows: ${list(n, (i) => `행${i}: ✓ ✕`, ' ; ')}`, 7, 'matrix', 'rows'],
  ['pipeline.stages', 'data-flow', (n) => `stages: ${list(n, (i) => `단계${i}[노드 A, 노드 B [planned]]`, ' → ')}`, 5, 'pipeline', 'stages'],
  ['pipeline.nodes-per-stage', 'data-flow', (n) => `stages: 입력[${list(n, (i) => `노드${i}(설명, 둘)`)}] → 처리[가] → 출력[나]`, 4, 'stage "입력"', 'nodes'],
  ['process-row.steps (an arrow inside a parenthesis is not a step)', 'linear-steps', (n) => `steps: ${list(n, (i) => `${i} 단계${i}(설명 → 보충)`, ' → ')}`, 5, 'process-row', 'steps'],
  ['risk-matrix.risks', 'risk', (n) => `risks: ${list(n, (i) => `R${i} 위험${i} (가능성 상, 영향 중) → 대응(R1과 같이)`, ' ; ')}`, 7, 'risk-matrix', 'risks'],
  ['screen-map.regions (the numbered markers)', 'ui-surface', (n) => `layout: page | regions: ${list(n, (i) => `${CIRCLED[i - 1]}영역${i}: 일`, ' ')}`, 6, 'screen-map', 'regions'],
  ['sequence.participants', 'interaction', (n) => `participants: ${list(n)} | messages: 항목1→항목2 요청 · 항목2⇢항목1 응답 · 항목1→항목2 다시`, 5, 'sequence', 'participants'],
  ['sequence.messages (one arrow per message, none counted inside a parenthesis)', 'interaction', (n) => `participants: A, B | messages: ${list(n, (i) => `A→B 요청${i}(a → b)`, ' · ')}`, 10, 'sequence', 'messages'],
  ['sequence.groups', 'interaction', (n) => `participants: A, B | messages: A→B 요청 · B⇢A 응답 · A→B 다시 | alt: ${list(n, (i) => `조건${i} = ${i}`, ' · ')}`, 2, 'sequence', 'ALT/OPT groups'],
  ['stacked-bar.parts', 'share', (n) => `parts: ${list(n, (i) => `구간${i}=10%`)}`, 5, 'stacked-bar', 'parts'],
  ['state-machine.main-states (● ◉ and the (전이) labels are not states)', 'lifecycle', (n) => `states: 가, 나 | main: ● → ${list(n, (i) => `상태${i}`, ' →(전이) ')} → ◉`, 5, 'state-machine', 'main-path states'],
  ['state-machine.other-transitions', 'lifecycle', (n) => `states: 가, 나 | main: ● → 가 →(전이) 나 →(전이) 다 → ◉ | other: ${list(n, (i) => `가 →(전이) 상태${i}[retry]`, ' · ')}`, 5, 'state-machine', 'other transitions'],
  ['status-board.rows', 'status', (n) => `rows: ${list(n, (i) => `작업${i}(담당) · 정상 · 50% · 메모`, ' ; ')}`, 7, 'status-board', 'rows'],
  ['swimlane.lanes', 'role-handoff', (n) => `lanes: ${list(n)} | steps: 항목1:단계 → 항목2:단계 → 항목1:끝`, 5, 'swimlane', 'lanes'],
  ['swimlane.steps (→, →[라벨], →(라벨) and ↓ all separate steps)', 'role-handoff', (n) => `lanes: 가, 나 | steps: ${list(n, (i) => `${i % 2 ? '가' : '나'}:단계${i}(a → b)`, ' →[예] ').replace(/→\[예\]/g, (m, off) => ['→[예]', '→(알림)', '↓', '→'][off % 4])}`, 8, 'swimlane', 'steps'],
  ['table.columns', 'text-table', (n) => `columns: ${list(n)} | rows: ${list(3, (i) => `값${i} · 값`, ' ; ')}`, 4, 'table', 'columns'],
  ['timeline.items', 'milestones', (n) => `items: ${list(n, (i) => `${i}월 · 제목${i} · 설명 · done`, ' ; ')}`, 8, 'timeline', 'items'],
  ['tree.children', 'hierarchy', (n) => `root: 루트 | children: ${list(n, (i) => `하위${i}[잎, 잎 [planned]]`)}`, 5, 'tree', 'children'],
  ['tree.leaves-per-child (the [planned] group is not the leaf group)', 'hierarchy', (n) => `root: 루트 | children: 가 [planned][${list(n, (i) => `잎${i}(설명, 둘)`)}], 나[잎 [planned]]`, 6, '"가"', 'leaves'],
  ['use-case.actors', 'actor-goals', (n) => `system: 도구 | actors: ${list(n, (i) => `행위자${i}: 목표`, ' ‖ ')}`, 4, 'use-case', 'actors'],
];
// counted by their own tests above: use-case goals-per-actor, layer-map modules-per-layer, table rows / appendix-rows
const COUNTED_ELSEWHERE = ['use-case.goals-per-actor', 'layer-map.modules-per-layer', 'table.rows', 'table.appendix-rows'];

test('every @limits-x counter: max items pass, max+1 warns once with its subject and unit', () => {
  const warnsOf = (shape, fd) => {
    const res = validatePlan(plan([sec(1, shape, fd)]));
    assert.equal(res.ok, true, `${shape}: ${fd}\n${res.errors.join('; ')}`); // a count is only ever a warning
    return res.warnings.filter(w => /\(>\d+\)/.test(w));
  };
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&');
  for (const [label, shape, gen, max, who, unit, total = 1] of COUNT_CASES) {
    assert.deepEqual(warnsOf(shape, gen(max)), [], `${label}: ${max} must pass`);
    const over = warnsOf(shape, gen(max + 1));
    assert.equal(over.length, total, `${label}: ${max + 1} must warn ${total}x, got ${JSON.stringify(over)}`);
    assert.match(over[0], new RegExp(`^s1 \\(${shape}\\): ${esc(who)} has ${max + 1} ${esc(unit)} \\(>${max}\\) — `), label);
  }
  // every counter is exercised by a case, and the case's limit is the template's @limits-x max
  const limits = Object.fromEntries(listTemplates().map(t => [t.meta.component, t.meta.limitsX]));
  const cased = new Set();
  for (const [label, , , max] of COUNT_CASES) {
    const [id, key] = label.split(/[ (]/)[0].split('.');
    cased.add(`${id}.${key}`);
    assert.equal(limits[id][key].max, max, `${label}: the case's max is not ${id}.${key}'s @limits-x max`);
  }
  const all = Object.entries(COUNTERS).flatMap(([id, keys]) => Object.keys(keys).map(k => `${id}.${k}`));
  assert.deepEqual(all.filter(k => !cased.has(k) && !COUNTED_ELSEWHERE.includes(k)), [], 'counters with no at-limit / over-limit case');
});

test('tree: a child with 7 leaves warns by name (6 pass), and it is still only a warning', () => {
  const tree = (n) => `root: 플랫폼 | children: 분석 공간[${list(n)}], 운영 콘솔 공간[관리·감사]`;
  const res = validatePlan(plan([sec(1, 'hierarchy', tree(7))]));
  assert.equal(res.ok, true);
  assert.match(res.warnings.join('\n'), /^s1 \(hierarchy\): "분석 공간" has 7 leaves \(>6\) — tree shows 0–6 per child; /);
  assert.deepEqual(validatePlan(plan([sec(1, 'hierarchy', tree(6))])).warnings, []);
});

test('the shipped example plan stays quiet on the countable limits', () => {
  const repo = fileURLToPath(new URL('../../../', import.meta.url));
  const warnsFor = (rel) => validatePlan(readFileSync(join(repo, rel), 'utf8'), { planDir: join(repo, rel, '..') }).warnings.filter(w => /\(>\d+\)/.test(w));
  assert.deepEqual(warnsFor('examples/feedbackops-light-brief/content-plan.md'), []);
});

test('CLI prints warnings after OK, non-blocking', () => {
  const r = runCli(fixture('plan-executive.md'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /content-plan OK[\s\S]*WARN  executive plan/);
});

test('CLI resolves a pitch plan\'s facts file relative to the plan', () => {
  assert.equal(runCli(fixture('plan-pitch-facts.md')).status, 0);
  const r = runCli(fixture('plan-pitch-no-facts.md'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /facts/);
});

test('the worked example plan (with its header keys) is valid against the real component library', () => {
  const md = read('example-brief/content-plan.md');
  const res = validatePlan(md, { planDir });
  assert.equal(res.ok, true, res.errors.join('; '));
  assert.deepEqual(parsePlan(md).sections.map(s => s.id), ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 'sref']);
});

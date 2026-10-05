import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePlan, parsePlan, parseCoverTokens } from '../plan-schema.mjs';
import { listTemplates } from '../components.mjs';

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

test('executive plans with more than 7 numbered sections warn; non-executive plans do not', () => {
  const many = (over) => plan(Array.from({ length: 8 }, (_, i) => sec(i + 1, i === 0 || i === 7 ? 'decision' : 'peer-list', i === 0 || i === 7 ? 'question: 승인?' : 'none')), over);
  assert.match(validatePlan(many({ audience: 'executive' }), { templates: [...templates, ...synthDecision()] }).warnings.join('\n'), /8 numbered sections \(>7\)/);
  assert.doesNotMatch(validatePlan(many({}), { templates: [...templates, ...synthDecision()] }).warnings.join('\n'), />7/);
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, chmodSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasHeadlessChrome, sidecarByteIdentical, styleInputs, gateOptions, collectCompositionWarnings } from '../verify-doc.mjs';

const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const CLI = fileURLToPath(new URL('../verify-doc.mjs', import.meta.url));
const STYLE = 'feedbackops-light';
const ACCENT = '#1428A0';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));

const tmp = (prefix = 'vd-') => mkdtempSync(join(tmpdir(), prefix));
const run = (args, env = {}) => {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (e) { return { status: e.status, stdout: e.stdout || '', stderr: e.stderr || '' }; }
};
const lines = (s) => s.trim().split('\n');

// A doc dir holding `html` plus the style's canonical support.js (so sidecar-present passes).
function docDir(html, style = STYLE) {
  const dir = tmp();
  writeFileSync(join(dir, 'doc.dc.html'), html);
  copyFileSync(join(REPO, 'styles', style, 'support.js'), join(dir, 'support.js'));
  return { dir, doc: join(dir, 'doc.dc.html'), support: join(REPO, 'styles', style, 'support.js') };
}
const GOOD = `<!DOCTYPE html><html><head><style>body { word-break: keep-all; }</style></head><body><i style="color:${ACCENT}"></i><section id="s1"><h2>x</h2></section></body></html>`;

test('capability check returns a boolean and never throws', () => {
  assert.equal(typeof hasHeadlessChrome(), 'boolean');
});

test('sidecar byte-check is false when file absent', () => {
  assert.equal(sidecarByteIdentical('/nonexistent', '/also/nope'), false);
});

test('CHROME_PATH is honored first; a missing path falls through to PATH discovery', () => {
  const old = { c: process.env.CHROME_PATH, p: process.env.PATH };
  try {
    process.env.PATH = '/nonexistent-dir';
    delete process.env.CHROME_PATH;
    assert.equal(hasHeadlessChrome(), false);
    process.env.CHROME_PATH = process.execPath;
    assert.equal(hasHeadlessChrome(), true);
    process.env.CHROME_PATH = '/no/such/chrome';
    assert.equal(hasHeadlessChrome(), false);
  } finally {
    old.c === undefined ? delete process.env.CHROME_PATH : (process.env.CHROME_PATH = old.c);
    process.env.PATH = old.p;
  }
});

test('styleInputs: accent, palette (every hex of design.md) and figure-panel colors come from the style', () => {
  const st = styleInputs(STYLE);
  assert.equal(st.accent, ACCENT);
  assert.ok(st.paletteHexes.map(h => h.toUpperCase()).includes(ACCENT));
  assert.ok(st.paletteHexes.length > 10);
  assert.deepEqual(st.panel, { bg: '#f7fafe', border: '#dfe7f3' });
  assert.equal(styleInputs('indigo-serif').panel.bg, '#fafbfe');
  assert.throws(() => styleInputs('nope'), /unknown style "nope" \(have: .*feedbackops-light/);
});

test('gateOptions: --style supplies accent + palette; --accent wins; a plan adds plan text and its facts file', () => {
  const sidecarPresent = true;
  const a = gateOptions({ sidecarPresent, style: STYLE });
  assert.equal(a.accentHex, ACCENT);
  assert.ok(a.paletteHexes.length > 10);
  assert.equal(gateOptions({ sidecarPresent, style: STYLE, accent: '#111111' }).accentHex, '#111111');
  const noStyle = gateOptions({ sidecarPresent, accent: '#111111' });
  assert.equal(noStyle.paletteHexes, undefined);
  assert.equal(noStyle.plan, undefined);
  const withFacts = gateOptions({ sidecarPresent, style: STYLE, planPath: fx('plan-pitch-facts.md') });
  assert.equal(withFacts.plan.sections.length, 2);
  assert.match(withFacts.planText, /doc-type: pitch/);
  assert.match(withFacts.factsText, /F01/);
  assert.equal(withFacts.factsError, undefined);
  const dir = tmp();
  writeFileSync(join(dir, 'plan.md'), readFileSync(fx('plan-pitch-facts.md'), 'utf8').replace('facts-sample.md', 'gone.md'));
  const gone = gateOptions({ sidecarPresent, style: STYLE, planPath: join(dir, 'plan.md') });
  assert.match(gone.factsError, /facts file named by the plan header cannot be read: .*gone\.md/);
  rmSync(dir, { recursive: true, force: true });
});

test('CLI: usage error (exit 2) without a doc, without --canonical-support, or with neither --accent nor --style; unknown style', () => {
  const { dir, doc, support } = docDir(GOOD);
  for (const args of [[], [doc], [doc, '--canonical-support', support]]) {
    const r = run(args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /usage: node verify-doc\.mjs .*--style <id>.*--accent <hex>/);
  }
  const bad = run([doc, '--canonical-support', support, '--style', 'nope']);
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /unknown style "nope"/);
  rmSync(dir, { recursive: true, force: true });
});

test('CLI: --style alone is enough; the LAST line is `GATE PASSED (k/k checks)` (exit 0)', () => {
  const { dir, doc, support } = docDir(GOOD);
  const r = run([doc, '--canonical-support', support, '--style', STYLE, '--no-visual']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const out = lines(r.stdout);
  assert.match(out.at(-1), /^GATE PASSED \((\d+)\/\1 checks\)$/);
  assert.match(r.stdout, /^PASS {2}palette/m);
  assert.match(r.stdout, /^PASS {2}no-role-placeholders/m);
  assert.match(r.stdout, /VISUAL: skipped/);
  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a failing check makes the last line `GATE FAILED (j/k checks)` and exits 1, on stdout', () => {
  const { dir, doc, support } = docDir(GOOD.replace('word-break: keep-all;', '').replace(ACCENT, '#123456'));
  const r = run([doc, '--canonical-support', support, '--style', STYLE]);
  assert.equal(r.status, 1);
  const out = lines(r.stdout);
  assert.match(out.at(-1), /^GATE FAILED \((\d+)\/(\d+) checks\)$/);
  const [, j, k] = out.at(-1).match(/\((\d+)\/(\d+)/);
  assert.ok(Number(j) < Number(k));
  assert.match(r.stdout, /^FAIL {2}keep-all/m);
  assert.match(r.stdout, /^FAIL {2}palette {2}1 color\(s\) not in the style's design\.md: #123456/m);
  assert.doesNotMatch(r.stdout, /VISUAL/); // no browser tier on a failed structural gate
  rmSync(dir, { recursive: true, force: true });
});

test('CLI: --plan adds plan-alignment, plan-shapes and numbers-traced (a document number absent from the plan fails)', () => {
  const { dir, doc, support } = docDir(GOOD.replace('<h2>x</h2></section>', '<h2>x</h2></section><section id="s2"><p>지연 77분</p></section>'));
  const r = run([doc, '--canonical-support', support, '--style', STYLE, '--plan', fx('plan-valid.md'), '--no-visual']);
  assert.match(r.stdout, /^PASS {2}plan-alignment/m);
  assert.match(r.stdout, /^FAIL {2}plan-shapes/m); // s1/s2 carry no component
  assert.match(r.stdout, /^FAIL {2}numbers-traced {2}1 number\(s\) not in the plan or facts: 77 …지연 77분…/m);
  assert.match(lines(r.stdout).at(-1), /^GATE FAILED/);
  rmSync(dir, { recursive: true, force: true });
});

test('CLI: a facts file with a T table turns on terms-consistent (pass / banned variant fails); prose rows are WARN and never fail', () => {
  const ok = docDir(readFileSync(fx('doc-terms-ok.dc.html'), 'utf8'));
  const pass = run([ok.doc, '--canonical-support', ok.support, '--style', STYLE, '--plan', fx('plan-terms.md'), '--no-visual']);
  assert.equal(pass.status, 0, pass.stdout + pass.stderr);
  assert.match(pass.stdout, /^PASS {2}terms-consistent/m);
  assert.match(lines(pass.stdout).at(-1), /^GATE PASSED \((\d+)\/\1 checks\)$/);
  const bad = docDir(readFileSync(fx('doc-terms-banned.dc.html'), 'utf8').replace('<p>태스크가', `<p>${'가'.repeat(120)}. 시범을 제안합니다. 태스크가`));
  const fail = run([bad.doc, '--canonical-support', bad.support, '--style', STYLE, '--plan', fx('plan-terms.md'), '--no-visual']);
  assert.equal(fail.status, 1);
  assert.match(fail.stdout, /^FAIL {2}terms-consistent {2}2 banned variant\(s\) in the body: s2 "태스크" \(use 작업\)/m);
  assert.match(fail.stdout, /^WARN {2}prose:long-sentence {2}1 of \d+ sentence\(s\) over 110 characters/m);
  assert.match(fail.stdout, /^WARN {2}prose:register {2}1 polite ending\(s\)/m);
  assert.match(lines(fail.stdout).at(-1), /^GATE FAILED/);
  rmSync(ok.dir, { recursive: true, force: true });
  rmSync(bad.dir, { recursive: true, force: true });
});

test('CLI: without a T table the gate prints a NOTE (not a failure); without --plan the NOTE names terms-consistent too', () => {
  const dir = tmp();
  writeFileSync(join(dir, 'facts-terms.md'), readFileSync(fx('facts-terms.md'), 'utf8').replace(/## T — 용어[\s\S]*?(?=## Q)/, ''));
  writeFileSync(join(dir, 'plan.md'), readFileSync(fx('plan-terms.md'), 'utf8'));
  const d = docDir(readFileSync(fx('doc-terms-banned.dc.html'), 'utf8'));
  const r = run([d.doc, '--canonical-support', d.support, '--style', STYLE, '--plan', join(dir, 'plan.md'), '--no-visual']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^NOTE {2}terms-consistent {2}not checked — the facts file has no "## T — 용어" table/m);
  assert.doesNotMatch(r.stdout, /terms-consistent {2}\d+ banned/);
  const noPlan = run([d.doc, '--canonical-support', d.support, '--style', STYLE, '--no-visual']);
  assert.match(noPlan.stdout, /^NOTE {2}plan-shapes, numbers-traced, terms-consistent {2}not checked/m);
  rmSync(dir, { recursive: true, force: true });
  rmSync(d.dir, { recursive: true, force: true });
});

// ---- visual tier ----

// A stub "browser": records its argv, then dies — enough to see flags and the UNVERIFIED path.
function stubBrowser(dir) {
  const out = join(dir, 'argv.txt');
  const bin = join(dir, 'fake-chrome');
  writeFileSync(bin, `#!/bin/sh\necho "$@" > "${out}"\nexit 1\n`);
  chmodSync(bin, 0o755);
  return { bin, out };
}

test('visual tier: when every viewport fails the line is VISUAL: UNVERIFIED (reason), never "non-blocking"; the gate still passes', () => {
  const { dir, doc, support } = docDir(GOOD);
  const { bin } = stubBrowser(dir);
  const r = run([doc, '--canonical-support', support, '--style', STYLE], { CHROME_PATH: bin });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^VISUAL: UNVERIFIED \(1366x768: browser exited at startup \(code 1\) ; 1440x900: browser exited at startup/m);
  assert.doesNotMatch(r.stdout, /non-blocking/);
  assert.match(lines(r.stdout).at(-1), /^GATE PASSED/);
  rmSync(dir, { recursive: true, force: true });
});

test('visual tier: no browser at all → VISUAL: UNVERIFIED (no headless browser …)', () => {
  const { dir, doc, support } = docDir(GOOD);
  const r = run([doc, '--canonical-support', support, '--style', STYLE], { CHROME_PATH: '', PATH: '/nonexistent-dir' });
  assert.match(r.stdout, /^VISUAL: UNVERIFIED \(no headless browser/m);
  rmSync(dir, { recursive: true, force: true });
});

test('visual tier: --no-sandbox is passed exactly when running as root', async () => {
  const { dir, doc } = docDir(GOOD);
  const { bin, out } = stubBrowser(dir);
  const old = process.env.CHROME_PATH;
  process.env.CHROME_PATH = bin;
  try { await collectCompositionWarnings(doc); } finally { old === undefined ? delete process.env.CHROME_PATH : (process.env.CHROME_PATH = old); }
  const argv = readFileSync(out, 'utf8');
  assert.equal(argv.includes('--no-sandbox'), process.getuid?.() === 0);
  assert.match(argv, /--headless=new/);
  rmSync(dir, { recursive: true, force: true });
});

// Needs a working headless browser (CHROME_PATH or PATH); skipped otherwise. The page is plain HTML so no network is needed.
test('visual tier: the figure-panel colors come from the active style, not hardcoded indigo values', async (t) => {
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const dir = tmp();
  const doc = join(dir, 'doc.dc.html');
  writeFileSync(doc, `<!DOCTYPE html><html><body><section id="s1"><h2>workflow diagram</h2>
    <div style="display:grid; height:140px; background:#F7FAFE; border:1px solid #DFE7F3;"><div>a</div></div></section></body></html>`);
  const light = await collectCompositionWarnings(doc, styleInputs('feedbackops-light').panel);
  const indigo = await collectCompositionWarnings(doc, styleInputs('indigo-serif').panel);
  rmSync(dir, { recursive: true, force: true });
  if (light.unverified) return t.skip(`browser cannot analyze here: ${light.unverified}`);
  assert.equal(light.warnings.some(w => w.name === 'composition:missing-primary-figure'), false);
  assert.equal(indigo.warnings.some(w => w.name === 'composition:missing-primary-figure'), true);
});

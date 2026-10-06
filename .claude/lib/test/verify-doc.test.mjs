import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, chmodSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasHeadlessChrome, sidecarByteIdentical, styleInputs, gateOptions, collectCompositionWarnings, localAssetFor, resolveLocalAssets } from '../verify-doc.mjs';
import { listStyles } from '../components.mjs';

const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const CLI = fileURLToPath(new URL('../verify-doc.mjs', import.meta.url));
const STYLE = 'feedbackops-light';
const ACCENT = '#1428A0';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));

const tmp = (prefix = 'vd-') => mkdtempSync(join(tmpdir(), prefix));
// DC_LOCAL_ASSETS is blanked so a shell that exports it cannot change what a test sees; tests set it explicitly.
const run = (args, env = {}) => {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DC_LOCAL_ASSETS: '', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
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

test('styleInputs / gateOptions: the style\'s zone roles (accent family vs warn/slate fills) reach the gate; --accent alone carries none', () => {
  const roles = styleInputs(STYLE).zoneRoles;
  assert.equal(roles.accent, ACCENT);
  assert.ok(roles.accentFamily.has('#E7EFFC') && roles.problem.has('#B2202B') && roles.problem.has('#94A3B8')); // accent-050 · warn · slate
  assert.equal(gateOptions({ sidecarPresent: true, style: STYLE }).zoneRoles.accent, ACCENT);
  assert.equal(gateOptions({ sidecarPresent: true, accent: '#111111' }).zoneRoles, undefined);
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

test('CLI: chart-proportions and zone-colors fail the gate (exit 1) on a wrong bar and on the accent inside an AS-IS zone; the same figures drawn right pass', () => {
  const bars = (h) => `<div data-component="bar-chart" style="overflow-wrap:anywhere;"><div style="height:100%;" data-value="100"><span>100</span></div><div style="height:${h}%;" data-value="70"><span>70</span></div></div>`;
  const zone = (color) => `<div data-component="before-after"><div data-zone="as-is"><b style="color:${color};">현재</b></div><div data-zone="to-be"><i style="background:${ACCENT};">목표</i></div></div>`;
  const gate = (body) => {
    const { dir, doc, support } = docDir(GOOD.replace('</body>', `${body}</body>`));
    const r = run([doc, '--canonical-support', support, '--style', STYLE, '--no-visual']);
    rmSync(dir, { recursive: true, force: true });
    return r;
  };
  const ok = gate(bars(70) + zone('#475467'));
  assert.equal(ok.status, 0, ok.stdout);
  assert.match(ok.stdout, /^PASS {2}chart-proportions {2}1 chart\(s\), 2 value\(s\) drawn at the size they show$/m);
  assert.match(ok.stdout, /^PASS {2}zone-colors {2}2 zone\(s\) checked$/m);
  const bad = gate(bars(40) + zone(ACCENT));
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /^FAIL {2}chart-proportions {2}1 disagreement\(s\): bar-chart#1 bar 2 "70": height 40% but 70 of max 100 is 70%/m);
  assert.match(bad.stdout, /^FAIL {2}zone-colors {2}1 zone\(s\) break the AS-IS \/ TO-BE color split: before-after#1 as-is zone uses the accent #1428A0/m);
  assert.match(lines(bad.stdout).at(-1), /^GATE FAILED/);
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

// A stub "browser": appends its argv (one line per launch), then dies — enough to see flags and the UNVERIFIED path.
function stubBrowser(dir) {
  const out = join(dir, 'argv.txt');
  const bin = join(dir, 'fake-chrome');
  writeFileSync(bin, `#!/bin/sh\necho "$@" >> "${out}"\nexit 1\n`);
  chmodSync(bin, 0o755);
  return { bin, out };
}

test('visual tier: when every viewport fails the line is VISUAL: UNVERIFIED (reason), never "non-blocking"; the gate still passes', () => {
  const { dir, doc, support } = docDir(GOOD);
  const { bin } = stubBrowser(dir);
  const r = run([doc, '--canonical-support', support, '--style', STYLE], { CHROME_PATH: bin });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^VISUAL: UNVERIFIED \(1366x768: browser exited at startup \(code 1\) ; 1440x900: browser exited at startup \(code 1\) ; 390x844: browser exited at startup/m);
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

test('visual tier: three viewports — 1366x768, 1440x900 and the 390x844 narrow probe, in that order', async () => {
  const { dir, doc } = docDir(GOOD);
  const { bin, out } = stubBrowser(dir);
  const old = process.env.CHROME_PATH;
  process.env.CHROME_PATH = bin;
  try { await collectCompositionWarnings(doc); } finally { old === undefined ? delete process.env.CHROME_PATH : (process.env.CHROME_PATH = old); }
  const sizes = [...readFileSync(out, 'utf8').matchAll(/--window-size=(\d+,\d+)/g)].map(m => m[1]);
  assert.deepEqual(sizes, ['1366,768', '1440,900', '390,844']);
  rmSync(dir, { recursive: true, force: true });
});

// ---- local assets ----

// <dir>/node_modules with the files a document asks the CDNs for (plus a secret one level above node_modules).
function assetsDir() {
  const dir = tmp('vd-assets-');
  const put = (rel, body = 'x') => { mkdirSync(join(dir, 'node_modules', rel, '..'), { recursive: true }); writeFileSync(join(dir, 'node_modules', rel), body); };
  put('react/umd/react.production.min.js');
  put('react/package.json', '{"version":"18.3.1"}');
  put('@babel/standalone/babel.min.js');
  put('pretendard/dist/web/static/pretendard.css');
  put('pretendard/dist/web/static/woff2/Pretendard-Regular.woff2');
  writeFileSync(join(dir, 'secret.txt'), 'outside node_modules');
  return dir;
}

test('localAssetFor: unpkg and jsdelivr URLs map onto <dir>/node_modules (scoped names, gh/ repos, .min.css fallback)', () => {
  const dir = assetsDir();
  const nm = (rel) => join(dir, 'node_modules', rel);
  const react = { file: nm('react/umd/react.production.min.js'), pkg: 'react', ver: '18.3.1' };
  assert.deepEqual(localAssetFor('https://unpkg.com/react@18.3.1/umd/react.production.min.js', dir), react);
  assert.deepEqual(localAssetFor('https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js', dir), react);
  assert.deepEqual(localAssetFor('https://unpkg.com/@babel/standalone@7.26.4/babel.min.js', dir), { file: nm('@babel/standalone/babel.min.js'), pkg: '@babel/standalone', ver: '7.26.4' });
  const font = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static';
  assert.deepEqual(localAssetFor(`${font}/pretendard.min.css`, dir), { file: nm('pretendard/dist/web/static/pretendard.css'), pkg: 'pretendard', ver: 'v1.3.9' });
  assert.equal(localAssetFor(`${font}/woff2/Pretendard-Regular.woff2?v=1`, dir).file, nm('pretendard/dist/web/static/woff2/Pretendard-Regular.woff2'));
  assert.equal(localAssetFor('https://unpkg.com/react/umd/react.production.min.js', dir).ver, ''); // unversioned URL
  rmSync(dir, { recursive: true, force: true });
});

test('localAssetFor: null for hosts that are not CDNs, 404 for misses and for any path that leaves the package', () => {
  const dir = assetsDir();
  for (const url of ['https://example.com/react@18.3.1/umd/react.production.min.js', 'https://fonts.googleapis.com/css2?family=Inter', 'http://127.0.0.1:1/x.js', 'not a url'])
    assert.equal(localAssetFor(url, dir), null, url);
  for (const url of [
    'https://unpkg.com/react@18.3.1/umd/missing.js', 'https://unpkg.com/left-pad@1.0.0/index.js', 'https://unpkg.com/react@18.3.1/', 'https://unpkg.com/react@18.3.1',
    'https://cdn.jsdelivr.net/gh/orioncactus', 'https://cdn.jsdelivr.net/combine/npm/react', 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/nope.css',
  ]) assert.deepEqual(localAssetFor(url, dir), { status: 404 }, url);
  // traversal: encoded separators, encoded dots, a package named `..`, and a literal ../ (the URL parser folds it to another package)
  for (const url of [
    'https://unpkg.com/react@18.3.1/umd/..%2F..%2F..%2Fsecret.txt', 'https://unpkg.com/react@18.3.1/%2e%2e/%2e%2e/secret.txt',
    'https://unpkg.com/react@18.3.1/umd/..%5C..%5C..%5Csecret.txt', 'https://unpkg.com/..@1/secret.txt', 'https://unpkg.com/%2e%2e@1/secret.txt',
    'https://unpkg.com/@../standalone@1/secret.txt', 'https://unpkg.com/react@18.3.1/../../secret.txt',
    'https://cdn.jsdelivr.net/gh/o/..@1/secret.txt', 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/..%2F..%2F..%2Fsecret.txt',
  ]) assert.deepEqual(localAssetFor(url, dir), { status: 404 }, url);
  rmSync(dir, { recursive: true, force: true });
});

test('--local-assets / DC_LOCAL_ASSETS: the flag wins over the env var; empty env = unset; a missing directory (either source) throws', () => {
  const a = tmp('vd-a-'), b = tmp('vd-b-');
  const gone = join(a, 'no-such-dir');
  assert.equal(resolveLocalAssets(['--local-assets', a], { DC_LOCAL_ASSETS: b }), resolve(a));
  assert.equal(resolveLocalAssets([], { DC_LOCAL_ASSETS: b }), resolve(b));
  assert.equal(resolveLocalAssets([], {}), undefined);
  assert.equal(resolveLocalAssets([], { DC_LOCAL_ASSETS: '' }), undefined);
  assert.equal(resolveLocalAssets(['--local-assets', a], { DC_LOCAL_ASSETS: gone }), resolve(a)); // a bad env value is not looked at when the flag is given
  assert.throws(() => resolveLocalAssets(['--local-assets', gone], { DC_LOCAL_ASSETS: b }), /--local-assets directory does not exist: .*no-such-dir/);
  assert.throws(() => resolveLocalAssets([], { DC_LOCAL_ASSETS: gone }), /DC_LOCAL_ASSETS directory does not exist/);
  writeFileSync(join(a, 'file.txt'), 'x');
  assert.throws(() => resolveLocalAssets(['--local-assets', join(a, 'file.txt')], {}), /directory does not exist/); // a file is not a directory
  assert.throws(() => resolveLocalAssets(['--local-assets'], {}), /--local-assets needs a directory/);
  assert.throws(() => resolveLocalAssets(['--local-assets', '--no-visual'], {}), /--local-assets needs a directory/);
  rmSync(a, { recursive: true, force: true });
  rmSync(b, { recursive: true, force: true });
});

test('CLI: a --local-assets / DC_LOCAL_ASSETS directory that does not exist exits 2 with the usage text, before the gate runs; the flag beats the env var', () => {
  const { dir, doc, support } = docDir(GOOD);
  const good = tmp('vd-good-');
  const gone = join(good, 'no-such-dir');
  const base = [doc, '--canonical-support', support, '--style', STYLE, '--no-visual'];
  const byFlag = run([...base, '--local-assets', gone]);
  assert.equal(byFlag.status, 2);
  assert.match(byFlag.stderr, /--local-assets directory does not exist: .*no-such-dir/);
  assert.match(byFlag.stderr, /usage: node verify-doc\.mjs .*\[--local-assets <dir>\]/);
  assert.equal(byFlag.stdout, ''); // no gate output
  const byEnv = run(base, { DC_LOCAL_ASSETS: gone });
  assert.equal(byEnv.status, 2);
  assert.match(byEnv.stderr, /DC_LOCAL_ASSETS directory does not exist/);
  assert.equal(run([...base, '--local-assets']).status, 2); // flag without a value
  const flagWins = run([...base, '--local-assets', good], { DC_LOCAL_ASSETS: gone });
  assert.equal(flagWins.status, 0, flagWins.stdout + flagWins.stderr);
  assert.match(lines(flagWins.stdout).at(-1), /^GATE PASSED/);
  rmSync(dir, { recursive: true, force: true });
  rmSync(good, { recursive: true, force: true });
});

// A browser that cannot start at all (as opposed to one that rendered nothing) must skip, not fail, the browser-gated tests.
const browserDead = (res) => !res || /cannot start browser|browser exited at startup|CDP timeout|timed out/.test(res.unverified || '');
const wrap = (body) => `<!DOCTYPE html><html><body style="margin:0">${body}</body></html>`;
async function analyze(html, options) {
  const dir = tmp();
  const doc = join(dir, 'doc.dc.html');
  writeFileSync(doc, html);
  try { return await collectCompositionWarnings(doc, undefined, options); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Needs a working headless browser; the document and the "CDN" are local files, so no network is needed.
test('visual tier: --local-assets answers CDN requests from <dir>/node_modules and fails Google Fonts fast (event subscription + Fetch interception)', async (t) => {
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const assets = tmp('vd-assets-');
  mkdirSync(join(assets, 'node_modules', 'probe'), { recursive: true });
  writeFileSync(join(assets, 'node_modules', 'probe', 'p.js'), `document.body.insertAdjacentHTML('beforeend', '<section id="probed"><h2>workflow</h2></section>');`);
  // `probe` is no real package: only the interception can make this section appear
  const res = await analyze(wrap(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><script src="https://unpkg.com/probe@1.0.0/p.js"></script>`), { localAssets: assets });
  rmSync(assets, { recursive: true, force: true });
  if (browserDead(res)) return t.skip(`browser cannot run here: ${res?.unverified}`);
  assert.equal(res.unverified, null);
  assert.ok(res.warnings.some(w => w.name === 'composition:section-metrics' && /^probed /.test(w.detail)), 'the script served from <dir>/node_modules ran');
  assert.ok(res.assetNotes.some(n => n.name === 'local-assets' && /fonts\.googleapis\.com blocked/.test(n.detail)));
  assert.deepEqual(res.assetNotes.filter(n => n.name.startsWith('local-assets:')), []); // nothing missed, no version mismatch
});

test('visual tier: a CDN file missing under --local-assets, and a package installed at another version, are reported (and a page that renders nothing is UNVERIFIED)', async (t) => {
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const assets = tmp('vd-assets-');
  mkdirSync(join(assets, 'node_modules', 'probe'), { recursive: true });
  writeFileSync(join(assets, 'node_modules', 'probe', 'p.js'), '/* served */');
  writeFileSync(join(assets, 'node_modules', 'probe', 'package.json'), '{"version":"2.0.0"}');
  const res = await analyze(wrap(`<script src="https://unpkg.com/probe@1.0.0/p.js"></script><script src="https://unpkg.com/probe@1.0.0/gone.js"></script>`), { localAssets: assets });
  rmSync(assets, { recursive: true, force: true });
  if (browserDead(res)) return t.skip(`browser cannot run here: ${res?.unverified}`);
  assert.match(res.unverified, /0 sections.*--local-assets/);
  assert.match(res.unverified, /not found under --local-assets: https:\/\/unpkg\.com\/probe@1\.0\.0\/gone\.js/);
  const notes = Object.fromEntries(res.assetNotes.map(n => [n.name, n.detail]));
  assert.match(notes['local-assets:miss'], /^https:\/\/unpkg\.com\/probe@1\.0\.0\/gone\.js not found under .*node_modules$/);
  assert.match(notes['local-assets:version'], /^probe@1\.0\.0 is requested but .*node_modules.probe is 2\.0\.0$/);
});

test('visual tier 390px probe: a figure or element wider than the phone raises composition:mobile-overflow; clipped or self-scrolling ones do not', async (t) => {
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const wide = analyze(wrap(`<section id="s1"><h2>x</h2>
    <div data-component="probe-fig" style="width:600px; height:40px; background:#eee;">wide figure</div>
    <p><code style="white-space:nowrap;">${'verylongidentifier'.repeat(5)}</code></p></section>`));
  const ok = analyze(wrap(`<section id="s1"><h2>x</h2>
    <div style="overflow-x:auto;"><div data-component="clipped-fig" style="width:600px; height:40px; background:#eee;">wide figure inside a scroller</div></div>
    <div data-component="scroll-fig" style="overflow-x:auto;"><div style="width:600px; height:40px; background:#eee;">wide content</div></div></section>`));
  const [bad, good] = [await wide, await ok];
  if (browserDead(bad) || bad.unverified) return t.skip(`browser cannot analyze here: ${bad?.unverified}`);
  const overflow = bad.warnings.filter(w => w.name === 'composition:mobile-overflow');
  assert.equal(overflow.length, 1);
  assert.match(overflow[0].detail, /exceeds viewport 390/);
  assert.match(overflow[0].detail, /figures: probe-fig×1 \(\+\d+px\)/);
  assert.match(overflow[0].detail, /other: s1 <code>×1 "verylongidentifier/);
  assert.equal(bad.warnings.some(w => w.name === 'composition:desktop-overflow'), false); // the 600px figure and the 90-character token fit the desktop viewports
  assert.equal(good.warnings.some(w => w.name === 'composition:mobile-overflow'), false);
  const scrolls = good.warnings.filter(w => w.name === 'composition:mobile-scroll-figure');
  assert.equal(scrolls.length, 1);
  assert.equal(scrolls[0].level, 'INFO');
  assert.match(scrolls[0].detail, /^scroll-fig×1 scroll sideways/); // the root that scrolls itself, not the one a wrapper clips
  // the narrow viewport skips the desktop-only rows
  for (const res of [bad, good]) assert.equal(res.warnings.some(w => /section-height|stacked-grids/.test(w.name) && /390x844/.test(w.detail)), false);
});

// The page-level probe above cannot see these two: nothing makes the page scroll sideways.
test('visual tier 390px probe: a figure wider than its own frame (ending inside the sheet padding) raises composition:figure-overflow; one inside a scroller or scrolling itself does not', async (t) => {
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const frame = `<div style="padding:0 40px;">`; // a 310px content box at 390px
  const wide = analyze(wrap(`<section id="s1"><h2>x</h2>${frame}
    <div data-component="fixed-fig" style="width:340px; height:40px; background:#eee;">wider than the frame, still inside the viewport</div>
    <div data-component="spill-fig" style="height:40px; background:#eee;"><div style="width:340px; height:20px; background:#ccc;">children spill out of a figure that itself fits</div></div>
    <div data-component="fits-fig" style="height:40px; background:#eee;"><div style="width:300px; height:20px; background:#ccc;">fits</div></div></div></section>`));
  const ok = analyze(wrap(`<section id="s1"><h2>x</h2>${frame}
    <div style="overflow-x:auto;"><div data-component="wrapped-fig" style="width:340px; height:40px; background:#eee;">scrolls in its wrapper</div></div>
    <div data-component="scroll-fig" style="overflow-x:auto;"><div style="width:340px; height:40px; background:#eee;">scrolls itself</div></div></div></section>`));
  const [bad, good] = [await wide, await ok];
  if (browserDead(bad) || bad.unverified) return t.skip(`browser cannot analyze here: ${bad?.unverified}`);
  assert.equal(bad.warnings.some(w => w.name === 'composition:mobile-overflow'), false); // 390px page, the figure ends at x=380
  const rows = bad.warnings.filter(w => w.name === 'composition:figure-overflow');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].level, undefined); // a WARN
  assert.match(rows[0].detail, /^wider than their frame: .*fixed-fig×1 \(\+30px\)/);
  assert.match(rows[0].detail, /spill-fig×1 \(\+30px\)/);
  assert.doesNotMatch(rows[0].detail, /fits-fig/);
  assert.equal(good.warnings.some(w => w.name === 'composition:figure-overflow'), false);
  assert.match(good.warnings.find(w => w.name === 'composition:mobile-scroll-figure')?.detail || '', /^scroll-fig×1 /);
});

test('visual tier 390px probe: content silently cut off by overflow:hidden raises composition:figure-overflow; an ellipsis truncation and a scroller do not', async (t) => {
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const clipped = analyze(wrap(`<section id="s1"><h2>x</h2>
    <div data-component="root-clip" style="overflow:hidden;"><div style="width:600px; height:40px; background:#eee;">cut off at the root</div></div>
    <div data-component="inner-clip"><div style="overflow:hidden;"><div style="width:600px; height:40px; background:#eee;">cut off inside</div></div></div>
    <div data-component="ellipsis"><div style="overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${'a very long label '.repeat(12)}</div></div>
    <div data-component="scrolls" style="overflow-x:auto;"><div style="width:600px; height:40px; background:#eee;">scrolls</div></div></section>`));
  const res = await clipped;
  if (browserDead(res) || res.unverified) return t.skip(`browser cannot analyze here: ${res?.unverified}`);
  const rows = res.warnings.filter(w => w.name === 'composition:figure-overflow');
  assert.equal(rows.length, 1);
  assert.match(rows[0].detail, /content clipped by overflow:hidden: .*root-clip×1 \(\+\d+px\)/);
  assert.match(rows[0].detail, /inner-clip×1/);
  assert.doesNotMatch(rows[0].detail, /ellipsis|scrolls|wider than/);
  assert.equal(res.warnings.some(w => w.name === 'composition:mobile-overflow'), false); // a clip is not page overflow
  assert.match(res.warnings.find(w => w.name === 'composition:mobile-scroll-figure')?.detail || '', /^scrolls×1 /);
});

test('visual tier: the real feedbackops-light gallery renders offline through DC_LOCAL_ASSETS at all three viewports', async (t) => {
  const localAssets = process.env.DC_LOCAL_ASSETS;
  if (!localAssets || !existsSync(localAssets)) return t.skip('DC_LOCAL_ASSETS not set (a directory whose node_modules holds react, react-dom and pretendard)');
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  const res = await collectCompositionWarnings(join(REPO, 'styles', STYLE, 'components.gallery.dc.html'), styleInputs(STYLE).panel, { localAssets: resolve(localAssets) });
  if (browserDead(res)) return t.skip(`browser cannot run here: ${res?.unverified}`);
  assert.equal(res.unverified, null, JSON.stringify(res.assetNotes));
  const metrics = res.warnings.filter(w => w.name === 'composition:section-metrics');
  for (const height of [768, 900]) assert.ok(metrics.some(w => new RegExp(`viewport=\\d+x${height}$`).test(w.detail)), `desktop viewport of height ${height}`); // the width is a few px under the nominal one (scrollbar)
  assert.ok(res.warnings.some(w => w.name === 'composition:narrow-metrics' && /at 390x844/.test(w.detail)));
  assert.equal(res.warnings.some(w => w.name === 'composition:unverified'), false);
  assert.deepEqual(res.assetNotes.filter(n => n.name.startsWith('local-assets:')), []); // react, react-dom, pretendard all found at the requested versions
});

// The narrow-width contract (core/components.md §4 "Narrow widths"): every pasted component fits a 390px page. The galleries hold every
// component rendered with its own example content, so they are the oracle — no mobile-overflow (page) and no figure-overflow (a figure wider
// than its frame, or content cut off by overflow:hidden); a figure that scrolls inside itself is the allowed fallback (INFO).
test('narrow width: every style\'s component gallery has no mobile-overflow and no figure-overflow at 390px', async (t) => {
  const localAssets = process.env.DC_LOCAL_ASSETS;
  if (!localAssets || !existsSync(localAssets)) return t.skip('DC_LOCAL_ASSETS not set (a directory whose node_modules holds react, react-dom and pretendard)');
  if (!hasHeadlessChrome()) return t.skip('no headless browser');
  for (const style of listStyles()) {
    const res = await collectCompositionWarnings(join(REPO, 'styles', style, 'components.gallery.dc.html'), styleInputs(style).panel, { localAssets: resolve(localAssets) });
    if (browserDead(res)) return t.skip(`browser cannot run here: ${res?.unverified}`);
    assert.equal(res.unverified, null, `${style}: ${JSON.stringify(res.assetNotes)}`);
    assert.ok(res.warnings.some(w => w.name === 'composition:narrow-metrics' && /at 390x844/.test(w.detail)), `${style}: the 390px viewport rendered`);
    const bad = res.warnings.filter(w => /^composition:(mobile|figure)-overflow$/.test(w.name));
    assert.deepEqual(bad.map(w => `${w.name} ${w.detail}`), [], `${style} overflows at 390px`);
  }
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

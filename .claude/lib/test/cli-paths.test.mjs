import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, readdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The CLIs once compared import.meta.url (percent-encoded) with a raw file:// path, so under a path with
// spaces or Korean they exited 0 without doing anything — every gate "passed". Run them from such a path.
const REPO = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const fixture = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
const STYLE = 'feedbackops-light';

function run(script, args) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (e) { return { status: e.status, stdout: e.stdout || '', stderr: e.stderr || '' }; }
}

// A minimal repo copy under `<tmp>/발표 자료/pf`: the lib, the component templates, one style's spec files.
function repoCopy() {
  const base = mkdtempSync(join(tmpdir(), 'cli-'));
  const root = join(base, '발표 자료', 'pf');
  const lib = join(root, '.claude', 'lib');
  mkdirSync(lib, { recursive: true });
  for (const f of ['components.mjs', 'gate.mjs', 'plan-schema.mjs', 'verify-doc.mjs']) copyFileSync(join(REPO, '.claude/lib', f), join(lib, f));
  mkdirSync(join(root, 'core', 'components'), { recursive: true });
  for (const f of readdirSync(join(REPO, 'core/components'))) copyFileSync(join(REPO, 'core/components', f), join(root, 'core/components', f));
  mkdirSync(join(root, 'styles', STYLE), { recursive: true });
  for (const f of ['design.md', 'design.tokens.md', 'support.js']) copyFileSync(join(REPO, 'styles', STYLE, f), join(root, 'styles', STYLE, f));
  return { base, root, lib };
}

test('under a path with a space and Korean: plan-schema rejects a bad plan, verify-doc prints a GATE line, components.mjs runs', () => {
  const { base, root, lib } = repoCopy();
  try {
    const plan = join(root, 'bad plan.md');
    copyFileSync(fixture('plan-bad-shape.md'), plan);
    const p = run(join(lib, 'plan-schema.mjs'), [plan]);
    assert.equal(p.status, 1, 'plan-schema must not silently exit 0');
    assert.match(p.stderr, /content-plan INVALID/);
    assert.match(p.stderr, /shape "flowchart" is not in the vocabulary/);
    assert.equal(run(join(lib, 'plan-schema.mjs'), [fixture('plan-valid.md')]).status, 0);

    const doc = join(root, '문서.dc.html');
    copyFileSync(fixture('doc-no-keepall.dc.html'), doc);
    const v = run(join(lib, 'verify-doc.mjs'), [doc, '--accent', '#4338CA', '--canonical-support', join(root, 'styles', STYLE, 'support.js')]);
    assert.equal(v.status, 1);
    assert.match(v.stdout.trim().split('\n').at(-1), /^GATE FAILED \(\d+\/\d+ checks\)$/);

    writeFileSync(doc, `<!DOCTYPE html><html><head><style>body { word-break: keep-all; }</style></head><body><i style="color:#1428A0"></i><section id="s1"></section></body></html>`);
    copyFileSync(join(root, 'styles', STYLE, 'support.js'), join(root, 'support.js'));
    const ok = run(join(lib, 'verify-doc.mjs'), [doc, '--style', STYLE, '--no-visual', '--canonical-support', join(root, 'styles', STYLE, 'support.js')]);
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout.trim().split('\n').at(-1), /^GATE PASSED \((\d+)\/\1 checks\)$/);

    const c = run(join(lib, 'components.mjs'), ['list']);
    assert.equal(c.status, 0, c.stderr);
    assert.match(c.stdout, /kpi-row/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('through a symlinked directory the CLIs still run (realpath-based entry guard)', () => {
  const { base, lib } = repoCopy();
  try {
    const link = join(base, '링크 dir');
    symlinkSync(lib, link);
    const r = run(join(link, 'plan-schema.mjs'), [fixture('plan-bad-shape.md')]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /INVALID/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

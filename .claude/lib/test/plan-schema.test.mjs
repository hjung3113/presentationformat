import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validatePlan, parsePlan } from '../plan-schema.mjs';

const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');

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

test('valid plan passes and parses all fields', () => {
  const md = read('plan-valid.md');
  const res = validatePlan(md);
  assert.equal(res.ok, true, res.errors.join('; '));
  const p = parsePlan(md);
  assert.equal(p.header.hasAsIs, true);
  assert.equal(p.header.narrativeLens, 'architecture-first');
  assert.equal(p.sections.length, 2);
  assert.ok(p.sections[0].sourceSpan.length > 0);
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

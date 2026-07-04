import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, lstatSync, readlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// repo root = three dirs up from this test file (.claude/lib/test/ -> repo)
const REPO = resolve(new URL('../../..', import.meta.url).pathname);
const INSTALL = join(REPO, 'install.sh');

function run(codexHome) {
  return execFileSync('sh', [INSTALL], {
    env: { ...process.env, CODEX_HOME: codexHome },
    encoding: 'utf8',
  });
}

function freshHome() {
  return mkdtempSync(join(tmpdir(), 'codexhome-'));
}

test('fresh CODEX_HOME: both skills symlinked to the repo', () => {
  const home = freshHome();
  try {
    const out = run(home);
    for (const name of ['plan', 'build']) {
      const dest = join(home, 'skills', name);
      const st = lstatSync(dest);
      assert.ok(st.isSymbolicLink(), `${name} should be a symlink`);
      assert.equal(readlinkSync(dest), join(REPO, '.claude/skills', name));
    }
    assert.match(out, /Restart Codex/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('re-run is idempotent', () => {
  const home = freshHome();
  try {
    run(home);
    run(home); // second run must not throw and must keep correct links
    for (const name of ['plan', 'build']) {
      const dest = join(home, 'skills', name);
      assert.ok(lstatSync(dest).isSymbolicLink());
      assert.equal(readlinkSync(dest), join(REPO, '.claude/skills', name));
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('real directory at target is skipped, sibling still links', () => {
  const home = freshHome();
  try {
    mkdirSync(join(home, 'skills', 'plan'), { recursive: true }); // real dir, not a link
    const out = run(home);
    // plan left as a real directory
    assert.ok(!lstatSync(join(home, 'skills', 'plan')).isSymbolicLink());
    assert.match(out, /skip 'plan'/);
    // build still linked
    const buildDest = join(home, 'skills', 'build');
    assert.ok(lstatSync(buildDest).isSymbolicLink());
    assert.equal(readlinkSync(buildDest), join(REPO, '.claude/skills/build'));
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

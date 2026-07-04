# Multi-host Install Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After `git clone`, all three agent hosts — Claude Code, opencode, Codex — can use the `/plan → /build` authoring harness; add a Codex symlink installer plus a thin instruction bridge, without host-specific forks.

**Architecture:** Claude Code and opencode already discover `.claude/skills/` on clone (no-op). Codex needs its skills in `$CODEX_HOME/skills/`; a single POSIX `install.sh` symlinks the two skill dirs there (empirically verified to be discovered via `codex debug prompt-input`). A thin non-normative `AGENTS.md` bridges Codex/opencode instruction-reading and defers to `CLAUDE.md`. A `node:test` suite covers the shell mechanics; live Codex discovery is documented as evidence in `.claude/README.md`.

**Tech Stack:** POSIX `sh` (`install.sh`), Node.js 22 (`node:test`, zero external deps — `node:fs`, `node:child_process`, `node:os`), Markdown.

## Global Constraints

- **Host-neutral, co-equal Claude Code + opencode + Codex.** No host-specific agent forks (`.claude/agents/`, `.opencode/agent/`, Codex roles) — decision D0.
- **Codex install = absolute-path symlink**, never a `config.toml` mutation — decision D1.
- **Scripts zero external npm deps** — `node:test` / `node:fs` / `node:child_process` / `node:os` only.
- **`AGENTS.md` is non-normative** — the product spec of record is `CLAUDE.md` + `core/` + `styles/<style>/`; if `AGENTS.md` ever conflicts, the spec wins.
- **Host-read facts (verbatim):** `AGENTS.md` is read by Codex and opencode; Claude Code uses `CLAUDE.md`. Do not claim universal auto-read.
- **Symlink targets are absolute** to the repo path so they resolve regardless of invocation cwd.
- Spec of record: `docs/superpowers/specs/2026-07-04-multi-host-install-design.md`.

---

### Task 1: `install.sh` — Codex symlink installer

**Files:**
- Create: `install.sh` (repo root)

**Interfaces:**
- Produces: an executable POSIX-sh script. Behavior contract that Task 2 tests rely on:
  - Reads `CODEX_HOME` env (default `$HOME/.codex`); operates on `$CODEX_HOME/skills/{plan,build}`.
  - For each skill name: if target is a **real directory** (not a symlink) → print a line containing `skip` + the name, leave it untouched; else create/overwrite an absolute symlink to `<repo>/.claude/skills/<name>`.
  - `mkdir -p "$CODEX_HOME/skills"` before linking.
  - Prints a line containing `Restart Codex` on the Codex path.
  - Exit code `0` on success (including the skip case).

- [ ] **Step 1: Write the script**

Create `install.sh` with exactly this content:

```sh
#!/bin/sh
# Install the /plan → /build authoring harness for each agent host.
# Claude Code + opencode: no install (they scan .claude/skills/ on clone).
# Codex: symlink the two skill dirs into $CODEX_HOME/skills/ (verified discovered
# via `codex debug prompt-input`). Re-runnable / idempotent.
set -eu

# Absolute path to this repo (the dir containing this script).
REPO=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)

echo "Authoring harness install — repo: $REPO"

# --- Node preflight (the /build exit gate needs it) ---
if ! command -v node >/dev/null 2>&1; then
  echo "WARN: 'node' not found on PATH — the /build exit gate (.claude/lib/) will not run until Node is installed."
fi

# --- Claude Code / opencode: no-op ---
echo "Claude Code: skills work on clone (auto-discovers .claude/skills/). No install needed."
echo "opencode:    skills work on clone (scans .claude/skills/). No install needed."
if command -v opencode >/dev/null 2>&1; then
  echo "             verify with: opencode debug skill"
fi

# --- Codex: symlink into \$CODEX_HOME/skills ---
CODEX_HOME=${CODEX_HOME:-$HOME/.codex}
# strip any trailing slash
CODEX_HOME=$(printf '%s' "$CODEX_HOME" | sed 's:/*$::')
SKILLS_DIR="$CODEX_HOME/skills"
mkdir -p "$SKILLS_DIR"

link_one() {
  name=$1
  src="$REPO/.claude/skills/$name"
  dest="$SKILLS_DIR/$name"
  if [ -d "$dest" ] && [ ! -L "$dest" ]; then
    echo "Codex: skip '$name' — $dest is a real directory, not touching it."
    return 0
  fi
  if [ -L "$dest" ]; then
    current=$(readlink "$dest")
    if [ "$current" != "$src" ] && [ -e "$current" ]; then
      echo "Codex: skip '$name' — $dest already links elsewhere ($current)."
      return 0
    fi
    # dangling, or already ours: (re)point below.
  fi
  ln -sfn "$src" "$dest"
  echo "Codex: linked '$name' -> $src"
}

link_one plan
link_one build
echo "Codex: Restart Codex to load /plan and /build."
```

- [ ] **Step 2: Make it executable and smoke-run it**

Run:
```bash
chmod +x install.sh && ./install.sh
```
Expected: prints the Claude Code / opencode no-op lines, then `Codex: linked 'plan' -> …/.claude/skills/plan`, `Codex: linked 'build' -> …`, and `Codex: Restart Codex to load /plan and /build.` Exit code 0.

- [ ] **Step 3: Verify the real symlinks resolve**

Run:
```bash
ls -l "${CODEX_HOME:-$HOME/.codex}/skills/plan" "${CODEX_HOME:-$HOME/.codex}/skills/build"
```
Expected: both are symlinks (`->`) pointing at `<repo>/.claude/skills/{plan,build}`.

- [ ] **Step 4: Commit**

```bash
git add install.sh
git commit -m "feat(install): add Codex symlink installer (install.sh)"
```

---

### Task 2: `install.test.mjs` — shell-mechanics test

**Files:**
- Create: `.claude/lib/test/install.test.mjs`

**Interfaces:**
- Consumes: `install.sh` from Task 1 (its `CODEX_HOME` contract + skip behavior).
- Produces: a `node:test` suite runnable via `node --test .claude/lib/test/install.test.mjs`.

- [ ] **Step 1: Write the failing test**

Create `.claude/lib/test/install.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, lstatSync, readlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// repo root = two dirs up from this test file (.claude/lib/test/ -> repo)
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
```

- [ ] **Step 2: Run the suite**

Run:
```bash
node --test .claude/lib/test/install.test.mjs
```
Expected: `# pass 3`, `# fail 0`. (If `install.sh` from Task 1 is correct, these pass on first run — the "failing" phase was Task 1's own smoke run.)

- [ ] **Step 3: Run the full harness suite to confirm no regressions**

Run:
```bash
node --test .claude/lib/test/*.test.mjs
```
Expected: all suites pass (previously 7 tests + the 3 new = 10), `# fail 0`.

- [ ] **Step 4: Commit**

```bash
git add .claude/lib/test/install.test.mjs
git commit -m "test(install): cover install.sh symlink mechanics + idempotency"
```

---

### Task 3: `AGENTS.md` — thin non-normative bridge

**Files:**
- Create: `AGENTS.md` (repo root)

**Interfaces:**
- Consumes: `install.sh` (Task 1) — referenced as the Codex install command.
- Produces: a root `AGENTS.md` read by Codex and opencode.

- [ ] **Step 1: Write the file**

Create `AGENTS.md`:

```markdown
# AGENTS.md — authoring harness (non-normative)

This repo is a scroll-style HTML presentation system. It ships a two-step authoring harness
under `.claude/skills/`:

- **`/plan`** — interviews you against your source docs and emits `content-plan.md`.
- **`/build`** — renders a confirmed `content-plan.md` into a `.dc.html` document in a chosen
  style (`indigo-serif` today) and runs a mechanical exit gate.

**This file is non-normative.** The product spec of record is `CLAUDE.md` plus `core/` and
`styles/<style>/`. This file restates none of it and defers to them; if anything here ever
conflicts, the spec wins. Harness tooling details live in `.claude/README.md`.

## Which host reads what

`AGENTS.md` is read by **Codex** and **opencode**. **Claude Code** uses `CLAUDE.md`. There is no
single file every host auto-reads — this is intentional.

## Getting the skills

- **Claude Code** — no install; it discovers `.claude/skills/` on clone.
- **opencode** — no install; it scans `.claude/skills/` on clone (`opencode debug skill` to verify).
- **Codex** — run `./install.sh`, then **restart Codex**. It symlinks the two skills into
  `$CODEX_HOME/skills/`.

## Scope caveat for Codex

In Codex the skills are listed globally, but they are only **functional inside this repo**:
`/build`'s exit gate invokes `node .claude/lib/verify-doc.mjs` with a repo-root-relative path, so
running `/plan` or `/build` from another project will fail. Claude Code and opencode scope the
skills to this project, so this asymmetry is Codex-only.

## Prerequisites

- **Node** (recent LTS; verified on v22) — the `/build` exit gate under `.claude/lib/` needs it.
- **Headless Chrome (optional)** — the gate's visual tier uses it if present; otherwise it
  degrades to `VISUAL: UNVERIFIED` without blocking.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add non-normative AGENTS.md host bridge"
```

---

### Task 4: `.claude/README.md` — add Codex discovery evidence

**Files:**
- Modify: `.claude/README.md` (insert a `### Codex` subsection after the opencode subsection, which ends around line 95)

**Interfaces:**
- Consumes: nothing.
- Produces: documented empirical evidence mirroring the existing opencode block.

- [ ] **Step 1: Insert the Codex subsection**

After the opencode subsection (the paragraph ending "...do not assume parity without re-verifying."), append:

```markdown

### Codex

Codex (a skills-capable build; checked at `codex-cli 0.142.5`) does **not** scan the project's
`.claude/skills/`. It discovers skills by directory scan of `$CODEX_HOME/skills/<name>/`
(default `~/.codex/skills`). Install with `./install.sh` (symlinks the two skill dirs there),
then **restart Codex**.

#### Verified under Codex

- **Discovery mechanism:** directory scan of `$CODEX_HOME/skills`, following symlinks.
  `config.toml`'s `[[skills.config]]` table is a disable/override registry, **not** a discovery
  allowlist — no entry is required to enable a skill (confirmed: `~/.codex/skills/chronicle/` is
  discovered with no config entry).
- **Verification command** (from the repo root, after `./install.sh`):
  ```bash
  codex debug prompt-input
  ```
- **Result:** both `plan` and `build` appear in the model-visible skill list, each with its full
  name + description and the resolved symlink target
  `(file: <repo>/.claude/skills/<name>/SKILL.md)` — i.e. Codex followed the symlink and loaded
  the harness skills.

If a future Codex version changes discovery (e.g. requires explicit registration), re-run
`codex debug prompt-input` from the repo root to confirm `plan`/`build` are present, and update
this section — do not assume parity without re-verifying.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/README.md
git commit -m "docs(harness): document Codex skill discovery evidence"
```

---

### Task 5: `README.md` — one pointer line

**Files:**
- Modify: `README.md` (add a short line near the top-level usage area)

**Interfaces:**
- Consumes: `AGENTS.md`, `install.sh`.
- Produces: a discoverable pointer for agent-host users.

- [ ] **Step 1: Add the pointer**

Insert this line into `README.md` (after the existing "Adding a style" / usage block, before the answer-key paragraph — pick the spot that reads naturally):

```markdown
> **Using this from an agent host:** Claude Code and opencode pick up the `/plan → /build` skills on clone. For **Codex**, run `./install.sh` then restart. See [`AGENTS.md`](AGENTS.md).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: point README at the agent-host install bridge"
```

---

## Notes for the implementer

- **Do not** create `.claude/agents/`, `.opencode/agent/`, or Codex role files (decision D0).
- **Do not** edit `~/.codex/config.toml` (decision D1) — symlink only.
- The real `~/.codex/skills/{plan,build}` symlinks already exist on the author's machine from the
  design-verification step; Task 1's `./install.sh` run is idempotent and will simply re-affirm them.
- Out of scope (documented in the spec, not to be fixed here): making `build/SKILL.md`'s lib path
  cwd-robust (M2), and wiring `plan-schema.mjs` into `/plan` (m2).

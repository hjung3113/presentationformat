# Multi-host install bridge — design

**Date:** 2026-07-04
**Status:** approved, ready for implementation
**Goal:** After `git clone`, all three agent hosts — Claude Code, opencode, Codex — can use the
`/plan → /build` authoring harness. Claude Code and opencode already work on clone; close the
Codex gap and add a soft instruction bridge, without violating the harness's host-neutral
principle.

## Background — verified host behavior

- **Claude Code** — auto-discovers `.claude/skills/<name>/SKILL.md` on clone. No install. Reads
  `CLAUDE.md` for project instructions (not `AGENTS.md`).
- **opencode** — natively scans the project's `.claude/skills/` (v1.14.19, evidence in
  `.claude/README.md`). No install. Reads `AGENTS.md`.
- **Codex** (this machine: `codex-cli 0.142.5`, a skills-capable fork) — discovers skills by
  directory scan of `$CODEX_HOME/skills/<name>/` (default `~/.codex/skills`). It does **not**
  scan the project's `.claude/skills/`. `config.toml`'s `[[skills.config]]` table is a
  **disable/override registry** (every entry on this box is `enabled = false`), not a discovery
  allowlist — proven by `~/.codex/skills/chronicle/` being discovered with no config entry.
  Reads `AGENTS.md`.

### Empirical proof the symlink mechanism works (C1, discharged)

With `~/.codex/skills/{plan,build}` symlinked to `<repo>/.claude/skills/{plan,build}`, running
`codex debug prompt-input` from the repo root shows both skills in the model-visible skill list,
each with its full name + description and the resolved target path
`(file: <repo>/.claude/skills/<name>/SKILL.md)`. Codex follows the symlink during its scan. This
mirrors the opencode `opencode debug skill` evidence already recorded in `.claude/README.md`.

## Design decisions

- **D0 — no per-host custom agents.** Do not add `.claude/agents/`, `.opencode/agent/`, or Codex
  roles. Different formats per host would reintroduce the host-specific fork the SKILL.md common
  subset exists to avoid. The two prose skills already encode the workflow. Not creating agent
  forks is consistent with host-neutrality.
- **D1 — Codex install = symlink, not config registration.** Symlink discovery is empirically
  verified (above). It avoids mutating the user's global `config.toml` and matches the reversible,
  low-blast-radius intent. Symlinks are absolute to the repo path so they resolve regardless of
  invocation cwd.
- **D2 — one `install.sh`, not per-host scripts.** Claude Code and opencode are no-ops; a single
  script with a clear Codex section is simpler than three.

## Components

### 1. `install.sh` (repo root, POSIX sh)

- Resolve `REPO` = the script's own directory (absolute). Quote `"$REPO"` everywhere.
- **Codex section:**
  - `CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"` (tolerate a trailing slash).
  - `mkdir -p "$CODEX_HOME/skills"` (fresh box may lack it).
  - For each of `plan`, `build`: target `$CODEX_HOME/skills/<name>`.
    - If target is a **real directory** (not a symlink): warn + skip (don't clobber).
    - If target is a symlink pointing **elsewhere** (a different clone): warn + skip unless it
      dangles; if it dangles, re-point it.
    - Otherwise `ln -sfn "$REPO/.claude/skills/<name>" "$CODEX_HOME/skills/<name>"`.
  - Print: `Restart Codex to load /plan and /build.`
- **Claude Code / opencode section:** no-op. Print that the skills already work on clone; if
  `opencode` is on `PATH`, suggest `opencode debug skill` to verify.
- **Node preflight:** if `node` is absent, warn that the `/build` exit gate (`.claude/lib/`)
  needs it.
- Idempotent: re-running makes no further change and prints the same success lines.

### 2. `AGENTS.md` (repo root, thin, non-normative)

- One-paragraph statement that this repo ships a `/plan → /build` authoring harness under
  `.claude/skills/`, and that the product spec of record is `CLAUDE.md` + `core/` +
  `styles/<style>/` — this file restates nothing and defers to them (mirrors the `.claude/README.md`
  boundary).
- **Host note:** "`AGENTS.md` is read by Codex and opencode; Claude Code uses `CLAUDE.md`." No
  claim of universal auto-read.
- **Codex users:** run `./install.sh`, then restart Codex.
- **Scope caveat (M2):** in Codex the skills are listed globally, but they are only *functional*
  inside this repo, because `/build`'s gate invokes `node .claude/lib/verify-doc.mjs`
  (repo-root-relative). Invoked from another project they will fail. Claude Code and opencode
  scope the skills to the project, so this asymmetry is Codex-only.

### 3. `.claude/README.md` — add Codex evidence

Under the host-neutral install section, add a **Codex** subsection mirroring the existing
opencode one: the `codex debug prompt-input` command and the excerpt showing `plan`/`build`
resolved to their SKILL.md paths. Include the "re-verify if a future Codex version changes
discovery" caveat.

### 4. `README.md` — one pointer line

A single "Using this from an agent host" line pointing at `AGENTS.md` / `install.sh`.

## Testing

`.claude/lib/test/install.test.mjs` (`node:test`, zero-dep), spawning `install.sh` with a
temporary `CODEX_HOME`:

1. Fresh temp `CODEX_HOME` (no `skills/`) → both symlinks created, each pointing at the repo's
   `.claude/skills/<name>`.
2. Re-run → idempotent (still two correct symlinks, exit 0).
3. Pre-create `CODEX_HOME/skills/plan` as a **real directory** → that one skipped with a warning,
   `build` still linked.

The test verifies the shell mechanics only. Codex's *discovery* of the symlink is verified
out-of-band by the `codex debug prompt-input` evidence captured in `.claude/README.md` (a live
host, not mockable in `node:test`).

## Out of scope (noted, not fixed here)

- **M2 lib-path robustness in `build/SKILL.md`** — making the gate resolve `.claude/lib/` from
  the repo root regardless of cwd (or fast-fail with a clear message) is a SKILL.md change,
  separate from install. Documented as a caveat instead.
- **m2 `plan-schema.mjs` caller** — `grep` finds only `build/SKILL.md:115` (`verify-doc.mjs`)
  referencing `.claude/lib/`; no SKILL.md invokes `plan-schema.mjs`. Whether `/plan` should call
  it is orthogonal to install; flagged for a later pass.

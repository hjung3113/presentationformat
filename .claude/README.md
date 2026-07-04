# Authoring harness (tooling — non-normative)

**This directory is not the product spec.** The product spec — what a document must look like and
contain — lives in `core/`, `styles/<style>/`, and the root `CLAUDE.md`. Everything under
`.claude/` is *authoring tooling*: a two-skill pipeline plus a mechanical exit gate that helps a
human/agent produce a spec-conforming `.dc.html` document. If anything here ever conflicts with
`core/` or a style's `design.md`, the spec wins — fix the tooling, not the other way around.

## What the harness is

A two-step pipeline:

1. **`/plan`** (`.claude/skills/plan/SKILL.md`) — interviews the user against their source docs
   and emits `content-plan.md`: a style-agnostic, data-carrying outline of what goes in each
   section. Refuses to run on a vague idea with no real source material.
2. **`/build`** (`.claude/skills/build/SKILL.md`) — renders a confirmed `content-plan.md` into an
   actual `.dc.html` document in a chosen style (only `indigo-serif` exists today), then runs the
   exit gate. A document that hasn't passed the gate is not considered built.

The gate itself is zero-dependency Node under `.claude/lib/`:

- `.claude/lib/gate.mjs` — structural checks (`word-break: keep-all` present, accent hex present,
  sidecar present, unique `id`s, nav-link targets resolve, inline-styles-only — no class-based
  color rulesets).
- `.claude/lib/verify-doc.mjs` — CLI entry that runs the gate against a `.dc.html`, checks the
  `support.js` sidecar is byte-identical to the canonical copy, and reports a `VISUAL:` line
  (see below).
- `.claude/lib/plan-schema.mjs` — schema/shape checks for `content-plan.md`.
- `.claude/lib/test/*.test.mjs` — the test suite for the above (`node --test`).

## Prerequisites

- **Node** (any recent LTS; verified here on v22) — required to run the lib scripts and their
  tests:
  ```bash
  node --test .claude/lib/test/*.test.mjs
  ```
- **Headless browser (optional)** — the gate's visual tier wants `google-chrome`, `chromium`, or
  `chromium-browser` on `PATH` to actually render and screenshot a document. Without one,
  `verify-doc.mjs` prints `VISUAL: UNVERIFIED (no headless browser)` and the structural checks
  still run and can still fail the gate — the visual tier degrades gracefully, it does not block.

## Host-neutral install

The harness must run co-equally on **Claude Code** and **opencode** — both are treated as
first-class hosts, and the harness is designed to run identically on each, so nothing here may
depend on Claude-Code-only behavior.

### Claude Code

No install step. Claude Code discovers skills at `.claude/skills/<name>/SKILL.md` automatically
on clone — `/plan` and `/build` are available as soon as the repo is checked out.

### opencode

**No install step either — verified empirically, not assumed.** opencode (checked at v1.14.19)
natively scans the project's `.claude/skills/` directory in addition to its own global skill
locations (`~/.agents/skills/`, `~/.claude/skills/`); it needs no `.opencode/` copy, no symlink,
and no file-format adaptation. `SKILL.md` loads as-is.

#### Verified under opencode

- **Discovery path used:** opencode reads skills directly from
  `<project>/.claude/skills/<name>/SKILL.md` (confirmed via `location` field in output below) —
  the same path Claude Code uses. No expose step was needed.
- **Expose step:** none required (see above).
- **Verification command** (run from the repo root):
  ```bash
  opencode debug skill
  ```
- **Output (relevant excerpt, opencode v1.14.19):**
  ```
  [
    ...
    {
      "name": "plan",
      "location": "/Users/hyojung/Desktop/2026/presentationformat/.claude/skills/plan/SKILL.md",
      ...
    },
    {
      "name": "build",
      "location": "/Users/hyojung/Desktop/2026/presentationformat/.claude/skills/build/SKILL.md",
      ...
    },
    ...
  ]
  ```
  Both `plan` and `build` were present in the full listing (13 skills total on this machine,
  including unrelated global skills), each with `content` populated from the corresponding
  `SKILL.md` — i.e. opencode fully parsed and loaded both harness skills, not just found the
  files.

If a future opencode version changes this behavior (e.g. requires `.opencode/skill/` instead),
re-run `opencode debug skill` from the repo root to check the `location` values, and update this
section — do not assume parity without re-verifying.

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

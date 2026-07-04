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

# Authoring harness — design spec

> Status: design approved after adversarial 5-reviewer pass (unanimous GO_WITH_FIXES,
> 5.14/10 pre-fix). This document is the reinforced design incorporating every CRITICAL fix.
> Date: 2026-07-04.

## 1. Problem

The repo is a **style spec library** for building single-page vertical-scroll HTML explainer
documents (`.dc.html`). The spec substrate is complete, but there is **no automation** from
source material → rendered `.dc.html`. The only smoke test (ForgeRoom) was done manually by an
agent reading the specs. The goal: a small, host-neutral authoring harness that drives a user
from source docs to a verified `.dc.html`.

Non-goals (deferred, with resume conditions in §7): PPT output, style-selection command,
export/converters (Confluence macro, vvveb, plain HTML), and `/build` subagent fan-out.

## 2. Hard constraints

1. **Host-neutral, co-equal Claude Code + opencode.** The company forbids running Claude Code
   on sensitive data (security), so sensitive work runs in opencode. A CC-only harness is
   unusable for the real internal case. Therefore:
   - Skills are authored as the **minimal common subset of SKILL.md** both hosts honor.
   - **No Claude-Code-only tool calls** (in particular, not the `Workflow()` tool).
   - Install is host-neutral: document the discovery path per host (`.claude/skills/` for CC,
     `.opencode/` for opencode) and **verify one skill actually loads under opencode** — do not
     assume format parity.
2. **Respect existing repo invariants** (CLAUDE.md): core zero-HEX; style self-contained;
   answer-key-wins; semantic color split (as-is = slate+amber, to-be = indigo); inline styles
   only; `support.js` byte-identical sidecar (no build step); Korean `word-break: keep-all`.
3. **Repo = install.** Cloning the repo installs the harness; no package, fetch, or submodule.
4. **Product/tooling boundary stays clean.** Harness docs live under `.claude/` (or a clearly
   fenced, explicitly non-normative section), never appended as a normative "layer 2" inside the
   product's CLAUDE.md.

## 3. Architecture — 2 skills, file-based seam

```
[source docs]
   │  /plan   (grill with docs; requires a source — refuses if absent/thin)
   ▼
content-plan.md            ◄── the ONLY contract between stages (style-agnostic, carries data)
   │  /build  (content-plan.md + chosen style specs → render + verify)
   ▼
verified doc.dc.html (+ byte-identical support.js sidecar)
```

Verification is folded into `/build` as its exit gate — there is **no separate `/polish`
skill**. A document that has not passed the gate is not "built."

## 4. `/plan` — section content interview (stage 1)

NOT generic idea-brainstorming. It aligns the user on **what information goes on each section**,
grounded in the source docs.

**Precondition:** requires source docs. On absent / thin / vague-idea-only input it **refuses
and routes out** ("bring a source; open-ended ideation is out of scope") — it must not silently
become a brainstormer.

**Flow (propose-then-confirm):**
1. Read source docs.
2. Propose the full section sequence (numbered noun-phrase titles) as a TOC draft. Validate
   count against the style skeleton target (~6–9 + reference; merge thin rows). **Gate 1:** user
   reviews the TOC.
3. After TOC agreed, draft each section's content-plan entry **from the source**.
4. **Mechanical ask-threshold (source-span rule):** every payload field must cite a covering
   source span. A field with **no** covering span is *underdetermined* → MUST become a batched
   question. A field with a **conflicting** span is *high-consequence* → MUST be surfaced (never
   auto-picked). This turns "ask only what's underdetermined" into a reproducible rule, bounding
   both over-asking and silent guessing.
5. Handle greenfield/metric-less topics explicitly: detect no-AS-IS / no-metrics up front and
   switch question strategy (do not fabricate a fake "before"; align with authoring-guide
   §4.4/§4.6).
6. **Gate 2:** present the completed `content-plan.md` (payloads + figure-data) for confirmation
   **before** `/build` spends effort.

## 5. `content-plan.md` — the seam contract

Thin, **style-agnostic**, and **data-carrying**. Style-specific rendering decisions
(page-type, diagram device, color token) are NOT here — `/build` derives them from the active
style. The contract carries only content + the expensive source-derived data, so `/build` never
re-reads the source.

**Document header:**
- `has-as-is` — is there a current/old state to contrast? (drives dormant slate+amber)
- `metrics-mode` — are there metrics? (drives whether a Data section exists)
- `act-structure` — flat, or act-grouped with dividers (for >~9 sections)
- `source-ref` — path(s) + hash/mtime of consumed sources (staleness guard for `/build`)

**Per section:**
- `title` — noun-phrase
- `intent` — what this section conveys
- `payload` — the information/facts to place. **Structured content/notes, NOT final Korean
  prose** — voice/register is style-scoped, so `/build` renders it (authoring-guide §3.1).
- `figure-data` — raw values for any figure (bar values, gantt when×how-much, matrix rows).
  Present so `/build` can pick a device and fill it without re-reading source.
- `source-span` — the covering citation (also powers the §4 ask-threshold + staleness).

The contract references style concepts (page-type registry, color law) **by pointer only** —
it never re-enumerates the legal page-type set or restates the color law inline (CLAUDE.md
rule 8, doc-ownership).

## 6. `/build` — render + verify (stage 3, the real gap)

**Linear** for MVP — no subagent fan-out (removes the cross-cutting-state / drift / sidecar-
regeneration risk class, and any host subagent-primitive dependency).

1. Read `content-plan.md` + the chosen style specs. **Style is a `/build` argument** (only one
   style today); `/build` validates that the plan's section count/shape fits the style skeleton.
2. Clone the style's `template.dc.html`.
3. Map: `intent` → page-type (authoring-guide §4), `figure-data` → diagram device (§5.1),
   state → semantic color (design.md §1.4).
4. **Visual oracle = `design-system.answerkey.dc.html`**, not `design.md` prose (answer-key-wins,
   rule 5). Both build and the gate reference the rendered answer key as ground truth.
5. **`support.js` sidecar = a literal byte-copy of the single canonical file** — never
   regenerated, never hand-written (rule 10).
6. **Exit gate (two-tier):**
   - **Mechanical hard gate (always runs, no browser):** semantic color split present; `word-
     break: keep-all`; inline styles only; unique section ids + intact `[data-navlink]` mapping;
     `support.js` sidecar present and byte-identical. Machine pass/fail — a reproducible
     completion signal.
   - **Visual render (capability-checked):** if a headless browser + free port + runtime are
     available, serve over http and render for a density/layout/color eyeball. If not available,
     **skip and flag "visual UNVERIFIED"** — never silently assert a check that did not run.

## 7. Deferred (resume conditions)

- **Stage 2 — style-select command:** when a 2nd style exists. Until then style is a `/build`
  arg. The style-agnostic seam (§5) is already 2nd-style-ready.
- **Stage 5 — export/converters:** when real demand is confirmed; even then it is a lossy static
  snapshot (React runtime + scroll/nav interactivity dies) and must be documented as such.
- **`/build` fan-out:** when a document actually exceeds a single context. Re-introduce only with
  an explicit reduce contract: acronym first-use ledger, section-id/nav-label allocator, cross-
  reference/TOC pass, and a main-only color-law unification gate against design.md §1.4.

## 8. Review provenance

Adversarial 5-reviewer pass (harness-architect, portability-skeptic, scope-yagni-enforcer,
authoring-ux-grill-critic, repo-invariant-integration). Unanimous GO_WITH_FIXES, 5.14/10 average
pre-fix. Convergent CRITICALs and their resolutions:
- Seam schema incomplete / duplicative → thin, style-agnostic, data-carrying contract (§5).
- `/polish` over-scoped + machine-dependent + non-deterministic → folded into `/build` two-tier
  exit gate with capability check (§6).
- Fan-out unsafe (no reduce contract, invariant drift) → dropped for MVP, linear build (§6, §7).
- Grill threshold undefined → mechanical source-span rule + 2nd gate + source precondition (§4).
- Answer key not cited as oracle; support.js regeneration risk → §6.4, §6.5.
- opencode portability was flagged "unearned" by scope; overridden by the §2.1 hard constraint
  (company security). Host-neutral install is required, not optional.

# CLAUDE.md

## What this project is

A reusable **scroll-style HTML presentation system**. Goal: any document built to this
system — whatever its subject — reads as the work of the **same author** (one consistent
design). A document is a single self-contained HTML page read top→bottom (a "paper sheet",
**not** a slide deck).

**Future direction:** the current spec is **one style**. The system is meant to grow into
**multiple selectable styles**. When editing, keep style-specific values (color, type,
geometry) separable from structural rules (shell, runtime, DOM contract, page-type registry)
so a second style can be added without forking the whole system.

## Repo map

Spec library lives at **repo root** — this is the product:

| File | Owns |
|------|------|
| `README.md` | Entry point + read order + doc-ownership table |
| `authoring-guide.md` | Voice, Korean register, skeleton, page types, situation→device, color intent→token map |
| `composition-guide.md` | Density budgets, in-section layout, focal hierarchy, whitespace/pacing |
| `design.md` | **All** HEX/px/radius tokens, components, diagram geometry, anti-patterns. Source of truth for visuals |
| `runtime-spec.md` | `.dc.html` shell, `<helmet>`, `DCLogic` lifecycle, DOM contract, serving |
| `template.dc.html` | Runnable fill-in-the-blanks skeleton — start builds here |
| `design.tokens.md` | Machine-readable **mirror** of `design.md` (derived, not source) |
| `examples/design-system.answerkey.dc.html` | Rendered answer key — live gallery of every token/component/diagram |
| `examples/feedbackops.dc.html` | Second worked example |

**`parserimprove/` is reference material only** — a real project's design docs used to
exercise the system. Not the product. Canonical worked example:
`parserimprove/로그파서 개선 설명자료 v2.dc.html`. The other `.dc.html` there are old drafts (ignore).
`parserimprove/uploads/` holds domain design docs + `spec_extensions.md` (proposed spec
extensions, not yet merged into core) + `converter_pilot.dc.html` (a pilot). See `HANDOFF.md`.

## Core rules

1. **Single source of truth for visuals** — every HEX value lives in `design.md` **only**.
   Change it there, then re-mirror into `design.tokens.md`. Never define colors elsewhere.
2. **Answer key wins** — when `examples/design-system.answerkey.dc.html` and `design.md`
   disagree, the answer key is correct; update `design.md` to match.
3. **Semantic color split (current style, normative)** — current/old/problem state = slate +
   amber; target/new/improved state = indigo. Stated once in `design.md §1.4`; other docs
   reference it. Strongest fingerprint — never violate. (This rule is style-scoped; a future
   style may define its own, but a document must not mix.)
4. **Inline styles only** — no CSS classes, no shared stylesheet. Paste token values directly.
   Only global CSS allowed = what cannot be inlined (font loading, `word-break`, selection,
   scrollbar).
5. **Doc ownership is strict** — each spec doc owns its layer and excludes others (see the
   table in `README.md §"What each doc owns"`). Put a change in the doc that owns it; don't
   duplicate values across docs.
6. **Three signatures** (make any doc feel same-hand): serif display headings (Noto Serif KR)
   over sans body (Pretendard); a single indigo accent carrying meaning, never decorative;
   the semantic color split.
7. **Korean line breaking** — `word-break: keep-all` is global and mandatory.

## Building a document

Read order: `authoring-guide.md` → `composition-guide.md` → `design.md` → `runtime-spec.md`,
then clone `template.dc.html`. Full quick-start in `README.md`.

**Requirements to render:** serve over http(s) (not `file://`), keep `support.js` beside the
`.dc.html`, allow outbound network (fonts + React UMD). Details in `runtime-spec.md §4`.

## Working notes

- When adding/changing a token: edit `design.md` → update `design.tokens.md` mirror → verify
  against the answer key.
- When extending structure (new page type, component, runtime behavior): put it in the owning
  doc, keep it style-agnostic where possible so future styles inherit it.
- `spec_extensions.md` in `parserimprove/uploads/` is a **proposal** — not yet merged into
  core specs. Don't treat it as authoritative until merged.

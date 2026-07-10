# CLAUDE.md

## What this project is

A reusable **scroll-style HTML presentation system**. Goal: any document built to a given
style — whatever its subject — reads as the work of the **same author** (one consistent
design). A document is a single self-contained HTML page read top→bottom (a "paper sheet",
**not** a slide deck).

The system is split on two axes so **multiple styles** can coexist:

- **`core/`** — style-agnostic structure shared by every style (runtime, shell, DOM contract,
  serving). **Contains no colors/HEX.**
- **`styles/<style>/`** — one style's self-contained SSOT (tokens, components, geometry,
  density, voice, template, answer key).

Today there are two styles, `indigo-serif` (default) and `teal-sans` (internal-engineering docs).
A further style is added by **copying the folder**, never by forking `core/` — see
`ADDING-A-STYLE.md`.

## Repo map

| Path | Owns |
|------|------|
| `README.md` | Entry point + **style registry** + read order + doc-ownership table |
| `ADDING-A-STYLE.md` | **Adding a style** — consolidated clone procedure + invariant gate (process doc; points at SSOT, owns no values) |
| `core/runtime-spec.md` | `.dc.html` shell, `<helmet>`, `DCLogic` lifecycle, DOM contract, serving, the six **chrome-token** slots. Style-agnostic, **no HEX** |
| `core/support.js` reference | The generated runtime; a byte-identical copy sits beside every `.dc.html` (see Requirements) |
| `styles/indigo-serif/design.md` | **All** HEX/px/radius tokens, components, diagram geometry, anti-patterns. This style's visual SSOT |
| `styles/indigo-serif/design.tokens.md` | Machine-readable **mirror** of that `design.md` (derived, not source) |
| `styles/indigo-serif/authoring-guide.md` | Voice, Korean register, skeleton, page types, situation→device, color intent→token map |
| `styles/indigo-serif/composition-guide.md` | Density budgets, in-section layout, focal hierarchy, whitespace/pacing |
| `styles/indigo-serif/template.dc.html` | Runnable fill-in-the-blanks skeleton — start builds here (support.js sidecar next to it) |
| `styles/indigo-serif/design-system.answerkey.dc.html` | Rendered answer key — live gallery; **wins** vs `design.md` on conflict |
| `examples/feedbackops.dc.html` | Worked example (support.js sidecar in `examples/`) |
| `examples/feedbackops-design-report/` | Second worked example + desktop/mobile renders |
| `archive/parserimprove/` | **Archived.** Old design reference (semiconductor log-parser docs). Not part of this project — kept only for provenance |

Worked examples live in `examples/`. `archive/parserimprove/` is a frozen historical
reference the indigo-serif specs were originally abstracted from; it is **not** the product and
carries no live TODOs.

## Core rules

1. **`core/` has zero HEX** — any color literal under `core/` is a bug; it belongs in a style's
   `design.md`. `core/runtime-spec.md` names six chrome tokens (`⟨accent⟩`, `⟨bg-canvas⟩`, …)
   and resolves their values from the active style's `design.md`. Exception: the generated
   `support.js` carries its own internal HEX and is not style-scoped.
2. **A style is self-contained** — all of one style's SSOT lives in `styles/<style>/`. Every HEX
   for that style lives in its `design.md` **only**. Change it there, then re-mirror into that
   folder's `design.tokens.md`.
3. **New style = copy folder, `core/` untouched** — duplicate `styles/<style>/`, swap
   tokens/voice/template, register in `README.md`. If a change would force editing `core/` to
   recolor, that value leaked out of a style — fix the leak, don't fork core.
4. **No `core/` doc names a style folder by literal id** — core refers to "the active style's
   `design.md`", never `styles/indigo-serif/...`. Otherwise core silently points at one style.
5. **Answer key wins** — when a style's `design-system.answerkey.dc.html` and its `design.md`
   disagree, the answer key is correct; update `design.md` to match.
6. **Semantic color split (indigo-serif, normative)** — current/old/problem state = slate +
   amber; target/new/improved state = indigo. Stated once in `styles/indigo-serif/design.md
   §1.4`; other docs reference it. Strongest fingerprint — never violate. Style-scoped: a future
   style may define its own, but one document must not mix.
7. **Inline styles only** — no CSS classes, no shared stylesheet. Paste token values directly.
   Only global CSS allowed = what cannot be inlined (font loading, `word-break`, selection,
   scrollbar).
8. **Doc ownership is strict** — each spec doc owns its layer and excludes others (see the table
   in `README.md §"What each doc owns"`). Put a change in the owning doc; don't duplicate values.
9. **Korean line breaking** — `word-break: keep-all` is global and mandatory.
10. **support.js beside every `.dc.html`** — there is no build step; each `.dc.html` needs a
    byte-identical `support.js` copy in its own directory (runtime does `fetch('./…')`).

## Building a document

Read order for indigo-serif: `styles/indigo-serif/authoring-guide.md` →
`styles/indigo-serif/composition-guide.md` → `styles/indigo-serif/design.md` →
`core/runtime-spec.md`, then clone `styles/indigo-serif/template.dc.html`. Full quick-start in
`README.md`.

**Requirements to render:** serve over http(s) (not `file://`), keep a `support.js` copy beside
the `.dc.html`, allow outbound network (fonts + React UMD). Details in `core/runtime-spec.md §4`.

## Working notes

- When adding/changing a token: edit that style's `design.md` → update its `design.tokens.md`
  mirror → verify against that style's answer key.
- When extending structure (new runtime behavior, DOM contract): put it in `core/`, keep it
  style-agnostic (token names, no HEX, no style-folder paths) so every style inherits it.
- `archive/parserimprove/` is frozen historical reference only — not authoritative, no live
  work items. Don't merge or cite it as product spec.

---

> **Non-normative pointer (not part of the product spec).** This repo also ships an authoring
> harness under `.claude/` — a `/plan` → `/build` skill pipeline plus a mechanical exit gate that
> helps produce a spec-conforming `.dc.html`. It is tooling, not a spec doc: it owns none of the
> invariants above, and if it ever disagrees with `core/` or a style's `design.md`, this file and
> the style specs win. See `.claude/README.md`.

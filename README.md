# Scroll-style HTML presentation system

A reusable system for building single-page, vertical-scroll HTML "explainer" documents (a paper-sheet read top→bottom, not a slide deck). The goal: **any document built to a given style — whatever its subject — reads as the work of the same author.**

The system separates two axes:

- **`core/`** — style-agnostic structure shared by every style: the runtime container, the `.dc.html` shell, the `DCLogic` lifecycle, the DOM naming contract, serving rules. **No colors live here.**
- **`styles/<style>/`** — one design style's self-contained SSOT: visual tokens, components, diagram geometry, density budgets, voice, a runnable template, and a rendered answer key.

A document picks **one** style and never mixes two.

---

## Style registry

| Style | Identity | Folder |
|-------|----------|--------|
| **indigo-serif** *(default, only style today)* | Serif display headings (Noto Serif KR) over sans body (Pretendard); single indigo `#4338CA` accent; semantic slate+amber (as-is) vs indigo (to-be) split. | [`styles/indigo-serif/`](styles/indigo-serif/) |

Pick a style, then jump straight to its two most-opened files:

- **indigo-serif** — build from [`styles/indigo-serif/template.dc.html`](styles/indigo-serif/template.dc.html); see it rendered in [`styles/indigo-serif/design-system.answerkey.dc.html`](styles/indigo-serif/design-system.answerkey.dc.html).

> **Adding a style:** copy `styles/indigo-serif/` to `styles/<new>/`, swap its tokens / voice / template, register it in the table above. `core/` stays untouched — that is the whole point of the split. (See `CLAUDE.md` for the invariants a new style must hold.)

The reference the indigo-serif specs are abstracted from: [`reference/parserimprove/로그파서 개선 설명자료 v2.dc.html`](reference/parserimprove/로그파서%20개선%20설명자료%20v2.dc.html) — the canonical worked example. (Other `.dc.html` files under `reference/` are earlier drafts; ignore them.)

The **rendered answer key** — a live gallery of every token, component, chart, flowchart shape, data-viz and UML diagram a style defines — is that style's `design-system.answerkey.dc.html`. `design.md` is the written mirror of it; when the two disagree, the answer key wins and `design.md` is updated to match. Open it (served over http) to *see* what each spec value produces.

---

## Read in this order (for the indigo-serif style)

1. **`styles/indigo-serif/authoring-guide.md`** — *what to write and which device to reach for.* Voice, Korean register, document structure, page types, when-to-use decisions. Start here to plan the document.
2. **`styles/indigo-serif/composition-guide.md`** — *how much goes in a section and how to arrange it.* Density budgets per page type, in-section composition/layout, focal hierarchy, whitespace/rhythm, viewport pacing. Read after you've picked page types, before you place components.
3. **`styles/indigo-serif/design.md`** — *exactly how it should look.* Visual tokens (color, type, spacing, radius), components, diagram geometry, anti-patterns. Copy exact values from here.
4. **`core/runtime-spec.md`** — *the container and JS every document runs inside.* The `.dc.html` shell, `<helmet>`, the `data-dc-script` / `DCLogic` lifecycle, the scroll-progress + active-nav scripts, the DOM naming contract, serving requirements. **Without this the page does not render or behave correctly.** Style-agnostic — it names six *chrome tokens* and pulls their values from the active style's `design.md`.
5. **`styles/indigo-serif/template.dc.html`** — *start here when building.* A topic-neutral, runnable skeleton: clone it and fill in content.

---

## What each doc owns (and explicitly excludes)

| Doc | Owns | Does NOT cover |
|-----|------|----------------|
| `core/runtime-spec.md` | `.dc.html` structure, `<x-dc>`/`<helmet>`, `DCLogic` lifecycle, DOM contract (`#rprog`, `[data-navlink]`, section ids), runtime scripts, serving, the six chrome-token slots | Visual values (→ a style's `design.md`), prose (→ a style's `authoring-guide.md`) — **and no colors** |
| `styles/<style>/authoring-guide.md` | Voice, Korean register, skeleton, page-type registry, situation→device table, color **intent→token-name** map, pre-ship content checklist | Exact HEX/px values (→ `design.md`), runtime/JS (→ `core/runtime-spec.md`) |
| `styles/<style>/composition-guide.md` | Density budgets (elements per section/viewport), in-section composition/layout, focal hierarchy, whitespace/rhythm, viewport pacing, the density/composition checklist | Exact token values (→ `design.md`), voice/skeleton/page-type content (→ `authoring-guide.md`), runtime (→ `core/runtime-spec.md`) |
| `styles/<style>/design.md` | All HEX/px/radius tokens, components, diagram visuals, the **normative** semantic-color rule, anti-patterns, visual-reproduction checklist | Content/voice (→ `authoring-guide.md`), how-much/arrangement (→ `composition-guide.md`), JS runtime/container (→ `core/runtime-spec.md`) |
| `styles/<style>/template.dc.html` | A working, fill-in-the-blanks skeleton carrying this style's pasted values | — |
| `styles/<style>/design.tokens.md` | Machine-readable token mirror in [DESIGN.md-spec](https://github.com/google-labs-code/design.md) form, for AI/tooling consumption | Anything beyond colors/type/spacing/components — a **derived mirror** of `design.md`, not a source of truth |

**Single source of truth:** within a style, every HEX value lives in that style's `design.md` only. The semantic-color invariant (AS-IS = slate+amber, TO-BE = indigo) is stated normatively once in `styles/indigo-serif/design.md §1.4`; other docs reference it. `core/runtime-spec.md` holds **no** HEX — it names chrome tokens and resolves their values from the active style's `design.md`.

---

## Quick start for a new document

1. **Pick a style** from the registry above (today: indigo-serif).
2. Write the **title sequence first** — one noun-phrase section title each. Read them back as a table of contents; revise until the headings alone tell the story.
3. Lay out the skeleton (`authoring-guide.md §2`) and pick each section's **page type** (`authoring-guide.md §4` / `design.md §6`). Target ~6–9 numbered sections + a reference appendix; merge thin rows.
4. Clone the style's **`template.dc.html`**. For each section: lead paragraph → core content → decide if it's diagrammable (`authoring-guide.md §5.1`) → build the figure with exact values from `design.md`.
5. Apply color/emphasis by **intent** (`authoring-guide.md §5.2–5.3`); copy exact HEX from `design.md`.
6. Run the pre-ship checklist (`authoring-guide.md §6`) and the visual-reproduction checklist (`design.md §7`) before shipping.

---

## Requirements

Serve over http(s) (not `file://`), keep a copy of `support.js` **beside** each `.dc.html` file (there is no build step — copies are the byte-identical generated runtime), and allow outbound network for fonts + React UMD. Details in `core/runtime-spec.md §4`.

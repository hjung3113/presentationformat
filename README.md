# Scroll-style HTML presentation system

A reusable system for building single-page, vertical-scroll HTML "explainer" documents (a paper-sheet read top→bottom, not a slide deck). The goal: **any document built to a given style — whatever its subject — reads as the work of the same author.**

The system separates two axes:

- **`core/`** — style-agnostic structure shared by every style: the runtime container, the `.dc.html` shell, the `DCLogic` lifecycle, the DOM naming contract, serving rules. **No colors live here.**
- **`styles/<style>/`** — one design style's self-contained SSOT: visual tokens, components, diagram geometry, density budgets, voice, a runnable template, and a rendered answer key.
- **`core/components.md` + `core/components/`** — the shared **figure contract**: which diagram a section gets (content *shape* → component) and how each component is built (grid-placed templates with fill-in slots). Each style ships the same components with its own values in `styles/<style>/components/`.

A document picks **one** style and never mixes two.

---

## Style registry

| Style | Identity | Folder |
|-------|----------|--------|
| **indigo-serif** *(default)* | Serif display headings (Noto Serif KR) over sans body (Pretendard); single indigo `#4338CA` accent; semantic slate+amber (as-is) vs indigo (to-be) split. | [`styles/indigo-serif/`](styles/indigo-serif/) |
| **teal-sans** | One IBM Plex superfamily (Plex Sans body+headings, Plex Mono); single teal `#0F766E` accent; semantic slate (old) + red (problem) vs teal (target) split. For internal engineering / technical docs. | [`styles/teal-sans/`](styles/teal-sans/) |
| **feedbackops-light** | The FeedbackOps product design language (Pack 17 light): porcelain `#F3F7FE` canvas, Inter + Pretendard, JetBrains Mono, single Samsung-blue `#1428A0` accent, flat surfaces, 6–8px radii; semantic slate (old) + red/amber (problem/caution) vs blue (target). For FeedbackOps reports, status updates, and design briefs. | [`styles/feedbackops-light/`](styles/feedbackops-light/) |

Pick a style, then jump straight to its two most-opened files:

- **indigo-serif** — build from [`styles/indigo-serif/template.dc.html`](styles/indigo-serif/template.dc.html); see it rendered in [`styles/indigo-serif/design-system.answerkey.dc.html`](styles/indigo-serif/design-system.answerkey.dc.html).
- **teal-sans** — build from [`styles/teal-sans/template.dc.html`](styles/teal-sans/template.dc.html); see it rendered in [`styles/teal-sans/design-system.answerkey.dc.html`](styles/teal-sans/design-system.answerkey.dc.html).
- **feedbackops-light** — build from [`styles/feedbackops-light/template.dc.html`](styles/feedbackops-light/template.dc.html); see it rendered in [`styles/feedbackops-light/design-system.answerkey.dc.html`](styles/feedbackops-light/design-system.answerkey.dc.html).

Every style also has a **component gallery** — `styles/<style>/components.gallery.dc.html` — showing all 29 paste-ready figure components (UML activity, swimlane, sequence, state machine, class, use case, layer map, data flow, ER relations, hub, screen map, gantt, timeline, status board, risk matrix, decision block, charts, …) in that style.

> **Adding a style:** copy `styles/indigo-serif/` to `styles/<new>/`, swap its tokens / voice / template, register it in the table above. `core/` stays untouched — that is the whole point of the split. **Full procedure + invariant gate: [`ADDING-A-STYLE.md`](ADDING-A-STYLE.md).**

> **Using this from an agent host:** Claude Code and opencode pick up the `/plan → /build` skills on clone. For **Codex**, run `./install.sh` then restart. See [`AGENTS.md`](AGENTS.md).

Worked examples live in [`examples/`](examples/) — start with [`examples/feedbackops-light-brief/`](examples/feedbackops-light-brief/) (content plan with shapes → nine figure components → gate passing with `--plan`), then [`examples/feedbackops.dc.html`](examples/feedbackops.dc.html). (The indigo-serif specs were originally abstracted from an older design reference now frozen under [`archive/parserimprove/`](archive/parserimprove/); it is historical provenance only, not part of this project.)

The **rendered answer key** — a live gallery of every token, component, chart, flowchart shape, data-viz and UML diagram a style defines — is that style's `design-system.answerkey.dc.html`. `design.md` is the written mirror of it; when the two disagree, the answer key wins and `design.md` is updated to match. Open it (served over http) to *see* what each spec value produces.

---

## Figures — how a section gets the right diagram

Diagrams are chosen by **content shape**, not by taste, and built by **pasting**, not by drawing:

1. **Classify** each section into one shape from [`core/components.md`](core/components.md) §1 (e.g. `lifecycle`, `role-handoff`, `interaction`, `layered-structure`), using its first-"yes"-wins questions (§2). Korean signal words are listed per shape.
2. **Look up** the component for that shape (§1 table): `lifecycle` → `state-machine`, `role-handoff` → `swimlane`, `interaction` → `sequence`, …
3. **Paste** `styles/<style>/components/<component>.html`, replace every `⟦…⟧`, and change only what its `HOW TO FILL` header names (column count, `grid-column`, a percentage, or a margin from its lookup table — never pixel coordinates).

`/plan` records the shape and edge-carrying `figure-data` per section; `/build` does the lookup; the exit gate (`--plan`) fails any section whose shape's component is missing and any unfilled `⟦…⟧`. Document-type recipes (설계 설명서 `explainer`, 상태 보고 `status-report`, 의사결정 제안 `proposal`, 기능 소개 `feature-guide`, 분석 `analysis`, 필요성·투자 설득 `pitch`) are in `core/components.md` §5.

---

## Read in this order (for the indigo-serif style)

1. **`styles/indigo-serif/authoring-guide.md`** — *what to write and which device to reach for.* Voice, Korean register, document structure, page types, when-to-use decisions. Start here to plan the document.
2. **`styles/indigo-serif/composition-guide.md`** — *how much goes in a section and how to arrange it.* Density budgets per page type, in-section composition/layout, focal hierarchy, whitespace/rhythm, viewport pacing. Read after you've picked page types, before you place components.
3. **`styles/indigo-serif/design.md`** — *exactly how it should look.* Visual tokens (color, type, spacing, radius), components, diagram geometry, anti-patterns. Copy exact values from here.
4. **`core/components.md`** — *which figure each section gets.* Content shape → component, the classification procedure, paste/fill rules, document recipes. Then skim `styles/indigo-serif/components/README.md` (the paste-ready index).
5. **`core/runtime-spec.md`** — *the container and JS every document runs inside.* The `.dc.html` shell, `<helmet>`, the `data-dc-script` / `DCLogic` lifecycle, the scroll-progress + active-nav scripts, the DOM naming contract, serving requirements. **Without this the page does not render or behave correctly.** Style-agnostic — it names six *chrome tokens* and pulls their values from the active style's `design.md`.
6. **`styles/indigo-serif/template.dc.html`** — *start here when building.* A topic-neutral, runnable skeleton: clone it and fill in content.

---

## Authoring harness

There is an optional `/plan` → `/build` skill pipeline (plus a Node-based exit gate) that helps
produce a spec-conforming document — see [`.claude/README.md`](.claude/README.md). It is tooling
only, separate from the product spec above; it runs co-equally on Claude Code and opencode.
`/plan` records each document's `doc-type`, `audience`, optional `labels: en|ko` (label language: English category labels for engineering docs, Korean for executive/user), hero text (`title`, optional `eyebrow`, `thesis`, `cover-tokens`)
and, for a `pitch`, a `facts.md` ledger so every claim and number traces to a source; `/build` counts a
document as built only when its exit gate — `node .claude/lib/verify-doc.mjs <doc> --canonical-support
styles/<id>/support.js --style <id> --plan <content-plan.md>` — prints the `GATE PASSED` line.

---

## What each doc owns (and explicitly excludes)

| Doc | Owns | Does NOT cover |
|-----|------|----------------|
| `core/runtime-spec.md` | `.dc.html` structure, `<x-dc>`/`<helmet>`, `DCLogic` lifecycle, DOM contract (`#rprog`, `[data-navlink]`, section ids, the print hooks), runtime scripts, the print block, serving, the six chrome-token slots | Visual values (→ a style's `design.md`), prose (→ a style's `authoring-guide.md`) — **and no colors** |
| `core/components.md` | Content-shape vocabulary, shape→component mapping, classification procedure, gate hard-fail pairs, paste/fill contract (incl. the text-safe muted-ink rule and the `labels: en\|ko` label-language table), document recipes | Values (→ a style's `design.md`), component geometry (→ `core/components/`) — **no colors** |
| `core/components/*.html` | Style-agnostic component templates: structure, role placeholders (`⟨accent⟩`), `⟦slot⟧` markers, fill instructions; `README.md` there is a generated index | Values — a template names roles, never HEX |
| `styles/<style>/components/` + `components.gallery.dc.html` | **Generated** paste-ready components with this style's literal values, and their rendered gallery (`node .claude/lib/components.mjs build`) | Anything hand-written — never edit; change the template or the style's tokens |
| `styles/<style>/authoring-guide.md` | Voice, Korean register, skeleton, page-type registry, color **intent→token-name** map, pre-ship content checklist (situation→figure points at `core/components.md`) | Exact HEX/px values (→ `design.md`), runtime/JS (→ `core/runtime-spec.md`) |
| `styles/<style>/composition-guide.md` | Density budgets (elements per section/viewport), in-section composition/layout, focal hierarchy, whitespace/rhythm, viewport pacing, the density/composition checklist | Exact token values (→ `design.md`), voice/skeleton/page-type content (→ `authoring-guide.md`), runtime (→ `core/runtime-spec.md`) |
| `styles/<style>/design.md` | All HEX/px/radius tokens, components, diagram visuals, the **normative** semantic-color rule, anti-patterns, visual-reproduction checklist | Content/voice (→ `authoring-guide.md`), how-much/arrangement (→ `composition-guide.md`), JS runtime/container (→ `core/runtime-spec.md`) |
| `styles/<style>/template.dc.html` | A working, fill-in-the-blanks skeleton carrying this style's pasted values | — |
| `styles/<style>/design.tokens.md` | Machine-readable token mirror in [DESIGN.md-spec](https://github.com/google-labs-code/design.md) form, for AI/tooling consumption — also the value source for the component generator (`colors`, `rounded`, `fontStacks`) | Anything beyond colors/type/spacing/components — a **derived mirror** of `design.md`, not a source of truth |

**Single source of truth:** within a style, every HEX value lives in that style's `design.md` only. The semantic-color invariant (AS-IS = slate+amber, TO-BE = indigo) is stated normatively once in `styles/indigo-serif/design.md §1.4`; other docs reference it. `core/runtime-spec.md` holds **no** HEX — it names chrome tokens and resolves their values from the active style's `design.md`.

---

## Quick start for a new document

1. **Pick a style** from the registry above (indigo-serif · teal-sans · feedbackops-light).
2. Write the **title sequence first** — one noun-phrase section title each. Read them back as a table of contents; revise until the headings alone tell the story.
3. Lay out the skeleton (`authoring-guide.md §2`) and pick each section's **page type** (`authoring-guide.md §4` / `design.md §6`). Target ~6–9 numbered sections + a reference appendix; merge thin rows.
4. Clone the style's **`template.dc.html`**. For each section: lead paragraph → classify its **shape** (`core/components.md` §2) → paste that shape's component from `styles/<style>/components/` and fill every `⟦…⟧`.
5. Apply color/emphasis by **intent** (`authoring-guide.md §5.2–5.3`); copy exact HEX from `design.md`.
6. Run the pre-ship checklist (`authoring-guide.md §6`) and the visual-reproduction checklist (`design.md §7`) before shipping.

---

## Requirements

Serve over http(s) (not `file://`), keep a copy of `support.js` **beside** each `.dc.html` file (there is no build step — copies are the byte-identical generated runtime), and allow outbound network for fonts + React UMD. Details in `core/runtime-spec.md §4`.

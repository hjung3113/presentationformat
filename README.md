# Scroll-style HTML presentation system

A reusable system for building single-page, vertical-scroll HTML "explainer" documents (a paper-sheet read top→bottom, not a slide deck). The goal: **any document built to this system — whatever its subject — reads as the work of the same author.**

The reference these specs are abstracted from: [`parserimprove/로그파서 개선 설명자료 v2.dc.html`](parserimprove/로그파서%20개선%20설명자료%20v2.dc.html) — the canonical worked example. (The other two `.dc.html` files in that folder are earlier drafts; ignore them.)

---

## Read in this order

1. **`authoring-guide.md`** — *what to write and which device to reach for.* Voice, Korean register, document structure, page types, when-to-use decisions. Start here to plan the document.
2. **`design.md`** — *exactly how it should look.* Visual tokens (color, type, spacing, radius), components, diagram geometry, anti-patterns. Copy exact values from here.
3. **`runtime-spec.md`** — *the container and JS every document runs inside.* The `.dc.html` shell, `<helmet>`, the `data-dc-script` / `DCLogic` lifecycle, the scroll-progress + active-nav scripts, the DOM naming contract, serving requirements. **Without this the page does not render or behave correctly.**
4. **`template.dc.html`** — *start here when building.* A topic-neutral, runnable skeleton: clone it and fill in content.

---

## What each doc owns (and explicitly excludes)

| Doc | Owns | Does NOT cover |
|-----|------|----------------|
| `authoring-guide.md` | Voice, Korean register, skeleton, page-type registry, situation→device table, color **intent→token-name** map, pre-ship content checklist | Exact HEX/px values (→ `design.md`), runtime/JS (→ `runtime-spec.md`) |
| `design.md` | All HEX/px/radius tokens, components, diagram visuals, the **normative** semantic-color rule, anti-patterns, visual-reproduction checklist | Content/voice (→ `authoring-guide.md`), JS runtime/container (→ `runtime-spec.md`) |
| `runtime-spec.md` | `.dc.html` structure, `<x-dc>`/`<helmet>`, `DCLogic` lifecycle, DOM contract (`#rprog`, `[data-navlink]`, section ids), runtime scripts, serving | Visual values (→ `design.md`), prose (→ `authoring-guide.md`) |
| `template.dc.html` | A working, fill-in-the-blanks skeleton | — |

**Single source of truth:** every HEX value lives in `design.md` only. The semantic-color invariant (AS-IS = slate+amber, TO-BE = indigo) is stated normatively once in `design.md §1.4`; other docs reference it.

---

## Quick start for a new document

1. Write the **title sequence first** — one noun-phrase section title each. Read them back as a table of contents; revise until the headings alone tell the story.
2. Lay out the skeleton (`authoring-guide.md §2`) and pick each section's **page type** (`authoring-guide.md §4` / `design.md §6`). Target ~6–9 numbered sections + a reference appendix; merge thin rows.
3. Clone **`template.dc.html`**. For each section: lead paragraph → core content → decide if it's diagrammable (`authoring-guide.md §5.1`) → build the figure with exact values from `design.md`.
4. Apply color/emphasis by **intent** (`authoring-guide.md §5.2–5.3`); copy exact HEX from `design.md`.
5. Run the pre-ship checklist (`authoring-guide.md §6`) and the visual-reproduction checklist (`design.md §7`) before shipping.

---

## Requirements

Serve over http(s) (not `file://`), keep `support.js` beside the `.dc.html` file, and allow outbound network for fonts + React UMD. Details in `runtime-spec.md §4`.

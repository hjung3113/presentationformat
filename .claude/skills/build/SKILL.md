---
name: build
description: Render a confirmed content-plan.md into a verified scroll-style .dc.html document in a chosen style, then run the exit gate. Use after /plan has produced and the user has confirmed a content-plan.md, when the user is ready to actually produce the document. Takes a style id (only indigo-serif exists today) as an argument. A document that has not passed the gate is not considered built.
---

# /build — render + verify

This skill takes a confirmed `content-plan.md` (produced by `/plan`) and a chosen style, and
renders it into a single self-contained `.dc.html` document plus its `support.js` sidecar, then
runs a mechanical exit gate. **Linear build for this version — no subagent fan-out.** Build every
section in one pass, in one context.

Verification is not a separate step the user asks for later — it is `/build`'s own exit gate. A
document that has not passed the gate is not "built," regardless of how the HTML looks.

## Inputs

- `content-plan.md` — the seam contract from `/plan`. Style-agnostic: header (`has-as-is`,
  `metrics-mode`, `act-structure`, `source-ref`) plus, per section, `title`, `intent`, `payload`
  (structured notes, not prose), `figure-data`, `source-span`.
- `--style <id>` — which style to render into. Only `indigo-serif` exists today; if asked for any
  other id, say so and stop rather than guessing at a style that doesn't exist.

## Step 1 — Read the plan and the style's specs

Read the full `content-plan.md`. Then read the chosen style's own specs, in this order:
`authoring-guide.md` (voice, page-type registry §4, situation→device §5.1, color intent→token map
§5.2), `composition-guide.md` (density budgets, in-section layout), `design.md` (exact HEX/px
tokens, semantic color law §1.4). These three files are that style's complete self-contained SSOT
— never reach into another style's folder, and never invent a value not in them.

**The rendered `design-system.answerkey.dc.html` is the visual oracle for this style, not the
prose in `design.md`.** Where the two disagree, the answer key wins (repo rule: answer-key-wins).
Use the answer key to see how a component actually looks when in doubt.

## Step 2 — Validate the plan fits the style's skeleton

Before rendering anything, check that the plan's section count and shape fit the style's skeleton
(the style's authoring-guide describes its target section-count range and when it expects
act-grouped structure). If the plan has far too few or too many sections for the skeleton, or its
`act-structure` header disagrees with what its section count implies, surface that mismatch to the
user before building rather than silently forcing a bad fit.

## Step 3 — Clone the style's template

Start every build from a fresh copy of the style's `template.dc.html` — never write the document
shell, `<helmet>`, nav, progress bar, or runtime script block from scratch. The template already
carries the shell + runtime contract; only its section content is a stub to be replaced.

## Step 4 — Map each plan section into the style

For each section in the plan, in order, derive its rendering purely from the style's own specs —
the plan never states these choices itself:

- **`intent` → page type.** Match the section's stated intent to the style's page-type registry
  (authoring-guide, content patterns by page type) — e.g. an intent framing a bottleneck or
  current state maps to a Background/Problems-shaped page; an intent describing a proposed model
  maps to a Direction/Approach-shaped page. Follow that page type's own density and structure
  rules (composition-guide) once chosen.
- **`figure-data` → diagram device.** Use the style's situation→device table and reviewer-question
  column to pick the concrete figure (before/after panel, flow, bar chart, gantt, matrix, UML
  activity, swimlane, state machine, lane/surface map, etc.) that matches the shape of the data
  the plan carried — not a device picked for visual variety. A section with no `figure-data` gets
  no figure; don't invent one to fill space, and don't leave a diagrammable shape as bare prose
  either. A branching workflow is not a process row; ownership is not equal cards; UI operation
  needs a screen/surface/role map; decision asks need a visible decision block or open-question
  table.
- **State → semantic color.** Use the plan's `has-as-is` header and each section's content to
  decide which parts are current/old/problem state versus target/new/improved state, then apply
  the style's semantic color law accordingly. Never mix the two halves of that law inside one
  structural zone.

Before writing HTML, create the composition-guide section preflight for every numbered section:
`Section | Page type | Claim type | Primary device | Why not cards/table? | Expected count |
Figure budget`. Treat the preflight hard-fail cases as build blockers even though the automated
visual tier only reports warnings for now. If the plan's `narrative-lens` is missing because it
was produced by an older `/plan`, infer it from the confirmed TOC and keep the inference explicit
in your build notes.

## Step 5 — Render the voice

`payload` in the plan is structured notes and facts, **not finished prose** — turning it into the
style's actual voice and register (sentence endings, register split, emphasis rules, numbering
conventions, everything the style's authoring-guide sets out for prose) is `/build`'s job, not
`/plan`'s. Do not copy `payload` text verbatim into the document; compose it in the target
language and register the style specifies, staying strictly inside the facts the plan already
carried — `/build` does not re-read source docs or add new claims.

## Step 6 — Assemble the document

Replace the template's stub sections with the rendered sections in plan order, keeping every
section a distinct element with a unique id, and keeping every nav link's target pointing at a
real section id in the document. Keep to the style's inline-styles-only discipline: no CSS
classes, no shared stylesheet, values pasted directly as inline styles, matching the template's
existing pattern.

When adding detail during assembly, follow the composition-guide density-change protocol: classify
new material as `core`, `support`, or `aside`; split/promote `core`; keep `support` only if the
viewport and section budgets still hold; demote `aside` to footnote/reference/callout. Do not
answer a density request by appending a peer card grid under an already-valid primary figure.

## Step 7 — Copy the support.js sidecar

Copy the style's canonical `support.js` **byte-for-byte** into the same directory as the rendered
`.dc.html`. Never regenerate it, never hand-write or edit its contents, and never copy a
non-canonical or previously-modified copy — always the one canonical file the style ships. The
runtime loads it via a relative `fetch`, so it must sit right beside the document.

## Step 8 — Run the exit gate

Run the gate against the freshly built document and sidecar, passing the style's accent color and
the path to its canonical `support.js`:

```
node .claude/lib/verify-doc.mjs <doc.dc.html> --accent <style-accent-hex> --canonical-support <path/to/canonical/support.js>
```

The gate runs two tiers:

- A **mechanical hard gate** that always runs without a browser: accent color *present* somewhere
  in the document (a substring check, not a zone check), `word-break: keep-all` present,
  inline-styles-only, unique section ids with intact nav-link targets, `support.js` sidecar
  byte-identical to the canonical file. This must pass — exit 0 — for the document to count as
  built. **This gate does not verify semantic-color-split correctness** — it cannot tell whether
  slate/amber stayed in AS-IS/problem zones and indigo stayed in TO-BE/target zones per the color
  law. That correctness depends on following Step 4's state→color mapping and is checked, if at
  all, by the visual render tier below or by eyeballing against the style's answer key — never
  claim the mechanical gate guarantees color-zone correctness.
- A **warning-only desktop composition tier** that only runs if a headless browser is available.
  It serves the document over localhost and evaluates desktop viewports `1366x768` and `1440x900`
  for section height, stacked grids, 4-column text grids, missing primary figures, low-emphasis
  decision asks, meaning-block count, and desktop overflow. These rows print as `WARN` and do
  **not** change the exit code until the warnings have been calibrated against accepted artifacts.
  If a headless browser is not available, the gate reports the visual check as unverified rather
  than silently skipping it — treat that as an honest "not checked," not a pass.

**Treat any non-zero exit from the gate as "not built."** Read every check the gate prints; if any
mechanical check fails, fix the document and rerun the gate — do not hand the document to the user
as finished while a check is failing. Do not report success on the strength of the visual line
alone, and do not claim the visual/composition tier passed when it reports unverified. Do read and
summarize any `WARN` rows for the user; warnings are not failures, but they are review evidence.

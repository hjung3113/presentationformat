---
name: build
description: Render a confirmed content-plan.md into a verified scroll-style .dc.html document in a chosen style, then run the exit gate. Use after /plan has produced and the user has confirmed a content-plan.md, when the user is ready to actually produce the document. Takes a style id (indigo-serif, teal-sans, or feedbackops-light) as an argument. A document that has not printed the GATE PASSED line is not considered built.
---

# /build — render + verify

This skill takes a confirmed `content-plan.md` (produced by `/plan`) and a chosen style, and
renders it into a single self-contained `.dc.html` document plus its `support.js` sidecar, then
runs a mechanical exit gate. **Linear build for this version — no subagent fan-out.** Build every
section in one pass, in one context.

Verification is not a separate step the user asks for later — it is `/build`'s own exit gate. A
document that has not passed the gate is not "built," regardless of how the HTML looks.

## Inputs

- `content-plan.md` — the seam contract from `/plan`. Style-agnostic: header (`doc-type`, `audience`,
  `reader-action`, `has-as-is`, `metrics-mode`, `act-structure`, `narrative-lens`, `source-ref`, and
  the hero keys `title`, `thesis`, `cover-tokens`, optional `eyebrow`, `facts`, `as-of`) plus, per section
  (`## N. 제목` → `sN`, an unnumbered `##` → `sref`), `intent`, `shape`, `payload` (structured notes,
  not prose), `figure-data`, `source-span`.
- `--style <id>` — which style to render into: a folder under `styles/` (today `indigo-serif`,
  `teal-sans`, `feedbackops-light`; the registry is `README.md` §"Style registry"). If asked for an id
  with no folder, say so and stop rather than guessing at a style that doesn't exist.

**The plan is the only content input.** Do not re-read the original source docs and do not add a
claim, a number, or a hero token the plan does not carry (the exit gate traces every number back to
the plan and its `facts.md`).

## Step 1 — Read the plan and the style's specs

**Fail-fast on a malformed plan first.** Before reading anything else, mechanically validate the
`content-plan.md`:

```
node .claude/lib/plan-schema.mjs <content-plan.md>
```

Exit `0` = the plan is shaped correctly; proceed (read its `WARN` lines and mention them to the user —
they are review items, not blockers). Exit `1` = the plan is malformed (the CLI prints each missing
header key, placeholder, unknown value, missing field, unknown shape, or figure shape without its
figure-data key) — do not build; send the user back to `/plan` to fix it, or fix the plan if the fix is
unambiguous. Exit `2` = usage/read error (wrong path). A plan that fails this check is not buildable,
the same way a document that fails the exit gate (Step 8) is not built. (This `node .claude/lib/…`
path is repo-relative — see the note at Step 8 if `node` cannot find it.)

Read the full `content-plan.md`. Then read `core/components.md` (shape → component contract, paste
rules) and the chosen style's own specs, in this order: `authoring-guide.md` (voice, page-type
registry §4, color intent→token map §5.2), `composition-guide.md` (density budgets, in-section
layout), `design.md` (exact HEX/px tokens, semantic color law §1.4), and `components/README.md` (the
style's paste-ready component index). These are that style's complete self-contained SSOT — never
reach into another style's folder, and never invent a value not in them.

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
shell, `<helmet>`, nav, progress bar, print block, or runtime script block from scratch. The
template already carries the shell + runtime contract; only its text and section content are stubs
to be replaced. Every piece of template text is a `⟦…⟧` slot (hero, nav, section stubs, closing
line), so a leftover fails the gate.

**Fill the hero only from the plan header — never invent it:**

- the hero eyebrow pill ← the plan's optional `eyebrow:` header key, verbatim. If the plan has none, write
  `<DOC-TYPE in English caps> · <audience in Korean>` — e.g. `PROPOSAL · 관리자용`, `FEATURE GUIDE · 사용자용`
  (`audience` executive → 관리자용, user → 사용자용, developer → 개발자용; a hyphen in the doc-type becomes a
  space) — and nothing else: no invented subtitle, no tagline;
- the hero title ← `title`; the thesis paragraph ← `thesis` (compose it in the style's voice and register
  — the plan's thesis may be in any register, the page never is — but keep its meaning and keep its
  citation out of the visible text);
- each hero token (value + label) ← one entry of `cover-tokens`, in order; delete the unused token
  boxes — never pad to four and never add a token the plan lacks;
- the hero meta line ← `as-of` (e.g. 기준 YYYY-MM-DD) and nothing else; delete the line if the plan
  has no `as-of`. Delete the optional purpose line unless `reader-action` is worth a sentence there;
- the sticky-nav brand ← the title (short form).

**Nav labels come from the section titles** — one link per numbered section, each label the
section's title cut to a Korean 2–4-character keyword (the appendix gets the muted `ref` link). Section
ids are `s1…sN` in plan order and `sref` for the appendix; keep every `data-screen-label`, nav
`data-navlink` and `href` in agreement. **Act dividers** (documents above ~9 sections) are a `<div>`,
never a `<section>` — a `<section>` breaks the section count the gate checks against the plan.
**Act-divider spacing** (the style's `design.md §4.12`): the divider takes `margin:36px 0 0` when it is the
first block in the sheet and `margin:8px 0 0` after a section; the **first section after a divider drops its
`border-top`** and uses `padding:48px 0 56px` (later sections of the act keep `56px 0` + `border-top`).

## Step 4 — Map each plan section into the style

**Figures are a lookup, not a design decision.** For each section, in order:

1. Read its `shape`. (Older plan without shapes: classify it now with `core/components.md` §2 and
   write the result into your build notes — never skip the step.)
2. Look up the component for that shape in `core/components.md` §1.
3. Open **`styles/<style>/components/<component>.html`** (never `core/components/` — that one still
   has `⟨role⟩` placeholders). Read its `HOW TO FILL` header.
4. Paste the `<div data-component="…">` block under the section's lead paragraph and fill it from
   the section's `figure-data`: replace every `⟦…⟧`, copy `▼ REPEAT` units to match the item count,
   pick `VARIANT`s by meaning, delete unused `OPTIONAL` blocks, and set only the values the header
   names (column count — the same N in **every** `repeat(N,1fr)` and `calc(100% / N)` — a
   `grid-column`, a percentage slot together with its label, or a margin from its lookup table).
   **A thing the plan marks `[planned]` (or whose fact is `designed`/`planned`) is drawn with the component's
   planned variant** — muted dashed outline + state chip — never the built look (`core/components.md` §4).
   **A `text-table` section pastes the `table` component and fills it from the section's figure-data**
   (`columns: … | rows: …` — those columns and those rows, nothing added or dropped). A table in the
   reference appendix (`sref`), or a secondary table that follows another figure, uses the table's **soft
   header** variant (swap the header row for the soft-header VARIANT in its HOW TO FILL).
5. Never hand-draw a figure the library has, never use absolute pixel coordinates to place nodes,
   and never change a pasted component's colors, radii, or fonts. If the content truly fits no
   component, use the closest one and say so in your build notes.

Then derive the rest of the section purely from the style's own specs —
the plan never states these choices itself:

- **`intent` → page type.** Match the section's stated intent to the style's page-type registry
  (authoring-guide, content patterns by page type) — e.g. an intent framing a bottleneck or
  current state maps to a Background/Problems-shaped page; an intent describing a proposed model
  maps to a Direction/Approach-shaped page. Follow that page type's own density and structure
  rules (composition-guide) once chosen.
- **`shape` → component** (above). The shape decides the figure; visual variety never does. A
  section with shape `none` gets no figure; don't invent one to fill space, and don't leave a
  figure shape as bare prose or cards either — the gate fails that (`plan-shapes`).
- **State → semantic color.** Use the plan's `has-as-is` header and each section's content to
  decide which parts are current/old/problem state versus target/new/improved state, then apply
  the style's semantic color law accordingly. Never mix the two halves of that law inside one
  structural zone. A cost-of-the-status-quo number is a *problem* tile, not the accent tile; a legacy
  system or a legacy gantt bar is the AS-IS color.

Before writing HTML, create the composition-guide section preflight for every numbered section:
`Section | Page type | Shape | Component | Lead promises (count) | Figure budget`. The `Component`
column is copied from the lookup, not chosen. Treat the preflight hard-fail cases as build blockers even though the automated
visual tier only reports warnings for now. If the plan's `narrative-lens` is missing because it
was produced by an older `/plan`, infer it from the confirmed TOC and keep the inference explicit
in your build notes.

## Step 5 — Render the voice

`payload` in the plan is structured notes and facts, **not finished prose** — turning it into the
style's actual voice and register (sentence endings, register split, emphasis rules, numbering
conventions, everything the style's authoring-guide sets out for prose) is `/build`'s job, not
`/plan`'s. Do not copy `payload` text verbatim into the document; compose it in the target
language and register the style specifies, staying strictly inside the facts the plan already
carried — `/build` does not re-read source docs or add new claims. Keep the plan's markers
wherever a number appears: "(추정)" after an estimate, "(소유자 진술)" after an owner statement, and
designed/planned facts stay in the tense the plan gave them. A `pitch` ends with its explicit request
and does not use the "승인 요청서가 아니라" opener (the style's authoring-guide §1).

**Register conversion.** The plan's `thesis` and `payload` may be written in any register — notes, `~합니다`,
bare nouns. The document is **always** rendered in the style's register (these styles: `~한다/~된다/~이다`
문어체 for prose, 개조식 for chips and labels — authoring-guide §3.1). Convert the sentence, keep the meaning
and the markers; never carry a plan's `~합니다` sentence onto the page. A **KEY callout is one sentence**: if
the point needs more, the rest goes into the section's lead, not into the callout.

**Identifier chips.** An identifier inside prose — file name, path, class / function / API name, config key,
enum value, command — is set as the inline identifier chip of the style's `design.md §7.6` (mono font, light
fill, 4px radius, `white-space:nowrap`; copy the exact `style` string from there). Ordinary English
engineering words (Job, thread, diff) stay plain text; emphasis stays bold, never a chip.

## Step 6 — Assemble the document

Replace the template's stub sections with the rendered sections in plan order, keeping every
section a distinct element with a unique id, and keeping every nav link's target pointing at a
real section id in the document. Keep to the style's inline-styles-only discipline: no CSS
classes, no shared stylesheet, values pasted directly as inline styles, matching the template's
existing pattern. Leave the template's print block, `data-page` / `data-nav` / `data-progress`
attributes untouched. Delete the closing "계속 보강 예정" line unless the document really is in
progress.

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

Run the gate against the freshly built document and sidecar, from the repo root:

```
node .claude/lib/verify-doc.mjs <doc.dc.html> --canonical-support <styles/<style>/support.js> --style <style-id> --plan <content-plan.md>
```

`--style` supplies the accent color and turns on the palette check; `--plan` turns on the section,
shape and number checks — always pass both. (`--no-visual` skips the headless-browser tier; the
environment variable `CHROME_PATH` picks the browser.)

**Success means the literal last gate line `GATE PASSED (k/k checks)`** — nothing else. An exit code of
0 without that line (for example because the command did not run) is not a pass; `GATE FAILED` is not
built.

**Repo-relative path — run from the repo root.** Both `node .claude/lib/…` invocations in this
skill (this gate and the Step 1 plan check) resolve `.claude/lib/` relative to the current working
directory, which assumes you are at the repo root. When this skill is exposed globally (e.g.
symlinked into a Codex `$CODEX_HOME/skills/`) and invoked from an unrelated cwd, `node` will fail
with `Cannot find module '.../.claude/lib/verify-doc.mjs'`. That error means the skill is running
outside its repo, **not** that the document failed — `cd` to the presentation-system repo root
(the one containing this `.claude/` tree) and rerun. This harness is repo-scoped by design; it
does not self-locate its library.

The gate runs two tiers:

- A **mechanical hard gate** that always runs without a browser. This must pass for the document to
  count as built. When a check fails, fix the document (never weaken the check or edit the plan to
  match a mistake) and rerun:
  - `keep-all` — `word-break: keep-all` present; `accent-present` — the style's accent color appears;
    `sidecar-present` — `support.js` is byte-identical to the canonical file (re-copy it).
  - `unique-ids`, `navlink-integrity` — section ids are unique and every nav link points at a real id.
  - `inline-only` — the one global `<style>` holds no class selectors, not even inside `@media print`
    or in a `.a, .b {` list; move the styling inline.
  - `slots-filled` — no `⟦…⟧` left outside comments: fill it, or delete the unused block / template
    line it belongs to.
  - `no-role-placeholders` — a `⟨role⟩` is left: the figure was pasted from `core/components/`;
    re-paste it from `styles/<style>/components/`.
  - `palette` — a color literal is not in the style's `design.md`: it was invented or copied from
    another style; replace it with that style's own token value.
  - `grid-consistency` — a component's `repeat(M,1fr)` differs from its `calc(100% / N)`: make the
    count the same everywhere in that component (every row, header and background).
  - `known-components`, `plan-alignment`, `plan-shapes` — every `data-component` is a real component, the
    document's `<section>` ids equal the plan's `sN`/`sref` ids (act dividers are `<div>`s), and every
    section holds the component its shape requires.
  - `numbers-traced` — a number shown in the document is not in the plan or its `facts.md`. **The number
    must come from the plan or be removed from the document.** Never add a number to the plan or facts
    just to pass: if the number is real it needs a source, so go back to `/plan`, add the fact with its
    citation, and re-confirm.
  It also prints non-blocking `figures:*` rows (coverage per section, low variety, bare sections,
  crowded sections) — read them. **This gate does not verify semantic-color-split correctness** — it
  cannot tell whether the AS-IS color family stayed in AS-IS/problem zones and the accent stayed in
  TO-BE/target zones per the style's color law. That correctness depends on following Step 4's
  state→color mapping and is checked, if at all, by the visual render tier below or by eyeballing
  against the style's answer key — never claim the mechanical gate guarantees color-zone correctness.
- A **warning-only desktop composition tier** that only runs if a headless browser is available.
  It serves the document over localhost and evaluates desktop viewports `1366x768` and `1440x900`
  for section height, stacked grids, 4-column text grids, missing primary figures, low-emphasis
  decision asks, meaning-block count, and desktop overflow. These rows print as `WARN` and do
  **not** change the exit code until the warnings have been calibrated against accepted artifacts.
  If a headless browser is not available, the gate reports the visual check as unverified rather
  than silently skipping it — treat that as an honest "not checked," not a pass.

**Treat anything other than the `GATE PASSED` line as "not built."** Read every check the gate prints;
if any mechanical check fails, fix the document and rerun the gate — do not hand the document to the
user as finished while a check is failing. Do not report success on the strength of the visual line
alone, and do not claim the visual/composition tier passed when it reports unverified. Do read and
summarize any `WARN` rows for the user; warnings are not failures, but they are review evidence.

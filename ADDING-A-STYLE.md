# Adding a style

> Single consolidated procedure for adding a **second (or Nth) style** to this system.
> Consolidates what was scattered across `CLAUDE.md` (invariants), `README.md` (one-line
> pointer), `styles/indigo-serif/style.md` (manifest), and `HANDOFF.md` (D2 seam note).
>
> This is a **process doc**. It owns no tokens or spec values — it points at the SSOT and
> duplicates nothing. On any conflict, `CLAUDE.md` and the style's `design.md` win.

---

## The one rule

**A new style is a folder copy. `core/` is never touched.**

If adding a style would force you to edit anything under `core/` to recolor or restyle, a value
leaked out of a style — fix the leak (move it into the style's `design.md`), do **not** fork
`core/`. `core/` carries zero HEX and names style-agnostic *chrome tokens*; the style supplies
their values. That split is the whole point.

---

## What you copy, what you rewrite

Duplicate `styles/indigo-serif/` → `styles/<new-id>/`, then rewrite each file. Every file below
is style-scoped SSOT — none of it is shared.

| File | Rewrite | Notes |
|------|---------|-------|
| `style.md` | Every field: id, identity, fonts, accent, page bg, when-to-use | The manifest. Rewrite first — it forces the identity decisions the rest inherit. |
| `design.md` | **All** HEX/px/radius tokens, components, diagram geometry, anti-patterns | **The** source of truth. All ~64 HEX values live here and only here. |
| `design.tokens.md` | Re-mirror from the new `design.md` | Derived, not source. Regenerate after `design.md` is final — never hand-diverge it. It is also the **component generator's input**: it must define every `colors` key the templates in `core/components/` name, the `rounded` keys, and a `fontStacks` block (`body`, `display`, `mono` — CSS stacks exactly as pasted inline; the `mono` stack ends in the style's Korean body font before the generic family, so Hangul in a mono badge never falls to a system font). One of the `colors` keys is `muted-text`, the text-safe muted ink: pick a muted tone that is ≥4.5:1 on white and put it there — informative small text in every component uses it (`core/components.md §4`). The generator stops and lists any missing key. |
| `authoring-guide.md` | Voice, Korean register, page-type registry, situation→device, intent→token map | Kept whole (not split). |
| `composition-guide.md` | Density budgets, in-section layout, focal hierarchy, pacing | |
| `template.dc.html` | Paste the new style's values into the runnable skeleton | Clone target for every document in this style. Keep its label-language comments (eyebrow, appendix link, `REFERENCE`) and the commented `VARIANT compact hero` and `VARIANT compact act divider` blocks (with the matching `design.md §4.12` compact-variant paragraph and the answer-key sample) — rewrite their values for the new style. |
| `design-system.answerkey.dc.html` | Re-render as a live gallery of the new tokens/components/diagrams | **Wins vs `design.md`** on conflict. |
| `support.js` | Keep byte-identical (copy, do not edit) | Sidecar for **every** `.dc.html` file in the folder — no build step, runtime does `fetch('./support.js')`. |
| `components/` · `components.gallery.dc.html` | **Do not copy — generate.** Run `node .claude/lib/components.mjs build --style <new-id>` | Paste-ready figure components with the new style's values + their rendered gallery. Never hand-edit; a wrong look means a wrong token in `design.md`/`design.tokens.md`. |

---

## Procedure

1. **Copy the folder** — `cp -r styles/indigo-serif styles/<new-id>`.
2. **Rewrite `style.md`** — lock the identity: fonts, accent, page bg, when-to-use.
3. **Rewrite `design.md`** — swap every token. This is the bulk of the work.
   - Redefine the **semantic color split** (see gate #4). A new style *may* pick a different
     split than slate+amber / indigo, but must state it normatively once (indigo-serif states it
     in `design.md §1.4`) and never mix it within one document.
   - Wire the **six chrome tokens** `core/runtime-spec.md` consumes
     (`⟨bg-canvas⟩ ⟨ink⟩ ⟨selection⟩ ⟨accent⟩ ⟨nav-idle⟩ ⟨nav-ref⟩`) to the new style's values.
     See the mapping block at the bottom of `style.md` — the new style must supply all six.
4. **Re-mirror `design.tokens.md`** from the finished `design.md`.
5. **Rewrite `authoring-guide.md` + `composition-guide.md`** — voice, register, density.
6. **Paste values into `template.dc.html`**; keep the `support.js` sidecar beside it. Keep its `⟦…⟧`
   text slots (hero, nav, section stubs, closing line) and its `@media print` block with the
   `data-page` / `data-nav` / `data-progress` hooks (`core/runtime-spec.md §5`) — they are shared structure,
   only the values change. Keep its fluid shell paddings (sheet `min(64px,6vw)`, nav and hero `min(40px,5vw)`;
   the style's `design.md §8.1` owns the values) — they are what leaves figures room at the 390px floor.
6a. **Generate the component library** — `node .claude/lib/components.mjs build --style <new-id>`,
   then open `components.gallery.dc.html` over http and check every component reads correctly in the
   new palette (semantic colors in particular: target vs problem vs success must stay distinct).
7. **Re-render `design-system.answerkey.dc.html`** — served over http, verify each token/component/diagram visually.
8. **Register in `README.md`** — add a row to the style registry table (§"Style registry") and,
   if worth it, a two-most-opened-files pointer.
9. **Run the invariant gate below.**

---

## Invariant gate (must all hold)

From `CLAUDE.md §"Core rules"`. A new style is not done until every line is true.

1. **`core/` has zero HEX** — no color literal leaked into `core/`. (`support.js` internal HEX is exempt — it is the generated runtime, not style-scoped.)
2. **Self-contained** — every HEX for this style lives in this folder's `design.md` only. Nothing style-specific outside `styles/<new-id>/`.
3. **`core/` untouched** — `git diff` shows no changes under `core/`. If it does, a value leaked; move it into the style.
4. **Semantic split defined & unmixed** — the style states its own current/problem vs target/improved color meaning once, and no single document mixes both sides.
5. **Answer-key-wins** — `design-system.answerkey.dc.html` renders and agrees with `design.md`; on any disagreement, fix `design.md` to match the answer key.
6. **Inline styles only** — no CSS classes/shared stylesheet; values pasted inline. Only global CSS = what cannot be inlined (font loading, `word-break`, selection, scrollbar) plus the one `@media print` block (attribute selectors only).
7. **`word-break: keep-all` global** (mandatory for Korean line-breaking).
8. **`support.js` beside every `.dc.html`** — byte-identical copy in the folder.
9. **Components generated and current** — `node .claude/lib/components.mjs check` passes and the gallery was reviewed; the test suite (`node --test .claude/lib/test/*.test.mjs`) is green, and the gallery prints no `composition:mobile-overflow` / `composition:figure-overflow` row at 390px (`.claude/README.md`, **Local assets**).
10. **A document built from the template passes the exit gate** — `node .claude/lib/verify-doc.mjs <doc> --canonical-support styles/<new-id>/support.js --style <new-id> --plan <content-plan.md>` prints `GATE PASSED` (the `palette` check requires every color literal in the document to be in this style's `design.md`).

---

## After the second style (`teal-sans`, added) — decisions recorded

The second style, **`teal-sans`** (internal-engineering docs: IBM Plex superfamily, teal accent,
slate+red vs teal split), has been added. What the clone proved, and the resulting decisions:

### The clone is largely *deterministic* — capture the technique, not a script
Because the whole system is **inline-styles-only with literal HEX**, cloning is dominated by a
mechanical, table-driven substitution rather than free re-authoring:

1. **Extract** every unique HEX + font string from the source style
   (`grep -rhoiE '#[0-9a-f]{6}' styles/<src>/`).
2. **Map** each source token to its target: swap the two *hue families* (indigo→teal,
   amber→red), keep the neutral gray ramp intact to preserve its layered hierarchy, keep/nudge
   the success green so it stays distinct from the accent, swap the three font families, and
   tighten radii (scoped to `border-radius:` only).
3. **Apply** the map to `design.md`, `template.dc.html`, the answer key, and `design.tokens.md`
   on disk (a ~40-line Node script), leaving `support.js` byte-identical.
4. **Hand-edit only the prose the map can't touch:** the §0 signatures, §1.4 semantic law, the
   type-scale notes, `style.md`, and any label that *names* a hue/typeface in words.
5. **Render** the answer key over http, verify visually, then run the invariant gate below.

This keeps the proven neutral hierarchy and layout grammar exactly, so the new style reads as a
different author purely through hue + typeface + geometry. The mapping table itself is bespoke
per style pair, so it is **not** committed as a reusable file — the *technique* above is the
reusable asset.

### Skill-ification (`/add-style`) — **deferred to a 3rd style**
The procedure is now proven repeatable, but the irreducibly-human part (choosing the palette,
fonts, and semantic split — here grounded in a research pass) can't be scripted; a skill would
mostly wrap this doc plus the transform technique. Given how rarely a style is added, building a
bespoke skill for n=2 is premature. **Trigger: build `/add-style` only if a 3rd style is
requested** — by then the frequency justifies it and the technique above is the spec to encode.

### Doc-split (HANDOFF D2) — **still deferred, now with evidence**
Cloning `teal-sans` showed **no clean seam**: the table-driven transform treats `design.md` and
the answer key as single units, and splitting either would have complicated the mapping without
benefit. The large files are large by content volume, not by tangled responsibility. Do not split
until a clone actually surfaces a clean boundary.

---

## After the third style (`feedbackops-light`, added) — decisions recorded

The third style, **`feedbackops-light`**, mirrors the FeedbackOps product design language (Pack 17
light: Inter + Pretendard, Samsung blue `#1428A0`, porcelain canvas, flat surfaces, 6–8px radii). It
was cloned from `teal-sans` with the same table-driven technique: hue families mapped to FeedbackOps
tokens, the **neutral ramp also remapped** this time (FeedbackOps' cool-gray `#101828 / #374151 /
#667083 / #98A2B3` scale is part of its identity, unlike indigo→teal where the ramp was kept), fonts
swapped, radii mapped inside `border-radius:` declarations, the gradient hero flattened to a solid
fill (FeedbackOps forbids broad decorative gradients), and only identity prose hand-edited.

### Skill-ification (`/add-style`) — re-reviewed at n=3, still **no**
The component library removed the largest mechanical chunk a skill would have automated (every
diagram is now generated from `core/components/`). What remains is the irreducibly human part —
choosing the palette mapping and rewriting identity prose — plus a short hex-map script that is
bespoke per style pair. A skill would wrap this doc and little else.

### Doc-split (HANDOFF D2) — **the seam appeared and was taken**
The clean boundary that earlier clones did not show turned out to be *diagram construction*: it now
lives once in `core/components/` (style-agnostic templates) instead of being re-described in every
style's `design.md §5`. `design.md` keeps the values and the visual reference; no further split of
`design.md` or the answer key is planned.

### Drift found while cloning
`teal-sans`'s answer key had tightened card/panel radii (10/12/12px) while its `design.md` and
`design.tokens.md` still listed 14/16/18px. Per answer-key-wins the docs were corrected. The component
generator reads `design.tokens.md`, so this kind of mirror drift now shows up directly in the gallery.

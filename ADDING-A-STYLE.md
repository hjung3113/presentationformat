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
| `design.tokens.md` | Re-mirror from the new `design.md` | Derived, not source. Regenerate after `design.md` is final — never hand-diverge it. |
| `authoring-guide.md` | Voice, Korean register, page-type registry, situation→device, intent→token map | Kept whole (not split). |
| `composition-guide.md` | Density budgets, in-section layout, focal hierarchy, pacing | |
| `template.dc.html` | Paste the new style's values into the runnable skeleton | Clone target for every document in this style. |
| `design-system.answerkey.dc.html` | Re-render as a live gallery of the new tokens/components/diagrams | **Wins vs `design.md`** on conflict. |
| `support.js` | Keep byte-identical (copy, do not edit) | Sidecar for **both** `.dc.html` files in the folder — no build step, runtime does `fetch('./support.js')`. |

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
6. **Paste values into `template.dc.html`**; keep the `support.js` sidecar beside it.
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
6. **Inline styles only** — no CSS classes/shared stylesheet; values pasted inline. Only global CSS = what cannot be inlined (font loading, `word-break`, selection, scrollbar).
7. **`word-break: keep-all` global** (mandatory for Korean line-breaking).
8. **`support.js` beside every `.dc.html`** — byte-identical copy in the folder.

---

## After the second style: revisit doc-split (HANDOFF D2)

The single-style repo deferred splitting the two large files (`design.md` ~559 lines,
`design-system.answerkey.dc.html` ~1087 lines) until a real reuse boundary is proven. Adding the
second style **is** that moment: if cloning shows a clean seam (e.g. the §5 diagram catalog
splitting cleanly, or shared vs style-specific content diverging), revisit the split then — with
evidence, not speculation. Until proven, do not split.

If the clone procedure itself proves stable and repeatable across two styles, that is the trigger
to promote this doc into a `/add-style` skill — not before.

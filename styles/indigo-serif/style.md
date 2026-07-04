# Style: indigo-serif

> Manifest for this style. When cloning to a new style, copy this folder and rewrite every field below.

| Field | Value |
|-------|-------|
| **id** | `indigo-serif` |
| **status** | default (only style today) |
| **identity** | Serif display headings (Noto Serif KR) over sans body (Pretendard); single indigo `#4338CA` accent carrying meaning, never decorative; semantic split slate+amber (as-is/problem) vs indigo (to-be/improved). |
| **when to use** | Explanatory / before→after / architecture briefs where a calm, editorial "same-author" feel is wanted. |
| **display font** | Noto Serif KR |
| **body font** | Pretendard |
| **mono font** | JetBrains Mono |
| **accent** | `#4338CA` |
| **page bg** | `#EEF0F7` |

## Files (SSOT for this style)
- `design.md` — all HEX/px/geometry tokens, components, diagrams. **The** source of truth.
- `design.tokens.md` — machine mirror of `design.md` (derived).
- `authoring-guide.md` — voice, register, skeleton, page types (kept whole, not split).
- `composition-guide.md` — density budgets, layout, pacing.
- `template.dc.html` — runnable skeleton with this style's pasted values.
- `design-system.answerkey.dc.html` — rendered answer key (wins vs `design.md` on conflict).
- `support.js` — byte-identical generated runtime sidecar for the two `.dc.html` files here.

## Chrome tokens consumed by `core/runtime-spec.md`
The shared runtime names six slots; this style supplies them from `design.md`:
`⟨bg-canvas⟩`=page bg, `⟨ink⟩`=`ink-800`, `⟨selection⟩`=`on-accent`(selection variant),
`⟨accent⟩`=`accent`, `⟨nav-idle⟩`=`muted-500`, `⟨nav-ref⟩`=`muted-300`.

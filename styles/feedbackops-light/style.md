# Style: feedbackops-light

> Manifest for this style. When cloning to a new style, copy this folder and rewrite every field below.

| Field | Value |
|-------|-------|
| **id** | `feedbackops-light` |
| **status** | active (3rd style) |
| **identity** | The FeedbackOps product design language (Pack 17 light, ADR-0021) as a scroll document: porcelain canvas `#F3F7FE` with flat, layered light surfaces; Inter + Pretendard for body *and* headings, JetBrains Mono for IDs/badges/numbers; a single Samsung-blue `#1428A0` accent carrying meaning, never decorative; tight 6–8px radii and compact spacing; flat solid hero — no gradients. Semantic split slate (current/old) + red/amber (problem/caution) vs blue (target/improved). |
| **when to use** | FeedbackOps project reports, status updates, design/architecture briefs, and any internal operations document that should look like it came out of the FeedbackOps console. |
| **display font** | Inter + Pretendard (600–700 weight) |
| **body font** | Inter + Pretendard (Hangul falls through to Pretendard per glyph — same order as FeedbackOps `--font-sans`) |
| **mono font** | JetBrains Mono — stack `'JetBrains Mono',Pretendard,monospace` (Hangul falls back to the body font) |
| **accent** | `#1428A0` |
| **page bg** | `#F3F7FE` |
| **source of values** | FeedbackOps `docs/frontend/tokens.md` + `packages/ui/src/styles/tokens.css`. Steps FeedbackOps does not define are interpolated on the same cool-gray ramp (see `design.md §0`). |

## Files (SSOT for this style)
- `design.md` — all HEX/px/geometry tokens, components, diagrams. **The** source of truth.
- `design.tokens.md` — machine mirror of `design.md` (derived). Also feeds the component generator.
- `authoring-guide.md` — voice, register, skeleton, page types (kept whole, not split).
- `composition-guide.md` — density budgets, layout, pacing.
- `template.dc.html` — runnable skeleton with this style's pasted values.
- `design-system.answerkey.dc.html` — rendered answer key (wins vs `design.md` on conflict).
- `components/` + `components.gallery.dc.html` — **generated** paste-ready figure components (from `../../core/components/`) and their rendered gallery.
- `support.js` — byte-identical generated runtime sidecar for the `.dc.html` files here.

## Chrome tokens consumed by `core/runtime-spec.md`
The shared runtime names six slots; this style supplies them from `design.md`:
`⟨bg-canvas⟩`=page bg `#F3F7FE`, `⟨ink⟩`=`ink-800` `#1D2939`, `⟨selection⟩`=`#B9C9F7` (on-accent selection variant),
`⟨accent⟩`=`accent` `#1428A0`, `⟨nav-idle⟩`=`muted-500` `#667083`, `⟨nav-ref⟩`=`muted-300` `#B8C4D6`.

## Semantic color law (normative — stated once here and in `design.md §1.4`)
- **Target / new / improved / emphasis = Samsung blue** (`#1428A0` + tints). Plays the role indigo plays in `indigo-serif`.
- **Problem / pain / blocked / regression / "don't" / "no" = red** (`#B2202B` danger label, `#D92D3A` peak + tints). **Caution / partial / "주의" = amber** (`#8E5500` warning label). Both are FeedbackOps `-label` tokens.
- **Current / legacy / old-neutral / inactive = slate** (cool gray, `#94A3B8` + neutral ramp). The faded past.
- **Success / done / recommended / "yes" / ✓ = green** (`#10734A` + `#E7F5EE`) — kept distinct from the blue accent.
- Never mix the problem pole and the target pole inside one structural zone.

# Style: teal-sans

> Manifest for this style. When cloning to a new style, copy this folder and rewrite every field below.

| Field | Value |
|-------|-------|
| **id** | `teal-sans` |
| **status** | active (2nd style) |
| **identity** | One IBM Plex superfamily throughout — Plex Sans for body *and* headings (weight/size carry the display role), Plex Mono for code/badges/numbers; single teal `#0F766E` accent carrying meaning, never decorative; semantic split slate (current/old) + red (problem/pain) vs teal (target/improved). A crisp, engineered sans voice — deliberately the opposite typographic choice from `indigo-serif`. |
| **when to use** | Internal engineering / technical documentation — design notes, architecture briefs, before→after system redesigns, RFCs. A precise, dense, "same-author" engineering voice. |
| **display font** | IBM Plex Sans (600–700 weight) |
| **body font** | IBM Plex Sans (Korean via IBM Plex Sans KR → Noto Sans KR) |
| **mono font** | IBM Plex Mono |
| **accent** | `#0F766E` |
| **page bg** | `#EDF2F1` |

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
`⟨bg-canvas⟩`=page bg `#EDF2F1`, `⟨ink⟩`=`ink-800` `#1E2233`, `⟨selection⟩`=`#99F6E4` (on-accent selection variant),
`⟨accent⟩`=`accent` `#0F766E`, `⟨nav-idle⟩`=`muted-500` `#8A91A6`, `⟨nav-ref⟩`=`muted-300` `#B6BBCB`.

## Semantic color law (normative — stated once here and in `design.md §1.4`)
- **Target / new / improved / emphasis = teal** (`#0F766E` + tints). Plays the role indigo plays in `indigo-serif`.
- **Problem / pain / warn / regression / "don't" / "no" = red** (`#B42318`/`#DC2626` + tints). Plays amber's role.
- **Current / legacy / old-neutral / inactive = slate** (cool gray, `#94A0B4` + neutral ramp). The faded past.
- **Success / done / recommended / "yes" / ✓ = green** (`#15803D` + `#E8F6EC`) — kept distinct from the teal accent.
- Never mix the problem pole and the target pole inside one structural zone.

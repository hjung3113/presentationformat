# DESIGN SYSTEM — Visual Specification

> A reusable visual system for building scroll-style HTML presentation documents.
> Any document built to this spec — **regardless of its subject** — should read as the work of the same author.
> This file defines the **visual tokens**. For voice, content patterns, and when-to-use rules, see `authoring-guide.md`.
>
> **This doc owns:** all HEX/px/radius tokens, components, diagram geometry, anti-patterns, the visual checklist.
> **This doc does NOT cover:** content/voice → `authoring-guide.md`; the document shell, JS, `<helmet>`, and naming contract → `../../core/runtime-spec.md`. Start a build from `template.dc.html`.
>
> **Format:** a single self-contained HTML page, read top→bottom (a "paper sheet" document, not a slide deck).
> **Styling discipline:** inline styles only — no CSS classes, no shared stylesheet. Paste token values directly. The only global CSS allowed is what cannot be inlined (font loading, `word-break`, selection color, scrollbar).

---

## 0. Foundations

| Item | Value |
|------|-------|
| Layout | Vertical-scroll single HTML. Full-bleed hero → white "paper sheet" content column (`max-width:1100px`). |
| Body / UI font | **Inter + Pretendard** (`font-family:Inter,Pretendard,sans-serif`). Latin renders in Inter; Hangul falls through per glyph to Pretendard — the same order as FeedbackOps' `--font-sans`. |
| Display / heading font | **Inter + Pretendard** — the same stack as body; display quality comes from **weight + size** (hero/h2 at 600–700) and tight tracking (`-.02em` hero, `-.01em` h2), never a second face. |
| Mono font | **JetBrains Mono** — badges, section-number eyebrows, log/code lines, IDs, and any inline identifier (FeedbackOps' `--font-mono`). |
| Numerals | Body/data numerals set `font-variant-numeric: tabular-nums` wherever they align in a column (tables, KPI rows, charts). |
| Line breaking | `word-break: keep-all` **(global, mandatory)** — breaks at word/space boundaries. Pair with `overflow-wrap:break-word`, `text-wrap:pretty`. |
| Page background | `#F3F7FE` (FeedbackOps canvas, "Pitch Black" Pack 17 light) |
| Default body color | `#1D2939` |
| Accent (brand) | **Samsung blue `#1428A0`** (FeedbackOps `--color-neon-lime` / `--color-aether-blue`) |
| Provenance | Values mirror FeedbackOps `docs/frontend/tokens.md` (Pack 17 light, ADR-0021). Steps FeedbackOps does not define (e.g. `ink-800`, `body`) are interpolated on the same cool-gray ramp. |

Fonts load inside the `<helmet>` element (a real element, not a comment — see `../../core/runtime-spec.md §1`). Keep this exact order: Pretendard CSS → two `preconnect` hints → Google Fonts sheet (Inter + JetBrains Mono). The `preconnect` links are required.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```
> The full document shell (`<x-dc>` / `<helmet>` / `data-dc-script` / `DCLogic`) and the scroll-progress + active-nav scripts live in **`../../core/runtime-spec.md`** — they cannot be derived from visual tokens. Clone `template.dc.html` to get them assembled.
```css
/* helmet <style> — only the things that cannot be inline */
html { scroll-behavior: smooth; }
body { margin:0; background:#F3F7FE; word-break: keep-all; overflow-wrap: break-word; text-wrap: pretty; }
p, h1, h2, h3, div, span, li, a { word-break: keep-all; }
*::selection { background:#B9C9F7; }
.nav-scroll::-webkit-scrollbar { height:0; }
```

**The three signatures** that make any document feel "by the same hand":
1. The FeedbackOps console typeface — **Inter + Pretendard** for body *and* headings (weight/size carry the display role), JetBrains Mono for IDs/badges/numbers — on a **porcelain canvas with flat, layered light surfaces** (no gradients, 6–8px radii, compact spacing).
2. A single **Samsung-blue** accent carrying meaning, never decorative — the same restraint FeedbackOps applies to its one primary action colour.
3. **Semantic color split**: the *current/old/problem* state is always slate + red; the *target/new/improved* state is always blue. This split is the strongest fingerprint — never violate it.

---

> **Machine-readable mirror:** these tokens (colors, type, radius, spacing, core components) are also emitted in DESIGN.md-spec form in `design.tokens.md` for AI/tooling consumption. This file stays the source of truth — change a value here, then re-mirror.

## 1. Color Tokens

### 1.1 Accent — Blue (target / improvement / emphasis / key)
| Token | HEX | Use |
|-------|-----|-----|
| `accent` | `#1428A0` | Primary. Emphasis text, key box fill, badges, strong borders. |
| `accent-grad` | — | **Not used.** Hero and section divider are flat `accent`; FeedbackOps forbids broad decorative gradients. |
| `accent-ink` | `#0F1E78` | Dark text on light-blue fills. |
| `accent-soft` | `#3157D5` | Secondary fill (chart bars, single-block nodes). |
| `accent-050` | `#E7EFFC` | Emphasis box bg, pill-tag bg, arrow-circle bg. |
| `accent-zone` | `#EEF4FB` | "Phase A" header zone (timeline). |
| `accent-line` | `#B9C9F7` | Soft emphasis border. |
| `accent-line2` | `#D8E7FB` | Highlighted card border. |
| `accent-min` | `#A9BDF5` | "Minimal / partial" timeline bar. |
| `accent-lilac` | `#F0F4FE` | Conditional / optional step bg. |
| `on-accent` | `#D8E7FB` · `#B9C9F7` · `#B9C9F7` | Secondary text on blue. |

### 1.2 Neutral — Ink / body / muted
| Token | HEX | Use |
|-------|-----|-----|
| `ink-900` | `#101828` | Headings, strong inline emphasis. |
| `ink-800` | `#1D2939` | Default body, diagram-node text. |
| `ink-700` | `#374151` | `<b>` emphasis (non-accent). |
| `body` | `#374151` (lead) · `#475467` (most) | Paragraph / card body. |
| `muted-500` | `#667083` | Inactive nav, secondary labels. |
| `muted-400` | `#98A2B3` | Captions, footnotes, node sub-text. |
| `muted-300` | `#B8C4D6` · `#B8C4D6` | Arrows (↓), low-priority labels. |
| `hairline` | `#CBD6E6` · `#D5E0F4` | Dashed dividers, weak bars. |

### 1.3 Surface — fills / borders
| Token | HEX | Use |
|-------|-----|-----|
| `white` | `#FFFFFF` | Card / node base. |
| `paper-tint` | `#FBFDFF` | Diagram container bg (barely off-white). |
| `fig-tint` | `#F7FAFE` | **Figure panel** bg (diagram area under text). |
| `fill-50` | `#F3F7FE` | Filled cards / sub-cells. |
| `fill-100` | `#EDF3FB` | Soft list cards. |
| `border` | `#DCE5F2` | **Default card border (most common).** |
| `border-node` | `#CBD6E6` | Node border. |
| `border-section` | `#E3EAF4` | Section divider (border-top). |
| `border-row` | `#E6EDF7` · `#EDF2F9` | Table / list row rules. |
| `border-fig` | `#DFE7F3` | Figure-panel border. |
| `border-chip` | `#CBD6E6` | Chip border. |
| `mono-tint` | `#EEF2F7` | **AS-IS monolith** box fill ("one tangled blob"). |
| `mono-dashed` | `#B8C4D6` | AS-IS monolith dashed border. |
| `warm-tint` | `#F4F2EF` | AS-IS external/legacy annotation bar fill. |
| `warm-dashed` | `#CBD1D6` | Legacy-annotation dashed border. |

> `mono-tint`/`mono-dashed` are slate-family (AS-IS). `warm-tint`/`warm-dashed` mark a thing that is *external / not-ours / legacy* and sits apart. Both belong only in AS-IS zones.

### 1.4 Semantic accents (meaning colors)
| Meaning | Token | HEX | Use |
|---------|-------|-----|-----|
| **Current / legacy / "before"** | `slate` | `#94A3B8` (badge) · `#CBD6E6` (bar) | AS-IS badge, old-state blocks. |
| **Problem / pain point** | `warn` · `warn-2` | `#B2202B` (danger label) · `#8E5500` (warning label, amber) | `warn` = pain point / blocked / rejected text; `warn-2` = softer negative: partial, "주의", negative pills. Both are FeedbackOps `-label` tokens that clear WCAG AA on light surfaces. |
| Problem bg / border | `warn-bg` · `warn-line` | `#FCEDEE` · `#FDF1F1` · `#F3C7CB` | Warning chips/boxes, negative tags. |
| Peak / spike | `peak` | `#D92D3A` | Load-chart peak bar. |
| **Success / normal / end** | `ok` | `#10734A` · `#E7F5EE` | "yes" branch, "done", start-of-stream marker. |

> **Hard rule:** never put blue inside a "before/AS-IS" zone, and never put slate/red inside a "target/TO-BE" **structural** zone (before/after AFTER column, target-flow nodes, TO-BE badges). Color carries meaning.
>
> **Red scope (two legitimate uses).** Red (`warn`) marks *either* (a) an **AS-IS pain point**, *or* (b) a **semantic WARN / negative / "Don't" / regression-delta signal** in the slide-format components — the WARN callout (§4.8), Don't rows (§4.13), a `▼` regression delta (§5.13), a "no/아니오" branch (§4.6). What red must **never** be: decorative, an unknown/not-yet-measured value (that's ink placeholder + muted caveat, §7.5), or a fill inside a TO-BE structural zone.

---

## 2. Type Scale

Use the `font: {weight} {size}/{line-height} {family}` shorthand verbatim.

| Token | Definition | Use |
|-------|-----------|-----|
| `t-hero` | `700 44px/1.22 Inter,Pretendard,sans-serif`, `letter-spacing:-.02em`, `#fff` | Cover title |
| `t-h2` | `600 28px/1.32 Inter,Pretendard,sans-serif`, `letter-spacing:-.01em`, `#101828` | Section title |
| `t-h3-serif` | `600 20px/1.35 Inter,Pretendard,sans-serif`, `#101828` | Sub-heading in a section (name kept for cross-style parity; no serif in this style) |
| `t-h3` | `600 18px/1.4 Inter,Pretendard,sans-serif`, `#101828` | Subsection title, diagram-group title |
| `t-sub` | `600 16–17px/1.4 Inter,Pretendard,sans-serif`, `#101828` | Card heading, figure caption title |
| `t-eyebrow` | `700 13px/1 Inter,Pretendard,sans-serif`, `letter-spacing:.08em`, `#1428A0` | Section number label `NN · ENGLISH` |
| `t-eyebrow-ref` | `700 12px/1 Inter,Pretendard,sans-serif`, `letter-spacing:.08em`, `#B8C4D6` | Low-priority (reference) label |
| `t-lead` | `400 15.5px/1.8 Inter,Pretendard,sans-serif`, `#374151` / `#475467`, `max-width:760px` | Section lead paragraph |
| `t-body` | `400 14–14.5px/1.72–1.75 Inter,Pretendard,sans-serif`, `#475467` | Card body |
| `t-body-sm` | `400 13–13.5px/1.65–1.7 Inter,Pretendard,sans-serif`, `#475467` | Small card / diagram text |
| `t-caption` | `400 11–12.5px/1.5–1.6 Inter,Pretendard,sans-serif`, `#98A2B3` | Captions, footnotes (prefix `*`) |
| `t-node` | `600 12–13px/1.3 Inter,Pretendard,sans-serif` | Diagram node text |
| `t-node-sub` | `400 10–11px/1.4 Inter,Pretendard,sans-serif`, `#98A2B3` / `#5D6B98` | Node sub-text |
| `t-mono-badge` | `700 11px/1 'JetBrains Mono'`, `letter-spacing:.06em`, `#fff` | AS-IS / TO-BE badges |
| `t-mono-num` | `700 12px/1 'JetBrains Mono'`, `#1428A0` | Item number chip (e.g. 2.1) |
| `t-mono-log` | `500 11.5px/1.5 'JetBrains Mono'` | Log/code line sample |
| `t-stat` | `700 30px/1 Inter,Pretendard,sans-serif`, `#fff` | Hero stat number |
| `t-stat-lg` | `700 44px/1 Inter,Pretendard,sans-serif`, `#1428A0` / `#101828` | Stat-card grid number (§5.9) — the biggest numeral |
| `t-stat-band` | `700 32px/1 Inter,Pretendard,sans-serif`, `#fff` | Dark stat-band number (§4.11) |
| `t-kpi` | `700 26px/1 Inter,Pretendard,sans-serif`, `#101828` | KPI card value (§5.13) |
| `t-metric-mid` | `700 24px/1 Inter,Pretendard,sans-serif`, `#1428A0` | Donut center number (§5.12) |
| `t-ring-num` | `700 15px/1 'JetBrains Mono'` | Progress-ring center %, sequence/mono metric (§5.14) |

> **Oversized numerals are Inter at heavy weight (700) with `tabular-nums`** (`t-stat` family) — a big number is a display element; the weight and size carry it, not a second face. The mono `t-ring-num` is the one exception, used only inside the small progress-ring hole.

### Emphasis rules
- **Bold emphasis:** `<b style="color:#101828">…</b>` (ink) or `#374151` (soft ink) — key words only.
- **Accent emphasis** (means "improvement/key"): `<b style="color:#1428A0">…</b>`.
- **Highlight on dark backgrounds:** `border-bottom:2px solid rgba(255,255,255,.45)` or `box-shadow:inset 0 -8px 0 rgba(20,40,160,.12)`. Do **not** use `text-decoration:underline` or italics.
- Max **1–2** bold emphases per paragraph. Acronyms: expand once, then abbreviate.
- **Heading inline qualifier:** a trailing parenthetical/label inside a heading (e.g. `(현재)`, `UML Activity`, `무엇을`) drops to `font-weight:400; font-size:12–14px; color:#98A2B3` — never the heading's weight. Pattern: `<h3>제목 <span style="font-weight:400;color:#98A2B3;font-size:14px;">(보조)</span></h3>`.

---

## 3. Spacing & Radius Tokens

### 3.1 Radius — fixed by element type (consistency fingerprint)
| Token | Value | Where |
|-------|-------|-------|
| `r-node` | `6px` | Small diagram nodes, chips (FeedbackOps `--radius-md`) |
| `r-node-lg` | `8px` | Emphasis nodes, arrow-adjacent boxes |
| `r-pill-sm` | `4px` | Small badges / number chips (FeedbackOps badge radius) |
| `r-card-sm` | `8px` | Filled sub-cards, figure panel (`--radius-lg`) |
| `r-card` | `8px` | Standard card (most common) |
| `r-card-lg` | `12px` | Diagram container, large card (`--radius-xl`) |
| `r-panel` | `12px` | AS-IS/TO-BE comparison panel |
| `r-sheet` | `12px 12px 0 0` | Top paper sheet (top corners only) |
| `r-pill` | `100px` | Tag pills, start/end nodes |
| `r-circle` | `50%` | Arrow circle badge (36px), legend dots |

> Small nodes 6px, cards/figure panels 8px, big comparison panels 12px — tighter than the other styles, matching the FeedbackOps console's 6px-default geometry. Keep radius uniform within one diagram.

### 3.2 Padding / gap / width
| Token | Value | Use |
|-------|-------|-----|
| `sheet-max` | `1100px` | Paper-sheet max-width |
| `sheet-pad` | `0 64px` | Sheet horizontal padding |
| `section-pad` | `56px 0` | Section vertical padding |
| `lead-max` | `760px` | Lead / body paragraph max-width |
| `card-pad` | `20–26px` | Card inner padding |
| `fig-pad` | `22–24px` | Figure-panel padding |
| `gap-card` | `14–18px` | Card-grid gap |
| `gap-node` | `8–12px` | Diagram-node gap |
| Section rule | `border-top:1px solid #E3EAF4` | Top of each section (except first) |
| `block-gap` | `18px` adjacent · `30–38px` distinct | Between stacked cards (18) vs distinct sub-blocks/diagrams within one section (30–38) |
| Sheet top inset | `padding-top:8px` | Paper-sheet top padding |
| First section | `padding:60px 0 56px`, **no** border-top | Slightly larger top pad; later sections `56px 0` + border-top |

> The hero-to-first-title gap is fixed by three values together: sheet `−44px` overlap + sheet `padding-top:8px` + first section `~60px` top. Don't flatten the first section to 56px.

---

## 4. Components

### 4.1 Hero / Cover
```
bg: #1428A0
overlay: none
padding: 64px 40px 84px / inner max-width:1020px (h1 max-width:820px)
         flat fill — no gradient, no radial highlight (FeedbackOps: no broad decorative gradients)
eyebrow pill: bg rgba(255,255,255,.13), border rgba(255,255,255,.18), radius 100px, pad 9px 16px,
              600 12px, letter-spacing .1em, color #D8E7FB
title: t-hero (Inter 44px, white)
lead: 400 17px/1.8, #DCE4FF, emphasis = white + bottom border
sub-note: 400 14px/1.7, #A9B8F0
stat tiles (×4): flex, each bg rgba(255,255,255,.10) + border rgba(255,255,255,.14),
                radius 8px, pad 20–22px. number t-stat + label 13px #B9C9F7
```

### 4.2 Paper sheet
```
max-width:1100px; margin:-44px auto 0;  /* overlaps the hero */
background:#fff; border-radius:12px 12px 0 0;
box-shadow:0 -24px 60px rgba(16,24,40,.08);
padding:8px 64px 100px;
```

### 4.3 Sticky nav + progress bar
```
sticky bar: position:sticky; top:0; z-index:50; background:rgba(255,255,255,.86); backdrop-filter:blur(10px);
            border-bottom:1px solid #CBD6E6; height:54px; inner max-width:1100px; pad 0 40px
link row:   class="nav-scroll"; overflow-x:auto (scrollbar hidden via global .nav-scroll CSS, WebKit only)
links: 500 13px; #667083 (inactive) → #1428A0 + 700 (active, set imperatively by the observer)
ref link:  the appendix/glossary link is de-emphasized: color #B8C4D6 + a 10px vertical-align:super "ref" superscript; never highlighted active
brand:     <a href="#top"> to the hero (id="top"); smooth scroll via html{scroll-behavior:smooth}, no JS
progress: position:fixed top:0 height:3px; z-index:60 (above nav); inner div id="rprog" width 0→100% bg #1428A0 (scroll ratio)
```
> The JS that drives the progress width and the active link (IntersectionObserver, `rootMargin:'-45% 0px -50% 0px'`) plus the `id="sN"` ↔ `data-navlink="sN"` naming contract live in **`../../core/runtime-spec.md §2–3`**. The values above are appearance only.

### 4.4 Section header (identical pattern every section)
```html
<div style="font:700 13px/1 Inter,Pretendard,sans-serif; letter-spacing:.08em; color:#1428A0; margin-bottom:14px;">NN · ENGLISH</div>
<h2 style="font:600 28px/1.32 Inter,Pretendard,sans-serif; color:#101828; margin:0 0 12px; letter-spacing:-.01em;">Title</h2>
<p style="font:400 15.5px/1.8 Inter,Pretendard,sans-serif; color:#475467; margin:0 0 28px; max-width:760px;">Lead paragraph</p>
```

### 4.5 Card variants
| Variant | Style |
|---------|-------|
| Outline (default) | `border:1px solid #DCE5F2; border-radius:8px; padding:22px 24px;` |
| Filled (soft) | `background:#F3F7FE; border-radius:12–8px; padding:16–22px;` |
| Highlight | `border:1.5px solid #1428A0; border-radius:8px; background:linear-gradient(160deg,#EEF3FE,#fff);` |
| Dark summary | `background:#101828; border-radius:8px;` (text #D5DCEA, emphasis #fff, label #9AABFF) |
| Left-accent (risk) | `border:1px solid #DCE5F2; border-left:3px solid #1428A0; border-radius:0 8px 8px 0; padding:18px 20px;` — desc muted `#667083`, then `→` mitigation `#475467`. Also the base for note/callout boxes. |
| Subsection card (deep-dive) | `border:1px solid #DCE5F2; border-radius:8px; padding:26px 28px;` — wraps a whole `N.M` subsection; heading is `N.M Title` in `t-h3` (600 18px, **plain text, no chip**); the figure panel nests inside. |

**Status-row card** (e.g. MVP "Now"): rows `display:flex; justify-content:space-between`; left label `600 13px`; right status `600 12px #1428A0` (core) or `400 12px #667083` (minimal); core rows border `#D8E7FB`, minimal rows border `#DCE5F2`.

**Takeaway chip** (closes a card grid): `background:#E7EFFC; border:1px solid #D8E7FB; border-radius:8px;` vertically centered, `500 12px #1428A0`, `→`-led one-line synthesis. No heading.

### 4.6 Badges / chips / tags
| Element | Style |
|---------|-------|
| Number chip | `700 12px 'JetBrains Mono'; #1428A0; bg #E7EFFC; radius 6px; pad 6px 9px;` — for **peer enumerated items** in a grid (problems, findings). |
| Circled numeral | `①②③…` as a `600 14px #1428A0` heading prefix — for **role/component lists**. Distinct texture from number chips; don't mix the two for one role. |
| AS-IS badge | `700 11px 'JetBrains Mono'; letter-spacing .06em; #fff; bg #94A3B8; radius 6px; pad 6px 10px;` |
| TO-BE badge | same but `bg #1428A0` |
| Positive tag (pill) | `500 11px; radius 100px; pad 6px 11px; #1428A0; bg #E7EFFC;` |
| Negative tag (pill) | same but `#8E5500; bg #FDF1F1;` |
| "yes" branch tag | `700 10.5px; #10734A; bg #E7F5EE; radius 5px; pad 4px 8px;` |
| "no" branch tag | same but `#B2202B; bg #FCEDEE;` |

### 4.7 Table
```
container: border:1px solid #DCE5F2; border-radius:8px; overflow:hidden;
header (strong): bg #101828; cells 600 13px #fff; pad 14px 18px
header (soft):   bg #EEF3FA; cells 600 12.5px #374151
rows: display:grid (set column ratios); border-top:1px solid #E6EDF7;
      body 400 13px/1.6 #475467; first column emphasized (accent or ink), optional bg #F7FAFE
```

### 4.8 Callout / note box set (4 variants)
Four semantic callouts, all `border-left:3px solid; border-radius:0 8px 8px 0; padding:14px 16px;` label `700 11px/1 Inter,Pretendard,sans-serif; letter-spacing:.04em;` body `400 13px/1.65; #374151`. One short sentence each; **1–2 per screen** max.
| Variant | Fill | Left border + label |
|---------|------|---------------------|
| KEY (핵심) | `#E7EFFC` | `#1428A0` |
| OK (권장) | `#E7F5EE` | `#10734A` |
| WARN (주의) | `#FDF1F1` | `#B2202B` |
| NOTE (참고) | `#F3F7FE` | `#B8C4D6` (label `#667083`, body `#475467`) |

> **Red scope (updated).** The WARN callout **legitimately uses red** (`#B2202B` on `#FDF1F1`). Red now marks *either* an AS-IS pain point *or* a semantic WARN/negative signal — see the revised rule in §1.4-note and §8.2. It is still never decorative, and never placed inside a TO-BE **structural** zone (before/after AFTER column, target-flow nodes).

### 4.9 Process step row
Horizontal numbered steps for a 3–5 stage procedure. `display:flex;` each step `flex:1; text-align:center;`. Number circle `width:38px; height:38px; border-radius:50%; background:#1428A0; color:#fff; font:700 15px/1 'JetBrains Mono';` → title `600 13.5px/1.4 #101828` → body `400 12px/1.6 #475467`. Connectors between steps: `→` `flex:0 0 24px; color:#A9BDF5; font-size:18px;`. **Final (완료) step circle is green** `background:#10734A` with `✓` (`700 14px`). 6+ steps → switch to a vertical flow.

### 4.10 Pull quote
`background:linear-gradient(160deg,#EEF3FE,#fff); border:1px solid #D8E7FB; border-radius:8px; padding:24px 26px;` opening quote glyph `“` `700 40px/1 Inter,Pretendard,sans-serif; color:#B9C9F7;` quote text `600 18px/1.55 Inter,Pretendard,sans-serif; #101828;` attribution `500 12px/1.4 #667083`. For one message/principle set large, in Inter at display weight.

### 4.11 Dark stat band
A compact dark cousin of the hero stat tiles, dropped between sections. `background:#101828; border-radius:8px; padding:26px 30px; display:grid; grid-template-columns:repeat(4,1fr); gap:20px;` number `t-stat-band` (700 32px Inter `#fff`), label `400 12px/1.5 #9AABFF`. 3–4 headline numbers.

### 4.12 Section divider
Same solid Samsung-blue as the hero, boxed. `background:#1428A0; border-radius:8px; padding:40px 44px;` overlay `none`. Big index `700 56px/1 'JetBrains Mono'; color:rgba(255,255,255,.28);` (e.g. `03`) + part label `700 13px/1 Inter,Pretendard,sans-serif; letter-spacing:.1em; #D8E7FB;` (`PART 03`) + title `600 30px/1.3 Inter,Pretendard,sans-serif; #fff`. Breaks a long document into acts (page-type §6.2).

### 4.13 Do / Don't rows
Paired guidance rows. Do: `background:#E7F5EE; border-radius:8px; padding:12px 14px;` mark `✓` `700 13px #10734A`. Don't: `background:#FCEDEE;` mark `✕` `#B2202B`. Text `400 12.5px/1.6 #374151`. Don't-rows use red per the updated red scope (§4.8-note).

### 4.14 Check / comparison matrix
A verdict variant of the table (§4.7): dark header `#101828` (comparison column label may be `#B9C9F7`); rows `border-top:1px solid #E6EDF7`, first cell `background:#F7FAFE; #1D2939`. Marks: `✓` `600 15px/1 #10734A` (met) · `✕` `#CBD6E6` (not met) · partial = short text `600 13px #8E5500` (e.g. "수작업"). Grey ✕ + green ✓ make the winning (new-structure) column visually dominate.

---

## 5. Diagram Conventions

Place every diagram inside a **figure panel** (under the explanatory text):
`background:#F7FAFE; border:1px solid #DFE7F3; border-radius:8px; padding:22–24px;`
Standalone comparison panels use `border:1px solid #DCE5F2; border-radius:16–12px; background:#FBFDFF; padding:24–30px;`

> **Building a figure? Paste it, don't draw it.** Every figure shape in `../../core/components.md` has a paste-ready component in `components/` (generated from `../../core/components/` with this style's `design.tokens.md`; rendered in `components.gallery.dc.html`). The specs in this section are the visual reference those components implement — for *construction* (grid placement, lookup tables, slot markers) the component file wins; for *values* this file wins.

### 5.1 Universal node rules
- **Node:** white bg + `1px solid #CBD6E6` + radius 6px + pad 11px 8px, centered, `600 12px #1D2939`; sub-line `400 10–11px #98A2B3`.
- **Key node:** `background:#E7EFFC; border:1.5px solid #1428A0; color:#1428A0;`.
- **Data / store node:** `border:1px dashed #AEBBD3`.
- **Vertical arrow:** centered `↓`, `#B8C4D6; font-size:13px; padding:5px 0;`; sub-label `11px #98A2B3`.
- **Bidirectional:** `↕` (#1428A0). **Horizontal flow:** `→` (blue) or a 36px circular badge.
- **Circular arrow badge (primary):** `width:36px;height:36px;border-radius:50%;background:#1428A0;color:#fff;font-size:17px;` flex-centered — for primary before/after pivots only.
- **Inline light arrow circle:** `width:28px;height:28px;border-radius:50%;background:#E7EFFC;color:#1428A0;font-size:14px;` — between row-flow boxes (lighter, secondary).
- **Root/orchestrator node:** the primary blue node may carry `box-shadow:0 6px 16px rgba(20,40,160,.2)` to read as elevated; **all other nodes are flat.**
- **Merge/branch label:** `500 10.5px #98A2B3`, e.g. `↓ merge ↓`.

### 5.2 Before / After comparison (signature pattern)
```
container: border:1px solid #DCE5F2; border-radius:8px; padding:30px; background:#FBFDFF;
grid: display:grid; grid-template-columns:1fr 50px 1fr; align-items:stretch;
      (the shorter column gets display:flex; flex-direction:column; justify-content:center)
center (50px): arrow cell, align-self:center, 36px blue circle "→"
BEFORE column: header [slate badge][slate label]; slate/grey body; pain points in red; 3 negative pills below.
AFTER column:  header [blue badge][ink label]; blue body; 3 positive pills below.
```
**AS-IS "monolith" wrapper (signature):** the BEFORE sub-grid is enclosed in one box = `background:#EEF2F7; border:1.5px dashed #B8C4D6; border-radius:8px; padding:16px 14px;` with a centered caption (`600 12px #5D6679`, e.g. "현재 — 한 덩어리"); inner cells are white `1px solid #CBD6E6` radius 8. This "one tangled blob" enclosure is what makes AS-IS read as monolithic — don't render BEFORE cells as loose white boxes.
**Legacy/external annotation bar:** a thing that is not-ours/legacy and sits apart = `background:#F4F2EF; border:1px dashed #CBD1D6; border-radius:6px; padding:9px 12px;` label `600 11px #667083` + qualifier `400 11px #A7B0C0`.

### 5.3 Conditional / optional path
- Conditional step = **dashed blue box on lilac** (`bg #F0F4FE; border:1.5px dashed #1428A0;`) + a small qualifier badge ("only X").
- **Qualifier badge (mini):** `700 8.5px/1 Inter,Pretendard,sans-serif; letter-spacing:.02em; color:#fff; background:#1428A0; border-radius:4px; padding:3px 6px;` — a solid mini-tag (NOT a pill), e.g. "비표준만". Far smaller than any type token; don't default to 10–11px or a pill shape.
- The normal path = solid white box + a "passes straight through" sub-label.
- Put both paths in a `1fr 1fr` row, then `↓ … merge … ↓` into the key node.

### 5.4 UML Activity diagram
| Element | Representation |
|---------|---------------|
| Start | pill (radius 100px) `bg #101828; #fff;` prefixed `●` |
| End | pill `bg #10734A; #fff;` prefixed `◉` |
| Action | white box, radius 10px, `border:1px solid #CBD6E6` |
| Key action | `bg #E7EFFC; border:1.5px solid #1428A0; #1428A0;` |
| Decision | **diamond**: inside `position:relative`, a 70px square `transform:rotate(45deg)` + radius 9px + `border:1.5px solid #1428A0`; text (`600 11px #1428A0`) in a separate upright centered div. container ~118×96 |
| Branches | left "yes" (green tag) / right "no" (red tag) boxes, `bg #F3F7FE; border:1px solid #CBD6E6;` |
| Merge | `▼ merge` `#B8C4D6; 12px` |
- Width `max-width:560px; margin:0 auto`.

### 5.5 Bar chart
```
track: display:flex; align-items:flex-end; gap:6px; height:108px; border-bottom:1.5px solid #CBD6E6;
bar: flex:1; height:{n}px; border-radius:4px 4px 0 0;
color: improved/AFTER #3157D5 · peak #D92D3A · low/BEFORE #CBD6E6
labels: top-left [AS-IS slate / TO-BE blue badge] + one-line state
```
- BEFORE = one peak + rest low; AFTER = even heights.
- **Paired AS-IS/TO-BE charts:** render the two states in `grid 1fr 1fr; gap:28px`; each gets a `[mono badge][≤1-line state]` header (`700 10px` badge); a panel title `600 13px #101828` sits above both. Don't stack them or omit the badges.
- **Single-series variant** (a quantity/distribution with no before/after baseline): all bars `accent-soft #3157D5`, optionally one `peak #D92D3A`; **no AS-IS/TO-BE badges.**

### 5.6 Gantt / roadmap
```
row: display:grid; grid-template-columns:150px 1fr; align-items:center; padding:3px 0;
     label (150px) 600 12px #1D2939 + track (position:relative; height:28px)
phase divider: vertical dashed line at 50% inside track `border-left:1px dashed #D5E0F4` (top:-3px bottom:-3px)
header zones: grid 150px 1fr 1fr — [Phase A #EEF4FB, blue] [Phase B #F3F7FE, grey]
bar kinds (position:absolute; top:4px; bottom:4px; radius:6px; 600 10px; centered; overflow hidden):
  - core (Phase A full):   left:1.5%;  width:45%;   bg #1428A0; #fff
  - minimal (Phase A part):left:1.5%;  width:21%;   bg #A9BDF5; #0F1E78
  - future (Phase B):      left:51%;   width:45.5%; bg #E7EFFC; border:1px solid #B9C9F7; #1428A0
legend: three 12px dots (radius 3px) + 500 11px labels
footnote: 400 11.5px #98A2B3 — explain that bar length/position encodes *when × how-much*
```
> Bars of the same kind must share identical left/width. Length encodes meaning, never random.

- **k phases (generalize):** each header zone = `(100/k)%` wide; a bar in phase *i* (0-indexed) anchors at `left:(i·100/k + 1.5)%`. The 2-phase numbers above are this formula at k=2. Bars of the same kind across rows still share identical left/width.
- **Empty phase is allowed:** a row may have a bar in only one phase — leave the other phase empty rather than inventing a filler bar. Empty ≠ minimal.

### 5.7 Flow / tree / log
- Vertical flow: node → `↓` (sub-label) → node …; final/destination node `bg #E7EFFC; #1428A0`.
- A single monolithic block: `bg #3157D5; #fff` full-width box.
- Tree (parent→children→leaves): blue header box → white-node grid → `#F3F7FE` leaf chips.
- Log sample: mono font; "start" lines in green `#10734A`, "end" lines in red `#B2202B`.

> **All charts and diagrams below are pure CSS `div`s — no SVG, no chart library.** Bars are heights, rings/donuts are `conic-gradient`, trend areas are `clip-path`, heatmaps are `rgba` opacity. Every one sits in a figure panel (`#F7FAFE`) unless noted. Each is introduced by a **"언제 쓰나" usage chip**: `display:flex; gap:10px; background:#E7EFFC; border-radius:8px; padding:12px 15px;` label `700 11px/1.5 Inter,Pretendard,sans-serif; letter-spacing:.03em; #1428A0;` text `400 12.5px/1.6 #475467`. The color law holds across all of them: improved/target = blue, current/low = slate, peak = red.

### 5.8 Horizontal bar chart
Rows `display:grid; grid-template-columns:130px 1fr 44px; gap:14px; align-items:center;`. Label `500 12.5px/1.4 #374151`; track `height:20px; background:#F3F7FE; border-radius:4px; overflow:hidden;`; fill `border-radius:4px;`; value `700 12px/1 'JetBrains Mono'; text-align:right;`. Fill/value colors: high `#1428A0`; mid `#3157D5`; **low / below-target `#CBD6E6`, value `#667083`** (slate = 미달). Use for progress/achievement/share when items are many or labels long.

### 5.9 Stat card grid
`display:grid; grid-template-columns:repeat(3,1fr); gap:14px;`. Tile `background:#F3F7FE; border-radius:8px; padding:22px 24px;` number `t-stat-lg` (700 44px Inter, `#1428A0` or `#101828`), sub `400 13px/1.6 #475467`. **Highlight tile** (the improvement metric): `background:linear-gradient(160deg,#E7EFFC,#EEF3FE); border:1px solid #D8E7FB;` with unit suffix `%` at `700 20px`. Use when one or two numbers *are* the message.

### 5.10 Composition / stacked bar
`display:flex; height:30px; border-radius:6px; overflow:hidden;` segments largest-first, darkest-first: `#1428A0` → `#3157D5` → `#A9BDF5` (3–4 segments max). Legend swatches `11px; border-radius:3px;`, values bold `#101828`. Use for share-of-whole / 점유율.

### 5.11 Area / trend chart
Plot `position:relative; height:150px;`. Area fill `position:absolute; inset:0; clip-path:polygon(…points…, 100% 100%, 0% 100%); background:linear-gradient(180deg,rgba(20,40,160,.26),rgba(20,40,160,.03));`. Vertex markers `width:9px; height:9px; border-radius:50%; background:#1428A0; border:2px solid #fff;` placed at each `(left%,top%)`. Baseline `border-bottom:1.5px solid #CBD6E6;` x-labels `500 11.5px/1.4 #98A2B3`. Single series = one blue area; multiple series → use bars instead. Use when direction/累적 추세 is the message.

### 5.12 Donut / ratio
Ring `width:124px; height:124px; border-radius:50%; background:conic-gradient(#1428A0 0 {n}%, #DCE5F2 0);` center hole `width:86px; height:86px; background:#F7FAFE;` center number `t-metric-mid` (700 24px Inter `#1428A0`) + label `#98A2B3`. **Max 2 segments** (핵심 vs 나머지). Legend: filled `#1428A0`, remainder `#DCE5F2`.

### 5.13 KPI + delta
Card `background:#F7FAFE; border:1px solid #DFE7F3; border-radius:8px; padding:16px 18px; display:flex; justify-content:space-between; align-items:center;`. Value `t-kpi` (700 26px Inter `#101828`), label `#98A2B3`. **Delta pill** `700 12px/1; border-radius:4px; padding:6px 9px;` — improvement `#10734A` on `#E7F5EE` (`▲`), regression `#B2202B` on `#FCEDEE` (`▼`). Delta color follows *good vs bad*, not up vs down.

### 5.14 Progress rings
Each ring `width:92px; height:92px; border-radius:50%; background:conic-gradient({color} 0 {pct}%, #DCE5F2 0);` hole `width:66px; height:66px; background:#F7FAFE;` center `t-ring-num` (700 15px JetBrains Mono). Fill color encodes priority: high `#1428A0` → mid `#3157D5` → **low `#A9BDF5` (center text `#667083`)** — lower value = paler blue. 3–5 items compared.

### 5.15 Heatmap / intensity grid
`display:grid; grid-template-columns:70px repeat(7,1fr); gap:6px;`. Day headers `500 10px #98A2B3`; row labels `500 11px #475467`; cells `height:26px; border-radius:4px; background:rgba(20,40,160,α);` — **intensity is blue opacity only** (α ≈ .10→.95, single hue). **Mandatory legend** (low→high): swatches `rgba(20,40,160,.15/.45/.75/.95)` at `16×12px; border-radius:3px;`. Use for a 2-D intensity distribution (when × where).

### 5.16 Flowchart shape library
Supplements §5.1's node rules with the full node vocabulary:
- **Basic node** white `1px solid #CBD6E6` r8 · **Key node** `#E7EFFC`/`1.5px #1428A0`/`#1428A0` (one per flow) · **Data/DB store** `1px dashed #AEBBD3` r9 · **Single/monolithic block** `#3157D5; #fff;` r9.
- **Start pill** `background:#101828; color:#fff; border-radius:100px; padding:11px 20px;` prefixed `●`. **End pill** `background:#10734A;` prefixed `◉`.
- Arrows: horizontal `→` `#1428A0` 16–20px · vertical `↓` `#B8C4D6` · bidirectional `↕` `#1428A0` · 36px circle badge `#1428A0/#fff` for emphasized/transform links only. Pipeline final node `#E7EFFC/1.5px #1428A0` (sub-text `#5D6B98`). Tree leaf chips borderless `400 11px #6B7588` on `#F3F7FE`.

### 5.17 UML — sequence
Plot `position:relative; height:~214px; max-width:600px; margin:0 auto;`. Participant boxes across the top; lead actor `#fff` on `#1428A0`, key participant `#1428A0` on `#E7EFFC`/`1.5px #1428A0`, data/DB `#1D2939` on white `1px dashed #AEBBD3`. Lifelines dashed (`#B9C9F7` lead, `#D5E0F4` others). Activation bar `width:8px; background:#E7EFFC; border:1px solid #1428A0; border-radius:2px;`. **Call message**: label `500 10.5px #475467`, line `height:2px; background:#1428A0`, solid triangle arrowhead `border-left:7px solid #1428A0`. **Return message** (always dashed): label `#94A3B8`, line `border-top:2px dashed #94A3B8`, arrowhead `#94A3B8`. ≤4 participants, ≤6 messages.

### 5.18 UML — state machine
`display:flex; align-items:center; flex-wrap:wrap; gap:12px;`. **Start** `16px; border-radius:50%; background:#101828;`. States `600 12.5px/1.3 #1428A0; background:#E7EFFC; border:1.5px solid #1428A0; border-radius:8px; padding:12px 18px;`. Transitions `→` `#B8C4D6 17px` with trigger label above `500 10px #98A2B3`. **End** `24px circle; border:2px solid #10734A;` with inner `12px #10734A` dot. Retry/error = an arrow looping back to a prior state.

### 5.19 UML — class
Class box `border:1px solid #1428A0; border-radius:6px; overflow:hidden; min-width:150px;`. Name band `600 12px/1.3 #1428A0; background:#E7EFFC; padding:9px 12px; border-bottom:1px solid #B9C9F7;`. Attribute/method rows `500 10.5px/1.7 'JetBrains Mono'; #475467;` divided by `1px solid #DCE5F2`. Inheritance: `◁` `#1428A0 15px` + connector `26px×2px #B9C9F7`.

### 5.20 UML — component
Component box `background:#fff; border:1px solid #1428A0; border-radius:6px; padding:16px 22px; min-width:130px;` with a top-right component glyph (`15×11px` rect `1.5px #1428A0` + two `8×2px` bars), stereotype `500 9.5px #667083; letter-spacing:.04em;` («component»), name `600 13px #1428A0`. **Provided interface (lollipop):** `15px circle, 2px #1428A0 border, border-right-color:transparent` + `20×2px #1428A0` stem. **Required interface (socket):** `14px; border-radius:50%; border:2px solid #1428A0; background:#fff;` + stem.

### 5.21 UML — use case
**Actor (stick figure)** from absolutely-positioned `#1428A0` divs (13px head circle `2px #1428A0`, 2px bars for body/arms/legs, legs rotated ±22°), label `600 11.5px #475467`. Association line `36×2px #B9C9F7`. **System boundary** `border:1px solid #B9C9F7; border-radius:8px; padding:18px 22px; background:#fff;` title `600 10px #98A2B3`. **Use-case ovals** `600 12px/1.3 #1428A0; background:#E7EFFC; border:1.5px solid #1428A0; border-radius:50%; padding:12px 26px;`.

### 5.22 UML — swimlane / partition
Container `border:1px solid #DCE5F2; border-radius:8px; overflow:hidden; display:grid; grid-template-columns:repeat(n,1fr);` lane dividers `border-right:1px solid #DCE5F2`. Lead lane header `600 11.5px/1.3 #1428A0; background:#EEF4FB;` other headers `#475467 on #F3F7FE`, all `padding:10px 8px; border-bottom:1px solid #DCE5F2`. Lane body `min-height:150px`; activity nodes white `1px solid #CBD6E6` r8; accent node `#1428A0 on #E7EFFC/1px #B9C9F7`; cross-lane flow `↓` `#B8C4D6`. One subject per lane.

### 5.23 UML — fork / join (parallel)
`max-width:340px; margin:0 auto;`. **Sync bars** (fork and join) `height:6px; background:#1428A0; border-radius:3px;` (full-width). Between them, parallel branches `display:grid; grid-template-columns:1fr 1fr; gap:14px;` each branch node `500 11.5px/1.3 #1428A0; background:#E7EFFC; border:1px solid #B9C9F7; border-radius:6px;`. Surrounding nodes white `1px solid #CBD6E6`; terminal DB node `1px dashed #AEBBD3` r9; flow `↓` `#B8C4D6`. Use when tasks run concurrently and all must finish before proceeding.

### 5.24 Complex branch / terminal-outcome activity
For workflows where not every path continues to execution, render the decision as a first-class activity diagram, not a linear process row. Start/key node at top → `diamond` (§5.4) → outcome cards in `grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px;`.

- Normal outcomes: white node.
- Preferred/target outcomes: key node (`#E7EFFC / #1428A0`).
- Valid "no execution" or rejection outcomes: red semantic node `color:#B2202B; background:#FCEDEE; border:1px solid #F3C7CB;` with a reason/audit sub-line.
- Keep terminal outcomes visually equal height. Do not hide "no follow-up", "rejected", or "needs more evidence" as footnotes when they are valid states.

### 5.25 Forbidden path with allowed alternatives
Use when the reader must understand a prohibited conversion and the sanctioned replacement. Layout `display:grid; grid-template-columns:1fr 44px 1fr; gap:14px; align-items:center;` with the left panel for allowed paths and the right panel for the blocked path. The blocked panel uses the sanctioned WARN palette: `background:#FEF6F6; border:1px solid #F3C7CB;`, blocked nodes `#FCEDEE / #B2202B`. The center connector may be `↔` or `≠`; never use the same blue treatment on the forbidden side.

### 5.26 Parallel state machines
Use when two lifecycles run near each other but must not auto-map. Place two figure panels in a `1fr 1fr` grid. Each panel has a small mono badge (`TASK STATUS`, `REPORTER STATUS`, etc.) and its own state machine (§5.18). Add a WARN callout below: `background:#FDF1F1; border:1px solid #F3C7CB; color:#8E5500;` stating the forbidden automatic mapping. Do not draw a direct arrow between the two lanes unless it represents a review candidate, not a state mutation.

### 5.27 Recovery / decision table
Use a decision table when queue inclusion depends on policy, link presence, visibility, and resolution status. Container is the table/check-matrix base (§4.7/§4.14), but rows should be `grid-template-columns:1.2fr .8fr .8fr 1.1fr` by default: `condition / follow-up / visibility / result`. Header is dark `#101828`; result cells may use concise labels like `Active queue`, `History`, `Safe summary`, `Hidden`. Decision tables are better than flowcharts when the row conditions are independent and comparable.

---

## 6. Token usage by page type

Density, type emphasis, color, and component mix shift with a page's role. Match the role.

> **How *much* to put in each type, the per-viewport ceilings, focal-hierarchy and arrangement rules** are in `composition-guide.md` (density budgets §2, composition §3, focal/whitespace §4, pacing §5). This section names the *role and component mix*; that guide quantifies the *amount and layout*.

### 6.1 Cover / Title
- **Goal:** identity + one-line thesis. **Density:** very low.
- Full-bleed **solid Samsung blue** (flat, no gradient); white text; `t-hero` (Inter 700); eyebrow pill; lead 17px; 3–4 stat tiles.
- Emphasis = white + translucent bottom-border highlight. No body-grey, no figure panels, no cards-with-borders.

### 6.2 Section divider (optional)
- The **boxed solid-blue divider (§4.12)**: big mono index + Inter title on the flat hero blue. Almost no body. Used to break long documents into acts. (A lighter variant — large index + `t-h2` on `#F3F7FE` — is fine for a quieter break.)

### 6.3 Overview / Summary
- **Goal:** orient, give the big picture. **Density:** low–medium, airy.
- Lead paragraph (full `t-lead`) + **one** hero diagram (flow or before/after) **or** a small set (2–4) of soft cards.
- Prefer larger Inter sub-headings, generous whitespace, outline cards. Avoid dense grids and number chips here.

### 6.4 Detail / Explanation
- **Goal:** explain mechanics thoroughly. **Density:** medium–high but structured.
- Multi-card grids (2–3 col), **number chips** for enumerated points, supporting diagrams in figure panels.
- **Each subsection = [sub-heading + paragraph (top) → figure panel (below)]**, applied consistently. Never interleave text and diagrams ad-hoc.
- Body color `#475467`; key nouns in accent or ink bold (1–2 per paragraph).

### 6.5 Comparison
- **Goal:** contrast current vs target. The **before/after panel** (§5.2) is the centerpiece.
- Strict semantic split: BEFORE = slate + red; AFTER = blue. Equal-height columns; negative vs positive pill rows.

### 6.6 Data / Metrics
- **Goal:** quantify. Pick from the chart/viz gallery (§5.8–5.15): vertical/horizontal bar, stacked bar, area/trend, donut, KPI+delta, progress rings, heatmap — or oversized Inter numbers (stat-card grid §5.9, dark stat band §4.11).
- One idea per figure; label axes/states with small badges; lead each with its "언제 쓰나" chip. Keep surrounding text minimal.

### 6.7 Roadmap / Timeline
- **Goal:** show sequence over phases. Gantt (§5.6) with phase zones, consistent bar kinds, legend + footnote.
- Optional paired MVP/Later cards (highlight card + outline card) above the chart.

### 6.8 Table / Matrix
- **Goal:** map many-to-many (problem↔fix↔effect, item↔direction↔open-question). 3-column tables (§4.7).
- Strong dark header for primary matrices; soft header for secondary ones. First column carries the key term.

### 6.9 Reference / Appendix
- **Goal:** definitions, low priority. **Density:** compact, **de-emphasized**.
- `t-eyebrow-ref` (grey eyebrow), muted heading `#5D6679`, smaller body, two-column term lists with row hairlines. Place at the end; never compete with the narrative.

---

## 7. Content elements (lists · media · links · callouts · placeholders)

The reference is a system-redesign with no images and few lists, so these are under-exercised there — but a different topic (research summary, product brief, process proposal) will need them. Specs here keep them on-fingerprint.

### 7.1 Lists
Default list = `ul { margin:0; padding-left:17–18px; display:flex; flex-direction:column; gap:10–11px; }`; each `li` at `t-body`/`t-body-sm`, formatted `<b ink>keyword</b> — explanation` (em-dash gloss). Never default browser bullets/indentation. (Lists are banned on the **cover** only — see `authoring-guide.md §4.1`.)

### 7.2 Embedded media (images · screenshots · logos · charts)
Images live **inside a figure panel** (`#F7FAFE`, `border:1px solid #DFE7F3`), `border-radius` matching `r-card-sm` (11–12px), `max-width:100%`. Optional `t-caption` below (prefix `*`). A screenshot/logo gets a 1px `#DCE5F2` hairline frame. **No full-bleed images** inside the sheet, no sharp corners, no full-saturation photos.

### 7.3 Inline links
`color:#1428A0`, no underline; optional `border-bottom:1px solid #B9C9F7`. Never blue + underline. (Nav links are styled separately — see §4.3.)

### 7.4 Callout / note box
Use the **4-variant callout set (§4.8)** — KEY (blue) · OK (green) · WARN (red) · NOTE (grey). Pick by meaning: an emphasis/key point is KEY, a recommendation is OK, a genuine caution/risk is WARN (red is legitimate here, per the updated red scope in §1.4-note), a low-priority aside is NOTE. The plain blue Left-accent card (§4.5) remains the base for inline note/risk boxes inside prose. **Still never red for a merely-missing value** — an unknown is not a warning (§7.5).

### 7.5 Placeholders & unknown values
- A figure not yet quantified: use a placeholder glyph in **normal ink bold** (`O`, `OO`) immediately followed by a muted parenthetical `<span style="color:#98A2B3;">(… 추후 확정)</span>`. **Never** flag missing data with red/warn color — unknown ≠ problem.
- A framing "stat" with no number: substitute a 1–2-char word (`MVP`, `단계`) still set in `t-stat`.

---

## 8. Responsive & anti-patterns

### 8.1 Responsive
Supported reading target: desktop/company-computer view. Minimum review viewport is **1366×768**; preferred review viewport is **1440×900** or wider. Narrow/mobile overflow is not a release blocker unless explicitly requested for a given artifact.

Desktop-first reading document (~1100px). **No media queries by default** — mobile resilience comes only from intrinsic flex (hero stat tiles `flex:1; min-width:150px` in a `flex-wrap:wrap` row; nav row `overflow-x:auto`). If you must support narrow widths, the sanctioned minimum: below ~720px, `sheet-pad → 0 20px`; all `1fr 1fr` / `repeat(3,…)` grids collapse to one column; the comparison panel stacks (arrow rotates `↓`); the gantt label column shrinks. Don't improvise ad-hoc breakpoints — that's how "same author" breaks across docs.

### 8.2 Anti-patterns (never do)
- Blue inside an AS-IS zone, or slate/red inside a TO-BE zone (the strongest fingerprint).
- Red used **decoratively**, for a **missing/unknown value** (use ink placeholder + muted caveat, §7.5), or as a **fill inside a TO-BE structural zone**. Red IS allowed for an AS-IS pain point and for a semantic WARN/Don't/regression signal (§1.4-note, §4.8).
- `text-decoration:underline` or italics for emphasis; > 2 bold per paragraph.
- Decorative (meaningless) accent color — blue always carries meaning.
- Random/unequal heights or positions for same-kind bars or nodes.
- Mixed radii within one diagram; sharp-corner or full-saturation images.
- Punchy verdict/drama titles ("It's not X, it's Y!"); titles describe, never deliver verdicts.
- Default browser bullets; full polite-register (`~합니다`) prose (see `authoring-guide.md §3`).
- A diagram forced onto a plain enumerated list (problems/risks/glossary stay as card grids/tables — see §6.4 and the checklist).

---

## 9. Reproduction checklist
1. Load Pretendard (CSS) + Inter + JetBrains Mono (via `<helmet>`); set global `word-break:keep-all`.
2. Page bg `#F3F7FE`; hero (solid Samsung-blue) → paper sheet (white, max 1100, −44 overlap).
3. Sticky nav + 3px progress bar + IntersectionObserver active link.
4. Every section: eyebrow (`NN · ENGLISH`, blue) → h2 (Inter 28) → lead (15.5/1.8, max 760).
5. Body `#475467`, headings `#101828`, emphasis `#1428A0` or ink bold.
6. BEFORE = slate + red / AFTER = blue — never mixed.
7. Diagrams, charts (§5.8–5.15) and UML (§5.17–5.23) live in figure panels (`#F7FAFE`), each led by its "언제 쓰나" chip. Node radius 6, card/figure panel 8, comparison panel 12. Charts are pure CSS (bars/conic/clip-path/rgba) — no SVG or chart lib.
8. **Text (top) → related diagram (below)** *when the content is diagrammable* (flow/contrast/hierarchy/schedule/quantity). Enumerated peer lists (problems, risks, open questions, glossary) stay as card grids/tables with **no** diagram. Tall-narrow diagrams may sit **text-left / diagram-right** in a `1fr 1fr` grid.
9. Match the **page type** (§6) to its density, emphasis, and component mix.
10. No blue inside AS-IS; no slate/red inside a TO-BE structural zone. Red = AS-IS pain **or** a semantic WARN/Don't/regression signal (§4.8, §1.4-note) — never decorative, never for an unknown value (ink placeholder + muted caveat, §7.5).

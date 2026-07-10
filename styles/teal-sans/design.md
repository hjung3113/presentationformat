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
| Body / UI font | **IBM Plex Sans** (`font-family:'IBM Plex Sans','IBM Plex Sans KR','Noto Sans KR',sans-serif`). Korean resolves via `IBM Plex Sans KR` then `Noto Sans KR`. |
| Display / heading font | **IBM Plex Sans** — same superfamily as body; display quality comes from **weight + size** (hero/h2 at 600–700), not a second face. Deliberately *not* a serif — the opposite choice from `indigo-serif`, so the two read as different authors. |
| Mono font | **IBM Plex Mono** — badges, section-number eyebrows, log/code lines, hero stat numbers, and any inline identifier. |
| Numerals | Body/data numerals set `font-variant-numeric: tabular-nums` wherever they align in a column (tables, KPI rows, charts). |
| Line breaking | `word-break: keep-all` **(global, mandatory)** — breaks at word/space boundaries. Pair with `overflow-wrap:break-word`, `text-wrap:pretty`. |
| Page background | `#EDF2F1` |
| Default body color | `#1E2233` |
| Accent (brand) | **Teal `#0F766E`** |

Fonts load inside the `<helmet>` element (a real element, not a comment — see `../../core/runtime-spec.md §1`). Keep this exact order: two `preconnect` hints → the single Google Fonts sheet (Plex Sans + Plex Sans KR + Plex Mono + Noto Sans KR). The `preconnect` links are required. Unlike `indigo-serif`, there is no separate webfont-CDN stylesheet — everything is one Google Fonts request.
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
```
> The full document shell (`<x-dc>` / `<helmet>` / `data-dc-script` / `DCLogic`) and the scroll-progress + active-nav scripts live in **`../../core/runtime-spec.md`** — they cannot be derived from visual tokens. Clone `template.dc.html` to get them assembled.
```css
/* helmet <style> — only the things that cannot be inline */
html { scroll-behavior: smooth; }
body { margin:0; background:#EDF2F1; word-break: keep-all; overflow-wrap: break-word; text-wrap: pretty; }
p, h1, h2, h3, div, span, li, a { word-break: keep-all; }
*::selection { background:#99F6E4; }
.nav-scroll::-webkit-scrollbar { height:0; }
```

**The three signatures** that make any document feel "by the same hand":
1. One **IBM Plex** superfamily throughout — Plex Sans for body *and* headings (weight/size carry the display role), Plex Mono for code/badges/numbers. A crisp, engineered sans voice, never a serif.
2. A single teal accent carrying meaning, never decorative.
3. **Semantic color split**: the *current/old/problem* state is always slate + red; the *target/new/improved* state is always teal. This split is the strongest fingerprint — never violate it.

---

> **Machine-readable mirror:** these tokens (colors, type, radius, spacing, core components) are also emitted in DESIGN.md-spec form in `design.tokens.md` for AI/tooling consumption. This file stays the source of truth — change a value here, then re-mirror.

## 1. Color Tokens

### 1.1 Accent — Teal (target / improvement / emphasis / key)
| Token | HEX | Use |
|-------|-----|-----|
| `accent` | `#0F766E` | Primary. Emphasis text, key box fill, badges, strong borders. |
| `accent-grad` | `#0D9488 → #0F766E → #115E59` | Hero gradient stops (155deg). |
| `accent-ink` | `#134E4A` | Dark text on light-teal fills. |
| `accent-soft` | `#0D9488` | Secondary fill (chart bars, single-block nodes). |
| `accent-050` | `#ECFDF8` | Emphasis box bg, pill-tag bg, arrow-circle bg. |
| `accent-zone` | `#EAF7F5` | "Phase A" header zone (timeline). |
| `accent-line` | `#99F6E4` | Soft emphasis border. |
| `accent-line2` | `#CCFBF1` | Highlighted card border. |
| `accent-min` | `#7BE0D3` | "Minimal / partial" timeline bar. |
| `accent-lilac` | `#E9FBF6` | Conditional / optional step bg. |
| `on-accent` | `#CCFBF1` · `#99F6E4` · `#99F6E4` | Secondary text on teal. |

### 1.2 Neutral — Ink / body / muted
| Token | HEX | Use |
|-------|-----|-----|
| `ink-900` | `#15172B` | Headings, strong inline emphasis. |
| `ink-800` | `#1E2233` | Default body, diagram-node text. |
| `ink-700` | `#3A4255` | `<b>` emphasis (non-accent). |
| `body` | `#3E4658` (lead) · `#5A6175` (most) | Paragraph / card body. |
| `muted-500` | `#8A91A6` | Inactive nav, secondary labels. |
| `muted-400` | `#9AA0B2` | Captions, footnotes, node sub-text. |
| `muted-300` | `#B6BBCB` · `#B6BBD6` | Arrows (↓), low-priority labels. |
| `hairline` | `#C2C8D4` · `#D7DCE4` | Dashed dividers, weak bars. |

### 1.3 Surface — fills / borders
| Token | HEX | Use |
|-------|-----|-----|
| `white` | `#FFFFFF` | Card / node base. |
| `paper-tint` | `#FCFCFE` | Diagram container bg (barely off-white). |
| `fig-tint` | `#FAFBFE` | **Figure panel** bg (diagram area under text). |
| `fill-50` | `#F8F9FD` | Filled cards / sub-cells. |
| `fill-100` | `#F6F7FB` | Soft list cards. |
| `border` | `#E7E9F3` | **Default card border (most common).** |
| `border-node` | `#E2E5F0` | Node border. |
| `border-section` | `#EAEBF2` | Section divider (border-top). |
| `border-row` | `#EDEEF4` · `#F0F1F6` | Table / list row rules. |
| `border-fig` | `#EEF0F6` | Figure-panel border. |
| `border-chip` | `#DDE1EA` | Chip border. |
| `mono-tint` | `#F1F3F7` | **AS-IS monolith** box fill ("one tangled blob"). |
| `mono-dashed` | `#B7BECC` | AS-IS monolith dashed border. |
| `warm-tint` | `#F3F1EF` | AS-IS external/legacy annotation bar fill. |
| `warm-dashed` | `#CBD1D0` | Legacy-annotation dashed border. |

> `mono-tint`/`mono-dashed` are slate-family (AS-IS). `warm-tint`/`warm-dashed` mark a thing that is *external / not-ours / legacy* and sits apart. Both belong only in AS-IS zones.

### 1.4 Semantic accents (meaning colors)
| Meaning | Token | HEX | Use |
|---------|-------|-----|-----|
| **Current / legacy / "before"** | `slate` | `#94A0B4` (badge) · `#C2C8D4` (bar) | AS-IS badge, old-state blocks. |
| **Problem / pain point** | `warn` | `#B42318` · `#9B2C1B` | "scattered", "manual" warning text. |
| Problem bg / border | `warn-bg` · `warn-line` | `#FEF2F2` · `#FDF2EF` · `#F7C8C1` | Warning chips/boxes, negative tags. |
| Peak / spike | `peak` | `#DC2626` | Load-chart peak bar. |
| **Success / normal / end** | `ok` | `#15803D` · `#E8F6EC` | "yes" branch, "done", start-of-stream marker. |

> **Hard rule:** never put teal inside a "before/AS-IS" zone, and never put slate/red inside a "target/TO-BE" **structural** zone (before/after AFTER column, target-flow nodes, TO-BE badges). Color carries meaning.
>
> **Red scope (two legitimate uses).** Red (`warn`) marks *either* (a) an **AS-IS pain point**, *or* (b) a **semantic WARN / negative / "Don't" / regression-delta signal** in the slide-format components — the WARN callout (§4.8), Don't rows (§4.13), a `▼` regression delta (§5.13), a "no/아니오" branch (§4.6). What red must **never** be: decorative, an unknown/not-yet-measured value (that's ink placeholder + muted caveat, §7.5), or a fill inside a TO-BE structural zone.

---

## 2. Type Scale

Use the `font: {weight} {size}/{line-height} {family}` shorthand verbatim.

| Token | Definition | Use |
|-------|-----------|-----|
| `t-hero` | `700 52px/1.28 'IBM Plex Sans'`, `letter-spacing:-.02em`, `#fff` | Cover title |
| `t-h2` | `600 34px/1.34 'IBM Plex Sans'`, `letter-spacing:-.01em`, `#15172B` | Section title |
| `t-h3-serif` | `600 22px/1.4 'IBM Plex Sans'`, `#15172B` | Sub-heading in a section |
| `t-h3` | `600 18px/1.4 IBM Plex Sans`, `#15172B` | Subsection title, diagram-group title |
| `t-sub` | `600 16–17px/1.4 IBM Plex Sans`, `#15172B` | Card heading, figure caption title |
| `t-eyebrow` | `700 13px/1 IBM Plex Sans`, `letter-spacing:.08em`, `#0F766E` | Section number label `NN · ENGLISH` |
| `t-eyebrow-ref` | `700 12px/1 IBM Plex Sans`, `letter-spacing:.08em`, `#B6BBCB` | Low-priority (reference) label |
| `t-lead` | `400 16px/1.85 IBM Plex Sans`, `#3E4658` / `#5A6175`, `max-width:760px` | Section lead paragraph |
| `t-body` | `400 14–14.5px/1.72–1.75 IBM Plex Sans`, `#5A6175` | Card body |
| `t-body-sm` | `400 13–13.5px/1.65–1.7 IBM Plex Sans`, `#5A6175` | Small card / diagram text |
| `t-caption` | `400 11–12.5px/1.5–1.6 IBM Plex Sans`, `#9AA0B2` | Captions, footnotes (prefix `*`) |
| `t-node` | `600 12–13px/1.3 IBM Plex Sans` | Diagram node text |
| `t-node-sub` | `400 10–11px/1.4 IBM Plex Sans`, `#9AA0B2` / `#5E8C84` | Node sub-text |
| `t-mono-badge` | `700 11px/1 'IBM Plex Mono'`, `letter-spacing:.06em`, `#fff` | AS-IS / TO-BE badges |
| `t-mono-num` | `700 12px/1 'IBM Plex Mono'`, `#0F766E` | Item number chip (e.g. 2.1) |
| `t-mono-log` | `500 11.5px/1.5 'IBM Plex Mono'` | Log/code line sample |
| `t-stat` | `700 30px/1 'IBM Plex Sans'`, `#fff` | Hero stat number |
| `t-stat-lg` | `700 44px/1 'IBM Plex Sans'`, `#0F766E` / `#15172B` | Stat-card grid number (§5.9) — the biggest numeral |
| `t-stat-band` | `700 32px/1 'IBM Plex Sans'`, `#fff` | Dark stat-band number (§4.11) |
| `t-kpi` | `700 26px/1 'IBM Plex Sans'`, `#15172B` | KPI card value (§5.13) |
| `t-metric-mid` | `700 24px/1 'IBM Plex Sans'`, `#0F766E` | Donut center number (§5.12) |
| `t-ring-num` | `700 15px/1 'IBM Plex Mono'` | Progress-ring center %, sequence/mono metric (§5.14) |

> **Oversized numerals are Plex Sans at heavy weight (700) with `tabular-nums`** (`t-stat` family) — a big number is a display element; the weight and size carry it, not a second face. The mono `t-ring-num` is the one exception, used only inside the small progress-ring hole.

### Emphasis rules
- **Bold emphasis:** `<b style="color:#15172B">…</b>` (ink) or `#3A4255` (soft ink) — key words only.
- **Accent emphasis** (means "improvement/key"): `<b style="color:#0F766E">…</b>`.
- **Highlight on dark backgrounds:** `border-bottom:2px solid rgba(255,255,255,.45)` or `box-shadow:inset 0 -8px 0 rgba(15,118,110,.12)`. Do **not** use `text-decoration:underline` or italics.
- Max **1–2** bold emphases per paragraph. Acronyms: expand once, then abbreviate.
- **Heading inline qualifier:** a trailing parenthetical/label inside a heading (e.g. `(현재)`, `UML Activity`, `무엇을`) drops to `font-weight:400; font-size:12–14px; color:#9AA0B2` — never the heading's weight. Pattern: `<h3>제목 <span style="font-weight:400;color:#9AA0B2;font-size:14px;">(보조)</span></h3>`.

---

## 3. Spacing & Radius Tokens

### 3.1 Radius — fixed by element type (consistency fingerprint)
| Token | Value | Where |
|-------|-------|-------|
| `r-node` | `8px` | Small diagram nodes, chips |
| `r-node-lg` | `9–10px` | Emphasis nodes, arrow-adjacent boxes |
| `r-pill-sm` | `4–6px` | Small badges / number chips |
| `r-card-sm` | `11–12px` | Filled sub-cards, figure panel |
| `r-card` | `14px` | Standard card (most common) |
| `r-card-lg` | `16px` | Diagram container, large card |
| `r-panel` | `18px` | AS-IS/TO-BE comparison panel |
| `r-sheet` | `22px 22px 0 0` | Top paper sheet (top corners only) |
| `r-pill` | `100px` | Tag pills, start/end nodes |
| `r-circle` | `50%` | Arrow circle badge (36px), legend dots |

> Small nodes 8–10px, cards/containers 14–16px, big comparison panels 18px. Keep radius uniform within one diagram.

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
| Section rule | `border-top:1px solid #EAEBF2` | Top of each section (except first) |
| `block-gap` | `18px` adjacent · `30–38px` distinct | Between stacked cards (18) vs distinct sub-blocks/diagrams within one section (30–38) |
| Sheet top inset | `padding-top:8px` | Paper-sheet top padding |
| First section | `padding:60px 0 56px`, **no** border-top | Slightly larger top pad; later sections `56px 0` + border-top |

> The hero-to-first-title gap is fixed by three values together: sheet `−44px` overlap + sheet `padding-top:8px` + first section `~60px` top. Don't flatten the first section to 56px.

---

## 4. Components

### 4.1 Hero / Cover
```
bg: linear-gradient(155deg,#0D9488 0%,#0F766E 55%,#115E59 100%)
overlay: radial-gradient(circle at 85% 15%, rgba(255,255,255,.10) 0%, transparent 42%)
padding: 78px 40px 92px / inner max-width:1020px (h1 max-width:820px)
eyebrow pill: bg rgba(255,255,255,.13), border rgba(255,255,255,.18), radius 100px, pad 9px 16px,
              600 12px, letter-spacing .1em, color #CCFBF1
title: t-hero (Plex Sans 52px, white)
lead: 400 18px/1.85, #CFF7EF, emphasis = white + bottom border
sub-note: 400 14px/1.7, #8FD9CE
stat tiles (×4): flex, each bg rgba(255,255,255,.10) + border rgba(255,255,255,.14),
                radius 14px, pad 20–22px. number t-stat + label 13px #99F6E4
```

### 4.2 Paper sheet
```
max-width:1100px; margin:-44px auto 0;  /* overlaps the hero */
background:#fff; border-radius:12px 16px 0 0;
box-shadow:0 -24px 60px rgba(30,34,70,.10);
padding:8px 64px 100px;
```

### 4.3 Sticky nav + progress bar
```
sticky bar: position:sticky; top:0; z-index:50; background:rgba(255,255,255,.86); backdrop-filter:blur(10px);
            border-bottom:1px solid #E2E5F0; height:54px; inner max-width:1100px; pad 0 40px
link row:   class="nav-scroll"; overflow-x:auto (scrollbar hidden via global .nav-scroll CSS, WebKit only)
links: 500 13px; #8A91A6 (inactive) → #0F766E + 700 (active, set imperatively by the observer)
ref link:  the appendix/glossary link is de-emphasized: color #B6BBCB + a 10px vertical-align:super "ref" superscript; never highlighted active
brand:     <a href="#top"> to the hero (id="top"); smooth scroll via html{scroll-behavior:smooth}, no JS
progress: position:fixed top:0 height:3px; z-index:60 (above nav); inner div id="rprog" width 0→100% bg #0F766E (scroll ratio)
```
> The JS that drives the progress width and the active link (IntersectionObserver, `rootMargin:'-45% 0px -50% 0px'`) plus the `id="sN"` ↔ `data-navlink="sN"` naming contract live in **`../../core/runtime-spec.md §2–3`**. The values above are appearance only.

### 4.4 Section header (identical pattern every section)
```html
<div style="font:700 13px/1 IBM Plex Sans; letter-spacing:.08em; color:#0F766E; margin-bottom:14px;">NN · ENGLISH</div>
<h2 style="font:600 34px/1.34 'IBM Plex Sans','IBM Plex Sans KR',sans-serif; color:#15172B; margin:0 0 12px; letter-spacing:-.01em;">Title</h2>
<p style="font:400 16px/1.85 IBM Plex Sans; color:#5A6175; margin:0 0 28px; max-width:760px;">Lead paragraph</p>
```

### 4.5 Card variants
| Variant | Style |
|---------|-------|
| Outline (default) | `border:1px solid #E7E9F3; border-radius:10px; padding:22px 24px;` |
| Filled (soft) | `background:#F8F9FD; border-radius:12–13px; padding:16–22px;` |
| Highlight | `border:1.5px solid #0F766E; border-radius:12px; background:linear-gradient(160deg,#ECFDF7,#fff);` |
| Dark summary | `background:#15172B; border-radius:12px;` (text #D4D7E6, emphasis #fff, label #5EEAD4) |
| Left-accent (risk) | `border:1px solid #E7E9F3; border-left:3px solid #0F766E; border-radius:0 12px 12px 0; padding:18px 20px;` — desc muted `#8A91A6`, then `→` mitigation `#5A6175`. Also the base for note/callout boxes. |
| Subsection card (deep-dive) | `border:1px solid #E7E9F3; border-radius:12px; padding:26px 28px;` — wraps a whole `N.M` subsection; heading is `N.M Title` in `t-h3` (600 18px, **plain text, no chip**); the figure panel nests inside. |

**Status-row card** (e.g. MVP "Now"): rows `display:flex; justify-content:space-between`; left label `600 13px`; right status `600 12px #0F766E` (core) or `400 12px #8A91A6` (minimal); core rows border `#CCFBF1`, minimal rows border `#E7E9F3`.

**Takeaway chip** (closes a card grid): `background:#ECFDF8; border:1px solid #CCFBF1; border-radius:12px;` vertically centered, `500 12px #0F766E`, `→`-led one-line synthesis. No heading.

### 4.6 Badges / chips / tags
| Element | Style |
|---------|-------|
| Number chip | `700 12px 'IBM Plex Mono'; #0F766E; bg #ECFDF8; radius 6px; pad 6px 9px;` — for **peer enumerated items** in a grid (problems, findings). |
| Circled numeral | `①②③…` as a `600 14px #0F766E` heading prefix — for **role/component lists**. Distinct texture from number chips; don't mix the two for one role. |
| AS-IS badge | `700 11px 'IBM Plex Mono'; letter-spacing .06em; #fff; bg #94A0B4; radius 6px; pad 6px 10px;` |
| TO-BE badge | same but `bg #0F766E` |
| Positive tag (pill) | `500 11px; radius 100px; pad 6px 11px; #0F766E; bg #ECFDF8;` |
| Negative tag (pill) | same but `#9B2C1B; bg #FDF2EF;` |
| "yes" branch tag | `700 10.5px; #15803D; bg #E8F6EC; radius 5px; pad 4px 8px;` |
| "no" branch tag | same but `#B42318; bg #FEF2F2;` |

### 4.7 Table
```
container: border:1px solid #E7E9F3; border-radius:10px; overflow:hidden;
header (strong): bg #15172B; cells 600 13px #fff; pad 14px 18px
header (soft):   bg #EFF5F4; cells 600 12.5px #3A4255
rows: display:grid (set column ratios); border-top:1px solid #EDEEF4;
      body 400 13px/1.6 #5A6175; first column emphasized (accent or ink), optional bg #FAFBFE
```

### 4.8 Callout / note box set (4 variants)
Four semantic callouts, all `border-left:3px solid; border-radius:0 10px 10px 0; padding:14px 16px;` label `700 11px/1 IBM Plex Sans; letter-spacing:.04em;` body `400 13px/1.65; #3E4658`. One short sentence each; **1–2 per screen** max.
| Variant | Fill | Left border + label |
|---------|------|---------------------|
| KEY (핵심) | `#ECFDF8` | `#0F766E` |
| OK (권장) | `#E8F6EC` | `#15803D` |
| WARN (주의) | `#FDF2EF` | `#B42318` |
| NOTE (참고) | `#F8F9FD` | `#B6BBCB` (label `#8A91A6`, body `#5A6175`) |

> **Red scope (updated).** The WARN callout **legitimately uses red** (`#B42318` on `#FDF2EF`). Red now marks *either* an AS-IS pain point *or* a semantic WARN/negative signal — see the revised rule in §1.4-note and §8.2. It is still never decorative, and never placed inside a TO-BE **structural** zone (before/after AFTER column, target-flow nodes).

### 4.9 Process step row
Horizontal numbered steps for a 3–5 stage procedure. `display:flex;` each step `flex:1; text-align:center;`. Number circle `width:38px; height:38px; border-radius:50%; background:#0F766E; color:#fff; font:700 15px/1 'IBM Plex Mono';` → title `600 13.5px/1.4 #15172B` → body `400 12px/1.6 #5A6175`. Connectors between steps: `→` `flex:0 0 24px; color:#7BE0D3; font-size:18px;`. **Final (완료) step circle is green** `background:#15803D` with `✓` (`700 14px`). 6+ steps → switch to a vertical flow.

### 4.10 Pull quote
`background:linear-gradient(160deg,#ECFDF7,#fff); border:1px solid #CCFBF1; border-radius:10px; padding:24px 26px;` opening quote glyph `“` `700 40px/1 'IBM Plex Sans'; color:#99F6E4;` quote text `600 18px/1.55 'IBM Plex Sans'; #15172B;` attribution `500 12px/1.4 #8A91A6`. For one message/principle set large, in Plex Sans at display weight.

### 4.11 Dark stat band
A compact dark cousin of the hero stat tiles, dropped between sections. `background:#15172B; border-radius:10px; padding:26px 30px; display:grid; grid-template-columns:repeat(4,1fr); gap:20px;` number `t-stat-band` (700 32px Plex Sans `#fff`), label `400 12px/1.5 #5EEAD4`. 3–4 headline numbers.

### 4.12 Section divider
Same teal gradient as the hero, boxed. `background:linear-gradient(155deg,#0D9488 0%,#0F766E 55%,#115E59 100%); border-radius:10px; padding:40px 44px;` overlay `radial-gradient(circle at 88% 20%, rgba(255,255,255,.10) 0%, transparent 45%)`. Big index `700 56px/1 'IBM Plex Mono'; color:rgba(255,255,255,.28);` (e.g. `03`) + part label `700 13px/1 IBM Plex Sans; letter-spacing:.1em; #CCFBF1;` (`PART 03`) + title `600 30px/1.3 'IBM Plex Sans'; #fff`. Breaks a long document into acts (page-type §6.2).

### 4.13 Do / Don't rows
Paired guidance rows. Do: `background:#E8F6EC; border-radius:10px; padding:12px 14px;` mark `✓` `700 13px #15803D`. Don't: `background:#FEF2F2;` mark `✕` `#B42318`. Text `400 12.5px/1.6 #3E4658`. Don't-rows use red per the updated red scope (§4.8-note).

### 4.14 Check / comparison matrix
A verdict variant of the table (§4.7): dark header `#15172B` (comparison column label may be `#99F6E4`); rows `border-top:1px solid #EDEEF4`, first cell `background:#FAFBFE; #1E2233`. Marks: `✓` `600 15px/1 #15803D` (met) · `✕` `#C2C8D4` (not met) · partial = short text `600 13px #9B2C1B` (e.g. "수작업"). Grey ✕ + green ✓ make the winning (new-structure) column visually dominate.

---

## 5. Diagram Conventions

Place every diagram inside a **figure panel** (under the explanatory text):
`background:#FAFBFE; border:1px solid #EEF0F6; border-radius:12px; padding:22–24px;`
Standalone comparison panels use `border:1px solid #E7E9F3; border-radius:16–18px; background:#FCFCFE; padding:24–30px;`

### 5.1 Universal node rules
- **Node:** white bg + `1px solid #E2E5F0` + radius 8–10px + pad 11px 8px, centered, `600 12px #1E2233`; sub-line `400 10–11px #9AA0B2`.
- **Key node:** `background:#ECFDF8; border:1.5px solid #0F766E; color:#0F766E;`.
- **Data / store node:** `border:1px dashed #B9BEDB`.
- **Vertical arrow:** centered `↓`, `#B6BBD6; font-size:13px; padding:5px 0;`; sub-label `11px #9AA0B2`.
- **Bidirectional:** `↕` (#0F766E). **Horizontal flow:** `→` (teal) or a 36px circular badge.
- **Circular arrow badge (primary):** `width:36px;height:36px;border-radius:50%;background:#0F766E;color:#fff;font-size:17px;` flex-centered — for primary before/after pivots only.
- **Inline light arrow circle:** `width:28px;height:28px;border-radius:50%;background:#ECFDF8;color:#0F766E;font-size:14px;` — between row-flow boxes (lighter, secondary).
- **Root/orchestrator node:** the primary teal node may carry `box-shadow:0 6px 16px rgba(15,118,110,.2)` to read as elevated; **all other nodes are flat.**
- **Merge/branch label:** `500 10.5px #9AA0B2`, e.g. `↓ merge ↓`.

### 5.2 Before / After comparison (signature pattern)
```
container: border:1px solid #E7E9F3; border-radius:12px; padding:30px; background:#FCFCFE;
grid: display:grid; grid-template-columns:1fr 50px 1fr; align-items:stretch;
      (the shorter column gets display:flex; flex-direction:column; justify-content:center)
center (50px): arrow cell, align-self:center, 36px teal circle "→"
BEFORE column: header [slate badge][slate label]; slate/grey body; pain points in red; 3 negative pills below.
AFTER column:  header [teal badge][ink label]; teal body; 3 positive pills below.
```
**AS-IS "monolith" wrapper (signature):** the BEFORE sub-grid is enclosed in one box = `background:#F1F3F7; border:1.5px dashed #B7BECC; border-radius:10px; padding:16px 14px;` with a centered caption (`600 12px #6A7187`, e.g. "현재 — 한 덩어리"); inner cells are white `1px solid #DDE1EA` radius 8. This "one tangled blob" enclosure is what makes AS-IS read as monolithic — don't render BEFORE cells as loose white boxes.
**Legacy/external annotation bar:** a thing that is not-ours/legacy and sits apart = `background:#F3F1EF; border:1px dashed #CBD1D0; border-radius:9px; padding:9px 12px;` label `600 11px #8A91A6` + qualifier `400 11px #A8AEC0`.

### 5.3 Conditional / optional path
- Conditional step = **dashed teal box on lilac** (`bg #E9FBF6; border:1.5px dashed #0F766E;`) + a small qualifier badge ("only X").
- **Qualifier badge (mini):** `700 8.5px/1 IBM Plex Sans; letter-spacing:.02em; color:#fff; background:#0F766E; border-radius:4px; padding:3px 6px;` — a solid mini-tag (NOT a pill), e.g. "비표준만". Far smaller than any type token; don't default to 10–11px or a pill shape.
- The normal path = solid white box + a "passes straight through" sub-label.
- Put both paths in a `1fr 1fr` row, then `↓ … merge … ↓` into the key node.

### 5.4 UML Activity diagram
| Element | Representation |
|---------|---------------|
| Start | pill (radius 100px) `bg #15172B; #fff;` prefixed `●` |
| End | pill `bg #15803D; #fff;` prefixed `◉` |
| Action | white box, radius 10px, `border:1px solid #E2E5F0` |
| Key action | `bg #ECFDF8; border:1.5px solid #0F766E; #0F766E;` |
| Decision | **diamond**: inside `position:relative`, a 70px square `transform:rotate(45deg)` + radius 9px + `border:1.5px solid #0F766E`; text (`600 11px #0F766E`) in a separate upright centered div. container ~118×96 |
| Branches | left "yes" (green tag) / right "no" (red tag) boxes, `bg #F8F9FD; border:1px solid #DDE1EA;` |
| Merge | `▼ merge` `#B6BBD6; 12px` |
- Width `max-width:560px; margin:0 auto`.

### 5.5 Bar chart
```
track: display:flex; align-items:flex-end; gap:6px; height:108px; border-bottom:1.5px solid #E2E5F0;
bar: flex:1; height:{n}px; border-radius:4px 4px 0 0;
color: improved/AFTER #0D9488 · peak #DC2626 · low/BEFORE #C2C8D4
labels: top-left [AS-IS slate / TO-BE teal badge] + one-line state
```
- BEFORE = one peak + rest low; AFTER = even heights.
- **Paired AS-IS/TO-BE charts:** render the two states in `grid 1fr 1fr; gap:28px`; each gets a `[mono badge][≤1-line state]` header (`700 10px` badge); a panel title `600 13px #15172B` sits above both. Don't stack them or omit the badges.
- **Single-series variant** (a quantity/distribution with no before/after baseline): all bars `accent-soft #0D9488`, optionally one `peak #DC2626`; **no AS-IS/TO-BE badges.**

### 5.6 Gantt / roadmap
```
row: display:grid; grid-template-columns:150px 1fr; align-items:center; padding:3px 0;
     label (150px) 600 12px #1E2233 + track (position:relative; height:28px)
phase divider: vertical dashed line at 50% inside track `border-left:1px dashed #D7DCE4` (top:-3px bottom:-3px)
header zones: grid 150px 1fr 1fr — [Phase A #EAF7F5, teal] [Phase B #F8F9FD, grey]
bar kinds (position:absolute; top:4px; bottom:4px; radius:6px; 600 10px; centered; overflow hidden):
  - core (Phase A full):   left:1.5%;  width:45%;   bg #0F766E; #fff
  - minimal (Phase A part):left:1.5%;  width:21%;   bg #7BE0D3; #134E4A
  - future (Phase B):      left:51%;   width:45.5%; bg #ECFDF8; border:1px solid #99F6E4; #0F766E
legend: three 12px dots (radius 3px) + 500 11px labels
footnote: 400 11.5px #9AA0B2 — explain that bar length/position encodes *when × how-much*
```
> Bars of the same kind must share identical left/width. Length encodes meaning, never random.

- **k phases (generalize):** each header zone = `(100/k)%` wide; a bar in phase *i* (0-indexed) anchors at `left:(i·100/k + 1.5)%`. The 2-phase numbers above are this formula at k=2. Bars of the same kind across rows still share identical left/width.
- **Empty phase is allowed:** a row may have a bar in only one phase — leave the other phase empty rather than inventing a filler bar. Empty ≠ minimal.

### 5.7 Flow / tree / log
- Vertical flow: node → `↓` (sub-label) → node …; final/destination node `bg #ECFDF8; #0F766E`.
- A single monolithic block: `bg #0D9488; #fff` full-width box.
- Tree (parent→children→leaves): teal header box → white-node grid → `#EDF2F1` leaf chips.
- Log sample: mono font; "start" lines in green `#15803D`, "end" lines in red `#B42318`.

> **All charts and diagrams below are pure CSS `div`s — no SVG, no chart library.** Bars are heights, rings/donuts are `conic-gradient`, trend areas are `clip-path`, heatmaps are `rgba` opacity. Every one sits in a figure panel (`#FAFBFE`) unless noted. Each is introduced by a **"언제 쓰나" usage chip**: `display:flex; gap:10px; background:#ECFDF8; border-radius:10px; padding:12px 15px;` label `700 11px/1.5 IBM Plex Sans; letter-spacing:.03em; #0F766E;` text `400 12.5px/1.6 #5A6175`. The color law holds across all of them: improved/target = teal, current/low = slate, peak = red.

### 5.8 Horizontal bar chart
Rows `display:grid; grid-template-columns:130px 1fr 44px; gap:14px; align-items:center;`. Label `500 12.5px/1.4 #3A4255`; track `height:20px; background:#EDF2F1; border-radius:5px; overflow:hidden;`; fill `border-radius:5px;`; value `700 12px/1 'IBM Plex Mono'; text-align:right;`. Fill/value colors: high `#0F766E`; mid `#0D9488`; **low / below-target `#C2C8D4`, value `#8A91A6`** (slate = 미달). Use for progress/achievement/share when items are many or labels long.

### 5.9 Stat card grid
`display:grid; grid-template-columns:repeat(3,1fr); gap:14px;`. Tile `background:#F8F9FD; border-radius:10px; padding:22px 24px;` number `t-stat-lg` (700 44px Plex Sans, `#0F766E` or `#15172B`), sub `400 13px/1.6 #5A6175`. **Highlight tile** (the improvement metric): `background:linear-gradient(160deg,#ECFDF8,#ECFDF7); border:1px solid #CCFBF1;` with unit suffix `%` at `700 20px`. Use when one or two numbers *are* the message.

### 5.10 Composition / stacked bar
`display:flex; height:30px; border-radius:8px; overflow:hidden;` segments largest-first, darkest-first: `#0F766E` → `#0D9488` → `#7BE0D3` (3–4 segments max). Legend swatches `11px; border-radius:3px;`, values bold `#15172B`. Use for share-of-whole / 점유율.

### 5.11 Area / trend chart
Plot `position:relative; height:150px;`. Area fill `position:absolute; inset:0; clip-path:polygon(…points…, 100% 100%, 0% 100%); background:linear-gradient(180deg,rgba(15,118,110,.26),rgba(15,118,110,.03));`. Vertex markers `width:9px; height:9px; border-radius:50%; background:#0F766E; border:2px solid #fff;` placed at each `(left%,top%)`. Baseline `border-bottom:1.5px solid #E2E5F0;` x-labels `500 11.5px/1.4 #9AA0B2`. Single series = one teal area; multiple series → use bars instead. Use when direction/累적 추세 is the message.

### 5.12 Donut / ratio
Ring `width:124px; height:124px; border-radius:50%; background:conic-gradient(#0F766E 0 {n}%, #E7E9F3 0);` center hole `width:86px; height:86px; background:#FAFBFE;` center number `t-metric-mid` (700 24px Plex Sans `#0F766E`) + label `#9AA0B2`. **Max 2 segments** (핵심 vs 나머지). Legend: filled `#0F766E`, remainder `#E7E9F3`.

### 5.13 KPI + delta
Card `background:#FAFBFE; border:1px solid #EEF0F6; border-radius:11px; padding:16px 18px; display:flex; justify-content:space-between; align-items:center;`. Value `t-kpi` (700 26px Plex Sans `#15172B`), label `#9AA0B2`. **Delta pill** `700 12px/1; border-radius:6px; padding:6px 9px;` — improvement `#15803D` on `#E8F6EC` (`▲`), regression `#B42318` on `#FEF2F2` (`▼`). Delta color follows *good vs bad*, not up vs down.

### 5.14 Progress rings
Each ring `width:92px; height:92px; border-radius:50%; background:conic-gradient({color} 0 {pct}%, #E7E9F3 0);` hole `width:66px; height:66px; background:#FAFBFE;` center `t-ring-num` (700 15px Mono). Fill color encodes priority: high `#0F766E` → mid `#0D9488` → **low `#7BE0D3` (center text `#8A91A6`)** — lower value = paler teal. 3–5 items compared.

### 5.15 Heatmap / intensity grid
`display:grid; grid-template-columns:70px repeat(7,1fr); gap:6px;`. Day headers `500 10px #9AA0B2`; row labels `500 11px #5A6175`; cells `height:26px; border-radius:5px; background:rgba(15,118,110,α);` — **intensity is teal opacity only** (α ≈ .10→.95, single hue). **Mandatory legend** (low→high): swatches `rgba(15,118,110,.15/.45/.75/.95)` at `16×12px; border-radius:3px;`. Use for a 2-D intensity distribution (when × where).

### 5.16 Flowchart shape library
Supplements §5.1's node rules with the full node vocabulary:
- **Basic node** white `1px solid #E2E5F0` r8 · **Key node** `#ECFDF8`/`1.5px #0F766E`/`#0F766E` (one per flow) · **Data/DB store** `1px dashed #B9BEDB` r9 · **Single/monolithic block** `#0D9488; #fff;` r9.
- **Start pill** `background:#15172B; color:#fff; border-radius:100px; padding:11px 20px;` prefixed `●`. **End pill** `background:#15803D;` prefixed `◉`.
- Arrows: horizontal `→` `#0F766E` 16–20px · vertical `↓` `#B6BBD6` · bidirectional `↕` `#0F766E` · 36px circle badge `#0F766E/#fff` for emphasized/transform links only. Pipeline final node `#ECFDF8/1.5px #0F766E` (sub-text `#5E8C84`). Tree leaf chips borderless `400 11px #7A8197` on `#EDF2F1`.

### 5.17 UML — sequence
Plot `position:relative; height:~214px; max-width:600px; margin:0 auto;`. Participant boxes across the top; lead actor `#fff` on `#0F766E`, key participant `#0F766E` on `#ECFDF8`/`1.5px #0F766E`, data/DB `#1E2233` on white `1px dashed #B9BEDB`. Lifelines dashed (`#99F6E4` lead, `#D7DCE4` others). Activation bar `width:8px; background:#ECFDF8; border:1px solid #0F766E; border-radius:2px;`. **Call message**: label `500 10.5px #5A6175`, line `height:2px; background:#0F766E`, solid triangle arrowhead `border-left:7px solid #0F766E`. **Return message** (always dashed): label `#94A0B4`, line `border-top:2px dashed #94A0B4`, arrowhead `#94A0B4`. ≤4 participants, ≤6 messages.

### 5.18 UML — state machine
`display:flex; align-items:center; flex-wrap:wrap; gap:12px;`. **Start** `16px; border-radius:50%; background:#15172B;`. States `600 12.5px/1.3 #0F766E; background:#ECFDF8; border:1.5px solid #0F766E; border-radius:12px; padding:12px 18px;`. Transitions `→` `#B6BBD6 17px` with trigger label above `500 10px #9AA0B2`. **End** `24px circle; border:2px solid #15803D;` with inner `12px #15803D` dot. Retry/error = an arrow looping back to a prior state.

### 5.19 UML — class
Class box `border:1px solid #0F766E; border-radius:8px; overflow:hidden; min-width:150px;`. Name band `600 12px/1.3 #0F766E; background:#ECFDF8; padding:9px 12px; border-bottom:1px solid #99F6E4;`. Attribute/method rows `500 10.5px/1.7 'IBM Plex Mono'; #5A6175;` divided by `1px solid #E7E9F3`. Inheritance: `◁` `#0F766E 15px` + connector `26px×2px #99F6E4`.

### 5.20 UML — component
Component box `background:#fff; border:1px solid #0F766E; border-radius:9px; padding:16px 22px; min-width:130px;` with a top-right component glyph (`15×11px` rect `1.5px #0F766E` + two `8×2px` bars), stereotype `500 9.5px #8A91A6; letter-spacing:.04em;` («component»), name `600 13px #0F766E`. **Provided interface (lollipop):** `15px circle, 2px #0F766E border, border-right-color:transparent` + `20×2px #0F766E` stem. **Required interface (socket):** `14px; border-radius:50%; border:2px solid #0F766E; background:#fff;` + stem.

### 5.21 UML — use case
**Actor (stick figure)** from absolutely-positioned `#0F766E` divs (13px head circle `2px #0F766E`, 2px bars for body/arms/legs, legs rotated ±22°), label `600 11.5px #5A6175`. Association line `36×2px #99F6E4`. **System boundary** `border:1px solid #99F6E4; border-radius:12px; padding:18px 22px; background:#fff;` title `600 10px #9AA0B2`. **Use-case ovals** `600 12px/1.3 #0F766E; background:#ECFDF8; border:1.5px solid #0F766E; border-radius:50%; padding:12px 26px;`.

### 5.22 UML — swimlane / partition
Container `border:1px solid #E7E9F3; border-radius:12px; overflow:hidden; display:grid; grid-template-columns:repeat(n,1fr);` lane dividers `border-right:1px solid #E7E9F3`. Lead lane header `600 11.5px/1.3 #0F766E; background:#EAF7F5;` other headers `#5A6175 on #F8F9FD`, all `padding:10px 8px; border-bottom:1px solid #E7E9F3`. Lane body `min-height:150px`; activity nodes white `1px solid #E2E5F0` r8; accent node `#0F766E on #ECFDF8/1px #99F6E4`; cross-lane flow `↓` `#B6BBD6`. One subject per lane.

### 5.23 UML — fork / join (parallel)
`max-width:340px; margin:0 auto;`. **Sync bars** (fork and join) `height:6px; background:#0F766E; border-radius:3px;` (full-width). Between them, parallel branches `display:grid; grid-template-columns:1fr 1fr; gap:14px;` each branch node `500 11.5px/1.3 #0F766E; background:#ECFDF8; border:1px solid #99F6E4; border-radius:8px;`. Surrounding nodes white `1px solid #E2E5F0`; terminal DB node `1px dashed #B9BEDB` r9; flow `↓` `#B6BBD6`. Use when tasks run concurrently and all must finish before proceeding.

### 5.24 Complex branch / terminal-outcome activity
For workflows where not every path continues to execution, render the decision as a first-class activity diagram, not a linear process row. Start/key node at top → `diamond` (§5.4) → outcome cards in `grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px;`.

- Normal outcomes: white node.
- Preferred/target outcomes: key node (`#ECFDF8 / #0F766E`).
- Valid "no execution" or rejection outcomes: red semantic node `color:#B42318; background:#FEF2F2; border:1px solid #F7C8C1;` with a reason/audit sub-line.
- Keep terminal outcomes visually equal height. Do not hide "no follow-up", "rejected", or "needs more evidence" as footnotes when they are valid states.

### 5.25 Forbidden path with allowed alternatives
Use when the reader must understand a prohibited conversion and the sanctioned replacement. Layout `display:grid; grid-template-columns:1fr 44px 1fr; gap:14px; align-items:center;` with the left panel for allowed paths and the right panel for the blocked path. The blocked panel uses the sanctioned WARN palette: `background:#FEF6F4; border:1px solid #F7C8C1;`, blocked nodes `#FEF2F2 / #B42318`. The center connector may be `↔` or `≠`; never use the same teal treatment on the forbidden side.

### 5.26 Parallel state machines
Use when two lifecycles run near each other but must not auto-map. Place two figure panels in a `1fr 1fr` grid. Each panel has a small mono badge (`TASK STATUS`, `REPORTER STATUS`, etc.) and its own state machine (§5.18). Add a WARN callout below: `background:#FDF2EF; border:1px solid #F7C8C1; color:#9B2C1B;` stating the forbidden automatic mapping. Do not draw a direct arrow between the two lanes unless it represents a review candidate, not a state mutation.

### 5.27 Recovery / decision table
Use a decision table when queue inclusion depends on policy, link presence, visibility, and resolution status. Container is the table/check-matrix base (§4.7/§4.14), but rows should be `grid-template-columns:1.2fr .8fr .8fr 1.1fr` by default: `condition / follow-up / visibility / result`. Header is dark `#15172B`; result cells may use concise labels like `Active queue`, `History`, `Safe summary`, `Hidden`. Decision tables are better than flowcharts when the row conditions are independent and comparable.

---

## 6. Token usage by page type

Density, type emphasis, color, and component mix shift with a page's role. Match the role.

> **How *much* to put in each type, the per-viewport ceilings, focal-hierarchy and arrangement rules** are in `composition-guide.md` (density budgets §2, composition §3, focal/whitespace §4, pacing §5). This section names the *role and component mix*; that guide quantifies the *amount and layout*.

### 6.1 Cover / Title
- **Goal:** identity + one-line thesis. **Density:** very low.
- Full-bleed **teal gradient**; white text; `t-hero` (Plex Sans 700); eyebrow pill; lead 18px; 3–4 stat tiles.
- Emphasis = white + translucent bottom-border highlight. No body-grey, no figure panels, no cards-with-borders.

### 6.2 Section divider (optional)
- The **boxed teal-gradient divider (§4.12)**: big mono index + Plex Sans title on the hero gradient. Almost no body. Used to break long documents into acts. (A lighter variant — large index + `t-h2` on `#F8F9FD` — is fine for a quieter break.)

### 6.3 Overview / Summary
- **Goal:** orient, give the big picture. **Density:** low–medium, airy.
- Lead paragraph (full `t-lead`) + **one** hero diagram (flow or before/after) **or** a small set (2–4) of soft cards.
- Prefer larger Plex Sans sub-headings, generous whitespace, outline cards. Avoid dense grids and number chips here.

### 6.4 Detail / Explanation
- **Goal:** explain mechanics thoroughly. **Density:** medium–high but structured.
- Multi-card grids (2–3 col), **number chips** for enumerated points, supporting diagrams in figure panels.
- **Each subsection = [sub-heading + paragraph (top) → figure panel (below)]**, applied consistently. Never interleave text and diagrams ad-hoc.
- Body color `#5A6175`; key nouns in accent or ink bold (1–2 per paragraph).

### 6.5 Comparison
- **Goal:** contrast current vs target. The **before/after panel** (§5.2) is the centerpiece.
- Strict semantic split: BEFORE = slate + red; AFTER = teal. Equal-height columns; negative vs positive pill rows.

### 6.6 Data / Metrics
- **Goal:** quantify. Pick from the chart/viz gallery (§5.8–5.15): vertical/horizontal bar, stacked bar, area/trend, donut, KPI+delta, progress rings, heatmap — or oversized Plex Sans numbers (stat-card grid §5.9, dark stat band §4.11).
- One idea per figure; label axes/states with small badges; lead each with its "언제 쓰나" chip. Keep surrounding text minimal.

### 6.7 Roadmap / Timeline
- **Goal:** show sequence over phases. Gantt (§5.6) with phase zones, consistent bar kinds, legend + footnote.
- Optional paired MVP/Later cards (highlight card + outline card) above the chart.

### 6.8 Table / Matrix
- **Goal:** map many-to-many (problem↔fix↔effect, item↔direction↔open-question). 3-column tables (§4.7).
- Strong dark header for primary matrices; soft header for secondary ones. First column carries the key term.

### 6.9 Reference / Appendix
- **Goal:** definitions, low priority. **Density:** compact, **de-emphasized**.
- `t-eyebrow-ref` (grey eyebrow), muted heading `#6A7187`, smaller body, two-column term lists with row hairlines. Place at the end; never compete with the narrative.

---

## 7. Content elements (lists · media · links · callouts · placeholders)

The reference is a system-redesign with no images and few lists, so these are under-exercised there — but a different topic (research summary, product brief, process proposal) will need them. Specs here keep them on-fingerprint.

### 7.1 Lists
Default list = `ul { margin:0; padding-left:17–18px; display:flex; flex-direction:column; gap:10–11px; }`; each `li` at `t-body`/`t-body-sm`, formatted `<b ink>keyword</b> — explanation` (em-dash gloss). Never default browser bullets/indentation. (Lists are banned on the **cover** only — see `authoring-guide.md §4.1`.)

### 7.2 Embedded media (images · screenshots · logos · charts)
Images live **inside a figure panel** (`#FAFBFE`, `border:1px solid #EEF0F6`), `border-radius` matching `r-card-sm` (11–12px), `max-width:100%`. Optional `t-caption` below (prefix `*`). A screenshot/logo gets a 1px `#E7E9F3` hairline frame. **No full-bleed images** inside the sheet, no sharp corners, no full-saturation photos.

### 7.3 Inline links
`color:#0F766E`, no underline; optional `border-bottom:1px solid #99F6E4`. Never blue + underline. (Nav links are styled separately — see §4.3.)

### 7.4 Callout / note box
Use the **4-variant callout set (§4.8)** — KEY (teal) · OK (green) · WARN (red) · NOTE (grey). Pick by meaning: an emphasis/key point is KEY, a recommendation is OK, a genuine caution/risk is WARN (red is legitimate here, per the updated red scope in §1.4-note), a low-priority aside is NOTE. The plain teal Left-accent card (§4.5) remains the base for inline note/risk boxes inside prose. **Still never red for a merely-missing value** — an unknown is not a warning (§7.5).

### 7.5 Placeholders & unknown values
- A figure not yet quantified: use a placeholder glyph in **normal ink bold** (`O`, `OO`) immediately followed by a muted parenthetical `<span style="color:#9AA0B2;">(… 추후 확정)</span>`. **Never** flag missing data with red/warn color — unknown ≠ problem.
- A framing "stat" with no number: substitute a 1–2-char word (`MVP`, `단계`) still set in `t-stat`.

---

## 8. Responsive & anti-patterns

### 8.1 Responsive
Supported reading target: desktop/company-computer view. Minimum review viewport is **1366×768**; preferred review viewport is **1440×900** or wider. Narrow/mobile overflow is not a release blocker unless explicitly requested for a given artifact.

Desktop-first reading document (~1100px). **No media queries by default** — mobile resilience comes only from intrinsic flex (hero stat tiles `flex:1; min-width:150px` in a `flex-wrap:wrap` row; nav row `overflow-x:auto`). If you must support narrow widths, the sanctioned minimum: below ~720px, `sheet-pad → 0 20px`; all `1fr 1fr` / `repeat(3,…)` grids collapse to one column; the comparison panel stacks (arrow rotates `↓`); the gantt label column shrinks. Don't improvise ad-hoc breakpoints — that's how "same author" breaks across docs.

### 8.2 Anti-patterns (never do)
- Teal inside an AS-IS zone, or slate/red inside a TO-BE zone (the strongest fingerprint).
- Red used **decoratively**, for a **missing/unknown value** (use ink placeholder + muted caveat, §7.5), or as a **fill inside a TO-BE structural zone**. Red IS allowed for an AS-IS pain point and for a semantic WARN/Don't/regression signal (§1.4-note, §4.8).
- `text-decoration:underline` or italics for emphasis; > 2 bold per paragraph.
- Decorative (meaningless) accent color — teal always carries meaning.
- Random/unequal heights or positions for same-kind bars or nodes.
- Mixed radii within one diagram; sharp-corner or full-saturation images.
- Punchy verdict/drama titles ("It's not X, it's Y!"); titles describe, never deliver verdicts.
- Default browser bullets; full polite-register (`~합니다`) prose (see `authoring-guide.md §3`).
- A diagram forced onto a plain enumerated list (problems/risks/glossary stay as card grids/tables — see §6.4 and the checklist).

---

## 9. Reproduction checklist
1. Load IBM Plex Sans / IBM Plex Sans / IBM Plex Mono (via `<helmet>`); set global `word-break:keep-all`.
2. Page bg `#EDF2F1`; hero (teal gradient) → paper sheet (white, max 1100, −44 overlap).
3. Sticky nav + 3px progress bar + IntersectionObserver active link.
4. Every section: eyebrow (`NN · ENGLISH`, teal) → h2 (Plex Sans 34) → lead (16/1.85, max 760).
5. Body `#5A6175`, headings `#15172B`, emphasis `#0F766E` or ink bold.
6. BEFORE = slate + red / AFTER = teal — never mixed.
7. Diagrams, charts (§5.8–5.15) and UML (§5.17–5.23) live in figure panels (`#FAFBFE`), each led by its "언제 쓰나" chip. Node radius 8–10, card 14–16, comparison panel 18. Charts are pure CSS (bars/conic/clip-path/rgba) — no SVG or chart lib.
8. **Text (top) → related diagram (below)** *when the content is diagrammable* (flow/contrast/hierarchy/schedule/quantity). Enumerated peer lists (problems, risks, open questions, glossary) stay as card grids/tables with **no** diagram. Tall-narrow diagrams may sit **text-left / diagram-right** in a `1fr 1fr` grid.
9. Match the **page type** (§6) to its density, emphasis, and component mix.
10. No teal inside AS-IS; no slate/red inside a TO-BE structural zone. Red = AS-IS pain **or** a semantic WARN/Don't/regression signal (§4.8, §1.4-note) — never decorative, never for an unknown value (ink placeholder + muted caveat, §7.5).

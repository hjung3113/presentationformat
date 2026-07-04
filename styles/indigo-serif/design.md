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
| Body / UI font | **Pretendard** (`font-family:Pretendard,sans-serif`) |
| Display / heading font | **Noto Serif KR** — hero title, section titles (h2), some h3 |
| Mono font | **JetBrains Mono** — badges, section-number eyebrows, log/code lines, hero stat numbers |
| Line breaking | `word-break: keep-all` **(global, mandatory)** — breaks at word/space boundaries. Pair with `overflow-wrap:break-word`, `text-wrap:pretty`. |
| Page background | `#EEF0F7` |
| Default body color | `#1E2233` |
| Accent (brand) | **Indigo `#4338CA`** |

Fonts load inside the `<helmet>` element (a real element, not a comment — see `../../core/runtime-spec.md §1`). Keep this exact order: Pretendard CSS → two `preconnect` hints → Google Fonts sheet. The `preconnect` links are required.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```
> The full document shell (`<x-dc>` / `<helmet>` / `data-dc-script` / `DCLogic`) and the scroll-progress + active-nav scripts live in **`../../core/runtime-spec.md`** — they cannot be derived from visual tokens. Clone `template.dc.html` to get them assembled.
```css
/* helmet <style> — only the things that cannot be inline */
html { scroll-behavior: smooth; }
body { margin:0; background:#EEF0F7; word-break: keep-all; overflow-wrap: break-word; text-wrap: pretty; }
p, h1, h2, h3, div, span, li, a { word-break: keep-all; }
*::selection { background:#C7D2FE; }
.nav-scroll::-webkit-scrollbar { height:0; }
```

**The three signatures** that make any document feel "by the same hand":
1. Serif display headings (Noto Serif KR) over a clean sans body (Pretendard).
2. A single indigo accent carrying meaning, never decorative.
3. **Semantic color split**: the *current/old/problem* state is always slate + amber; the *target/new/improved* state is always indigo. This split is the strongest fingerprint — never violate it.

---

> **Machine-readable mirror:** these tokens (colors, type, radius, spacing, core components) are also emitted in DESIGN.md-spec form in `design.tokens.md` for AI/tooling consumption. This file stays the source of truth — change a value here, then re-mirror.

## 1. Color Tokens

### 1.1 Accent — Indigo (target / improvement / emphasis / key)
| Token | HEX | Use |
|-------|-----|-----|
| `accent` | `#4338CA` | Primary. Emphasis text, key box fill, badges, strong borders. |
| `accent-grad` | `#4F46E5 → #3F35C4 → #372EAC` | Hero gradient stops (155deg). |
| `accent-ink` | `#312E81` | Dark text on light-indigo fills. |
| `accent-soft` | `#6B63D6` | Secondary fill (chart bars, single-block nodes). |
| `accent-050` | `#EEF0FF` | Emphasis box bg, pill-tag bg, arrow-circle bg. |
| `accent-zone` | `#F1F2FB` | "Phase A" header zone (timeline). |
| `accent-line` | `#C9CEF4` | Soft emphasis border. |
| `accent-line2` | `#DADEF8` | Highlighted card border. |
| `accent-min` | `#C7CCF2` | "Minimal / partial" timeline bar. |
| `accent-lilac` | `#F3F1FE` | Conditional / optional step bg. |
| `on-accent` | `#D9DCFF` · `#C7CAF5` · `#C7D2FE` | Secondary text on indigo. |

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
| `hairline` | `#C2C8D4` · `#D7DAEC` | Dashed dividers, weak bars. |

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
| `warm-tint` | `#F6F4F2` | AS-IS external/legacy annotation bar fill. |
| `warm-dashed` | `#C9CDD8` | Legacy-annotation dashed border. |

> `mono-tint`/`mono-dashed` are slate-family (AS-IS). `warm-tint`/`warm-dashed` mark a thing that is *external / not-ours / legacy* and sits apart. Both belong only in AS-IS zones.

### 1.4 Semantic accents (meaning colors)
| Meaning | Token | HEX | Use |
|---------|-------|-----|-----|
| **Current / legacy / "before"** | `slate` | `#94A0B4` (badge) · `#C2C8D4` (bar) | AS-IS badge, old-state blocks. |
| **Problem / pain point** | `warn` | `#B4543F` · `#94724F` | "scattered", "manual" warning text. |
| Problem bg / border | `warn-bg` · `warn-line` | `#FBF1EE` · `#FBF3EC` · `#F0D7CF` | Warning chips/boxes, negative tags. |
| Peak / spike | `peak` | `#C9714F` | Load-chart peak bar. |
| **Success / normal / end** | `ok` | `#1F8A5B` · `#E6F5EE` | "yes" branch, "done", start-of-stream marker. |

> **Hard rule:** never put indigo inside a "before/AS-IS" zone, and never put slate/amber inside a "target/TO-BE" **structural** zone (before/after AFTER column, target-flow nodes, TO-BE badges). Color carries meaning.
>
> **Amber scope (two legitimate uses).** Amber (`warn`) marks *either* (a) an **AS-IS pain point**, *or* (b) a **semantic WARN / negative / "Don't" / regression-delta signal** in the slide-format components — the WARN callout (§4.8), Don't rows (§4.13), a `▼` regression delta (§5.13), a "no/아니오" branch (§4.6). What amber must **never** be: decorative, an unknown/not-yet-measured value (that's ink placeholder + muted caveat, §7.5), or a fill inside a TO-BE structural zone.

---

## 2. Type Scale

Use the `font: {weight} {size}/{line-height} {family}` shorthand verbatim.

| Token | Definition | Use |
|-------|-----------|-----|
| `t-hero` | `700 52px/1.28 'Noto Serif KR'`, `letter-spacing:-.02em`, `#fff` | Cover title |
| `t-h2` | `600 34px/1.34 'Noto Serif KR'`, `letter-spacing:-.01em`, `#15172B` | Section title |
| `t-h3-serif` | `600 22px/1.4 'Noto Serif KR'`, `#15172B` | Sub-heading in a section |
| `t-h3` | `600 18px/1.4 Pretendard`, `#15172B` | Subsection title, diagram-group title |
| `t-sub` | `600 16–17px/1.4 Pretendard`, `#15172B` | Card heading, figure caption title |
| `t-eyebrow` | `700 13px/1 Pretendard`, `letter-spacing:.08em`, `#4338CA` | Section number label `NN · ENGLISH` |
| `t-eyebrow-ref` | `700 12px/1 Pretendard`, `letter-spacing:.08em`, `#B6BBCB` | Low-priority (reference) label |
| `t-lead` | `400 16px/1.85 Pretendard`, `#3E4658` / `#5A6175`, `max-width:760px` | Section lead paragraph |
| `t-body` | `400 14–14.5px/1.72–1.75 Pretendard`, `#5A6175` | Card body |
| `t-body-sm` | `400 13–13.5px/1.65–1.7 Pretendard`, `#5A6175` | Small card / diagram text |
| `t-caption` | `400 11–12.5px/1.5–1.6 Pretendard`, `#9AA0B2` | Captions, footnotes (prefix `*`) |
| `t-node` | `600 12–13px/1.3 Pretendard` | Diagram node text |
| `t-node-sub` | `400 10–11px/1.4 Pretendard`, `#9AA0B2` / `#7C82B8` | Node sub-text |
| `t-mono-badge` | `700 11px/1 'JetBrains Mono'`, `letter-spacing:.06em`, `#fff` | AS-IS / TO-BE badges |
| `t-mono-num` | `700 12px/1 'JetBrains Mono'`, `#4338CA` | Item number chip (e.g. 2.1) |
| `t-mono-log` | `500 11.5px/1.5 'JetBrains Mono'` | Log/code line sample |
| `t-stat` | `700 30px/1 'Noto Serif KR'`, `#fff` | Hero stat number |
| `t-stat-lg` | `700 44px/1 'Noto Serif KR'`, `#4338CA` / `#15172B` | Stat-card grid number (§5.9) — the biggest numeral |
| `t-stat-band` | `700 32px/1 'Noto Serif KR'`, `#fff` | Dark stat-band number (§4.11) |
| `t-kpi` | `700 26px/1 'Noto Serif KR'`, `#15172B` | KPI card value (§5.13) |
| `t-metric-mid` | `700 24px/1 'Noto Serif KR'`, `#4338CA` | Donut center number (§5.12) |
| `t-ring-num` | `700 15px/1 'JetBrains Mono'` | Progress-ring center %, sequence/mono metric (§5.14) |

> **Oversized numerals are always Serif KR** (`t-stat` family), never Pretendard — a big number is a display element. The mono `t-ring-num` is the one exception, used only inside the small progress-ring hole.

### Emphasis rules
- **Bold emphasis:** `<b style="color:#15172B">…</b>` (ink) or `#3A4255` (soft ink) — key words only.
- **Accent emphasis** (means "improvement/key"): `<b style="color:#4338CA">…</b>`.
- **Highlight on dark backgrounds:** `border-bottom:2px solid rgba(255,255,255,.45)` or `box-shadow:inset 0 -8px 0 rgba(67,56,202,.12)`. Do **not** use `text-decoration:underline` or italics.
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
bg: linear-gradient(155deg,#4F46E5 0%,#3F35C4 55%,#372EAC 100%)
overlay: radial-gradient(circle at 85% 15%, rgba(255,255,255,.10) 0%, transparent 42%)
padding: 78px 40px 92px / inner max-width:1020px (h1 max-width:820px)
eyebrow pill: bg rgba(255,255,255,.13), border rgba(255,255,255,.18), radius 100px, pad 9px 16px,
              600 12px, letter-spacing .1em, color #D9DCFF
title: t-hero (Serif 52px, white)
lead: 400 18px/1.85, #E2E3FB, emphasis = white + bottom border
sub-note: 400 14px/1.7, #B8BBF0
stat tiles (×4): flex, each bg rgba(255,255,255,.10) + border rgba(255,255,255,.14),
                radius 14px, pad 20–22px. number t-stat + label 13px #C7CAF5
```

### 4.2 Paper sheet
```
max-width:1100px; margin:-44px auto 0;  /* overlaps the hero */
background:#fff; border-radius:22px 22px 0 0;
box-shadow:0 -24px 60px rgba(30,34,70,.10);
padding:8px 64px 100px;
```

### 4.3 Sticky nav + progress bar
```
sticky bar: position:sticky; top:0; z-index:50; background:rgba(255,255,255,.86); backdrop-filter:blur(10px);
            border-bottom:1px solid #E2E5F0; height:54px; inner max-width:1100px; pad 0 40px
link row:   class="nav-scroll"; overflow-x:auto (scrollbar hidden via global .nav-scroll CSS, WebKit only)
links: 500 13px; #8A91A6 (inactive) → #4338CA + 700 (active, set imperatively by the observer)
ref link:  the appendix/glossary link is de-emphasized: color #B6BBCB + a 10px vertical-align:super "ref" superscript; never highlighted active
brand:     <a href="#top"> to the hero (id="top"); smooth scroll via html{scroll-behavior:smooth}, no JS
progress: position:fixed top:0 height:3px; z-index:60 (above nav); inner div id="rprog" width 0→100% bg #4338CA (scroll ratio)
```
> The JS that drives the progress width and the active link (IntersectionObserver, `rootMargin:'-45% 0px -50% 0px'`) plus the `id="sN"` ↔ `data-navlink="sN"` naming contract live in **`../../core/runtime-spec.md §2–3`**. The values above are appearance only.

### 4.4 Section header (identical pattern every section)
```html
<div style="font:700 13px/1 Pretendard; letter-spacing:.08em; color:#4338CA; margin-bottom:14px;">NN · ENGLISH</div>
<h2 style="font:600 34px/1.34 'Noto Serif KR',serif; color:#15172B; margin:0 0 12px; letter-spacing:-.01em;">Title</h2>
<p style="font:400 16px/1.85 Pretendard; color:#5A6175; margin:0 0 28px; max-width:760px;">Lead paragraph</p>
```

### 4.5 Card variants
| Variant | Style |
|---------|-------|
| Outline (default) | `border:1px solid #E7E9F3; border-radius:14px; padding:22px 24px;` |
| Filled (soft) | `background:#F8F9FD; border-radius:12–13px; padding:16–22px;` |
| Highlight | `border:1.5px solid #4338CA; border-radius:16px; background:linear-gradient(160deg,#F5F6FF,#fff);` |
| Dark summary | `background:#15172B; border-radius:16px;` (text #D4D7E6, emphasis #fff, label #A8AEF5) |
| Left-accent (risk) | `border:1px solid #E7E9F3; border-left:3px solid #4338CA; border-radius:0 12px 12px 0; padding:18px 20px;` — desc muted `#8A91A6`, then `→` mitigation `#5A6175`. Also the base for note/callout boxes. |
| Subsection card (deep-dive) | `border:1px solid #E7E9F3; border-radius:16px; padding:26px 28px;` — wraps a whole `N.M` subsection; heading is `N.M Title` in `t-h3` (600 18px, **plain text, no chip**); the figure panel nests inside. |

**Status-row card** (e.g. MVP "Now"): rows `display:flex; justify-content:space-between`; left label `600 13px`; right status `600 12px #4338CA` (core) or `400 12px #8A91A6` (minimal); core rows border `#DADEF8`, minimal rows border `#E7E9F3`.

**Takeaway chip** (closes a card grid): `background:#EEF0FF; border:1px solid #DADEF8; border-radius:12px;` vertically centered, `500 12px #4338CA`, `→`-led one-line synthesis. No heading.

### 4.6 Badges / chips / tags
| Element | Style |
|---------|-------|
| Number chip | `700 12px 'JetBrains Mono'; #4338CA; bg #EEF0FF; radius 6px; pad 6px 9px;` — for **peer enumerated items** in a grid (problems, findings). |
| Circled numeral | `①②③…` as a `600 14px #4338CA` heading prefix — for **role/component lists**. Distinct texture from number chips; don't mix the two for one role. |
| AS-IS badge | `700 11px 'JetBrains Mono'; letter-spacing .06em; #fff; bg #94A0B4; radius 6px; pad 6px 10px;` |
| TO-BE badge | same but `bg #4338CA` |
| Positive tag (pill) | `500 11px; radius 100px; pad 6px 11px; #4338CA; bg #EEF0FF;` |
| Negative tag (pill) | same but `#94724F; bg #FBF3EC;` |
| "yes" branch tag | `700 10.5px; #1F8A5B; bg #E6F5EE; radius 5px; pad 4px 8px;` |
| "no" branch tag | same but `#B4543F; bg #FBF1EE;` |

### 4.7 Table
```
container: border:1px solid #E7E9F3; border-radius:14px; overflow:hidden;
header (strong): bg #15172B; cells 600 13px #fff; pad 14px 18px
header (soft):   bg #F3F4FA; cells 600 12.5px #3A4255
rows: display:grid (set column ratios); border-top:1px solid #EDEEF4;
      body 400 13px/1.6 #5A6175; first column emphasized (accent or ink), optional bg #FAFBFE
```

### 4.8 Callout / note box set (4 variants)
Four semantic callouts, all `border-left:3px solid; border-radius:0 10px 10px 0; padding:14px 16px;` label `700 11px/1 Pretendard; letter-spacing:.04em;` body `400 13px/1.65; #3E4658`. One short sentence each; **1–2 per screen** max.
| Variant | Fill | Left border + label |
|---------|------|---------------------|
| KEY (핵심) | `#EEF0FF` | `#4338CA` |
| OK (권장) | `#E6F5EE` | `#1F8A5B` |
| WARN (주의) | `#FBF3EC` | `#B4543F` |
| NOTE (참고) | `#F8F9FD` | `#B6BBCB` (label `#8A91A6`, body `#5A6175`) |

> **Amber scope (updated).** The WARN callout **legitimately uses amber** (`#B4543F` on `#FBF3EC`). Amber now marks *either* an AS-IS pain point *or* a semantic WARN/negative signal — see the revised rule in §1.4-note and §8.2. It is still never decorative, and never placed inside a TO-BE **structural** zone (before/after AFTER column, target-flow nodes).

### 4.9 Process step row
Horizontal numbered steps for a 3–5 stage procedure. `display:flex;` each step `flex:1; text-align:center;`. Number circle `width:38px; height:38px; border-radius:50%; background:#4338CA; color:#fff; font:700 15px/1 'JetBrains Mono';` → title `600 13.5px/1.4 #15172B` → body `400 12px/1.6 #5A6175`. Connectors between steps: `→` `flex:0 0 24px; color:#C7CCF2; font-size:18px;`. **Final (완료) step circle is green** `background:#1F8A5B` with `✓` (`700 14px`). 6+ steps → switch to a vertical flow.

### 4.10 Pull quote
`background:linear-gradient(160deg,#F5F6FF,#fff); border:1px solid #DADEF8; border-radius:14px; padding:24px 26px;` opening quote glyph `“` `700 40px/1 'Noto Serif KR'; color:#C9CEF4;` quote text `600 18px/1.55 'Noto Serif KR'; #15172B;` attribution `500 12px/1.4 #8A91A6`. For one message/principle set large, in serif.

### 4.11 Dark stat band
A compact dark cousin of the hero stat tiles, dropped between sections. `background:#15172B; border-radius:14px; padding:26px 30px; display:grid; grid-template-columns:repeat(4,1fr); gap:20px;` number `t-stat-band` (700 32px Serif `#fff`), label `400 12px/1.5 #A8AEF5`. 3–4 headline numbers.

### 4.12 Section divider
Same indigo gradient as the hero, boxed. `background:linear-gradient(155deg,#4F46E5 0%,#3F35C4 55%,#372EAC 100%); border-radius:14px; padding:40px 44px;` overlay `radial-gradient(circle at 88% 20%, rgba(255,255,255,.10) 0%, transparent 45%)`. Big index `700 56px/1 'JetBrains Mono'; color:rgba(255,255,255,.28);` (e.g. `03`) + part label `700 13px/1 Pretendard; letter-spacing:.1em; #D9DCFF;` (`PART 03`) + title `600 30px/1.3 'Noto Serif KR'; #fff`. Breaks a long document into acts (page-type §6.2).

### 4.13 Do / Don't rows
Paired guidance rows. Do: `background:#E6F5EE; border-radius:10px; padding:12px 14px;` mark `✓` `700 13px #1F8A5B`. Don't: `background:#FBF1EE;` mark `✕` `#B4543F`. Text `400 12.5px/1.6 #3E4658`. Don't-rows use amber per the updated amber scope (§4.8-note).

### 4.14 Check / comparison matrix
A verdict variant of the table (§4.7): dark header `#15172B` (comparison column label may be `#C7CAF5`); rows `border-top:1px solid #EDEEF4`, first cell `background:#FAFBFE; #1E2233`. Marks: `✓` `600 15px/1 #1F8A5B` (met) · `✕` `#C2C8D4` (not met) · partial = short text `600 13px #94724F` (e.g. "수작업"). Grey ✕ + green ✓ make the winning (new-structure) column visually dominate.

---

## 5. Diagram Conventions

Place every diagram inside a **figure panel** (under the explanatory text):
`background:#FAFBFE; border:1px solid #EEF0F6; border-radius:12px; padding:22–24px;`
Standalone comparison panels use `border:1px solid #E7E9F3; border-radius:16–18px; background:#FCFCFE; padding:24–30px;`

### 5.1 Universal node rules
- **Node:** white bg + `1px solid #E2E5F0` + radius 8–10px + pad 11px 8px, centered, `600 12px #1E2233`; sub-line `400 10–11px #9AA0B2`.
- **Key node:** `background:#EEF0FF; border:1.5px solid #4338CA; color:#4338CA;`.
- **Data / store node:** `border:1px dashed #B9BEDB`.
- **Vertical arrow:** centered `↓`, `#B6BBD6; font-size:13px; padding:5px 0;`; sub-label `11px #9AA0B2`.
- **Bidirectional:** `↕` (#4338CA). **Horizontal flow:** `→` (indigo) or a 36px circular badge.
- **Circular arrow badge (primary):** `width:36px;height:36px;border-radius:50%;background:#4338CA;color:#fff;font-size:17px;` flex-centered — for primary before/after pivots only.
- **Inline light arrow circle:** `width:28px;height:28px;border-radius:50%;background:#EEF0FF;color:#4338CA;font-size:14px;` — between row-flow boxes (lighter, secondary).
- **Root/orchestrator node:** the primary indigo node may carry `box-shadow:0 6px 16px rgba(67,56,202,.2)` to read as elevated; **all other nodes are flat.**
- **Merge/branch label:** `500 10.5px #9AA0B2`, e.g. `↓ merge ↓`.

### 5.2 Before / After comparison (signature pattern)
```
container: border:1px solid #E7E9F3; border-radius:18px; padding:30px; background:#FCFCFE;
grid: display:grid; grid-template-columns:1fr 50px 1fr; align-items:stretch;
      (the shorter column gets display:flex; flex-direction:column; justify-content:center)
center (50px): arrow cell, align-self:center, 36px indigo circle "→"
BEFORE column: header [slate badge][slate label]; slate/grey body; pain points in amber; 3 negative pills below.
AFTER column:  header [indigo badge][ink label]; indigo body; 3 positive pills below.
```
**AS-IS "monolith" wrapper (signature):** the BEFORE sub-grid is enclosed in one box = `background:#F1F3F7; border:1.5px dashed #B7BECC; border-radius:14px; padding:16px 14px;` with a centered caption (`600 12px #6A7187`, e.g. "현재 — 한 덩어리"); inner cells are white `1px solid #DDE1EA` radius 8. This "one tangled blob" enclosure is what makes AS-IS read as monolithic — don't render BEFORE cells as loose white boxes.
**Legacy/external annotation bar:** a thing that is not-ours/legacy and sits apart = `background:#F6F4F2; border:1px dashed #C9CDD8; border-radius:9px; padding:9px 12px;` label `600 11px #8A91A6` + qualifier `400 11px #A8AEC0`.

### 5.3 Conditional / optional path
- Conditional step = **dashed indigo box on lilac** (`bg #F3F1FE; border:1.5px dashed #4338CA;`) + a small qualifier badge ("only X").
- **Qualifier badge (mini):** `700 8.5px/1 Pretendard; letter-spacing:.02em; color:#fff; background:#4338CA; border-radius:4px; padding:3px 6px;` — a solid mini-tag (NOT a pill), e.g. "비표준만". Far smaller than any type token; don't default to 10–11px or a pill shape.
- The normal path = solid white box + a "passes straight through" sub-label.
- Put both paths in a `1fr 1fr` row, then `↓ … merge … ↓` into the key node.

### 5.4 UML Activity diagram
| Element | Representation |
|---------|---------------|
| Start | pill (radius 100px) `bg #15172B; #fff;` prefixed `●` |
| End | pill `bg #1F8A5B; #fff;` prefixed `◉` |
| Action | white box, radius 10px, `border:1px solid #E2E5F0` |
| Key action | `bg #EEF0FF; border:1.5px solid #4338CA; #4338CA;` |
| Decision | **diamond**: inside `position:relative`, a 70px square `transform:rotate(45deg)` + radius 9px + `border:1.5px solid #4338CA`; text (`600 11px #4338CA`) in a separate upright centered div. container ~118×96 |
| Branches | left "yes" (green tag) / right "no" (amber tag) boxes, `bg #F8F9FD; border:1px solid #DDE1EA;` |
| Merge | `▼ merge` `#B6BBD6; 12px` |
- Width `max-width:560px; margin:0 auto`.

### 5.5 Bar chart
```
track: display:flex; align-items:flex-end; gap:6px; height:108px; border-bottom:1.5px solid #E2E5F0;
bar: flex:1; height:{n}px; border-radius:4px 4px 0 0;
color: improved/AFTER #6B63D6 · peak #C9714F · low/BEFORE #C2C8D4
labels: top-left [AS-IS slate / TO-BE indigo badge] + one-line state
```
- BEFORE = one peak + rest low; AFTER = even heights.
- **Paired AS-IS/TO-BE charts:** render the two states in `grid 1fr 1fr; gap:28px`; each gets a `[mono badge][≤1-line state]` header (`700 10px` badge); a panel title `600 13px #15172B` sits above both. Don't stack them or omit the badges.
- **Single-series variant** (a quantity/distribution with no before/after baseline): all bars `accent-soft #6B63D6`, optionally one `peak #C9714F`; **no AS-IS/TO-BE badges.**

### 5.6 Gantt / roadmap
```
row: display:grid; grid-template-columns:150px 1fr; align-items:center; padding:3px 0;
     label (150px) 600 12px #1E2233 + track (position:relative; height:28px)
phase divider: vertical dashed line at 50% inside track `border-left:1px dashed #D7DAEC` (top:-3px bottom:-3px)
header zones: grid 150px 1fr 1fr — [Phase A #F1F2FB, indigo] [Phase B #F8F9FD, grey]
bar kinds (position:absolute; top:4px; bottom:4px; radius:6px; 600 10px; centered; overflow hidden):
  - core (Phase A full):   left:1.5%;  width:45%;   bg #4338CA; #fff
  - minimal (Phase A part):left:1.5%;  width:21%;   bg #C7CCF2; #312E81
  - future (Phase B):      left:51%;   width:45.5%; bg #EEF0FF; border:1px solid #C9CEF4; #4338CA
legend: three 12px dots (radius 3px) + 500 11px labels
footnote: 400 11.5px #9AA0B2 — explain that bar length/position encodes *when × how-much*
```
> Bars of the same kind must share identical left/width. Length encodes meaning, never random.

- **k phases (generalize):** each header zone = `(100/k)%` wide; a bar in phase *i* (0-indexed) anchors at `left:(i·100/k + 1.5)%`. The 2-phase numbers above are this formula at k=2. Bars of the same kind across rows still share identical left/width.
- **Empty phase is allowed:** a row may have a bar in only one phase — leave the other phase empty rather than inventing a filler bar. Empty ≠ minimal.

### 5.7 Flow / tree / log
- Vertical flow: node → `↓` (sub-label) → node …; final/destination node `bg #EEF0FF; #4338CA`.
- A single monolithic block: `bg #6B63D6; #fff` full-width box.
- Tree (parent→children→leaves): indigo header box → white-node grid → `#EEF0F7` leaf chips.
- Log sample: mono font; "start" lines in green `#1F8A5B`, "end" lines in amber `#B4543F`.

> **All charts and diagrams below are pure CSS `div`s — no SVG, no chart library.** Bars are heights, rings/donuts are `conic-gradient`, trend areas are `clip-path`, heatmaps are `rgba` opacity. Every one sits in a figure panel (`#FAFBFE`) unless noted. Each is introduced by a **"언제 쓰나" usage chip**: `display:flex; gap:10px; background:#EEF0FF; border-radius:10px; padding:12px 15px;` label `700 11px/1.5 Pretendard; letter-spacing:.03em; #4338CA;` text `400 12.5px/1.6 #5A6175`. The color law holds across all of them: improved/target = indigo, current/low = slate, peak = amber.

### 5.8 Horizontal bar chart
Rows `display:grid; grid-template-columns:130px 1fr 44px; gap:14px; align-items:center;`. Label `500 12.5px/1.4 #3A4255`; track `height:20px; background:#EEF0F7; border-radius:5px; overflow:hidden;`; fill `border-radius:5px;`; value `700 12px/1 'JetBrains Mono'; text-align:right;`. Fill/value colors: high `#4338CA`; mid `#6B63D6`; **low / below-target `#C2C8D4`, value `#8A91A6`** (slate = 미달). Use for progress/achievement/share when items are many or labels long.

### 5.9 Stat card grid
`display:grid; grid-template-columns:repeat(3,1fr); gap:14px;`. Tile `background:#F8F9FD; border-radius:14px; padding:22px 24px;` number `t-stat-lg` (700 44px Serif, `#4338CA` or `#15172B`), sub `400 13px/1.6 #5A6175`. **Highlight tile** (the improvement metric): `background:linear-gradient(160deg,#EEF0FF,#F5F6FF); border:1px solid #DADEF8;` with unit suffix `%` at `700 20px`. Use when one or two numbers *are* the message.

### 5.10 Composition / stacked bar
`display:flex; height:30px; border-radius:8px; overflow:hidden;` segments largest-first, darkest-first: `#4338CA` → `#6B63D6` → `#C7CCF2` (3–4 segments max). Legend swatches `11px; border-radius:3px;`, values bold `#15172B`. Use for share-of-whole / 점유율.

### 5.11 Area / trend chart
Plot `position:relative; height:150px;`. Area fill `position:absolute; inset:0; clip-path:polygon(…points…, 100% 100%, 0% 100%); background:linear-gradient(180deg,rgba(67,56,202,.26),rgba(67,56,202,.03));`. Vertex markers `width:9px; height:9px; border-radius:50%; background:#4338CA; border:2px solid #fff;` placed at each `(left%,top%)`. Baseline `border-bottom:1.5px solid #E2E5F0;` x-labels `500 11.5px/1.4 #9AA0B2`. Single series = one indigo area; multiple series → use bars instead. Use when direction/累적 추세 is the message.

### 5.12 Donut / ratio
Ring `width:124px; height:124px; border-radius:50%; background:conic-gradient(#4338CA 0 {n}%, #E7E9F3 0);` center hole `width:86px; height:86px; background:#FAFBFE;` center number `t-metric-mid` (700 24px Serif `#4338CA`) + label `#9AA0B2`. **Max 2 segments** (핵심 vs 나머지). Legend: filled `#4338CA`, remainder `#E7E9F3`.

### 5.13 KPI + delta
Card `background:#FAFBFE; border:1px solid #EEF0F6; border-radius:11px; padding:16px 18px; display:flex; justify-content:space-between; align-items:center;`. Value `t-kpi` (700 26px Serif `#15172B`), label `#9AA0B2`. **Delta pill** `700 12px/1; border-radius:6px; padding:6px 9px;` — improvement `#1F8A5B` on `#E6F5EE` (`▲`), regression `#B4543F` on `#FBF1EE` (`▼`). Delta color follows *good vs bad*, not up vs down.

### 5.14 Progress rings
Each ring `width:92px; height:92px; border-radius:50%; background:conic-gradient({color} 0 {pct}%, #E7E9F3 0);` hole `width:66px; height:66px; background:#FAFBFE;` center `t-ring-num` (700 15px Mono). Fill color encodes priority: high `#4338CA` → mid `#6B63D6` → **low `#C7CCF2` (center text `#8A91A6`)** — lower value = paler indigo. 3–5 items compared.

### 5.15 Heatmap / intensity grid
`display:grid; grid-template-columns:70px repeat(7,1fr); gap:6px;`. Day headers `500 10px #9AA0B2`; row labels `500 11px #5A6175`; cells `height:26px; border-radius:5px; background:rgba(67,56,202,α);` — **intensity is indigo opacity only** (α ≈ .10→.95, single hue). **Mandatory legend** (low→high): swatches `rgba(67,56,202,.15/.45/.75/.95)` at `16×12px; border-radius:3px;`. Use for a 2-D intensity distribution (when × where).

### 5.16 Flowchart shape library
Supplements §5.1's node rules with the full node vocabulary:
- **Basic node** white `1px solid #E2E5F0` r8 · **Key node** `#EEF0FF`/`1.5px #4338CA`/`#4338CA` (one per flow) · **Data/DB store** `1px dashed #B9BEDB` r9 · **Single/monolithic block** `#6B63D6; #fff;` r9.
- **Start pill** `background:#15172B; color:#fff; border-radius:100px; padding:11px 20px;` prefixed `●`. **End pill** `background:#1F8A5B;` prefixed `◉`.
- Arrows: horizontal `→` `#4338CA` 16–20px · vertical `↓` `#B6BBD6` · bidirectional `↕` `#4338CA` · 36px circle badge `#4338CA/#fff` for emphasized/transform links only. Pipeline final node `#EEF0FF/1.5px #4338CA` (sub-text `#7C82B8`). Tree leaf chips borderless `400 11px #7A8197` on `#EEF0F7`.

### 5.17 UML — sequence
Plot `position:relative; height:~214px; max-width:600px; margin:0 auto;`. Participant boxes across the top; lead actor `#fff` on `#4338CA`, key participant `#4338CA` on `#EEF0FF`/`1.5px #4338CA`, data/DB `#1E2233` on white `1px dashed #B9BEDB`. Lifelines dashed (`#C9CEF4` lead, `#D7DAEC` others). Activation bar `width:8px; background:#EEF0FF; border:1px solid #4338CA; border-radius:2px;`. **Call message**: label `500 10.5px #5A6175`, line `height:2px; background:#4338CA`, solid triangle arrowhead `border-left:7px solid #4338CA`. **Return message** (always dashed): label `#94A0B4`, line `border-top:2px dashed #94A0B4`, arrowhead `#94A0B4`. ≤4 participants, ≤6 messages.

### 5.18 UML — state machine
`display:flex; align-items:center; flex-wrap:wrap; gap:12px;`. **Start** `16px; border-radius:50%; background:#15172B;`. States `600 12.5px/1.3 #4338CA; background:#EEF0FF; border:1.5px solid #4338CA; border-radius:12px; padding:12px 18px;`. Transitions `→` `#B6BBD6 17px` with trigger label above `500 10px #9AA0B2`. **End** `24px circle; border:2px solid #1F8A5B;` with inner `12px #1F8A5B` dot. Retry/error = an arrow looping back to a prior state.

### 5.19 UML — class
Class box `border:1px solid #4338CA; border-radius:8px; overflow:hidden; min-width:150px;`. Name band `600 12px/1.3 #4338CA; background:#EEF0FF; padding:9px 12px; border-bottom:1px solid #C9CEF4;`. Attribute/method rows `500 10.5px/1.7 'JetBrains Mono'; #5A6175;` divided by `1px solid #E7E9F3`. Inheritance: `◁` `#4338CA 15px` + connector `26px×2px #C9CEF4`.

### 5.20 UML — component
Component box `background:#fff; border:1px solid #4338CA; border-radius:9px; padding:16px 22px; min-width:130px;` with a top-right component glyph (`15×11px` rect `1.5px #4338CA` + two `8×2px` bars), stereotype `500 9.5px #8A91A6; letter-spacing:.04em;` («component»), name `600 13px #4338CA`. **Provided interface (lollipop):** `15px circle, 2px #4338CA border, border-right-color:transparent` + `20×2px #4338CA` stem. **Required interface (socket):** `14px; border-radius:50%; border:2px solid #4338CA; background:#fff;` + stem.

### 5.21 UML — use case
**Actor (stick figure)** from absolutely-positioned `#4338CA` divs (13px head circle `2px #4338CA`, 2px bars for body/arms/legs, legs rotated ±22°), label `600 11.5px #5A6175`. Association line `36×2px #C9CEF4`. **System boundary** `border:1px solid #C9CEF4; border-radius:12px; padding:18px 22px; background:#fff;` title `600 10px #9AA0B2`. **Use-case ovals** `600 12px/1.3 #4338CA; background:#EEF0FF; border:1.5px solid #4338CA; border-radius:50%; padding:12px 26px;`.

### 5.22 UML — swimlane / partition
Container `border:1px solid #E7E9F3; border-radius:12px; overflow:hidden; display:grid; grid-template-columns:repeat(n,1fr);` lane dividers `border-right:1px solid #E7E9F3`. Lead lane header `600 11.5px/1.3 #4338CA; background:#F1F2FB;` other headers `#5A6175 on #F8F9FD`, all `padding:10px 8px; border-bottom:1px solid #E7E9F3`. Lane body `min-height:150px`; activity nodes white `1px solid #E2E5F0` r8; accent node `#4338CA on #EEF0FF/1px #C9CEF4`; cross-lane flow `↓` `#B6BBD6`. One subject per lane.

### 5.23 UML — fork / join (parallel)
`max-width:340px; margin:0 auto;`. **Sync bars** (fork and join) `height:6px; background:#4338CA; border-radius:3px;` (full-width). Between them, parallel branches `display:grid; grid-template-columns:1fr 1fr; gap:14px;` each branch node `500 11.5px/1.3 #4338CA; background:#EEF0FF; border:1px solid #C9CEF4; border-radius:8px;`. Surrounding nodes white `1px solid #E2E5F0`; terminal DB node `1px dashed #B9BEDB` r9; flow `↓` `#B6BBD6`. Use when tasks run concurrently and all must finish before proceeding.

### 5.24 Complex branch / terminal-outcome activity
For workflows where not every path continues to execution, render the decision as a first-class activity diagram, not a linear process row. Start/key node at top → `diamond` (§5.4) → outcome cards in `grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px;`.

- Normal outcomes: white node.
- Preferred/target outcomes: key node (`#EEF0FF / #4338CA`).
- Valid "no execution" or rejection outcomes: amber semantic node `color:#B4543F; background:#FBF1EE; border:1px solid #F0D7CF;` with a reason/audit sub-line.
- Keep terminal outcomes visually equal height. Do not hide "no follow-up", "rejected", or "needs more evidence" as footnotes when they are valid states.

### 5.25 Forbidden path with allowed alternatives
Use when the reader must understand a prohibited conversion and the sanctioned replacement. Layout `display:grid; grid-template-columns:1fr 44px 1fr; gap:14px; align-items:center;` with the left panel for allowed paths and the right panel for the blocked path. The blocked panel uses the sanctioned WARN palette: `background:#FFF8F6; border:1px solid #F0D7CF;`, blocked nodes `#FBF1EE / #B4543F`. The center connector may be `↔` or `≠`; never use the same indigo treatment on the forbidden side.

### 5.26 Parallel state machines
Use when two lifecycles run near each other but must not auto-map. Place two figure panels in a `1fr 1fr` grid. Each panel has a small mono badge (`TASK STATUS`, `REPORTER STATUS`, etc.) and its own state machine (§5.18). Add a WARN callout below: `background:#FBF3EC; border:1px solid #F0D7CF; color:#94724F;` stating the forbidden automatic mapping. Do not draw a direct arrow between the two lanes unless it represents a review candidate, not a state mutation.

### 5.27 Recovery / decision table
Use a decision table when queue inclusion depends on policy, link presence, visibility, and resolution status. Container is the table/check-matrix base (§4.7/§4.14), but rows should be `grid-template-columns:1.2fr .8fr .8fr 1.1fr` by default: `condition / follow-up / visibility / result`. Header is dark `#15172B`; result cells may use concise labels like `Active queue`, `History`, `Safe summary`, `Hidden`. Decision tables are better than flowcharts when the row conditions are independent and comparable.

---

## 6. Token usage by page type

Density, type emphasis, color, and component mix shift with a page's role. Match the role.

> **How *much* to put in each type, the per-viewport ceilings, focal-hierarchy and arrangement rules** are in `composition-guide.md` (density budgets §2, composition §3, focal/whitespace §4, pacing §5). This section names the *role and component mix*; that guide quantifies the *amount and layout*.

### 6.1 Cover / Title
- **Goal:** identity + one-line thesis. **Density:** very low.
- Full-bleed **indigo gradient**; white text; `t-hero` serif; eyebrow pill; lead 18px; 3–4 stat tiles.
- Emphasis = white + translucent bottom-border highlight. No body-grey, no figure panels, no cards-with-borders.

### 6.2 Section divider (optional)
- The **boxed indigo-gradient divider (§4.12)**: big mono index + serif title on the hero gradient. Almost no body. Used to break long documents into acts. (A lighter variant — large index + `t-h2` on `#F8F9FD` — is fine for a quieter break.)

### 6.3 Overview / Summary
- **Goal:** orient, give the big picture. **Density:** low–medium, airy.
- Lead paragraph (full `t-lead`) + **one** hero diagram (flow or before/after) **or** a small set (2–4) of soft cards.
- Prefer serif sub-headings, generous whitespace, outline cards. Avoid dense grids and number chips here.

### 6.4 Detail / Explanation
- **Goal:** explain mechanics thoroughly. **Density:** medium–high but structured.
- Multi-card grids (2–3 col), **number chips** for enumerated points, supporting diagrams in figure panels.
- **Each subsection = [sub-heading + paragraph (top) → figure panel (below)]**, applied consistently. Never interleave text and diagrams ad-hoc.
- Body color `#5A6175`; key nouns in accent or ink bold (1–2 per paragraph).

### 6.5 Comparison
- **Goal:** contrast current vs target. The **before/after panel** (§5.2) is the centerpiece.
- Strict semantic split: BEFORE = slate + amber; AFTER = indigo. Equal-height columns; negative vs positive pill rows.

### 6.6 Data / Metrics
- **Goal:** quantify. Pick from the chart/viz gallery (§5.8–5.15): vertical/horizontal bar, stacked bar, area/trend, donut, KPI+delta, progress rings, heatmap — or oversized serif numbers (stat-card grid §5.9, dark stat band §4.11).
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
`color:#4338CA`, no underline; optional `border-bottom:1px solid #C9CEF4`. Never blue + underline. (Nav links are styled separately — see §4.3.)

### 7.4 Callout / note box
Use the **4-variant callout set (§4.8)** — KEY (indigo) · OK (green) · WARN (amber) · NOTE (grey). Pick by meaning: an emphasis/key point is KEY, a recommendation is OK, a genuine caution/risk is WARN (amber is legitimate here, per the updated amber scope in §1.4-note), a low-priority aside is NOTE. The plain indigo Left-accent card (§4.5) remains the base for inline note/risk boxes inside prose. **Still never amber for a merely-missing value** — an unknown is not a warning (§7.5).

### 7.5 Placeholders & unknown values
- A figure not yet quantified: use a placeholder glyph in **normal ink bold** (`O`, `OO`) immediately followed by a muted parenthetical `<span style="color:#9AA0B2;">(… 추후 확정)</span>`. **Never** flag missing data with amber/warn color — unknown ≠ problem.
- A framing "stat" with no number: substitute a 1–2-char word (`MVP`, `단계`) still set in `t-stat`.

---

## 8. Responsive & anti-patterns

### 8.1 Responsive
Supported reading target: desktop/company-computer view. Minimum review viewport is **1366×768**; preferred review viewport is **1440×900** or wider. Narrow/mobile overflow is not a release blocker unless explicitly requested for a given artifact.

Desktop-first reading document (~1100px). **No media queries by default** — mobile resilience comes only from intrinsic flex (hero stat tiles `flex:1; min-width:150px` in a `flex-wrap:wrap` row; nav row `overflow-x:auto`). If you must support narrow widths, the sanctioned minimum: below ~720px, `sheet-pad → 0 20px`; all `1fr 1fr` / `repeat(3,…)` grids collapse to one column; the comparison panel stacks (arrow rotates `↓`); the gantt label column shrinks. Don't improvise ad-hoc breakpoints — that's how "same author" breaks across docs.

### 8.2 Anti-patterns (never do)
- Indigo inside an AS-IS zone, or slate/amber inside a TO-BE zone (the strongest fingerprint).
- Amber used **decoratively**, for a **missing/unknown value** (use ink placeholder + muted caveat, §7.5), or as a **fill inside a TO-BE structural zone**. Amber IS allowed for an AS-IS pain point and for a semantic WARN/Don't/regression signal (§1.4-note, §4.8).
- `text-decoration:underline` or italics for emphasis; > 2 bold per paragraph.
- Decorative (meaningless) accent color — indigo always carries meaning.
- Random/unequal heights or positions for same-kind bars or nodes.
- Mixed radii within one diagram; sharp-corner or full-saturation images.
- Punchy verdict/drama titles ("It's not X, it's Y!"); titles describe, never deliver verdicts.
- Default browser bullets; full polite-register (`~합니다`) prose (see `authoring-guide.md §3`).
- A diagram forced onto a plain enumerated list (problems/risks/glossary stay as card grids/tables — see §6.4 and the checklist).

---

## 9. Reproduction checklist
1. Load Pretendard / Noto Serif KR / JetBrains Mono (via `<helmet>`); set global `word-break:keep-all`.
2. Page bg `#EEF0F7`; hero (indigo gradient) → paper sheet (white, max 1100, −44 overlap).
3. Sticky nav + 3px progress bar + IntersectionObserver active link.
4. Every section: eyebrow (`NN · ENGLISH`, indigo) → h2 (Serif 34) → lead (16/1.85, max 760).
5. Body `#5A6175`, headings `#15172B`, emphasis `#4338CA` or ink bold.
6. BEFORE = slate + amber / AFTER = indigo — never mixed.
7. Diagrams, charts (§5.8–5.15) and UML (§5.17–5.23) live in figure panels (`#FAFBFE`), each led by its "언제 쓰나" chip. Node radius 8–10, card 14–16, comparison panel 18. Charts are pure CSS (bars/conic/clip-path/rgba) — no SVG or chart lib.
8. **Text (top) → related diagram (below)** *when the content is diagrammable* (flow/contrast/hierarchy/schedule/quantity). Enumerated peer lists (problems, risks, open questions, glossary) stay as card grids/tables with **no** diagram. Tall-narrow diagrams may sit **text-left / diagram-right** in a `1fr 1fr` grid.
9. Match the **page type** (§6) to its density, emphasis, and component mix.
10. No indigo inside AS-IS; no slate/amber inside a TO-BE structural zone. Amber = AS-IS pain **or** a semantic WARN/Don't/regression signal (§4.8, §1.4-note) — never decorative, never for an unknown value (ink placeholder + muted caveat, §7.5).

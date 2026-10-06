---
version: alpha
name: Scroll Explainer Design System — feedbackops-light
description: FeedbackOps product design language (Pack 17 light, ADR-0021) as a scroll-document style. Machine-readable token surface for the scroll-style same-author HTML explainer system. Conforms to the DESIGN.md spec (google-labs-code/design.md). Derived mirror of design.md, which stays the single source of truth for values and usage semantics; the parts this schema cannot express (diagram geometry, page-type roles, voice, runtime) live in design.md / authoring-guide.md / ../../core/runtime-spec.md.
colors:
  # Accent — Samsung blue = target / improvement / key (never in an AS-IS zone)
  accent: "#1428A0"
  accent-soft: "#3157D5"
  accent-ink: "#0F1E78"
  accent-050: "#E7EFFC"
  accent-zone: "#EEF4FB"
  accent-line: "#B9C9F7"
  accent-line2: "#D8E7FB"
  accent-min: "#A9BDF5"
  accent-lilac: "#F0F4FE"
  # Neutral — ink / body / muted
  ink-900: "#101828"
  ink-800: "#1D2939"
  ink-700: "#374151"
  body-lead: "#374151"
  body: "#475467"
  muted-500: "#667083"
  muted-400: "#98A2B3"
  muted-300: "#B8C4D6"
  hairline: "#CBD6E6"
  muted-text: "#5D6679"   # text-safe muted ink: informative small text (sub-lines, footnotes, legend, labels), >=4.5:1 on white. muted-500/400/300 are decorative / disabled only
  # Surface — fills / borders
  white: "#FFFFFF"
  page-bg: "#F3F7FE"
  paper-tint: "#FBFDFF"
  fig-tint: "#F7FAFE"
  fill-50: "#F3F7FE"
  fill-100: "#EDF3FB"
  border: "#DCE5F2"
  border-node: "#CBD6E6"
  border-section: "#E3EAF4"
  border-row: "#E6EDF7"
  border-fig: "#DFE7F3"
  border-chip: "#CBD6E6"
  mono-tint: "#EEF2F7"
  mono-dashed: "#B8C4D6"
  warm-tint: "#F4F2EF"
  warm-dashed: "#CBD1D6"
  # Semantic — meaning colors
  slate: "#94A3B8"            # AS-IS badge (current / legacy / before)
  slate-bar: "#CBD6E6"
  warn: "#B2202B"             # pain point / problem
  warn-2: "#8E5500"
  warn-bg: "#FCEDEE"
  warn-line: "#F3C7CB"
  peak: "#D92D3A"
  ok: "#10734A"              # success / normal / end
  ok-bg: "#E7F5EE"
  # On-accent / dark-surface text
  on-accent-1: "#D8E7FB"     # eyebrow pill, divider part-label on blue
  on-accent-2: "#B9C9F7"     # hero stat label, matrix compare-header
  label-on-dark: "#9AABFF"   # dark card / stat-band label
  muted-blue: "#5D6B98"    # sub-text on pipeline / conditional nodes
  leaf-text: "#6B7588"       # borderless tree-leaf chip text
  # Extra surfaces / borders (slide-format components)
  highlight-grad: "#EEF3FE"  # highlight card / pull-quote gradient stop
  table-header-soft: "#EEF3FA"  # secondary table header
  dashed-store: "#AEBBD3"    # data/DB store dashed border
  dashed-rule: "#D5E0F4"     # gantt/lifeline dashed line
fontStacks:
  # CSS font-family stacks pasted verbatim into inline styles (design.md §0). Consumed by the component
  # generator (.claude/lib/components.mjs) to fill ⟨f:body⟩ / ⟨f:display⟩ / ⟨f:mono⟩. The mono stack ends in the
  # style's Korean body font before the generic family, so Hangul in a mono badge never falls back to a system font.
  body: "Inter,Pretendard,sans-serif"
  display: "Inter,Pretendard,sans-serif"
  mono: "'JetBrains Mono',Pretendard,monospace"
typography:
  t-hero:        { fontFamily: "Inter", fontWeight: 700, fontSize: "44px", lineHeight: "1.22", letterSpacing: "-0.02em" }
  t-h2:          { fontFamily: "Inter", fontWeight: 600, fontSize: "28px", lineHeight: "1.32", letterSpacing: "-0.01em" }
  t-h3-serif:    { fontFamily: "Inter", fontWeight: 600, fontSize: "20px", lineHeight: "1.35" }
  t-h3:          { fontFamily: "Inter", fontWeight: 600, fontSize: "18px", lineHeight: "1.4" }
  t-sub:         { fontFamily: "Inter", fontWeight: 600, fontSize: "16px", lineHeight: "1.4" }
  t-eyebrow:     { fontFamily: "Inter", fontWeight: 700, fontSize: "13px", lineHeight: "1", letterSpacing: "0.08em" }
  t-eyebrow-ref: { fontFamily: "Inter", fontWeight: 700, fontSize: "12px", lineHeight: "1", letterSpacing: "0.08em" }
  t-lead:        { fontFamily: "Inter", fontWeight: 400, fontSize: "15.5px", lineHeight: "1.8" }
  t-body:        { fontFamily: "Inter", fontWeight: 400, fontSize: "14px", lineHeight: "1.72" }
  t-body-sm:     { fontFamily: "Inter", fontWeight: 400, fontSize: "13px", lineHeight: "1.65" }
  t-caption:     { fontFamily: "Inter", fontWeight: 400, fontSize: "11.5px", lineHeight: "1.5" }
  t-node:        { fontFamily: "Inter", fontWeight: 600, fontSize: "12px", lineHeight: "1.3" }
  t-node-sub:    { fontFamily: "Inter", fontWeight: 400, fontSize: "10.5px", lineHeight: "1.4" }
  t-mono-badge:  { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: "11px", lineHeight: "1", letterSpacing: "0.06em" }
  t-mono-num:    { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: "12px", lineHeight: "1" }
  t-mono-log:    { fontFamily: "JetBrains Mono", fontWeight: 500, fontSize: "11.5px", lineHeight: "1.5" }
  t-stat:        { fontFamily: "Inter", fontWeight: 700, fontSize: "30px", lineHeight: "1" }
  t-stat-lg:     { fontFamily: "Inter", fontWeight: 700, fontSize: "44px", lineHeight: "1" }   # stat-card grid number
  t-stat-band:   { fontFamily: "Inter", fontWeight: 700, fontSize: "32px", lineHeight: "1" }   # dark stat-band number
  t-kpi:         { fontFamily: "Inter", fontWeight: 700, fontSize: "26px", lineHeight: "1" }   # KPI card value
  t-metric-mid:  { fontFamily: "Inter", fontWeight: 700, fontSize: "24px", lineHeight: "1" }   # donut center number
  t-ring-num:    { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: "15px", lineHeight: "1" }  # progress-ring center %
rounded:
  node: "6px"
  node-lg: "8px"
  pill-sm: "4px"
  card-sm: "8px"
  card: "8px"
  card-lg: "12px"
  panel: "12px"
  pill: "100px"
  circle: "50%"
spacing:
  sheet-max: "1100px"
  sheet-pad: "min(64px,6vw)"
  shell-pad-x: "min(40px,5vw)"
  section-pad: "56px"
  lead-max: "760px"
  card-pad: "22px"
  fig-pad: "24px"
  gap-card: "16px"
  gap-node: "10px"
  block-gap: "18px"
components:
  hero:
    backgroundColor: "{colors.accent}"   # actually a 155deg gradient #3157D5→#1428A0→#0F1E78, see design.md §4.1
    textColor: "{colors.white}"
  paperSheet:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"             # top corners only: 22px 22px 0 0, see design.md §4.2
  cardOutline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.body}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  cardFilled:
    backgroundColor: "{colors.fill-50}"
    textColor: "{colors.body}"
    rounded: "{rounded.card-sm}"
  cardHighlight:
    backgroundColor: "{colors.accent-050}"
    textColor: "{colors.accent}"
    rounded: "{rounded.card-lg}"
  cardDark:
    backgroundColor: "{colors.ink-900}"
    textColor: "{colors.white}"
    rounded: "{rounded.card-lg}"
  riskCard:
    backgroundColor: "{colors.white}"
    textColor: "{colors.body}"
    rounded: "{rounded.card-sm}"          # asymmetric 0 12px 12px 0 + 3px left accent, see design.md §4.5
  numberChip:
    backgroundColor: "{colors.accent-050}"
    textColor: "{colors.accent}"
    typography: "{typography.t-mono-num}"
    rounded: "6px"
  asisBadge:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.white}"
    typography: "{typography.t-mono-badge}"
    rounded: "6px"
  tobeBadge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    typography: "{typography.t-mono-badge}"
    rounded: "6px"
  node:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-800}"
    typography: "{typography.t-node}"
    rounded: "{rounded.node}"
  keyNode:
    backgroundColor: "{colors.accent-050}"
    textColor: "{colors.accent}"
    rounded: "{rounded.node}"             # 1.5px accent border, see design.md §5.1
  figurePanel:
    backgroundColor: "{colors.fig-tint}"
    rounded: "{rounded.card-sm}"
    padding: "{spacing.fig-pad}"
  comparisonPanel:
    backgroundColor: "{colors.paper-tint}"
    rounded: "{rounded.panel}"
  # Slide-format components (design.md §4.8–§4.14). Red WARN/Don't is a sanctioned semantic use — see design.md §1.4-note.
  calloutKey:
    backgroundColor: "{colors.accent-050}"
    textColor: "{colors.accent}"                # border-left 3px accent, rounded 0 10px 10px 0, see design.md §4.8
  calloutOk:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
  calloutWarn:
    backgroundColor: "#FDF1F1"
    textColor: "{colors.warn}"                  # red = semantic WARN (allowed), not an AS-IS-only color
  calloutNote:
    backgroundColor: "{colors.fill-50}"
    textColor: "{colors.muted-500}"
  processStep:
    backgroundColor: "{colors.accent}"          # 38px number circle, #fff text; final step uses {colors.ok}
    textColor: "{colors.white}"
  pullQuote:
    backgroundColor: "{colors.highlight-grad}"  # linear-gradient(160deg,#EEF3FE,#fff), border accent-line2
    textColor: "{colors.ink-900}"
    rounded: "{rounded.card}"
  statBand:
    backgroundColor: "{colors.ink-900}"         # dark band; number t-stat-band #fff, label label-on-dark
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
  sectionDivider:
    backgroundColor: "{colors.accent}"          # actually the 155deg hero gradient; index rgba(#fff,.28), see design.md §4.12
    textColor: "{colors.white}"
    rounded: "{rounded.card}"
  checkMatrix:
    backgroundColor: "{colors.ink-900}"         # dark header; ✓ {colors.ok}, ✕ {colors.hairline}, partial {colors.warn-2}
    textColor: "{colors.white}"
    rounded: "{rounded.card-sm}"
---

# Scroll Explainer Design System

> **What this file is.** A machine-readable token surface conforming to the [DESIGN.md spec](https://github.com/google-labs-code/design.md) (Apache-2.0) so that AI agents and design-token tooling can consume this design system deterministically. It is an **interop layer, not a replacement.** `design.md` stays the single source of truth for both values and usage semantics; the frontmatter above is a **derived mirror** of `design.md`'s tokens (keep them in sync — if a value changes, change it in `design.md` and re-mirror here). The prose below summarizes intent and **cross-links the authoritative human specs** for everything this schema cannot express.
>
> **No content lives only here.** Diagram geometry, page-type roles, the Korean voice, and the runtime/JS layer are not representable in the DESIGN.md schema and remain in the additional docs — nothing was dropped to fit this format:
> - `design.md` — full visual spec (components, diagram conventions §5, page types §6, anti-patterns §8). Canonical for usage semantics.
> - `authoring-guide.md` — voice, Korean register, content patterns, page-type registry.
> - `../../core/runtime-spec.md` — `<x-dc>` shell, `<helmet>`, `data-dc-script`/`DCLogic`, the scroll-progress + active-nav scripts, the DOM naming contract.
> - `template.dc.html` — runnable skeleton. `README.md` — the doc map.
>
> **Filename note.** The DESIGN.md spec expects the literal filename `DESIGN.md`. On a case-insensitive filesystem (macOS) that collides with `design.md`, so this file is `design.tokens.md`. When feeding a tool that requires the literal name, symlink or copy it: `ln -s design.tokens.md DESIGN.md`.

## Overview

A reusable system for single-page, vertical-scroll, self-contained HTML explainer documents (a "paper sheet" read top→bottom, not a slide deck). Any document built to it — whatever the subject — should read as the work of the same author. Three signatures: (1) the FeedbackOps console type — Inter + Pretendard for body and headings (weight/size carry display), JetBrains Mono for IDs/code — on a flat porcelain canvas with 6–8px radii; (2) a single Samsung-blue accent that always carries meaning; (3) a strict **semantic color split** — the current/old/problem state is slate + red, the target/new/improved state is blue. Full rationale: `design.md §0`, `authoring-guide.md §1`.

## Colors

Token values are in the frontmatter `colors`. Three families: **accent** (Samsung blue — target/key), **neutral** (ink/body/muted), **surface** (fills/borders), plus **semantic** meaning colors. The hard invariant (normative): **never put blue in an AS-IS zone, never put slate/red in a TO-BE structural zone.** Red (`warn`) has **two sanctioned uses**: an AS-IS pain point, or a semantic **WARN / Don't / regression** signal in the slide-format components (callout WARN, Don't rows, `▼` delta). It is never decorative and never marks a merely-unknown value (use an ink placeholder + muted caveat). Full table with per-token usage: `design.md §1` (scope rule in §1.4-note).

## Typography

Body/UI font **Inter + Pretendard**; display/heading font **Inter + Pretendard** 400;500;600;700 (hero, section h2, some h3, all **oversized numerals** — `t-stat`/`t-stat-lg`/`t-stat-band`/`t-kpi`/`t-metric-mid`); mono **JetBrains Mono** 400;500;600;700 (badges, eyebrow numbers, log/code, ring/hero stat numbers). Korean line breaking uses global `word-break: keep-all` (mandatory). Full type scale with usage and emphasis rules: `design.md §2`. Acronym/number/register rules for Korean: `authoring-guide.md §3.1`.

## Layout

Full-bleed flat Samsung-blue hero → white paper sheet (`max-width: 1100px`, `−44px` overlap) on a `#F3F7FE` page. Section padding `56px 0` (first section `60px`, no border-top); lead/body max-width `760px`; sheet horizontal padding `min(64px,6vw)` (nav / hero `min(40px,5vw)`). Block rhythm: `18px` between stacked cards, `30–38px` between distinct sub-blocks. No media queries (desktop-first ~1100px, fluid paddings and component reflow down to a 390px floor). Full spacing tokens + responsive contract: `design.md §3`, `§8.1`.

## Elevation & Depth

Mostly flat. The only shadows: the paper sheet (`0 -24px 60px rgba(16,24,40,.08)`), the primary/root blue node (`0 6px 16px rgba(20,40,160,.2)` — all other nodes flat), and inset text-highlight on dark backgrounds. Sticky nav `z-index:50`; scroll-progress bar `z-index:60` (above nav). Details: `design.md §4.2`, `§5.1`, `../../core/runtime-spec.md §3`.

## Shapes

Radius is fixed by element type (a consistency fingerprint): nodes/chips 6px, figure panels and cards 8px, big comparison panels 12px, pills 100px, the paper-sheet top corners 12px. Keep radius uniform within one diagram. Full radius scale: `design.md §3.1`.

## Components

Frontmatter `components` encodes the foundational set (cards, badges, chips, nodes, panels) **plus the slide-format components** (4-variant callout, process step, pull-quote, dark stat band, section divider, check matrix). The full catalog — hero anatomy, sticky nav + progress, table variants, AS-IS monolith box, risk left-accent card, status-row, takeaway chip, circled-numeral lists — plus the **chart/viz gallery** (vertical/horizontal/stacked bar, area/trend, donut, KPI+delta, progress rings, heatmap; all pure-CSS, no SVG), the **UML library** (sequence, state machine, class, component, use case, swimlane, fork/join), and complex workflow patterns (terminal-outcome activity, forbidden path, parallel state machines, recovery decision table) live in `design.md §4–§5`. Their geometry exceeds what this schema can hold, so the schema carries the tokens and `design.md` carries the geometry + the "언제 쓰나" usage guidance.

## Do's and Don'ts

**Do:** Inter + Pretendard throughout (weight/size for display), flat porcelain surfaces; Samsung blue only where it means target/key; AS-IS = slate+red; diagram only what's diagrammable (flow/contrast/hierarchy/schedule/quantity); text→diagram (or text-left/diagram-right) per subsection; uniform radii; same-kind bars/nodes share size & position; ≤1–2 bold per paragraph; `word-break:keep-all`; Korean `~한다` 문어체.

**Don't:** blue in an AS-IS zone; broad decorative gradients or slate/red in a TO-BE structural zone; red decoratively or for a merely-unknown value (red IS fine for AS-IS pain or a semantic WARN/Don't/regression signal); underline/italic for emphasis; >2 bold per paragraph; decorative (meaningless) accent color; random/unequal same-kind bars or nodes; mixed radii in one diagram; sharp-corner or full-saturation images; punchy verdict/drama titles; default browser bullets; full polite-register `~합니다` prose; a diagram forced onto a plain enumerated list. Full anti-pattern gallery: `design.md §8.2`; voice bans: `authoring-guide.md §1`, `§3.1`.

---

*Conformance: some `contrast-ratio` lint warnings are expected and intentional (muted captions/labels are deliberately low-contrast secondary text). This file documents tokens; it does not validate produced HTML — for that see the consistency tooling notes in `README.md`.*

## Component library

The paste-ready figure components (`components/*.html`) are generated from `../../core/components/` with this file's `colors`, `rounded`, and `fontStacks` — change a value here (after `design.md`), then run `node .claude/lib/components.mjs build`.

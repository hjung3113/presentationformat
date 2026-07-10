---
version: alpha
name: Scroll Explainer Design System
description: Machine-readable token surface for the scroll-style same-author HTML explainer system. Conforms to the DESIGN.md spec (google-labs-code/design.md). Derived mirror of design.md, which stays the single source of truth for values and usage semantics; the parts this schema cannot express (diagram geometry, page-type roles, voice, runtime) live in design.md / authoring-guide.md / ../../core/runtime-spec.md.
colors:
  # Accent — teal = target / improvement / key (never in an AS-IS zone)
  accent: "#0F766E"
  accent-soft: "#0D9488"
  accent-ink: "#134E4A"
  accent-050: "#ECFDF8"
  accent-zone: "#EAF7F5"
  accent-line: "#99F6E4"
  accent-line2: "#CCFBF1"
  accent-min: "#7BE0D3"
  accent-lilac: "#E9FBF6"
  # Neutral — ink / body / muted
  ink-900: "#15172B"
  ink-800: "#1E2233"
  ink-700: "#3A4255"
  body-lead: "#3E4658"
  body: "#5A6175"
  muted-500: "#8A91A6"
  muted-400: "#9AA0B2"
  muted-300: "#B6BBCB"
  hairline: "#C2C8D4"
  # Surface — fills / borders
  white: "#FFFFFF"
  page-bg: "#EDF2F1"
  paper-tint: "#FCFCFE"
  fig-tint: "#FAFBFE"
  fill-50: "#F8F9FD"
  fill-100: "#F6F7FB"
  border: "#E7E9F3"
  border-node: "#E2E5F0"
  border-section: "#EAEBF2"
  border-row: "#EDEEF4"
  border-fig: "#EEF0F6"
  border-chip: "#DDE1EA"
  mono-tint: "#F1F3F7"
  mono-dashed: "#B7BECC"
  warm-tint: "#F3F1EF"
  warm-dashed: "#CBD1D0"
  # Semantic — meaning colors
  slate: "#94A0B4"            # AS-IS badge (current / legacy / before)
  slate-bar: "#C2C8D4"
  warn: "#B42318"             # pain point / problem
  warn-2: "#9B2C1B"
  warn-bg: "#FEF2F2"
  warn-line: "#F7C8C1"
  peak: "#DC2626"
  ok: "#15803D"              # success / normal / end
  ok-bg: "#E8F6EC"
  # On-accent / dark-surface text
  on-accent-1: "#CCFBF1"     # eyebrow pill, divider part-label on teal
  on-accent-2: "#99F6E4"     # hero stat label, matrix compare-header
  label-on-dark: "#5EEAD4"   # dark card / stat-band label
  muted-teal: "#5E8C84"    # sub-text on pipeline / conditional nodes
  leaf-text: "#7A8197"       # borderless tree-leaf chip text
  # Extra surfaces / borders (slide-format components)
  highlight-grad: "#ECFDF7"  # highlight card / pull-quote gradient stop
  table-header-soft: "#EFF5F4"  # secondary table header
  dashed-store: "#B9BEDB"    # data/DB store dashed border
  dashed-rule: "#D7DCE4"     # gantt/lifeline dashed line
typography:
  t-hero:        { fontFamily: "IBM Plex Sans", fontWeight: 700, fontSize: "52px", lineHeight: "1.28", letterSpacing: "-0.02em" }
  t-h2:          { fontFamily: "IBM Plex Sans", fontWeight: 600, fontSize: "34px", lineHeight: "1.34", letterSpacing: "-0.01em" }
  t-h3-serif:    { fontFamily: "IBM Plex Sans", fontWeight: 600, fontSize: "22px", lineHeight: "1.4" }
  t-h3:          { fontFamily: "IBM Plex Sans",    fontWeight: 600, fontSize: "18px", lineHeight: "1.4" }
  t-sub:         { fontFamily: "IBM Plex Sans",    fontWeight: 600, fontSize: "16px", lineHeight: "1.4" }
  t-eyebrow:     { fontFamily: "IBM Plex Sans",    fontWeight: 700, fontSize: "13px", lineHeight: "1", letterSpacing: "0.08em" }
  t-eyebrow-ref: { fontFamily: "IBM Plex Sans",    fontWeight: 700, fontSize: "12px", lineHeight: "1", letterSpacing: "0.08em" }
  t-lead:        { fontFamily: "IBM Plex Sans",    fontWeight: 400, fontSize: "16px", lineHeight: "1.85" }
  t-body:        { fontFamily: "IBM Plex Sans",    fontWeight: 400, fontSize: "14px", lineHeight: "1.72" }
  t-body-sm:     { fontFamily: "IBM Plex Sans",    fontWeight: 400, fontSize: "13px", lineHeight: "1.65" }
  t-caption:     { fontFamily: "IBM Plex Sans",    fontWeight: 400, fontSize: "11.5px", lineHeight: "1.5" }
  t-node:        { fontFamily: "IBM Plex Sans",    fontWeight: 600, fontSize: "12px", lineHeight: "1.3" }
  t-node-sub:    { fontFamily: "IBM Plex Sans",    fontWeight: 400, fontSize: "10.5px", lineHeight: "1.4" }
  t-mono-badge:  { fontFamily: "IBM Plex Mono", fontWeight: 700, fontSize: "11px", lineHeight: "1", letterSpacing: "0.06em" }
  t-mono-num:    { fontFamily: "IBM Plex Mono", fontWeight: 700, fontSize: "12px", lineHeight: "1" }
  t-mono-log:    { fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: "11.5px", lineHeight: "1.5" }
  t-stat:        { fontFamily: "IBM Plex Sans", fontWeight: 700, fontSize: "30px", lineHeight: "1" }
  t-stat-lg:     { fontFamily: "IBM Plex Sans", fontWeight: 700, fontSize: "44px", lineHeight: "1" }   # stat-card grid number
  t-stat-band:   { fontFamily: "IBM Plex Sans", fontWeight: 700, fontSize: "32px", lineHeight: "1" }   # dark stat-band number
  t-kpi:         { fontFamily: "IBM Plex Sans", fontWeight: 700, fontSize: "26px", lineHeight: "1" }   # KPI card value
  t-metric-mid:  { fontFamily: "IBM Plex Sans", fontWeight: 700, fontSize: "24px", lineHeight: "1" }   # donut center number
  t-ring-num:    { fontFamily: "IBM Plex Mono", fontWeight: 700, fontSize: "15px", lineHeight: "1" }  # progress-ring center %
rounded:
  node: "8px"
  node-lg: "9px"
  pill-sm: "5px"
  card-sm: "12px"
  card: "14px"
  card-lg: "16px"
  panel: "18px"
  pill: "100px"
  circle: "50%"
spacing:
  sheet-max: "1100px"
  sheet-pad: "64px"
  section-pad: "56px"
  lead-max: "760px"
  card-pad: "22px"
  fig-pad: "24px"
  gap-card: "16px"
  gap-node: "10px"
  block-gap: "18px"
components:
  hero:
    backgroundColor: "{colors.accent}"   # actually a 155deg gradient #0D9488→#0F766E→#115E59, see design.md §4.1
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
    backgroundColor: "#FDF2EF"
    textColor: "{colors.warn}"                  # red = semantic WARN (allowed), not an AS-IS-only color
  calloutNote:
    backgroundColor: "{colors.fill-50}"
    textColor: "{colors.muted-500}"
  processStep:
    backgroundColor: "{colors.accent}"          # 38px number circle, #fff text; final step uses {colors.ok}
    textColor: "{colors.white}"
  pullQuote:
    backgroundColor: "{colors.highlight-grad}"  # linear-gradient(160deg,#ECFDF7,#fff), border accent-line2
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

A reusable system for single-page, vertical-scroll, self-contained HTML explainer documents (a "paper sheet" read top→bottom, not a slide deck). Any document built to it — whatever the subject — should read as the work of the same author. Three signatures: (1) one IBM Plex superfamily — Plex Sans for body and headings (weight/size carry display), Plex Mono for code; (2) a single teal accent that always carries meaning; (3) a strict **semantic color split** — the current/old/problem state is slate + red, the target/new/improved state is teal. Full rationale: `design.md §0`, `authoring-guide.md §1`.

## Colors

Token values are in the frontmatter `colors`. Three families: **accent** (teal — target/key), **neutral** (ink/body/muted), **surface** (fills/borders), plus **semantic** meaning colors. The hard invariant (normative): **never put teal in an AS-IS zone, never put slate/red in a TO-BE structural zone.** Red (`warn`) has **two sanctioned uses**: an AS-IS pain point, or a semantic **WARN / Don't / regression** signal in the slide-format components (callout WARN, Don't rows, `▼` delta). It is never decorative and never marks a merely-unknown value (use an ink placeholder + muted caveat). Full table with per-token usage: `design.md §1` (scope rule in §1.4-note).

## Typography

Body/UI font **IBM Plex Sans**; display/heading font **IBM Plex Sans** 400;500;600;700 (hero, section h2, some h3, all **oversized numerals** — `t-stat`/`t-stat-lg`/`t-stat-band`/`t-kpi`/`t-metric-mid`); mono **IBM Plex Mono** 400;500;600;700 (badges, eyebrow numbers, log/code, ring/hero stat numbers). Korean line breaking uses global `word-break: keep-all` (mandatory). Full type scale with usage and emphasis rules: `design.md §2`. Acronym/number/register rules for Korean: `authoring-guide.md §3.1`.

## Layout

Full-bleed teal hero → white paper sheet (`max-width: 1100px`, `−44px` overlap) on a `#EDF2F1` page. Section padding `56px 0` (first section `60px`, no border-top); lead/body max-width `760px`; sheet horizontal padding `64px`. Block rhythm: `18px` between stacked cards, `30–38px` between distinct sub-blocks. No media queries by default (desktop-first ~1100px). Full spacing tokens + responsive contract: `design.md §3`, `§8.1`.

## Elevation & Depth

Mostly flat. The only shadows: the paper sheet (`0 -24px 60px rgba(30,34,70,.10)`), the primary/root teal node (`0 6px 16px rgba(15,118,110,.2)` — all other nodes flat), and inset text-highlight on dark backgrounds. Sticky nav `z-index:50`; scroll-progress bar `z-index:60` (above nav). Details: `design.md §4.2`, `§5.1`, `../../core/runtime-spec.md §3`.

## Shapes

Radius is fixed by element type (a consistency fingerprint): small nodes/chips 8–10px, cards/containers 14–16px, big comparison panels 18px, pills 100px, the paper-sheet top corners 22px. Keep radius uniform within one diagram. Full radius scale: `design.md §3.1`.

## Components

Frontmatter `components` encodes the foundational set (cards, badges, chips, nodes, panels) **plus the slide-format components** (4-variant callout, process step, pull-quote, dark stat band, section divider, check matrix). The full catalog — hero anatomy, sticky nav + progress, table variants, AS-IS monolith box, risk left-accent card, status-row, takeaway chip, circled-numeral lists — plus the **chart/viz gallery** (vertical/horizontal/stacked bar, area/trend, donut, KPI+delta, progress rings, heatmap; all pure-CSS, no SVG), the **UML library** (sequence, state machine, class, component, use case, swimlane, fork/join), and complex workflow patterns (terminal-outcome activity, forbidden path, parallel state machines, recovery decision table) live in `design.md §4–§5`. Their geometry exceeds what this schema can hold, so the schema carries the tokens and `design.md` carries the geometry + the "언제 쓰나" usage guidance.

## Do's and Don'ts

**Do:** one Plex Sans superfamily (weight/size for display); teal only where it means target/key; AS-IS = slate+red; diagram only what's diagrammable (flow/contrast/hierarchy/schedule/quantity); text→diagram (or text-left/diagram-right) per subsection; uniform radii; same-kind bars/nodes share size & position; ≤1–2 bold per paragraph; `word-break:keep-all`; Korean `~한다` 문어체.

**Don't:** teal in an AS-IS zone or slate/red in a TO-BE structural zone; red decoratively or for a merely-unknown value (red IS fine for AS-IS pain or a semantic WARN/Don't/regression signal); underline/italic for emphasis; >2 bold per paragraph; decorative (meaningless) accent color; random/unequal same-kind bars or nodes; mixed radii in one diagram; sharp-corner or full-saturation images; punchy verdict/drama titles; default browser bullets; full polite-register `~합니다` prose; a diagram forced onto a plain enumerated list. Full anti-pattern gallery: `design.md §8.2`; voice bans: `authoring-guide.md §1`, `§3.1`.

---

*Conformance: some `contrast-ratio` lint warnings are expected and intentional (muted captions/labels are deliberately low-contrast secondary text). This file documents tokens; it does not validate produced HTML — for that see the consistency tooling notes in `README.md`.*

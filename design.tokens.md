---
version: alpha
name: Scroll Explainer Design System
description: Machine-readable token surface for the scroll-style same-author HTML explainer system. Conforms to the DESIGN.md spec (google-labs-code/design.md). Derived mirror of design.md, which stays the single source of truth for values and usage semantics; the parts this schema cannot express (diagram geometry, page-type roles, voice, runtime) live in design.md / authoring-guide.md / runtime-spec.md.
colors:
  # Accent — indigo = target / improvement / key (never in an AS-IS zone)
  accent: "#4338CA"
  accent-soft: "#6B63D6"
  accent-ink: "#312E81"
  accent-050: "#EEF0FF"
  accent-zone: "#F1F2FB"
  accent-line: "#C9CEF4"
  accent-line2: "#DADEF8"
  accent-min: "#C7CCF2"
  accent-lilac: "#F3F1FE"
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
  page-bg: "#EEF0F7"
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
  warm-tint: "#F6F4F2"
  warm-dashed: "#C9CDD8"
  # Semantic — meaning colors
  slate: "#94A0B4"            # AS-IS badge (current / legacy / before)
  slate-bar: "#C2C8D4"
  warn: "#B4543F"             # pain point / problem
  warn-2: "#94724F"
  warn-bg: "#FBF1EE"
  warn-line: "#F0D7CF"
  peak: "#C9714F"
  ok: "#1F8A5B"              # success / normal / end
  ok-bg: "#E6F5EE"
typography:
  t-hero:        { fontFamily: "Noto Serif KR", fontWeight: 700, fontSize: "52px", lineHeight: "1.28", letterSpacing: "-0.02em" }
  t-h2:          { fontFamily: "Noto Serif KR", fontWeight: 600, fontSize: "34px", lineHeight: "1.34", letterSpacing: "-0.01em" }
  t-h3-serif:    { fontFamily: "Noto Serif KR", fontWeight: 600, fontSize: "22px", lineHeight: "1.4" }
  t-h3:          { fontFamily: "Pretendard",    fontWeight: 600, fontSize: "18px", lineHeight: "1.4" }
  t-sub:         { fontFamily: "Pretendard",    fontWeight: 600, fontSize: "16px", lineHeight: "1.4" }
  t-eyebrow:     { fontFamily: "Pretendard",    fontWeight: 700, fontSize: "13px", lineHeight: "1", letterSpacing: "0.08em" }
  t-eyebrow-ref: { fontFamily: "Pretendard",    fontWeight: 700, fontSize: "12px", lineHeight: "1", letterSpacing: "0.08em" }
  t-lead:        { fontFamily: "Pretendard",    fontWeight: 400, fontSize: "16px", lineHeight: "1.85" }
  t-body:        { fontFamily: "Pretendard",    fontWeight: 400, fontSize: "14px", lineHeight: "1.72" }
  t-body-sm:     { fontFamily: "Pretendard",    fontWeight: 400, fontSize: "13px", lineHeight: "1.65" }
  t-caption:     { fontFamily: "Pretendard",    fontWeight: 400, fontSize: "11.5px", lineHeight: "1.5" }
  t-node:        { fontFamily: "Pretendard",    fontWeight: 600, fontSize: "12px", lineHeight: "1.3" }
  t-node-sub:    { fontFamily: "Pretendard",    fontWeight: 400, fontSize: "10.5px", lineHeight: "1.4" }
  t-mono-badge:  { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: "11px", lineHeight: "1", letterSpacing: "0.06em" }
  t-mono-num:    { fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: "12px", lineHeight: "1" }
  t-mono-log:    { fontFamily: "JetBrains Mono", fontWeight: 500, fontSize: "11.5px", lineHeight: "1.5" }
  t-stat:        { fontFamily: "Noto Serif KR", fontWeight: 700, fontSize: "30px", lineHeight: "1" }
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
    backgroundColor: "{colors.accent}"   # actually a 155deg gradient #4F46E5→#3F35C4→#372EAC, see design.md §4.1
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
---

# Scroll Explainer Design System

> **What this file is.** A machine-readable token surface conforming to the [DESIGN.md spec](https://github.com/google-labs-code/design.md) (Apache-2.0) so that AI agents and design-token tooling can consume this design system deterministically. It is an **interop layer, not a replacement.** `design.md` stays the single source of truth for both values and usage semantics; the frontmatter above is a **derived mirror** of `design.md`'s tokens (keep them in sync — if a value changes, change it in `design.md` and re-mirror here). The prose below summarizes intent and **cross-links the authoritative human specs** for everything this schema cannot express.
>
> **No content lives only here.** Diagram geometry, page-type roles, the Korean voice, and the runtime/JS layer are not representable in the DESIGN.md schema and remain in the additional docs — nothing was dropped to fit this format:
> - `design.md` — full visual spec (components, diagram conventions §5, page types §6, anti-patterns §8). Canonical for usage semantics.
> - `authoring-guide.md` — voice, Korean register, content patterns, page-type registry.
> - `runtime-spec.md` — `<x-dc>` shell, `<helmet>`, `data-dc-script`/`DCLogic`, the scroll-progress + active-nav scripts, the DOM naming contract.
> - `template.dc.html` — runnable skeleton. `README.md` — the doc map.
>
> **Filename note.** The DESIGN.md spec expects the literal filename `DESIGN.md`. On a case-insensitive filesystem (macOS) that collides with `design.md`, so this file is `design.tokens.md`. When feeding a tool that requires the literal name, symlink or copy it: `ln -s design.tokens.md DESIGN.md`.

## Overview

A reusable system for single-page, vertical-scroll, self-contained HTML explainer documents (a "paper sheet" read top→bottom, not a slide deck). Any document built to it — whatever the subject — should read as the work of the same author. Three signatures: (1) serif display headings (Noto Serif KR) over a clean sans body (Pretendard); (2) a single indigo accent that always carries meaning; (3) a strict **semantic color split** — the current/old/problem state is slate + amber, the target/new/improved state is indigo. Full rationale: `design.md §0`, `authoring-guide.md §1`.

## Colors

Token values are in the frontmatter `colors`. Three families: **accent** (indigo — target/key), **neutral** (ink/body/muted), **surface** (fills/borders), plus **semantic** meaning colors. The hard invariant (normative): **never put indigo in an AS-IS zone, never put slate/amber in a TO-BE zone.** A corollary: an unknown value or a warning is *not* a problem — never give it amber. Full table with per-token usage: `design.md §1`.

## Typography

Body/UI font **Pretendard**; display/heading font **Noto Serif KR** (hero, section h2, some h3); mono **JetBrains Mono** (badges, eyebrow numbers, log/code, hero stat numbers). Korean line breaking uses global `word-break: keep-all` (mandatory). Full type scale with usage and emphasis rules: `design.md §2`. Acronym/number/register rules for Korean: `authoring-guide.md §3.1`.

## Layout

Full-bleed indigo hero → white paper sheet (`max-width: 1100px`, `−44px` overlap) on a `#EEF0F7` page. Section padding `56px 0` (first section `60px`, no border-top); lead/body max-width `760px`; sheet horizontal padding `64px`. Block rhythm: `18px` between stacked cards, `30–38px` between distinct sub-blocks. No media queries by default (desktop-first ~1100px). Full spacing tokens + responsive contract: `design.md §3`, `§8.1`.

## Elevation & Depth

Mostly flat. The only shadows: the paper sheet (`0 -24px 60px rgba(30,34,70,.10)`), the primary/root indigo node (`0 6px 16px rgba(67,56,202,.2)` — all other nodes flat), and inset text-highlight on dark backgrounds. Sticky nav `z-index:50`; scroll-progress bar `z-index:60` (above nav). Details: `design.md §4.2`, `§5.1`, `runtime-spec.md §3`.

## Shapes

Radius is fixed by element type (a consistency fingerprint): small nodes/chips 8–10px, cards/containers 14–16px, big comparison panels 18px, pills 100px, the paper-sheet top corners 22px. Keep radius uniform within one diagram. Full radius scale: `design.md §3.1`.

## Components

Frontmatter `components` encodes the foundational set (cards, badges, chips, nodes, panels). The full component catalog — hero anatomy, sticky nav + progress, table variants, the AS-IS monolith box, risk left-accent card, status-row, takeaway chip, circled-numeral lists — and all **diagram conventions** (before/after panel, UML activity, bar chart, gantt, flow/tree/log) are in `design.md §4–§5`; their structure exceeds what this schema can hold, so the schema carries the tokens and `design.md` carries the geometry.

## Do's and Don'ts

**Do:** serif headings over sans body; indigo only where it means target/key; AS-IS = slate+amber; diagram only what's diagrammable (flow/contrast/hierarchy/schedule/quantity); text→diagram (or text-left/diagram-right) per subsection; uniform radii; same-kind bars/nodes share size & position; ≤1–2 bold per paragraph; `word-break:keep-all`; Korean `~한다` 문어체.

**Don't:** indigo in an AS-IS zone or slate/amber in a TO-BE zone; amber for a warning or a missing value; underline/italic for emphasis; >2 bold per paragraph; decorative (meaningless) accent color; random/unequal same-kind bars or nodes; mixed radii in one diagram; sharp-corner or full-saturation images; punchy verdict/drama titles; default browser bullets; full polite-register `~합니다` prose; a diagram forced onto a plain enumerated list. Full anti-pattern gallery: `design.md §8.2`; voice bans: `authoring-guide.md §1`, `§3.1`.

---

*Conformance: some `contrast-ratio` lint warnings are expected and intentional (muted captions/labels are deliberately low-contrast secondary text). This file documents tokens; it does not validate produced HTML — for that see the consistency tooling notes in `README.md`.*

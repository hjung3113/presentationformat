# Authoring harness (tooling — non-normative)

**This directory is not the product spec.** The product spec — what a document must look like and
contain — lives in `core/`, `styles/<style>/`, and the root `CLAUDE.md`. Everything under
`.claude/` is *authoring tooling*: a two-skill pipeline plus a mechanical exit gate that helps a
human/agent produce a spec-conforming `.dc.html` document. If anything here ever conflicts with
`core/` or a style's `design.md`, the spec wins — fix the tooling, not the other way around.

## What the harness is

A two-step pipeline:

1. **`/plan`** (`.claude/skills/plan/SKILL.md`) — interviews the user against their source docs
   and emits `content-plan.md`: a style-agnostic, data-carrying outline of what goes in each
   section. Refuses to run on a vague idea with no real source material.
2. **`/build`** (`.claude/skills/build/SKILL.md`) — renders a confirmed `content-plan.md` into an
   actual `.dc.html` document in a chosen style (`indigo-serif`, `teal-sans`, `feedbackops-light`),
   pasting each section's figure from the style's component library by shape, then runs the exit gate. A document that hasn't passed the gate is not considered built.

The gate itself is zero-dependency Node under `.claude/lib/`:

- `.claude/lib/gate.mjs` — the checks, pure functions over the document's HTML (no I/O). See
  **Gate checks** below.
- `.claude/lib/prose.mjs` — the text-level half of the gate, also pure: the reader's visible text split into
  paragraph-like blocks, the `## T — 용어` term-sheet parser, `terms-consistent` / `terms:first-use`, and the
  Korean `prose:*` heuristics. `gate.mjs` imports it, so the two files travel together.
- `.claude/lib/figures.mjs` — the figure half of the gate, also pure: `chart-proportions`, `zone-colors` and
  `figures:lead-count`, read from the `data-value` / `data-item` / `data-zone` markers the component templates carry
  (see **Figure markers** below). `gate.mjs` imports it; it imports two palette helpers back from `gate.mjs`.
- `.claude/lib/facts.mjs` — fact bindings, also pure: the `facts.md` F-table parser (`parseFacts`), the numeral helpers
  `numbers-traced` shares, and the `data-f` / `planned:unmarked` checks (see **Fact bindings** below). `gate.mjs` imports it; it
  reads the tag index of `figures.mjs`.
- `.claude/lib/figure-counts.mjs` — the plan-time counter registry: for each component, how to count each of its `@limits-x`
  keys in that component's figure-data format (see **Plan checks**). `plan-schema.mjs` imports it.
- `.claude/lib/verify-doc.mjs` — CLI entry that runs the gate against a `.dc.html`
  (`<doc> --canonical-support <support.js> [--style <id>] [--accent <hex>] [--plan <content-plan.md>] [--no-visual] [--local-assets <dir>]`),
  checks the `support.js` sidecar is byte-identical to the canonical copy, runs the visual tier (see
  below) and ends with the **GATE line**.
- `.claude/lib/plan-schema.mjs` — schema/shape checks for `content-plan.md`. CLI entry
  (`node .claude/lib/plan-schema.mjs <content-plan.md>`): exit `0` valid (prints each section's id,
  shape and title, then any `WARN` lines), `1` malformed (lists header and per-section errors — see
  **Plan checks**), `2` usage error, an unreadable plan or an unreadable component template (only the template read is reported that
  way — a bug inside the check itself surfaces with its stack). `/plan` runs it to self-check its emitted plan before
  Gate 2; `/build` runs it as a fail-fast at Step 1 ingest.
- `.claude/lib/components.mjs` — the **component generator**. Reads `core/components/*.html`
  (structure, role placeholders) and each style's `design.tokens.md` (`colors`, `rounded`,
  `fontStacks`), and writes `styles/<style>/components/*.html` (paste-ready), their `README.md` index,
  `styles/<style>/components.gallery.dc.html`, and `core/components/README.md`.
  `build [--style <id>]` regenerates, `check` exits 1 if anything committed is stale, `list` / `shapes`
  print the catalog. Outputs are committed so documents need no build step. `parseMeta` also exposes
  `dataKeys` (`[{key, optional}]`, from each template's `@data` line), which `plan-schema.mjs` matches
  a section's `figure-data` against, and `limitsX` (`{key: {min, max}}`, from the `@limits-x` line).
- `.claude/lib/test/*.test.mjs` — the test suite for the above (`node --test .claude/lib/test/*.test.mjs`),
  including: generated outputs up to date, every template renders in every style with no unresolved
  token, `core/` carries zero HEX, `core/components.md` §1 matches the templates' `@shape` metadata,
  each template's first `@data` key matches the figure-data contract, no template hard-codes an English label
  outside a `⟦slot⟧` (label language), the figure markers (`figures.test.mjs`: each check with a positive, a negative and its
  false-positive probes; `components.test.mjs`: the exact marker counts and zero findings on every rendered template and gallery in every style), the visual tier's local-asset routing (`localAssetFor`: hosts, scoped packages, misses, path traversal) and its 390px probe (page overflow, figure overflow, silent clipping; the three component galleries must be clean at 390px), the narrow-width template contract (no bare `Nfr` track outside `minmax()`, `overflow-wrap:anywhere` on every root, a scrolling root has its `min-width:min-content` box; per component in a browser at the 343px a phone leaves: `activity` outcomes wrap in pairs with the rail over the first row and nothing scrolls, the `use-case` system label never touches a use case, a `decision-table` key and a `sequence` label are not split mid-word and those two scroll inside their box, a `status-board` row wraps to two lines with its memo in view, with or without the progress column — also at the fractional width of a zoomed page, where the `before-after` pivot shows one arrow and the `status-board` header folds with its rows; `before-after`, `activity` and `status-board` keep their host's width in a flex column (flex-start, center) and a flex row — `components.test.mjs`; `composition:figure-collapsed`, with a collapsed figure, a grid, a flex row and a figure beside text as probes, and the three roots without their `width:100%` — `verify-doc.test.mjs`; the gallery's `mobile-scroll-figure` row names exactly which figures scroll — `verify-doc.test.mjs`), informative text uses `⟨muted-text⟩` and every style's `muted-text` is ≥4.5:1 on
  white with a mono stack that ends in its Korean body font, the optional `labels: en|ko` plan key, the three CLIs run from a
  path with spaces/Korean and through a symlink (they once exited 0 without running), the worked
  example (`test/fixtures/example-brief/`) passes every plan-aware check, and the text half of the gate
  (`prose.test.mjs`: visible-text blocks, the term-sheet parser, `terms-consistent` / sref exemption, each `prose:*`
  heuristic positive and negative), the fact bindings (`facts.test.mjs`: ledger parsing, `data-f` passes and failures, the
  set-membership fallback, `planned:unmarked` with markers at each ancestor level), and the plan-time counts (`plan-schema.test.mjs`:
  every `@limits-x` key has a counter with an at-limit and an over-limit case, and a drift test holds each `@limits-x` range to the
  `min–max` in its template's `@limits` prose).

### The GATE line

`verify-doc.mjs` prints one line per check, then the visual tier, and **the last line is always**

```
GATE PASSED (k/k checks)      # exit 0
GATE FAILED (j/k checks)      # exit 1
```

`/build` treats only the `GATE PASSED` line as success — an exit code alone is not enough (a
wrapper, a `| tail`, or a wrong path can all hide a failure). A structural failure skips the visual
tier. Usage errors (missing flag, unknown `--style`) exit `2` with the usage text.

Flags: `--style <id>` resolves `styles/<id>/` from the lib's own location, supplies the accent
(`design.tokens.md` `colors.accent`) when `--accent` is absent, enables the `palette` check and supplies the accent / warn /
slate roles the TO-BE half of `zone-colors` reads.
`--accent <hex>` wins over the style's. `--plan <file>` enables `plan-alignment`, `plan-shapes`
and `numbers-traced` — and `terms-consistent` when the plan's facts file has a `## T — 용어` table. `--no-visual` skips the browser tier. At least one of `--accent` / `--style`
is required. `--local-assets <dir>` (env `DC_LOCAL_ASSETS`; the flag wins; a directory that does not exist exits `2`, but the env var
is only looked at when the visual tier runs — a stale one does not stop a `--no-visual` gate) lets the visual tier render without
outbound network — see **Prerequisites**.

### Gate checks

Every check is hard-fail unless marked non-blocking.

| check | passes when |
|---|---|
| `keep-all` | `word-break: keep-all` is present |
| `accent-present` | the accent hex appears (case-insensitive) |
| `sidecar-present` | `support.js` beside the doc is byte-identical to the canonical copy |
| `unique-ids` · `navlink-integrity` | no duplicate `id`; every `data-navlink` resolves (HTML comments are ignored — a leftover commented template variant is harmless) |
| `inline-only` | no class selector in any `<style>` — including `.a, .b {` lists, `div.x {` and rules inside `@media`. Attribute/element/pseudo selectors, `@font-face`, `::selection` and `::-webkit-scrollbar` stay allowed |
| `slots-filled` · `no-role-placeholders` | no `⟦…⟧` slot and no `⟨role⟩` token left outside HTML comments |
| `palette` (`--style`) | every `#RGB` / `#RRGGBB` in a `style` attribute (or `fill`/`stroke`/… attribute) or `<style>` text is in the style's `design.md` (case-insensitive, `#abc` = `#AABBCC`). Comments, `<script>`, `&#…;` entities, `href`/`id` fragments and `url(#…)` are ignored |
| `grid-consistency` | inside each `[data-component]` root that uses `calc(100% / N)`, every `repeat(M, 1fr)` / `repeat(M, minmax(0, 1fr))` / floored `repeat(M, minmax(<length>, 1fr))` has M = N (nested components are judged on their own) |
| `chart-proportions` | every `data-value`-marked bar, row and segment of a `bar-chart`, `hbar-chart`, `stacked-bar` or `status-board` is drawn at the size its number says (±2 points) and shows that number — **Figure markers** below. Runs only where the markers exist |
| `zone-colors` | no `data-zone="as-is"` zone uses the style's accent, and no `data-zone="to-be"` zone is mostly warn/slate fills — **Figure markers** below. Runs only where the markers exist |
| `known-components` | every `data-component` is a template id |
| `plan-alignment` (`--plan`) | plan sections map to ids — a numbered title `N.` → `sN`, an unnumbered title → `sref` — and every one exists in the document; the document has no numbered `sN` the plan lacks. Act dividers must be `<div>`, never `<section>` |
| `plan-shapes` (`--plan`) | each section (looked up by id) carries the component its shape requires |
| `numbers-traced` (`--plan`) | every numeral a reader sees is traceable, and a number marked `data-f` is a number of the facts row it cites — next sections |
| `terms-consistent` (`--plan` + a facts file with a `## T — 용어` table) | no `쓰지 않을 말` variant of the term sheet appears in the visible text outside the `sref` appendix — see **Term sheet** below. Without a T table the gate prints `NOTE  terms-consistent  not checked …` |

Non-blocking `figures:*` rows report per-section coverage, low variety, bare sections, more
than 2 main figures in one section, and a lead whose count disagrees with its figure (`figures:lead-count`). The non-blocking
`planned:unmarked` row reports an element whose `data-f` cites a `designed` / `planned` fact with no planned marker near it
(an `INFO` row says when every such element is marked). Non-blocking
`prose:*` and `terms:first-use` rows report Korean-writing problems — see **Prose warnings** below.

**`numbers-traced`** exists so nothing in the document can be a number nobody supplied (template
examples, plausible-looking invention). *Document side:* only visible text — comments, `<script>`,
`<style>`, `<helmet>`, tag markup (so attribute values) and entities are stripped, then every
numeral token is read (`1,200` → `1200`, `05` → `5`, decimals kept, `1,2` is two numbers).
*Traced set:* every numeral anywhere in the plan file, plus the facts file named by the plan's
`facts:` header (resolved relative to the plan; unreadable → the check fails with that message).
Source line refs (`L12-40`) are not counted — they cite a place, not a value. *Exempt:* `NN ·`
eyebrows, a text node that is only 1–2 digits inside a section (step/number badges), a leading
`N.` / `N)` list marker, `sN` ids. The hero (everything before the first `<section>`) is checked in
full, so a made-up hero token fails. Failure lists up to 8 untraced numbers with ~20 characters of
context each; fix it by putting the real number in the plan (with its citation) or removing it
from the document — never by editing the check.

**Fact bindings (`data-f`, `planned:unmarked`).** Set membership alone cannot tell a right number from a wrong one that happens to
exist elsewhere in the ledger, so a number can be bound to its row. An element that shows a number from the facts ledger carries
`data-f="F03"` (several rows: `data-f="F03 F07"`); `core/components.md` §4 "Numbers come from the plan" is the authoring contract.
`facts.mjs` reads the F tables of the facts file named by the plan (every `F\d+` row of every table whose header has `id` and
`사실` or `값`, columns found by header name, so the order may differ and the table may be split under sub-headings) and, for each
`data-f` element: an id that is not a ledger row **fails**; a numeral the element shows (thousands commas and leading zeros
normalized, `F`/`Q`/`C` ids and `L12` refs dropped) that is in none of the cited rows' `값` or `사실` **fails** — the `사실`
sentence counts because the ledger states 16,796 and 15,768 in the sentence of F04, whose `값` is the ratio 1.07. Both are folded into the
`numbers-traced` row. The element's text is then removed from the set-membership fallback, which still reads every number
without `data-f` exactly as before, so a document without `data-f` passes unchanged. Put `data-f` on the narrowest element that shows
the number (the value span of a tile, the sub-line that states the count): everything the element shows is checked — except what a
`data-f` element nested inside it shows, which that element's own binding checks (`<b data-f="F01">18일<i data-f="F04">1.07</i></b>`).
A decimal's trailing zeros do not matter (`1.070` is `1.07`, `2.0` is `2`).
`planned:unmarked` (warning) covers the other half of the ledger's `상태`: an element citing a row whose 상태 is `designed` or
`planned` must not read as built, so it needs `계획` / `예정` / `미구현` / `미설계` / `제안` / `요청` / `대기` in its own text or in an ancestor's text within 3
levels, or `data-state="planned"` / `"caveat"` on itself or on an ancestor within 3 levels (the planned and state-chip variants of
`layer-map`, `pipeline`, `tree`, `timeline`, `sequence` and `before-after` carry `data-state`). An ancestor that holds other `data-f` elements
is a shared container, so only its `data-state` counts — its text belongs to all of them. The row never fails the gate.

**Figure markers (`chart-proportions`, `zone-colors`, `figures:lead-count`).** The component templates carry four attributes,
appended after the element's `style="…"` (`core/components.md` §4 "Figure markers" is the authoring contract); `figures.mjs`
reads three of them from the live markup (comments and `<script>` are ignored) and `facts.mjs` the fourth, `data-state`
(**Fact bindings** above). A check has a row only where its markers are; a figure that
could carry them but does not prints `NOTE  <check>  not checked — N figure(s) carry no …`, so a document built before the markers
existed passes unchanged.

- `chart-proportions` (hard) — over the `data-value` elements of each chart component (a non-numeric value such as `—` is skipped).
  One scale per chart, read off its largest-value mark (k = size ÷ value): `bar-chart` — the bar's own `height:N%` is within ±2 of
  value × k, and the largest bar's size is more than 2 (a largest bar drawn at ~0 gives no scale — every other bar would be "proportional"
  to nothing, as would a chart of all-0 bars with one drawn: with a largest value of 0 every bar must be drawn at 0) and at most 102 (it must
  fit the plot), so a chart drawn to its maximum (k = 100 ÷ max) and a
  percent chart on an absolute 0–100 axis (k = 1) both pass while a bar off the proportion fails. `hbar-chart` and `status-board` —
  the first `width:N%` inside the row is within ±2 of the value when the row's text shows `value%` (or `value％`) — and at most 102, like
  the largest proportional bar (`120%` drawn at 120% fails) — else within ±2 of
  value × k over the rows that show no `%` (`70/100건` drawn at 70% passes; the `status-board` 대기 row has no bar and no marker). `stacked-bar`: each
  segment's `width:N%` is within ±2 of its value and the marked segments add up to 100 ±2. In all four, `data-value` must equal a
  numeral the element shows (±0.5; an element with no digits, like a textless segment, is skipped). A marked element with no
  `height`/`width` percentage to compare fails — the marker sits on the wrong element. A chart that marks some of its bars and not
  others prints `NOTE  chart-proportions  partly checked …` naming how many `height:N%` / `width:N%` bars carry no marker (the
  fills inside a marked row and the columns that wrap a marked bar are not bars). A chart that marks nothing prints
  `NOTE  chart-proportions  not checked — N figure(s) carry no data-value` whatever its bars are drawn in (a `bar-chart` in px
  included); only a `status-board` that draws no bar at all (built without its progress column) is left out. Entities in a label (`&#55;`, `&#x37;`) read as the
  character they name.
- `zone-colors` (hard) — over the `data-zone` elements. `as-is` fails when any hex inside it (a `style`, `fill`, `stroke`, `color` or
  `bgcolor` attribute) is the style's accent or any other color of the accent family — `accent` and every `accent-*` token, e.g.
  `accent-050` (`--accent` wins for the accent itself; without `--style` only the accent is known). `to-be` fails when the zone's background fills
  (`background`, `background-color`, `fill`, `bgcolor` — never borders or text) in the problem family outnumber those in the accent family, so
  one slate chip among accent fills passes. The families come from `design.tokens.md`: accent family = every `accent*` token; problem
  family = `warn`, `warn-2`, `warn-bg`, `warn-line`, `slate`, `slate-bar`, `mono-tint`, `mono-dashed`, minus any literal the accent family
  shares. Only fills count because a style may reuse one literal for a border and a problem fill (feedbackops-light paints `slate-bar`
  and `border-node` the same), and an element drawn at 2px or less in width or height is a rule, not a fill (every style paints its
  `hairline` in the `slate-bar` literal). Without `--style` only the AS-IS half runs and a `NOTE` names the skipped TO-BE zones. A `before-after`
  with no `data-zone` is always listed in the NOTE; a `gantt` or `layer-map` only when it paints a problem-family fill (a legacy bar or
  layer) and has no marker.
- `figures:lead-count` (non-blocking) — the lead of each `sN` section (its first `<p>` of 25+ characters) against the number of
  `data-item` markers in the section's first figure that has any. Count words are `두 세 네 다섯 여섯 일곱 여덟 아홉` or the digits 2–9
  followed by 가지·단계·곳·개·층·갈래·구간·축·종 (`개` as a counter, never inside 개월/개선/개발); 1 and anything above 9 never counts
  and the M of "N개 중 M개" is dropped. It warns only when the lead has count words and none equals the figure's count, so
  "7단계 … 다섯 구간" over five steps passes; one `INFO` row lists what was read. Marked today: `card-grid` cards, `process-row` steps,
  `pipeline` stage columns, `kpi-row` tiles. `layer-map` layers, `timeline` rows and `table` rows are not: calibrating against the
  three pasted documents, the pitch's layer-map lead counts five responsibilities over four layers — a false positive.

**Term sheet (`terms-consistent`, `terms:first-use`).** `/plan` Step 1 fixes one word per concept in the
optional `## T — 용어` table of `facts.md` (`| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |`; template
`.claude/skills/plan/facts.template.md`). The gate reads that table through the plan's `facts:` header. *Check:* the
reader's visible text (the same stripping as `numbers-traced`, but inline tags join the surrounding text) outside the
`<section id="sref">` appendix — hero, nav, act dividers, closing line and numbered sections — must contain no `쓰지 않을 말` variant (comma-separated;
Latin case-sensitive, Hangul exact; a variant made only of Latin letters/digits matches as a whole token — banned `AD` hits `AD 계정` but not `LOAD` or `ADR-0008`, and `Task` does not hit `Tasks`, so list a plural as its own variant — while a Hangul or mixed variant is an exact substring and also hits inside a longer word, `업무` in `업무량`). A chosen term or first-use form that contains a variant
(`작업(Task)` holds `Task`) is masked first, so the prescribed form never trips its own ban. Failure lists up to 8 hits
(`s3 "태스크" (use 작업) …context…`). *Warnings:* `terms:first-use` — (a) a term's `처음 나올 때` form (whitespace-insensitive)
appears nowhere in the document, or (b) the bare term is read **before** its first-use form (order check, `firstUseOrder()`
in `prose.mjs`). Order rules (`core/components.md §4` "Terms and first use"): blocks are read in document order — the pre-`<section>` hero first,
then each section, with an act divider between sections and the closing line after the last at their real positions (a bare
term there is fine once the form has been read, and out of order before it). The hero thesis counts as the first occurrence —
when the form is in the hero, the hero and everything after it may use the bare term; when it is not, a bare term in the hero is
out of order; a form that appears only in a divider or the closing line excuses nothing before it; nav labels and the fixed document title (hero blocks that are a link or an `<h1>`) are exempt; section titles (`h2`) are exempt too — the lead right below defines the term; a longer term that contains the bare one (`작업 요청` holds `작업`) and the `sref` glossary are not bare uses; a term whose form
appears nowhere is left to (a). Placeholder rows (`<…>`) are ignored, so an unfilled template table means "no term
sheet". Without `--plan`, without a facts file, or without a T table the check does not run (a `NOTE` says why).

**Prose warnings (`prose:*`, never fail the gate).** Computed on the paragraph-like blocks of the hero, the numbered
sections and the dividers/closing line between and after them (the appendix and headings are excluded; only blocks of 25+ characters that end like a sentence — `.`/`!`/`?`,
or `다`/`요`/`까` — are prose, so figure labels and chips are ignored). Sentences end at `. ! ?` before a space or the end
(3.5, v0.2.0 and file.md stay whole). Thresholds are constants in `prose.mjs`.

| row | fires when |
|---|---|
| `prose:long-sentence` | a sentence is over 110 characters (spaces included); reports the count and the two longest |
| `prose:dot-chain` | a sentence has 4 or more `·` (a noun pile) |
| `prose:dash` | more than one `—` in a sentence, or more than 3 in a section lead (the first `<p>` of a numbered section) |
| `prose:translationese` | any `~는/한/된/인 것이다`, `~것으로 보인다`, `되어지/되어진/보여지…`, `~에 있어서/~함에 있어`; or `~에 대한` / `~(을/를) 통해` 3+ times in one section |
| `prose:register` | a polite ending (`~합니다`, `~습니다`, `~해요` and kin) in body text — all styles write `~한다` |

`~에 있어서` also matches a literal "is located in" (`서버에 있어서`); read the context before rewriting. A kept warning
must be justified in `/build`'s final report (its Step 9).

### Plan checks

`plan-schema.mjs` returns `{ok, errors, warnings}`; the CLI prints warnings (non-blocking) after OK /
INVALID.

- **Header** (YAML, one `key: value` per line; continuation lines indented ≥ 2 spaces). Required:
  `doc-type` (`explainer|status-report|proposal|feature-guide|analysis|pitch`), `audience`
  (`executive|user|developer`), `reader-action`, `has-as-is`, `metrics-mode`, `act-structure`,
  `narrative-lens`, `source-ref`, `title`, `thesis`, `cover-tokens`. `facts: <path>` is required for
  `pitch` (the file must exist relative to the plan) and read by `numbers-traced` whenever present;
  `as-of: YYYY-MM-DD` is optional, and so is `eyebrow` (the hero eyebrow, printed verbatim; without it `/build`
  writes `<DOC-TYPE> · <audience>`) and `labels: en|ko` (the language of section eyebrows, the appendix label and
  component badges; without it `/build` uses `en` for `audience: developer` and `ko` for `executive|user` —
  `labelLanguage()` in `plan-schema.mjs`, table in `core/components.md §4`). Enums are validated; any value that is still a template
  placeholder (`<…>`) is rejected; `cover-tokens` is 2–4 items `값=라벨 [cite]` separated by `;`.
  Keys and enums are defined in the figure-data contract — `core/components.md` and the
  `content-plan.template.md` the skills carry.
- **Sections** (`## N. 제목` → `sN`; `## 제목` without a number → `sref`; ids must be unique). Each
  field is one `- key: value` line (indented continuation lines are appended; an empty field stays
  empty and never captures the next line): `intent`, `shape`, `payload`, `source-span` always;
  `figure-data` for figure/chart/report shapes **and `text-table`** (a `columns: … | rows: …` table; `none` is an
  error). `source-span` must look like a citation
  (path, `L12-40`, `[F03]`, `repo@sha`) — "source" alone is rejected.
- **figure-data** must contain the component's first `@data` key (`(^|[|\s])KEY\s*(\([^)]*\))?\s*:` —
  an annotation such as `layers (위→아래):` is fine), and for a component whose `@data` shows flow
  (`→ ⇢ -> ↻`) at least one of `→ ⇢ -> --> ↻ (self)`; ASCII `->` request, `-->` response, `(self)`
  internal are accepted equivalents.
- **Warnings:** more than 2 sections with shape `decision`; `audience: executive` with more than 12
  numbered sections (the text suggests grouping into acts — the section count follows the content, and a document that
  covers several products/systems gives each its own section set; `core/components.md` §5), any of `code-structure|interaction|entity-relations|rule-table`, a first
  numbered section that is not `headline-metric|decision`, or a last one that is not `decision`. **Countable
  limits** also warn (never error): every component whose countable parts have a limit states it twice, as the prose `@limits`
  line and as machine-readable `@limits-x` tokens (`key=min..max`, e.g. `layers=2..5 modules-per-layer=1..5`; `parseLimitsX` in
  `components.mjs`). For a section whose shape maps to such a component, `figure-counts.mjs` counts each key in the component's
  figure-data format (`COUNTERS`: component → key → counter) and warns on a count **above `max`** only, naming the section, the
  thing counted and the limit — `s2 (hierarchy): "분석 공간" has 7 leaves (>6) — tree shows 0–6 per child; …`. Counters read
  top-level separators only (a comma inside `( )`, `[ ]` or a number such as `1,200` is not a separator) and under-count what
  they cannot tell apart, so an ambiguous format yields a missed warning rather than a false one. `COUNT_LIMITS` in `plan-schema.mjs`
  (goals per actor, modules per layer, table rows 7, `sref` appendix rows 10) is derived from `@limits-x`. A new countable
  part gets its `@limits-x` token **and** a counter; a drift test fails when a range differs from the `min–max` in the prose, when a
  prose range has no token, or when a token has no counter.

## Prerequisites

- **Node** (any recent LTS; verified here on v22) — required to run the lib scripts and their
  tests:
  ```bash
  node --test .claude/lib/test/*.test.mjs
  ```
  The browser-gated tests skip when there is no headless browser; the one that renders a real gallery
  also needs `DC_LOCAL_ASSETS` (see **Local assets** below).
- **Headless browser (optional)** — the visual tier wants Chrome/Chromium. It is found via
  `$CHROME_PATH` (checked first), then `google-chrome`, `chromium`, `chromium-browser`,
  `chrome-headless-shell` on `PATH`, then the macOS app bundle. As root (containers) it passes
  `--no-sandbox`. The documents load React/Babel (unpkg) and Pretendard (jsdelivr) from CDNs, and Google
  Fonts, so the browser needs **outbound network** to render them — or `--local-assets` (below). It
  renders three viewports in turn: `1366x768` and `1440x900` for the desktop composition rows, and
  `390x844` (a phone, scrollbars hidden) for the narrow-width probe. The tier never blocks the gate;
  it ends in one of:
  - `VISUAL: composition warnings 0 at 1366x768, 1440x900 and 390x844` — measured, clean;
  - warning rows, then `VISUAL: composition warnings are non-blocking until calibrated against accepted artifacts`;
  - `VISUAL: UNVERIFIED (reason)` — no browser, the browser died or timed out at every viewport,
    or no `<section>` rendered at all (so "0 warnings" would be meaningless). Treat it as "not
    looked at", not as a pass of the visual tier.

  The figure-panel colors the analyzer looks for come from the active style's `fig-tint` /
  `border-fig` tokens (indigo-serif values when `--style` is absent).
- **Local assets (optional, for offline rendering)** — `--local-assets <dir>` or env `DC_LOCAL_ASSETS=<dir>`
  answers the page's CDN requests from `<dir>/node_modules` (the flag wins; a directory that does not
  exist exits `2` — for the env var only when the visual tier runs, never under `--no-visual`; no flag and no env changes nothing). `unpkg.com/<pkg>@<ver>/<path>` and
  `cdn.jsdelivr.net/{npm/<pkg>@<ver>,gh/<user>/<repo>@<ver>}/<path>` map to `<dir>/node_modules/<pkg>/<path>`
  (scoped names too; `x.min.css` falls back to `x.css`); Google Fonts requests fail at once, so the page
  falls back to system fonts and text metrics differ slightly from the real render. Install what the
  document loads, at the versions `support.js` asks for (it checks React with SRI, so they must match
  exactly): `npm install --prefix <dir> react@<v> react-dom@<v> pretendard@<v>`, plus `@babel/standalone@<v>`
  if a document uses JSX. A request the directory cannot answer, or a package at another version, is
  printed as a `local-assets:*` row below, and a page that then renders nothing is `UNVERIFIED`.

  Rows that come from the 390px viewport and from `--local-assets` (`composition:figure-collapsed` is the one 390px row the desktop
  viewports print too). The 390px viewport skips the desktop height and stacking rows, so these are the only rows it prints:

  | row | level | printed when |
  |---|---|---|
  | `composition:mobile-overflow` | WARN | at 390px the page scrolls sideways (`scrollWidth` > viewport + 2). Lists the offending `data-component` ids as `id×n (+Npx)` (n figures with an overflowing node, N the largest overshoot), then non-figure offenders as `<section> <tag>×n "text"`. A node inside an ancestor with `overflow-x` auto, scroll, hidden or clip is clipped or scrolls, so it is not an offender. Page level only — the next row covers a figure that is too wide without making the page scroll |
  | `composition:figure-overflow` | WARN | at 390px a `data-component` root is wider than its frame — also when the page itself does not scroll sideways — or silently loses content. Two parts, each `id×n (+Npx)`: `wider than their frame:` — the root's border box extends past its parent's content box (so it ends inside the sheet's side padding), or its own contents spill out of it (`overflow-x` visible and `scrollWidth` > `clientWidth` + 2); `content clipped by overflow:hidden:` — the root or a node inside it has `overflow-x` hidden or clip and `scrollWidth` > `clientWidth` + 2 (a `text-overflow: ellipsis` truncation is intended and ignored). A root whose parent scrolls, or that scrolls itself (`overflow-x` auto or scroll), is not reported here: that is `composition:mobile-scroll-figure` |
  | `composition:figure-collapsed` | WARN | a `data-component` root renders narrower than half the content width of its parent — at **any** of the three viewports, so the desktop ones print it too. Lists `id×n (Wpx of Fpx)` (n roots, W the narrowest, F its frame) then `render narrower than half their frame at Npx`. It is the failure the two overflow rows cannot see: a figure whose layout reads `100cqw` (`container-type:inline-size`) has no intrinsic width, so in a host that sizes to its content (a flex column with `align-items:flex-start` or `center`, an `inline-block`, `width:fit-content`, a grid `auto` track) it folds to its padding while nothing overflows and nothing is clipped (`before-after` 58px wide and ~1,950px tall). A figure that shares its row with another visible child of the same parent (a grid cell, a figure beside a figure or a paragraph) takes a share of the frame on purpose and is skipped, as is a frame under 120px. `core/components.md` §4 "Narrow widths" is the contract |
  | `composition:mobile-scroll-figure` | INFO | a figure root, or a node inside it, has `overflow-x` auto or scroll and really scrolls at 390px — the intended narrow fallback, listed so it is visible rather than counted as overflow |
  | `composition:narrow-metrics` | INFO | the 390px viewport rendered; carries the section count and the document `scrollWidth` |
  | `local-assets` | INFO | `--local-assets` is active; names the directory and any host that was blocked |
  | `local-assets:version` · `local-assets:miss` | WARN | a package is installed at another version than the URL asks for · a requested file is not under `<dir>/node_modules` |

## Host-neutral install

The harness must run co-equally on **Claude Code** and **opencode** — both are treated as
first-class hosts, and the harness is designed to run identically on each, so nothing here may
depend on Claude-Code-only behavior.

### Claude Code

No install step. Claude Code discovers skills at `.claude/skills/<name>/SKILL.md` automatically
on clone — `/plan` and `/build` are available as soon as the repo is checked out.

### opencode

**No install step either — verified empirically, not assumed.** opencode (checked at v1.14.19)
natively scans the project's `.claude/skills/` directory in addition to its own global skill
locations (`~/.agents/skills/`, `~/.claude/skills/`); it needs no `.opencode/` copy, no symlink,
and no file-format adaptation. `SKILL.md` loads as-is.

#### Verified under opencode

- **Discovery path used:** opencode reads skills directly from
  `<project>/.claude/skills/<name>/SKILL.md` (confirmed via `location` field in output below) —
  the same path Claude Code uses. No expose step was needed.
- **Expose step:** none required (see above).
- **Verification command** (run from the repo root):
  ```bash
  opencode debug skill
  ```
- **Output (relevant excerpt, opencode v1.14.19):**
  ```
  [
    ...
    {
      "name": "plan",
      "location": "/Users/hyojung/Desktop/2026/presentationformat/.claude/skills/plan/SKILL.md",
      ...
    },
    {
      "name": "build",
      "location": "/Users/hyojung/Desktop/2026/presentationformat/.claude/skills/build/SKILL.md",
      ...
    },
    ...
  ]
  ```
  Both `plan` and `build` were present in the full listing (13 skills total on this machine,
  including unrelated global skills), each with `content` populated from the corresponding
  `SKILL.md` — i.e. opencode fully parsed and loaded both harness skills, not just found the
  files.

If a future opencode version changes this behavior (e.g. requires `.opencode/skill/` instead),
re-run `opencode debug skill` from the repo root to check the `location` values, and update this
section — do not assume parity without re-verifying.

### Codex

Codex (a skills-capable build; checked at `codex-cli 0.142.5`) does **not** scan the project's
`.claude/skills/`. It discovers skills by directory scan of `$CODEX_HOME/skills/<name>/`
(default `~/.codex/skills`). Install with `./install.sh` (symlinks the two skill dirs there),
then **restart Codex**.

#### Verified under Codex

- **Discovery mechanism:** directory scan of `$CODEX_HOME/skills`, following symlinks.
  `config.toml`'s `[[skills.config]]` table is a disable/override registry, **not** a discovery
  allowlist — no entry is required to enable a skill (confirmed: `~/.codex/skills/chronicle/` is
  discovered with no config entry).
- **Verification command** (from the repo root, after `./install.sh`):
  ```bash
  codex debug prompt-input
  ```
- **Result:** both `plan` and `build` appear in the model-visible skill list, each with its full
  name + description and the resolved symlink target
  `(file: <repo>/.claude/skills/<name>/SKILL.md)` — i.e. Codex followed the symlink and loaded
  the harness skills.

If a future Codex version changes discovery (e.g. requires explicit registration), re-run
`codex debug prompt-input` from the repo root to confirm `plan`/`build` are present, and update
this section — do not assume parity without re-verifying.

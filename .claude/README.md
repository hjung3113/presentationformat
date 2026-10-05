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
- `.claude/lib/verify-doc.mjs` — CLI entry that runs the gate against a `.dc.html`
  (`<doc> --canonical-support <support.js> [--style <id>] [--accent <hex>] [--plan <content-plan.md>] [--no-visual]`),
  checks the `support.js` sidecar is byte-identical to the canonical copy, runs the visual tier (see
  below) and ends with the **GATE line**.
- `.claude/lib/plan-schema.mjs` — schema/shape checks for `content-plan.md`. CLI entry
  (`node .claude/lib/plan-schema.mjs <content-plan.md>`): exit `0` valid (prints each section's id,
  shape and title, then any `WARN` lines), `1` malformed (lists header and per-section errors — see
  **Plan checks**), `2` usage or read error. `/plan` runs it to self-check its emitted plan before
  Gate 2; `/build` runs it as a fail-fast at Step 1 ingest.
- `.claude/lib/components.mjs` — the **component generator**. Reads `core/components/*.html`
  (structure, role placeholders) and each style's `design.tokens.md` (`colors`, `rounded`,
  `fontStacks`), and writes `styles/<style>/components/*.html` (paste-ready), their `README.md` index,
  `styles/<style>/components.gallery.dc.html`, and `core/components/README.md`.
  `build [--style <id>]` regenerates, `check` exits 1 if anything committed is stale, `list` / `shapes`
  print the catalog. Outputs are committed so documents need no build step. `parseMeta` also exposes
  `dataKeys` (`[{key, optional}]`, from each template's `@data` line), which `plan-schema.mjs` matches
  a section's `figure-data` against.
- `.claude/lib/test/*.test.mjs` — the test suite for the above (`node --test .claude/lib/test/*.test.mjs`),
  including: generated outputs up to date, every template renders in every style with no unresolved
  token, `core/` carries zero HEX, `core/components.md` §1 matches the templates' `@shape` metadata,
  each template's first `@data` key matches the figure-data contract, no template hard-codes an English label
  outside a `⟦slot⟧` (label language), informative text uses `⟨muted-text⟩` and every style's `muted-text` is ≥4.5:1 on
  white with a mono stack that ends in its Korean body font, the optional `labels: en|ko` plan key, the three CLIs run from a
  path with spaces/Korean and through a symlink (they once exited 0 without running), the worked
  example (`test/fixtures/example-brief/`) passes every plan-aware check, and the text half of the gate
  (`prose.test.mjs`: visible-text blocks, the term-sheet parser, `terms-consistent` / sref exemption, each `prose:*`
  heuristic positive and negative).

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
(`design.tokens.md` `colors.accent`) when `--accent` is absent, and enables the `palette` check.
`--accent <hex>` wins over the style's. `--plan <file>` enables `plan-alignment`, `plan-shapes`
and `numbers-traced` — and `terms-consistent` when the plan's facts file has a `## T — 용어` table. `--no-visual` skips the browser tier. At least one of `--accent` / `--style`
is required.

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
| `grid-consistency` | inside each `[data-component]` root that uses `calc(100% / N)`, every `repeat(M, 1fr)` has M = N (nested components are judged on their own) |
| `known-components` | every `data-component` is a template id |
| `plan-alignment` (`--plan`) | plan sections map to ids — a numbered title `N.` → `sN`, an unnumbered title → `sref` — and every one exists in the document; the document has no numbered `sN` the plan lacks. Act dividers must be `<div>`, never `<section>` |
| `plan-shapes` (`--plan`) | each section (looked up by id) carries the component its shape requires |
| `numbers-traced` (`--plan`) | every numeral a reader sees is traceable — next section |
| `terms-consistent` (`--plan` + a facts file with a `## T — 용어` table) | no `쓰지 않을 말` variant of the term sheet appears in the visible text outside the `sref` appendix — see **Term sheet** below. Without a T table the gate prints `NOTE  terms-consistent  not checked …` |

Non-blocking `figures:*` rows report per-section coverage, low variety, bare sections, and more
than 2 main figures in one section. Non-blocking `prose:*` and `terms:first-use` rows report Korean-writing
problems — see **Prose warnings** below.

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

**Term sheet (`terms-consistent`, `terms:first-use`).** `/plan` Step 1 fixes one word per concept in the
optional `## T — 용어` table of `facts.md` (`| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |`; template
`.claude/skills/plan/facts.template.md`). The gate reads that table through the plan's `facts:` header. *Check:* the
reader's visible text (the same stripping as `numbers-traced`, but inline tags join the surrounding text) outside the
`<section id="sref">` appendix — hero, nav and numbered sections — must contain no `쓰지 않을 말` variant (comma-separated;
plain substring match, Latin case-sensitive, Hangul exact). A chosen term or first-use form that contains a variant
(`작업(Task)` holds `Task`) is masked first, so the prescribed form never trips its own ban. Failure lists up to 8 hits
(`s3 "태스크" (use 작업) …context…`). *Warning:* `terms:first-use` — a term's `처음 나올 때` form (whitespace-insensitive)
appears nowhere in the document. Placeholder rows (`<…>`) are ignored, so an unfilled template table means "no term
sheet". Without `--plan`, without a facts file, or without a T table the check does not run (a `NOTE` says why).

**Prose warnings (`prose:*`, never fail the gate).** Computed on the paragraph-like blocks of the hero and the numbered
sections (the appendix and headings are excluded; only blocks of 25+ characters that end like a sentence — `.`/`!`/`?`,
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
  numbered section that is not `headline-metric|decision`, or a last one that is not `decision`.

## Prerequisites

- **Node** (any recent LTS; verified here on v22) — required to run the lib scripts and their
  tests:
  ```bash
  node --test .claude/lib/test/*.test.mjs
  ```
- **Headless browser (optional)** — the visual tier wants Chrome/Chromium. It is found via
  `$CHROME_PATH` (checked first), then `google-chrome`, `chromium`, `chromium-browser`,
  `chrome-headless-shell` on `PATH`, then the macOS app bundle. As root (containers) it passes
  `--no-sandbox`. The documents load React/Babel and fonts from CDNs, so the browser also needs
  **outbound network** to render them. The tier never blocks the gate; it ends in one of:
  - `VISUAL: composition warnings 0 at 1366x768 and 1440x900` — measured, clean;
  - warning rows, then `VISUAL: composition warnings are non-blocking until calibrated against accepted artifacts`;
  - `VISUAL: UNVERIFIED (reason)` — no browser, the browser died or timed out at every viewport,
    or no `<section>` rendered at all (so "0 warnings" would be meaningless). Treat it as "not
    looked at", not as a pass of the visual tier.

  The figure-panel colors the analyzer looks for come from the active style's `fig-tint` /
  `border-fig` tokens (indigo-serif values when `--style` is absent).

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

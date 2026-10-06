---
name: plan
description: Interview the user against their source docs to produce a content-plan.md — a style-agnostic, data-carrying plan of what goes in each section of a scroll-style document (explainer, status report, proposal, feature guide, analysis, or a pitch for a need/investment) — backed by a facts.md ledger so every claim and number traces to a source. Use before /build, whenever a user wants to turn source material (specs, notes, tickets, transcripts, several repos) into a planned document outline. Refuses and routes out if no real source is provided; this is not a general brainstorming or ideation skill.
---

# /plan — section content interview

This skill grills the user against their **source docs** to agree on what information goes on
each section of a future document, and emits that agreement as `content-plan.md` (plus a `facts.md`
ledger that every claim and number cites). It does not write final prose, does not choose a visual
style, and does not invent content that isn't in the source. A second skill, `/build`, later renders
the confirmed content-plan into an actual document in a chosen style.

## Precondition — a real source is required

Before doing anything else, check what the user has handed you.

- If the user supplies source docs (specs, requirements, meeting notes, existing docs, data
  files, tickets, transcripts, one or several repositories — anything with actual facts in it),
  proceed.
- If the user has **no source**, or what they hand you is **thin** (a paragraph or two with no
  real substance to interview against), or it is a **vague idea** ("I want a doc about improving
  our onboarding" with nothing behind it), **refuse and route out**. Say plainly that this skill
  grounds a document in source material and is not open-ended brainstorming; ask the user to
  bring source docs, or point them at a brainstorming approach instead. Do not attempt to
  fabricate content or interview the user about their opinions to fill the gap — that is exactly
  the failure mode this skill must not fall into.
- **Owner-supplied facts count as a source** — but only as facts. A cost, an hours-per-month
  figure, a headcount, a date, who decides: things the owner is accountable for and that live in
  their head, not in any file. Record each as an `owner` fact with the owner named (Step 0). Opinions,
  wishes and "what if we also…" are not facts; a document built only from opinions is still refused.

Only once a real source is confirmed does the interview begin.

## Style-agnostic boundary

This skill produces content, not layout. Never decide, discuss, or bake in:

- which page type a section renders as (Cover, Background, Problems, Direction, etc.),
- which color token or semantic state (current/target) a section gets,
- any exact visual value or style.

It **does** classify each section's content **shape** (`core/components.md` §1–§2) — e.g. "this is a
lifecycle", "this is a role handoff". A shape is a fact about the content, not a visual choice, and
it is the same in every style. `/build` turns the shape into a figure by a fixed lookup, so a correct
shape here is what guarantees the document gets the right diagram. If the user asks about colors or
look, note that it's decided at `/build` time and steer back to content.

## Flow — gather, propose, then confirm (two gates)

### Step 0 — Gather: build `facts.md`

Create `facts.md` next to the plan from `.claude/skills/plan/facts.template.md` (required for
`doc-type: pitch`; recommended whenever the document carries numbers or several sources). It is the
only place a fact enters the pipeline: **no F-id → the claim is dropped.**

**Fixed reading order** (stop reading a layer once it stops adding facts for this document):

1. `README` / `PRODUCT` / `CONTEXT` — what the thing is, its vocabulary and invariants.
2. ADR **titles** first (what was decided), then the bodies of the ones that touch the topic.
3. Roadmap / planning / backlog documents — what is planned, what is done, what is waiting.
4. Topic design docs — the detail the numbered sections need.
5. Code, migrations, schemas — **only to confirm that something is `implemented`.** Never to discover
   new claims, and a feature that only a document describes is `designed`, not `implemented`.

**Several repositories.** Read each in the order above and cite `repo@sha:path Lx-y` on every row
(`sha` = `git rev-parse --short HEAD` of that repo at read time). List every repo in the plan's
`source-ref`. Never merge two repos' facts into one row.

**What a row is.** One atomic fact per row, in the source's own wording: `id` (F01…), `값` and `단위`
when it is a number, `종류` (`measured | doc | code | estimate | owner | derived`), `상태`
(`implemented | designed | planned | n/a`), `출처`, `as-of`, `독자` (`exec,user,dev`).

- A **derived** row (hours × people, a ratio) writes the formula in `사실` and cites its input F-ids;
  it is only as strong as its weakest input.
- An **owner** row records who said it and when (`owner@YYYY-MM-DD 이름`). Ask for these directly
  (cost of the status quo, manual hours, headcount, the ask, who decides and by when) — they are
  usually the numbers a pitch needs and no file has them. Do not let the owner's number slide into a
  `measured` row.
- An **estimate** is a guess that nobody measured.

**Open questions are rows, not guesses.** Anything a section needs that no source or owner statement
covers becomes a `Q` row (`질문`, `필요 섹션`, `누구`, `open`). Never fill it from general knowledge.
When it is answered, add the `F` row (`owner`, or the document that answers it) and set the Q row's
status to `→F12`. A pitch also keeps `C` rows (the claim you want to make, its F-ids, its limits).

**The term sheet lives in the same file.** An optional `## T — 용어` table
(`| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |`, template: `facts.template.md`) records the one word the document uses
for each concept. You fill it in Step 1, before any payload; the exit gate (`terms-consistent`) holds the document to it.

**Rules that travel with the ledger** (they bind Step 4 and `/build`):

- A claim with no F-id is dropped.
- `estimate` → the number is written with "(추정)"; `owner` → "(소유자 진술)". The marker stays wherever
  the number is repeated (hero token, tile, chart, table).
- `designed` and `planned` facts are never written in the present tense as if they exist today.
- **A number's `[Fnn]` is how the document binds it.** `/build` writes each citation as `data-f="Fnn"` on the element that shows
  the number, and the gate fails a numeral the cited row does not state (its `값`, or a number in its `사실` sentence). So cite the
  row the number actually comes from — a number that combines two facts cites both (`[F06][F07]`) — and give a ratio's row both
  its `값` and the inputs in its `사실`. A `designed`/`planned` row's number needs the planned wording beside it
  (`planned:unmarked` warns otherwise).

### Step 1 — Take stock

With the ledger in hand, note for later use:

- whether there is a current/old state described anywhere that a target/new state is meant to
  improve on (this becomes the `has-as-is` header value),
- whether the ledger contains measurable numbers (this becomes `metrics-mode`),
- roughly how many distinct topics of substance the facts support (feeds the TOC count below) and
  **how many products or systems the document has to introduce** (each one needs its own section set — Step 3),
- **the term sheet** — fix it now, in `facts.md` under `## T — 용어`, before a single payload is written.
  The sources call one thing by several names (an ADR says *Task Request*, a manual says *작업 요청*, a ticket says
  *일감*); a document that repeats all of them reads as several different things, and the reader cannot tell. For every
  concept the document names:
  1. **One term per concept.** Pick the word (`용어`), write what it means in one plain sentence (`뜻`), and list the
     other names the sources use as `쓰지 않을 말`. The document never uses a banned variant.
  2. **Audience-appropriate words.** An executive or user document uses everyday words (할 일 목록, 시험용 데이터,
     사내 통합 로그인) and keeps an internal token only where the reader will meet it on screen; a developer document
     keeps the engineering token. The audience comes from Step 2.6 — if that step changes it, redo the words.
  3. **Product and system names are defined once.** The `처음 나올 때` form carries the definition
     (`FeedbackOps(VOC·작업 운영 도구)`, `작업(Task)`); after that the bare name. A term the reader already knows needs no
     gloss: its `처음 나올 때` is the term itself. **The hero thesis counts as the first occurrence**, so write the plan's
     `thesis` with the first-use form of every sheet term it names (the nav labels and the document title are exempt and stay
     bare); a term the thesis does not name gets its form where `/build` first uses it (`terms:first-use` warns on a bare term
     read before its form).
  4. **No near-synonyms by accident.** Two rows that a reader could confuse (작업 / 작업 요청 / 과제) either get a
     difference in their `뜻` or collapse into one.

  **Payloads and figure-data then use only the chosen terms** — never a banned variant, even in notes — because `/build`
  copies words from the plan. The sheet is optional for a short single-product note, expected whenever the document names
  two or more products/systems or the sources disagree on names, and shown to the user with the TOC at Gate 1.

### Step 2 — Detect greenfield / metric-less topics up front

Before drafting the TOC, decide:

- **No current state (greenfield).** If the source describes a brand-new policy/system/product
  with nothing to contrast against, do not invent a fake "before." Plan sections the way a
  greenfield topic is planned: target-structure or principles→mechanism content instead of a
  before→after section (mirrors the style's authoring-guide §4.4). Set `has-as-is: false`.
- **No or partial metrics.** If the ledger has no measurable numbers, or only some, do not
  fabricate a chart's worth of figures. Plan to drop any standalone Data/Metrics section content
  and instead note where a deferred-quantification footnote belongs (mirrors the style's
  authoring-guide §4.6 — there is no dedicated Data/Metrics page type). Set `metrics-mode` to
  `absent` or `partial` accordingly; only use `present` when the ledger genuinely carries
  measurable figures. (`estimate` and `owner` numbers count as present but are always marked.)

Carry these decisions into every later step — they change what questions get asked and what
`payload`/`figure-data` content is legitimate to plan.

### Step 2.5 — Declare the narrative lens

Before drafting the TOC, choose and record one narrative lens:

- `architecture-first` — the outline explains structure first; use cases are supporting examples.
- `use-case-first` — the outline follows actors/scenarios/journeys first; architecture supports the journey later.
- `decision-first` — the opening states the decision context, recommendation tradeoffs, or open questions; this is decision framing, not a hidden approval request.

Ask the user only if the source or request is ambiguous enough that the lens would change section
order. If the user later asks for "more use cases", "decision-maker framing", "more detail", or
similar expansion that would change this lens, stop and ask whether to reorganize the outline or
only add examples inside the existing outline.

### Step 2.6 — Pick the document recipe and the audience

**Recipe.** Match the request words to a recipe in `core/components.md` §5 and record it as the
`doc-type` header: `explainer` (설계·구조·아키텍처·소개), `status-report` (보고·현황·주간·진행 상황),
`proposal` (결정·승인·제안), `feature-guide` (사용법·화면·기능 소개), `analysis` (분석·회고·지표),
`pitch` (필요성·투자·예산·도입 설득). The recipe gives a default section list *and* a default shape
per section — use it as the TOC checklist in Step 3, dropping rows the source cannot support. If two
recipes fit equally, ask once.

**Audience — one plan per audience.** Record `audience` (`executive | user | developer`) and a
one-line `reader-action` (what the reader decides or does after reading). A different audience is a
different plan file written from the **same** `facts.md` (use the ledger's `독자` column to pick the
rows); do not stretch one plan to serve everyone.

- `executive` — open with `headline-metric` or `decision`; end with `decision`; avoid `code-structure`,
  `interaction`, `entity-relations`, `rule-table`. The audience does not cap the section count (Step 3: the count
  follows the content; the validator warns only above 12 numbered sections and suggests act grouping). The plan
  validator warns on each of these.
- `user` — what they can do and where (`actor-goals`, `ui-surface`, `role-handoff`), usually
  `use-case-first`.
- `developer` — structure, interaction, state and data model are fair game, usually `architecture-first`.

If the audience is not obvious from the request, ask once (it changes the outline).

### Step 3 — Propose the TOC (Gate 1)

Propose a full section sequence as noun-phrase titles only (no content yet) — a table of
contents draft. Use a generic narrative arc as a checklist — roughly context → problem →
proposed direction → detail/deep-dive → validation → outcome → risk → plan → reference — but
adapt freely to what the source actually supports; don't force a beat the source doesn't back.
This arc is a content-sequencing aid only, not a page-type taxonomy — which page type each
section renders as is decided later at `/build` time from the chosen style's own skeleton (see
its authoring-guide).

- **Validate the count — the section count follows the content, not a quota.**
  - A document on one subject usually lands at roughly 6–9 numbered sections plus a reference appendix.
    Below that, merge thin rows — don't pad with a section the source can't support.
  - **When the document covers several products or systems, give each its own section(s):** what it is, who uses it,
    what works today, what is planned (the "system introduction" block of recipe F in `core/components.md` §5 applies
    to any recipe), and give the relationship or migration between them a section of its own. One thin paragraph for
    all of them is the failure this prevents — do not squeeze products together to stay under a number.
  - Above roughly 9, plan for act-grouped structure (dividers grouping sections into acts) and set
    `act-structure: act-grouped`; otherwise `act-structure: flat`. The audience does not change the count (an executive
    plan is warned only above 12 numbered sections, with the suggestion to group into acts); it changes which
    sections and shapes the plan uses.
- Check the sequence against the narrative lens from Step 2.5. A `use-case-first` lens must put
  actors/scenarios/journey before architecture detail; a `decision-first` lens must surface the
  decision context early, not bury it in the final section.
- **Decision budget.** Plan at most 1–2 sections with shape `decision`: the one section that *is* the
  request (the plan validator warns above 2). For a `pitch` the request is required and is the last
  numbered section. Sections that only lead up to the ask are classified by what they say.
- Present the TOC **and the term sheet** to the user and **stop — this is Gate 1**. Do not draft section content until
  the user has reviewed and agreed on the TOC and the words (adding, dropping, renaming, or reordering rows,
  choosing a different term, as they like). Re-propose and re-gate if they request changes.

### Step 4 — Draft each section from source

Once the TOC is agreed, draft each section's plan entry. Number the sections `## 1. 제목`,
`## 2. 제목`, … — the number is the section's id in the document (`s1`, `s2`, …). One unnumbered
`##` title (e.g. `## 부록 — 용어와 근거`) is the reference appendix (`sref`). For every section,
working strictly from the source:

- `intent` — one line: what this section is meant to convey.
- `shape` — exactly one value from `core/components.md` §1, chosen with the §2 procedure (ask its
  questions in order; first "yes" wins). Write the shape even when it is `none` or `peer-list`.
  If the section honestly needs two shapes, it is two sections — split it in the TOC. Use `risk`
  only if the source grades both likelihood and impact; otherwise `peer-list`.
- `payload` — the facts/information to place there, as structured notes, **not finished Korean
  prose**. Voice and register are decided at `/build` time (the style's authoring-guide §3.1); this
  skill only carries content. When a ledger exists, **every number and every claim cites its fact id**
  (`수작업 18시간/월 [F07]`); an estimate or owner value is written with its marker (`(추정)`,
  `(소유자 진술)`), and a `designed`/`planned` fact is phrased as designed/planned. **Write it in the term
  sheet's words only** (`용어`, never a `쓰지 않을 말`); `payload` and `figure-data` are where `/build` copies names from.
- `figure-data` — the raw values behind the figure, written in **the figure-data format of the
  shape's component** (the last column of `core/components/README.md`), so `/build` can fill the
  component's slots without re-reading source. Required for every shape whose component is a
  figure, chart, or report block **and for `text-table`**; write `none` only for `none`/`peer-list`.
  A `text-table` section is a pasted `table` filled from its figure-data, so it MUST carry
  `columns: 열1, 열2, 열3 | rows: 값 · 값 · 값 ; 값 · 값 · 값 …` (cells split by `·`, rows by `;` — every row, every cell; the
  document's table is exactly this; the plan validator rejects `none`). The format's first key is mandatory (`states:`, `lanes:`,
  `tiles:`, `columns:`, …) and keys ending in `?` are optional.
  **Stay inside the component's `@limits-x`** (the Limits column of `core/components/README.md`: layers, modules per layer, leaves
  per child, rows, options, …). The validator counts what the figure-data holds and warns above the maximum
  (`s2 (hierarchy): "분석 공간" has 6 leaves (>5)`). When a figure's counts exceed it, split the section in the TOC, group the items,
  or move the surplus to the appendix or a table — never write more than the figure can show, and never ask `/build` to raise a limit.
  An item whose ledger status is `designed` or `planned` (not built yet) gets the marker `[planned]` right
  after it — a layer module, pipeline node, tree child or leaf, timeline item, sequence ALT/OPT group — so
  `/build` draws it in the shared planned look instead of the built look (`core/components.md` §4).
  Numbers carry their `[Fnn]` here too. ASCII arrows are accepted: `->` for a request or transition,
  two hyphens followed by `>` for a response, `(self)` for internal processing.
  **Carry the connections, not just the boxes.** For flow and structure shapes the figure-data
  must name every edge: transitions with their trigger (`대기 →(제출) 검토 중`), messages with
  sender→receiver, handoffs with lane:step, layer links with how they connect, relations with
  cardinality. A list of node names with no edges is underdetermined — ask (Step 5) instead of
  guessing. This is the single biggest cause of "a pile of boxes instead of a diagram".
- `source-span` — the exact citation in the source that covers this content: a file path plus
  line range (`docs/x.md L12-40`), `repo@sha:path Lx-y`, or the fact ids (`[F03] [F07]`). Mandatory.

**Never put a number in the plan that the ledger or a source span does not carry** — `/build` prints
only numbers it finds in the plan, and the exit gate (`numbers-traced`) fails any other numeral.

### Step 5 — The source-span rule (mechanical, no judgment calls)

Apply this rule uniformly, per field, while drafting:

- **No covering span found** for something a section needs → the field is *underdetermined*.
  Do not guess or fill it in from general knowledge. Add a `Q` row to `facts.md` and put it on a
  **batched list of questions** to ask the user once the section drafts are otherwise complete
  (batch rather than interrupting after every single field).
- **Conflicting spans** — two or more parts of the source disagree on the same fact → the field
  is *high-consequence*. Never auto-pick one side. Surface the conflict explicitly to the user as
  its own question (what the two spans say, and where), and let them resolve it.
- A field with a single, unambiguous covering span needs no question — draft it directly and
  cite the span.

Ask all batched and high-consequence questions together after drafting, get answers, then update
the affected section entries. **An answer is recorded as a new `F` row** (`종류: owner`, source
`owner@date 이름`) and the Q row is closed (`→Fnn`); the section then cites that F-id. Do not cite
"user-clarification" as a span.

### Step 6 — Emit content-plan.md

Fill in `.claude/skills/build/content-plan.template.md` with the agreed header and section
entries, replacing every placeholder. Keep the header fields honest to what was actually
determined in the earlier steps:

- `doc-type`, `audience`, `reader-action` — Step 2.6.
- `has-as-is` — true only if a real current/old state exists in source.
- `metrics-mode` — `present` / `partial` / `absent`, matching Step 2's detection.
- `act-structure` — `flat` or `act-grouped`, matching the Step 3 count check.
- `narrative-lens` — `architecture-first`, `use-case-first`, or `decision-first`, matching Step 2.5.
- `source-ref` — every source consumed, with a fingerprint (`repo@sha` or `path@mtime`), so `/build`
  can detect if the source has since changed without re-reading it.
- `title` — the hero title. `eyebrow` — optional: the hero eyebrow pill, printed verbatim (e.g.
  `PROPOSAL · 관리자용`); leave the key out and `/build` writes `<DOC-TYPE in English caps> · <audience in
  Korean>` (`labels: ko` documents: `<문서 종류> · <대상>`) — nothing else. `thesis` — the one-sentence hero thesis (may end with a citation such
  as `[F03]`); it may be written in **any register** (notes, `~합니다`, bare nouns) — `/build` always
  renders the page in the style's register (`~한다`), so don't spend effort on polish here.
  `cover-tokens` — 2–4 hero tokens, `값=라벨 [cite]` separated by `;`, **each with a
  citation** (`[F07]`, or a source span such as `[PRODUCT.md L12]` when no ledger exists). `/build`
  fills the hero **only** from these, so a framing token with no source is not planned. A token need
  not be a number (`MVP=출시 단계 [F02]`).
- `facts` — path to `facts.md`, relative to the plan (required for `pitch`; its `## T — 용어` table, when present, is enforced by the gate). `as-of` — `YYYY-MM-DD`,
  the date printed in the hero meta line. `labels` — optional `en` | `ko`: the language of the document's eyebrows, appendix
  label and component badges. Leave it out: `/build` takes `en` for `audience: developer` and `ko` for `executive` / `user`
  (an executive or user document reads `01 · 요약` and `지금 / 목표`, not `01 · SUMMARY` and `AS-IS / TO-BE`). Write it only to override.

Before presenting it, mechanically self-check the emitted plan so no placeholder or missing field
reaches the user (this is the same shape gate `/build` runs at ingest, run here first):

```
node .claude/lib/plan-schema.mjs <content-plan.md>
```

Exit `0` = shaped correctly (it also prints each section's shape — read it back as a list: a
document whose shapes are mostly `none`/`peer-list` will render as walls of text and cards; recheck
those sections with the §2 procedure), go to Step 7. Exit `1` = the CLI lists the header keys or
per-section fields still missing, unknown values, placeholders, figure shapes without their
figure-data key — fix them and re-run before Gate 2. **Treat every `WARN` line as a review item**
(too many `decision` sections, an executive plan that is too long or uses developer shapes, a wrong
opening or closing shape, a figure over its `@limits-x`): fix it, or show it to the user at Gate 2 with your reason for keeping it.
(Repo-relative path — run from the repo root; if `node` cannot find `.claude/lib/`, this skill is
running outside its repo.)

### Step 7 — Confirm before handoff (Gate 2)

Present the completed `content-plan.md` — every section's `intent`, `shape`, `payload`, and
`figure-data` — to the user for review, together with the term sheet, the open `Q` rows still in `facts.md` and the
validator's warnings. Show the shapes as a one-line-per-section list first, with the component each
implies (e.g. `05 상태 규칙 — lifecycle → state-machine`), so the user can see which diagrams the
document will carry before any HTML exists. This is **Gate 2**: do not consider the plan final, and do
not point the user at `/build`, until the user has confirmed it. If they request changes, edit and
re-present; `/build` should never have to guess at unconfirmed content.

## What this skill does not do

- It does not write final Korean (or any language's) prose — `payload` is notes, not copy.
- It does not choose a page type, a color, or a style for any section. (It classifies the content
  shape; the component follows from the shape by lookup, not by taste.)
- It does not consult or reference a specific style's design docs — the plan is style-agnostic
  by construction, referencing style concepts (if at all) only by pointer, never by re-stating
  them.
- It does not proceed without source, and it does not become a general ideation tool when source
  runs out mid-interview — if the user pivots to "what if we also did X" with nothing behind it,
  treat that new thread the same as thin source: ask for material, or park it out of scope.
- It does not compute ROI or invent a number. A derived number is a ledger row with its formula and
  inputs; a missing number is a `Q` row.

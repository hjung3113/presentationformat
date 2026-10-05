# AUTHORING GUIDE — Writing in this voice

> A reusable guide for producing scroll-style HTML explainer documents that feel authored by the same person — **whatever the subject** (a system redesign, a research summary, a process proposal, a product brief…).
> This file governs **voice, structure, content patterns, and when-to-use decisions.** For exact visual values, see `design.md`. The two are meant to be used together: this guide tells you *what to write and which device to reach for*; `design.md` tells you *exactly how it should look*.
>
> **This doc owns:** voice (incl. Korean register, §3), skeleton, the page-type registry (§4), and the color **intent→token-name** map (§5.2). The situation→figure mapping is shared by all styles in `../../core/components.md`.
> **This doc does NOT cover:** exact HEX/px values → `design.md`; the document shell + JS + naming contract → `../../core/runtime-spec.md`. Start a build from `template.dc.html`; read `README.md` for the doc map.

---

## 1. Document DNA (applies to any topic)

- **Genre:** a peer-to-peer **"direction / explainer" document**, not a slide deck. It says *"here is how we're thinking about this and where it's going,"* and explains rather than persuades. A document may be **decision-framed** when the source asks for it, but that means visible decision context / open questions / recommendation tradeoffs — not a hidden approval request dressed as an explainer.
- **Exception — `doc-type: pitch` (필요성·투자 설득).** A pitch exists to ask for something, so an explicit ask (요청) is **required**: one `decision` section, placed **last** (`../../core/components.md` §5 recipe F). That follows the same principle as above — the ask is visible and explicit, never tucked into a card. The disclaimer opener "본 문서는 승인 요청서가 아니라 …" is **not** used in a pitch. Voice and hype rules are unchanged: no exaggeration, no suspense, no verdict punchlines; an estimate is marked "(추정)", an owner's statement is marked as such ("(소유자 진술)"), and a designed or planned item is never written as if it already exists.
- **Reader:** a knowledgeable peer. Assume domain literacy → don't over-explain basics; push glossaries to a low-emphasis appendix.
- **Density:** keep the substance plus the *necessary* elaboration. Trim secondary asides, not the core. (One-sentence compression ✗ / a tight 1–2 line paragraph ✓.) Rough budgets: lead 2–4 sentences (≤760px), card body ≤3 sentences, card grids 3–6 items, tables ≤7 rows. **Quantified per-section/per-viewport budgets, focal hierarchy, column-count and arrangement rules live in `composition-guide.md`** — consult it once page types are chosen, before placing components.
- **Voice:** calm, explanatory, declarative. No drama, no suspense, no hype, no imperative punchlines. Titles describe; they don't deliver verdicts.
- **Contrastive framing is allowed and encouraged** — delivered flatly, to *scope* a claim, not to build suspense: `A가 아니라 B`, `A일 뿐 B가 아니다`, `A를 넘어 B`. The reference opens on exactly this ("본 문서는 승인 요청서가 아니라 … 실행 방향 공유 자료이다") — for explainer-type documents; a `pitch` does not use that opener (see Genre). What's banned is the *hype* version: suspenseful reveals ("놀랍게도", "X일까? 아니다"), exclamation, verdict punchlines.

---

## 2. Standard skeleton (adapt the content, keep the bones)

A document in this voice almost always follows this arc. Rename freely; keep the shape.

| Page type | Typical role | Eyebrow example |
|-----------|--------------|-----------------|
| Cover | Title + one-line thesis + a few framing stats | `PROJECT BRIEF · …` |
| Background / Overview | Why this exists; current state at a glance | `01 · BACKGROUND` |
| Problems / Findings | The issues, grouped and numbered | `02 · PROBLEMS` |
| Direction / Approach | The proposed model; **before→after**; how it works | `03 · DIRECTION` |
| Deep-dive(s) | Operational / architectural detail, subsection by subsection | `04 · …` |
| Method / Validation | How it's tested or proven | `05 · …` |
| Mapping / Outcome | problem↔fix↔effect matrix; expected results | `06 · OUTCOME` |
| Risks | Risk → mitigation | `07 · RISK` |
| Scope / Plan | Now vs later; **roadmap**; open questions | `08 · SCOPE` |
| Reference | Glossary / appendix (de-emphasized) | `REFERENCE` |

- **Section count:** target ~6–9 numbered sections + a reference appendix. Below 4, merge skeleton rows; above ~9, group into acts with a section divider (`design.md §6.2`; markup is a `<div>`, never a `<section>`) and keep nav labels short (2–4 chars). Rows commonly merge — e.g. Mapping+Outcome → one section, Scope+Open-questions → one; drop Risk/Method if not applicable. The reference ships 8 numbered + 1 reference from the 10-row skeleton.
- **Other document types.** Status report, decision proposal, feature guide, analysis and **pitch** follow the recipes in `../../core/components.md` §5 (record the id as the plan's `doc-type`); the cover, voice and page-type rules in this guide still apply. A pitch additionally requires the explicit, last-placed ask (Genre exception, §1).
- **Eyebrows:** section eyebrows are `NN · ENGLISH (UPPERCASE)` where ENGLISH is the **category** (one or two words: BACKGROUND, PROBLEMS, DIRECTION, NON-FUNCTIONAL, TESTING, OUTCOME, RISK, SCOPE, REFERENCE) — *not* a translation of the Korean title. The **cover** eyebrow is `ENGLISH TAG · 한국어 한 줄 부제` ("PROJECT BRIEF · 실행 방향 공유 자료"). Nav and on-screen labels stay Korean.
- **Titles are noun phrases** ("Current Problems", "Direction — Separation of Concerns"), never punchy sentences. The titles read end-to-end like a table of contents: a reader skimming only the headings should follow the whole story.

---

### 2.1 FeedbackOps documents (this style's common shapes)

- **Explainer / design brief** — the skeleton above (`../../core/components.md` §5 recipe A).
- **Project status report** — use recipe B, which keeps the FeedbackOps reporting pack's fixed order so
  reports stay comparable over time: 요약(`headline-metric`) → 현재 상태(`status`) → 완료한 일
  (`milestones`) → 결정·가정(`decision` or `text-table`) → 리스크·블로커(`risk`) → 다음 행동
  (`schedule`) → 근거(`text-table`). For a short update keep every section but shrink each to its
  figure plus one lead sentence.
- **Pitch (필요성·투자 설득)** — use recipe F (`doc-type: pitch`): 요약 → 현재 비용 → 원인 → 제안 구조 → 기대 효과 → 대안 비교(현상 유지 행 포함) → 전환 계획 → 리스크 → 요청(마지막, `decision`) + 근거 부록. The explicit ask is required and the "승인 요청서가 아니라" opener is not used (§1 Genre exception). Every number cites a fact id; estimates read "(추정)".
- **Domain nouns stay as the product spells them** — `VOC`, `Finding`, `Task Request`, `Task`,
  `Survey`, `Managed System`, `Reporter-facing status`, `entity_links`. Do not translate or re-case
  them; they are the vocabulary of FeedbackOps' `CONTEXT.md` and its UI.
- **Two navigation layers when drawing product screens** (`screen-map`): the global system rail and the
  selected system's sidebar are separate regions — do not collapse a bounded system into one sidebar
  item.

## 3. Voice & sentence craft

- Plain declaratives. Split long sentences in two.
- Lead with the point, then the qualifier (in a short clause or parentheses).
- Use `·` for peer enumeration ("collect · delete · transform"); `→` for transformation/flow.
- Expand an acronym once, then abbreviate.
- **1–2 bold emphases per paragraph, max.** Bold only true keywords.
- When a number matters, bold it ("organized into **six groups**").
- Keep parallel structure across siblings: items in the same grid should be similar length and grammatical shape.

### 3.1 Korean register (mandatory — this is where same-author lives)

The output is Korean technical prose; these morphology rules carry more of the fingerprint than anything in English. The reference uses them without exception.

- **종결어미 = 문어체 평서문 `~한다/~된다/~이다` only.** Never `~합니다/~입니다/~해요`. Body, leads, risk text all end in `~다`.
  ✓ 책임을 분리**한다**. / 신뢰도와 직결**된다**. ✗ 책임을 분리합니다.
- **Two registers by surface.** Full `~다` sentences for leads / body / risk descriptions; **개조식** (telegraphic — 조사 dropped, ends on a noun) for chips, node sub-labels, roadmap bars, pills, footnote tails.
  Card body "…격리**한다**." → its pill "변경 영향 격리". Footnote "추후 보강 **예정**".
- **AS-IS pain = flat capability gap**, never emotive. Use `…하기 어렵다`, `…하지 못해 …`, `…이 낮다`, `…에 의존한다`. Avoid 심각/치명적/엄청난.
- **`·` (가운뎃점) joins peer nouns with NO surrounding spaces:** `수집·삭제·가공`, `구조적·운영적 부채`, `정규화·보정·병합`. Use it densely. (Spaces around `·` appear *only* in the `NN · ENGLISH` eyebrow.)
- **Title form = `핵심 명사구 — 한 줄 보조 설명`** (spaced em-dash). Phrase before `—` is the topic; after is a verdict-free gloss: "개선 방향 — 책임 분리", "처리 흐름 — 수집·가공 분리".
- **Acronyms: `한국어 정식어(ACRONYM)` once, then the bare acronym.** "단일 진실 원천(SSOT)" → later just "SSOT". Not English-expansion-first.
- **Keep established English engineering tokens inline, unmarked** (Job, thread, Config, diff, CI, raw, stale, upsert, Shadow Run). Don't translate, italicize, or quote them. Coin Korean only where a natural domain word exists ("따라잡기").
- **Numbers take a Korean counter and are bolded with the number:** "**6개** 그룹", "**50종 이상**", "**1회/시간**". For a not-yet-fixed figure: capital-`O` placeholder + muted parenthetical — "**O개**의 DB 서버 (수 추후 확정)". Never flag an unknown with warn color.
- **Double-quotes `'…'` mark a plain-language gloss or guiding question** dropped into terse 한자어 prose: "'어디까지 처리했는지'를 파악", 정책은 '무엇을' / 메커니즘은 '어떻게'. Quotes are never emphasis (emphasis is bold).
- **Problem-card headings = 조사-free noun stack ending in a neutral evaluative noun** (미흡/비효율/부담/난이도/수작업): "기준정보 설계·활용 미흡". A noun, not a sentence, no adjectival drama.
- **Lead rhythm:** a lead may run one long architected sentence (stacked clauses, commas, em-dash) resolving on a single `~한다`; keep card/figure prose to 1–2 short sentences. The flowing-lead ↔ clipped-card contrast is part of the voice — don't uniformly short-chop.
- **Footnotes** (`*` prefix, muted grey) do one of two jobs and stay to one sentence: (a) explain a figure's encoding ("막대의 길이·위치는 …를 나타낸다"), or (b) defer scope with a noun-ending tail ("추후 보강/확정 예정"). End an in-progress document with a closing disclaimer line above a `border-top` — the caveat voice is deliberate, not a hedge to delete.
- **Glossary line = `용어 — 정의`**; the definition ends nominally (메움/정렬/관리) and packs paired senses with bare `vs` / `+`: "표준/비표준 로그 — 표준 스펙 준수 로그 vs 설비사 자체 양식 로그(변환 필요)".

---

## 4. Content patterns by page type

> Match the page's *job* to its density, structure, and devices. (Visual values: `design.md` §6.)

### 4.1 Cover
Write: an eyebrow tag, a noun-phrase title (1–2 lines), one paragraph stating the thesis, an optional one-line "purpose of this doc" note, and 3–4 **framing tokens** (number + 2-line label). Nothing else. No bullet lists. A framing token need not be a number — when the topic has no metrics, use a 1–2-char word (`MVP`, `단계`, `Phase`) in the display-numeral slot. Pick 4 tokens that frame the doc (scale · scope · stage · approach). The hero text — title, thesis, tokens, date — comes only from the plan's `title` / `thesis` / `cover-tokens` / `as-of` header; never invent a hero token (a token with no source is dropped, not decorated).

### 4.2 Background / Overview
Write: a lead paragraph that frames *why this matters* and the current state in 2–4 sentences, then either a short set of "current limitations" cards **or** a single orienting diagram (a current-state flow). Low density; let it breathe. Background may carry a short (≤4) **thematic** limitations summary; Problems (next page) expands the same themes into **enumerated** numbered detail. Keep Background thematic, Problems enumerated — the overlap is by design, not duplication.

### 4.3 Problems / Findings
Write: a one-line lead that says how many groups, then **numbered** items (number chip + heading + 2–4 line description) in a 2-column grid. Each item is self-contained. This is the evidence base for "AS-IS" — keep it factual, not alarmist.

### 4.4 Direction / Approach
The heart of the document. Write: a short lead, then the **before→after comparison** as the centerpiece, then concise component/role descriptions (one line each is fine), then a **process diagram** (flow or UML activity) for anything with steps or branches. Prose here can be denser, but always pair structure with a diagram.

> **When there is no AS-IS (greenfield topic).** A brand-new policy/system/product has no current state to contrast, so the before/after panel and the slate/red half of the palette go dormant. Substitute the centerpiece with a **target-structure diagram** or a **principles → mechanism** flow. The identity still holds through the surviving signatures: Inter·Pretendard headings, the single Samsung-blue accent, figure panels, the calm `~한다` voice, text→diagram rhythm. Don't fabricate a fake "before" just to use the panel.

### 4.5 Deep-dive sections
Write each subsection as a consistent unit: **sub-heading → explanatory paragraph → figure panel with its diagram.** Same order every time. If a point is diagrammable (a flow, a contrast, a hierarchy, a schedule), diagram it; don't leave it as prose.

> **"Diagram if diagrammable" means *if*, not *always*.** Enumerated lists of peer items (problems, risks, open questions, glossary) are card grids or tables with **no** diagram — the reference deliberately leaves §2 Problems and §7 Risks diagram-free. A diagram is required only for flow / contrast / hierarchy / schedule / quantity.
> **Layout variant:** the top→below order may become **text-left / diagram-right** in a `1fr 1fr` grid when the diagram is tall and narrow (the reference does this for the current-state flow and the scenario cards). Side-by-side is sanctioned, not a violation.

### 4.6 Method / Validation
Write: a lead on the overall strategy, make the single most important mechanism a diagram (e.g. an input→two-outputs→diff comparison), and list the rest as compact cards.

> **No or partial metrics.** If the topic has no measurable numbers yet, **drop the standalone Data/Metrics page** rather than faking a chart. Defer quantification with a `*` muted footnote ("정량 지표는 측정 가능한 항목을 선별해 추후 보강 예정") and use `O`/`OO … (추후 확정)` placeholders for known-unknowns. For a single distribution with no baseline, use the single-series chart variant (`design.md §5.5`), not a before/after.

### 4.7 Mapping / Outcome
Write: a 3-column matrix (e.g. problem / fix / effect). Then split outcomes into "near-term" vs "end-state" using a highlight card and a dark summary card for contrast.

### 4.8 Risks
Write: risk cards with a left blue accent border — each = risk name + (muted) description + `→` mitigation. Keep symmetrical. Use the `risk-matrix` component only when the source grades both likelihood and impact (`../../core/components.md` §2 #6); never invent grades.

### 4.9 Scope / Plan
Write: paired "Now (MVP)" highlight card + "Later" outline card, then a **roadmap/Gantt** encoding *when × how-much*, then an open-questions table (item / current direction / needs-decision). If the document has a decision ask, it must appear as a visible **decision block** or open-question table in this section or the opening decision-framed section. It must never live only inside a peer mini-card. A document carries at most 1–2 `decision` sections.

### 4.10 Reference
Write: compact two-column term lists, muted styling, at the very end. Short definitions only.

---

## 5. Decision tables

### 5.1 Situation → figure (shared contract)

**Use `../../core/components.md`.** It holds the closed list of content **shapes** (with Korean signal
words), the first-"yes"-wins classification procedure, the shape → component table, the paste/fill
rules, and the document-type recipes. It is the same for every style, so this guide no longer keeps
its own copy. Build each figure by pasting this style's `components/<component>.html` (index:
`components/README.md`, rendered: `components.gallery.dc.html`) — never hand-assemble a diagram the
library already has.

Still diagram only what is diagrammable: a section of shape `none` gets a lead (and at most one
callout), and peer items (`peer-list`) stay a card grid. But a section whose shape is a flow,
structure, lifecycle, interaction, schedule, or quantity **must** carry its component — the exit gate
fails it otherwise.

Devices outside the component library (visual specs in `design.md`). They are **support only —
never a section's main figure**: a section whose shape requires a component fails `plan-shapes` if one
of these stands in for it.

| Content | Device | `design.md` |
|---|---|---|
| One principle to imprint | Pull quote | §4.10 |
| Break a long doc into acts | Section divider | §4.12 |
| A few headline numbers between sections | Dark stat band | §4.11 |
| One or two numbers *are* the message (large) | Stat-card grid (support only; the section's figure is `kpi-row`) | §5.9 |
| Trend where the slope is the point (single series) | Area / trend chart (support only; the section's figure is `bar-chart`) | §5.11 |
| One ratio (core vs rest) | Donut | §5.12 |
| Attainment of 3–5 items, compact | Progress rings (support only; the section's figure is `hbar-chart`) | §5.14 |
| 2-D intensity (when × where) | Heatmap | §5.15 |
| Exact log/code text is the evidence | Mono log box | §5.7 |
| One optional step inside a flow | Conditional dashed box + qualifier badge | §5.3 |

### 5.2 Situation → color (intent → token name)

Map by intent; copy the **exact HEX from `design.md`** (the single source of truth — do not paste HEX here, it drifts).

| Intent | Token (see `design.md`) |
|--------|-------------------------|
| Current / legacy / problem (AS-IS) | `slate` (badge + bar) + ink body — a legacy system, or a legacy gantt bar (병행 운영), is `slate` too |
| External system (not ours, not being replaced) | neutral dashed outline (`hairline`) — not `slate`, not `warn` |
| Pain point emphasis (AS-IS) | `warn` (red on `warn-bg`/`warn-line`) |
| Semantic WARN / Don't / regression | `warn` (red) — WARN callout, Don't row, `▼` delta (`design.md §4.8`) |
| Improvement / target / key (TO-BE) | `accent` (blue) + `accent-050` |
| Key component node | key-node (`accent-050` fill, 1.5px `accent` border, `accent` text) |
| Data / store node | dashed `border` (store) |
| Conditional / optional | dashed blue on `accent-lilac` + mini qualifier badge |
| Normal / success / endpoint | `ok` (green) |
| Body text | `body` (cards / lead) |
| Headings | `ink-900` |
| Captions / footnotes | `muted-400` (prefix `*`) |
| Low-priority section | `t-eyebrow-ref` grey eyebrow, muted heading |

> **The semantic-color invariant is normative in `design.md §1.4`:** never blue in an AS-IS zone, never slate/red in a TO-BE **structural** zone. The color *is* the meaning. **Red scope:** legitimate for an AS-IS pain point *or* a semantic WARN/Don't/regression signal (`design.md §1.4-note`, `§4.8`) — never decorative, and never for a merely-unknown value (that's an ink placeholder + muted caveat).

### 5.3 Emphasis choice
- Ordinary keyword → `<b style="color:#101828">` (or `#374151`).
- "Improvement/key" keyword → `<b style="color:#1428A0">`.
- On dark backgrounds → white + translucent bottom-border highlight.
- Never underline; never italicize for emphasis.

---

## 6. Consistency checklist (does it feel "same author"?)

This is the **content/voice** pre-ship list. For visual reproduction, also run `design.md §9`.

1. [ ] Section eyebrows `NN · ENGLISH` (category, not translation); cover eyebrow `ENGLISH · 한국어 부제`; titles all noun phrases (`핵심구 — 보조설명`).
2. [ ] Reading titles only tells the whole story, like a TOC. ~6–9 sections + reference.
3. [ ] Every section lead is 16px/1.85, max-width 760; lead flows long, cards stay short.
4. [ ] **Korean register (§3.1):** all body in `~한다` 문어체 (no `~합니다`); chips/labels 개조식; AS-IS pain as flat capability gap.
5. [ ] AS-IS = slate + red, TO-BE = blue — never violated. Red only for AS-IS pain or a semantic WARN/Don't/regression signal; never decorative, never for an unknown value.
6. [ ] Every section has a shape (`../../core/components.md`); figure shapes carry their pasted component (`data-component`, no `⟦…⟧` left); **enumerated peer lists (problems/ungraded risks/glossary) are NOT diagrammed** — card grids/tables instead.
7. [ ] Diagrammed subsections are "text → diagram (figure panel)" — top→below, or text-left/diagram-right for tall-narrow figures.
8. [ ] `·` tight (no spaces); acronyms `한국어(ACRONYM)` once; numbers bold + counter; unknowns `O … (추후 확정)`.
9. [ ] ≤ 1–2 bold emphases per paragraph; no drama/hype; contrastive `A가 아니라 B` is OK if flat.
10. [ ] `word-break:keep-all` is on; glossary at the end, de-emphasized; closing disclaimer if in-progress.
11. [ ] **Page type matches its job** (cover sparse, deep-dive dense, reference muted — §4).

---

## 7. Quick start for a new document
1. Declare the **narrative lens**: `architecture-first` | `use-case-first` | `decision-first`. If `use-case-first`, the first numbered sections follow actor/scenario/journey and architecture supports the journey later. If `decision-first`, the opening states the decision context and the deck proves it through tradeoffs/open questions. If `architecture-first`, use cases are examples, not the main spine.
2. Write the **title sequence first** (one noun-phrase title per section). Read them back as a TOC; revise until they tell the story alone. Aim for ~6–9 sections + reference (§2).
3. Lay out the skeleton (§2) and decide each page's **type** (§4 / `design.md` §6). If the topic is greenfield (no AS-IS) or metric-less, read §4.4 / §4.6 first.
4. **Clone `template.dc.html`** (it carries the shell + runtime JS from `../../core/runtime-spec.md`). For each section: lead paragraph → core content → **classify its shape (`../../core/components.md` §2)** → paste and fill that shape's component from `components/`.
5. Apply color/emphasis by intent (§5.2–5.3); copy exact visual values from `design.md`. Write in the §3.1 Korean register.
6. Run the §6 content checklist **and** `design.md §9` visual checklist before shipping.

### 7.1 Stop questions for structural ambiguity

Ask these only when the answer changes the outline, page type, primary device, or section budget. If the answer only changes wording, proceed without interruption.

1. Should this persuade decision-makers first, walk through user scenarios first, or explain architecture first?
2. When you say use-case centered, should the whole outline reorganize around actors/scenarios, or should examples be added inside the existing architecture outline?
3. Is the decision ask a final recommendation, an open question list, or a subtle direction-setting note?
4. For more content, should depth be added to the same sections, new sections added, or low-value overview blocks replaced with concrete scenarios?
5. Which audience is primary: executive sponsor, product/operator, developer/reviewer, or mixed peer review?
6. If this section already has a diagram, should the new material replace/annotate the diagram, become a new section, or move to appendix/reference?

# COMPONENT CONTRACT — content shape → figure component

> Style-agnostic. **No colors here** — values come from the active style. This file decides *which*
> figure a section gets; the component template decides *how it is built*; the active style decides
> *how it looks*.
>
> **This doc owns:** the closed vocabulary of content **shapes**, the shape → component mapping, the
> classification procedure, the hard-fail pairs the exit gate enforces, the paste/fill contract
> (`data-component`, `⟦…⟧` slots), and the document-type recipes.
> **This doc does NOT cover:** component geometry (→ `components/<id>.html`), token values (→ the active
> style's `design.md`), voice (→ the active style's `authoring-guide.md`), density budgets (→ the active
> style's `composition-guide.md`), the runtime shell (→ `runtime-spec.md`).
>
> **Files:** `components/<id>.html` = the structure templates (role placeholders, no values).
> `components/README.md` = generated index incl. each shape's **figure-data format**.
> The active style's `components/<id>.html` = the same component with literal values — **this is the
> file you paste from.** Its `components.gallery.dc.html` shows every component rendered.

---

## 0. The three-step rule (do this for every numbered section)

1. **Classify** the section's main claim into exactly one **shape** (§1, procedure in §2). Classify the
   *content*, not the look you want.
2. **Look up** the component for that shape (§1). Do not substitute a "simpler" one — the gate fails a
   section whose shape requires a figure that is missing (§3).
3. **Paste and fill** the active style's `components/<component>.html`: copy the
   `<div data-component="…">` block into the section under its lead paragraph, replace **every**
   `⟦…⟧`, change only the values its `HOW TO FILL` header tells you to change (§4).

If a section seems to need two shapes, it is two ideas: split it, or make one of them the section's
shape and move the other to the next section. One primary figure per idea.

---

## 1. Shape vocabulary (closed set)

`이런 내용이면` lists the signals to look for in the source/plan — words, or the structure of the facts.

| Shape | 이런 내용이면 (signals) | Component | 쓰지 말 것 (not this) |
|---|---|---|---|
| `none` | 맥락·배경 서술만 있고 항목·관계·순서·수치가 없다 | — (lead + 최대 1 callout) | 내용 없는 장식 도식 |
| `peer-list` | 동급 항목 3–6개: 문제점·발견·원칙·요구사항·등급 없는 리스크 | `card-grid` | 순서·관계가 있는데 카드로 나열 |
| `before-after` | 현재 vs 목표, 전/후, AS-IS/TO-BE, "바꾼다" | `before-after` | 카드 두 묶음 |
| `linear-steps` | 정해진 순서 3–5단계, 분기·되돌아감 없음: 절차·도입 단계 | `process-row` | 분기가 있는데 일렬 |
| `branching-flow` | 판단·조건·승인/반려·예외·재시도·여러 결말, "~면 ~, 아니면 ~" | `activity` | 일렬 단계 행 |
| `role-handoff` | 2–5 역할이 번갈아 행동, "누가 다음에", 요청→검토→실행 인계 | `swimlane` | 역할별 카드 |
| `lifecycle` | 상태값·상태 전이·라이프사이클·"~됨/~중", 무엇이 상태를 바꾸나 | `state-machine` | 단계 행 아래 상태 칩 |
| `interaction` | 시스템·서비스·사용자 사이 요청/응답/호출/API/메시지 순서 | `sequence` | 단계 행 |
| `layered-structure` | 시스템 구성·아키텍처·층/레이어·모듈 배치·연결 방식, 플랫폼·공통 기반 위에 서비스·메뉴가 탑재된다·얹힌다 | `layer-map` | 화살표 없는 박스 더미 |
| `data-flow` | 입력→처리→출력, 수집·정제·적재, 근거→판단→실행, 합류·분산 | `pipeline` | 단계 행 |
| `hierarchy` | 상위·하위 소속, 정보 구조(IA)·메뉴 트리, 조직, 분류 체계 ("메뉴"라는 말만으로는 계층이 아니다) | `tree` | 계층 맵 |
| `entity-relations` | 엔티티·테이블·도메인 객체 간 관계, 1:N, 참조, 소유 vs 링크 | `er-relations` | 관계 이름 없는 칩 |
| `code-structure` | 클래스·인터페이스·상속·구현, 속성·메서드 | `class-diagram` | 트리 |
| `hub` | 하나의 중심(링크 테이블·통합 계층·게이트웨이)이 여럿과 연결 | `hub-spoke` | 표 |
| `actor-goals` | 사용자 유형·역할별로 할 수 있는 일, 기능 범위, 유스케이스 | `use-case` | 기능 카드 |
| `ui-surface` | 화면 구성·영역·"어디서 무엇을 누르나", UI 원칙, 목록+상세 | `screen-map` | 원칙 카드만 |
| `forbidden-path` | 금지된 변환·지름길 + 대신 가는 정식 경로 | `forbidden-path` | 각주 경고만 |
| `capability-matrix` | 역할×권한, 객체×소유자, 대상×기능의 허용/불가 | `matrix` | 동급 카드 |
| `option-compare` | 대안×기준 비교, 어느 안이 무엇을 충족하나 | `matrix` | 서술 카드 |
| `rule-table` | 여러 조건 조합 → 결과(포함/제외/공개 여부 정책) | `decision-table` | 순서도 |
| `text-table` | 행·열 모두 의미, 칸마다 짧은 문장: 문제↔해결↔효과, 미정 질문 | `table` | 카드 |
| `decision` | 결정 요청·승인 필요·선택지와 권고·"언제까지 누가 정하나" | `decision-block` | 작은 카드 안에 숨긴 질문 |
| `risk` | 리스크 + 가능성·영향 두 등급을 출처가 모두 매긴 경우, 대응책 | `risk-matrix` | 등급을 지어낸 매트릭스 |
| `status` | 워크스트림·팀별 현재 상태(정상/주의/차단/완료), 진척 | `status-board` | 문단 |
| `milestones` | 날짜가 붙은 사건: 완료 이력·현재·다음 일정 | `timeline` | 단계 행 |
| `schedule` | 기간에 걸친 작업 계획, 겹침, 로드맵, MVP/이후 범위, 이관·병행·컷오버·전환 일정 | `gantt` | 날짜 목록 |
| `headline-metric` | 숫자 1–4개 자체가 메시지, 증감, 목표 대비, 현재 방식의 비용·손실·수작업 시간·건수 | `kpi-row` | 차트 |
| `quantity` | 항목별 크기 비교(≤8), 유형별 건수 | `bar-chart` | 표 |
| `trend` | 기간에 따른 변화, 월별·주별 추이 | `bar-chart` | 시점 하나 수치 |
| `share` | 전체 중 비율, 구성비, 점유 | `stacked-bar` | 여러 조각 파이 |
| `progress` | 항목별 진척률·달성률·커버리지(목표 대비) | `hbar-chart` | 체크리스트 카드 |
| `ranking` | 이름이 긴 항목 여러 개의 크기 순위, 상위 N | `hbar-chart` | 세로 막대에 긴 라벨 |

Also available without a shape (support blocks, never a section's primary figure): `callout`
(one-sentence aside: KEY/OK/WARN/NOTE).

**Two lifecycles that must not auto-map** (e.g. internal status vs user-facing status): shape
`lifecycle`, two `state-machine` components stacked, each with its name badge, plus one `callout`
(WARN) stating "자동 연동 없음".

**Signal-word notes.** "메뉴" alone does not imply `hierarchy`: a platform that menus or services are
*mounted on* (플랫폼·공통 기반·탑재·얹힌다) is `layered-structure`; only parent/child membership (an IA
tree, an org chart, a taxonomy) is `hierarchy`. A claim made of costs, losses, manual hours or counts
(비용·손실·수작업 시간·건수) is `headline-metric`; a migration claim (이관·병행·컷오버·전환 일정) is
`schedule` — the `gantt` has a `legacy` bar and a `cutover` milestone for it.

---

## 2. Classification procedure (first "yes" wins)

Ask in this order. The order resolves overlaps (e.g. an approval flow that also has roles).

| # | Question | Yes → shape |
|---|---|---|
| 1 | Is this section **the request itself** — the ask the reader must answer? (A section that only leads up to the ask is not; classify it by what it says.) | `decision` |
| 2 | Is the point that some conversion/shortcut is **forbidden**, with an allowed alternative? | `forbidden-path` |
| 3 | Is it the **current status** of several workstreams? | `status` |
| 4 | Is it **dated events** (done / now / next)? Work **spanning periods**? | `milestones` / `schedule` |
| 5 | Is the claim **a number**? 1–4 headline numbers → `headline-metric`; change over time → `trend`; parts of a whole → `share`; % toward a target → `progress`; sizes of ≤8 items → `quantity`; long-label ranking → `ranking` | (as listed) |
| 6 | Is it about **risks**, and does the source grade **both** likelihood and impact for each? (Only one grade, or none → skip to #16 `peer-list`; never invent grades.) | `risk` |
| 7 | Does an object move through **named states**? | `lifecycle` |
| 8 | Do **systems/participants exchange requests and responses** in order? | `interaction` |
| 9 | Do **2+ roles take turns** and "who acts next" matters? | `role-handoff` |
| 10 | Does the flow **branch** (conditions, approve/reject, retries, several endings)? | `branching-flow` |
| 11 | Is it **current vs target**? | `before-after` |
| 12 | Is it **ordered steps** with no branches? | `linear-steps` |
| 13 | Is it **structure**? layers + connections → `layered-structure`; inputs → processing → outputs → `data-flow`; parent/child → `hierarchy`; one center many links → `hub`; objects + relations/cardinality → `entity-relations`; classes/inheritance → `code-structure` | (as listed) |
| 14 | Is it **who can do what** (actors → functions)? → `actor-goals`. **Where on screen**? → `ui-surface` | (as listed) |
| 15 | Is it a **grid of verdicts**? ✓/✕ per row×column → `capability-matrix` (roles/objects) or `option-compare` (alternatives); conditions → outcome → `rule-table`; sentences per cell → `text-table` | (as listed) |
| 16 | Is it **3–6 peer items** with no order or relation? | `peer-list` |
| 17 | None of the above | `none` |

**Budgets and rules.**
- **`decision`: at most 1–2 sections per document** — the request itself, plus at most one recorded decision.
  The plan validator warns above 2. A pitch or proposal where every section "asks for approval" is
  one `decision` section at the end; the others are classified by their content.
- **`risk` only when the source grades both likelihood and impact.** Otherwise use `peer-list`
  (a card per risk with its mitigation). The same rule applies wherever a recipe below defaults to `risk`.

**Tie-breakers.** Roles *and* branches: if the reader must see who acts → `role-handoff` (put the
decision node inside the lane); if the reader must see every ending → `branching-flow`. Structure *and*
flow: whatever the section **title** promises wins; the other becomes the next section.

---

## 3. Hard-fail pairs (enforced by the exit gate when a plan is supplied)

`verify-doc --plan` maps the plan's sections to the document's `<section>`s in order and checks that
each section whose shape is not `none` contains a `data-component` the shape allows:

- every shape → exactly the component listed in §1 (`trend`/`quantity` → `bar-chart`; `progress`/
  `ranking` → `hbar-chart`; `capability-matrix`/`option-compare` → `matrix`);
- a section whose shape requires a figure but contains only `card-grid`/`callout`/plain text **fails** —
  this is the "boxes instead of a diagram" failure this contract exists to prevent;
- any `⟦` left in the document (outside comments) **fails**, and so does any `⟨role⟩` left
  (`no-role-placeholders` — it means the figure was pasted from the style-agnostic `core/components/`
  instead of the active style's `components/`);
- a `data-component` value that is not a known component **fails**.

Warnings (non-blocking): fewer than 3 distinct figure components in a document with ≥5 numbered
sections; more than one third of numbered sections with shape `none`; a section with **more than 2**
main figures (the gate warns above 2 — one idea per figure). Plan-time warnings from
`plan-schema`: more than 2 `decision` sections, and for `audience: executive` more than 12 numbered
sections (group into acts — the section count follows the content, §5), a developer-grade shape
(`code-structure`, `interaction`, `entity-relations`, `rule-table`), a first section that is not
`headline-metric` or `decision`, or a last section that is not `decision`.

---

## 4. Paste & fill contract

- **Keep the root marker.** The outer `<div data-component="…">` attribute stays exactly as pasted —
  the gate and reviewers find figures by it. Do not add CSS classes (inline styles only).
- **Replace every `⟦…⟧`.** The text inside is an example, not a default. Unknown values become the
  style's placeholder (`O` + muted "(추후 확정)"), never invented facts.
- **Repeat, don't redraw.** `▼ REPEAT … ▲ /REPEAT` marks the unit to copy for more items; delete
  copies for fewer. `VARIANT` marks alternative looks (pick by meaning). `OPTIONAL` blocks may be
  deleted. Comments may be deleted after filling.
- **Only change what HOW TO FILL names.** Typically: the column count `N` in
  `repeat(N,1fr)` / `calc(100% / N)`, a `grid-column` start/end, a `width`/`height` percentage, or a
  margin from the lookup table in the header. Never edit colors, radii, or fonts in a pasted component.
- **N appears in EVERY `repeat(N,1fr)` and `calc(100% / N)` in the component** — every row, the header,
  and the lifeline/lane/period background, not just "the main grid". Change all of them together; the
  gate's `grid-consistency` check fails a component whose `repeat(M,1fr)` differs from its
  `calc(100% / N)`.
- **Percentages are slots tied to their label.** A bar's `width`/`height` slot and the value shown on
  it (`35` and `35%`) are filled with the same value; a matrix cell glyph (`✓`/`✕`/short text) is a slot
  whose color follows its shape (copy a cell of that shape).
- **Numbers come from the plan.** Every number visible in the document appears in the plan's
  `payload`/`figure-data`/cover tokens (or its facts ledger). A template example is not a value; if the
  plan has no number for a slot, use the `O … (추후 확정)` placeholder. A **number chip** (the `card-grid`
  item badge) is a bare integer — 1, 2, 3 in card order — never a `2.1` / `5.3` section.item decimal; the gate's
  `numbers-traced` reads a decimal as a number the plan never supplied.
- **Terms and first use.** A concept the plan's term sheet (`## T — 용어` in `facts.md`) names is written in one form
  only: its `처음 나올 때` form the first time the reader meets it, the bare term afterwards. **The hero thesis counts as
  the first occurrence** — a term the thesis uses carries its first-use form there; a term the thesis does not use gets
  the form where it first appears in the numbered sections (a section title counts as an appearance). **Nav labels and
  the fixed document title (the hero title and the nav brand) are exempt**: they stay bare, and neither count as a first
  use nor break the order. The gate's `terms:first-use` warns (non-blocking) when a first-use form never appears or when
  the bare term appears before it; a banned variant (`terms-consistent`) is the hard check.
- **What the gate reads in pasted figures** (`verify-doc`): `no-role-placeholders`, `palette` (with
  `--style`: every color literal must be in the style's `design.md` — no invented colors),
  `grid-consistency`, and `numbers-traced` (with `--plan`).
- **Text-safe muted ink.** Small informative text — a sub-line under a number or node, a footnote (`*`), legend and
  axis labels, a footer or field label, a state chip, the `(추정)` / `(추후 확정)` suffixes — is set in the style's
  text-safe muted role `⟨muted-text⟩` (≥4.5:1 on white). The faint roles `⟨muted-500⟩` / `⟨muted-400⟩` / `⟨muted-300⟩` are for
  decoration and disabled marks only: arrow glyphs, `—` not-applicable cells, hairlines, dashed outlines, text on a dark fill.
  Informative text in a faint role is a defect even when it looks tidy. The role's value and its measured contrast live in
  the active style's `design.md` (§1.2) — this rule is stated here once and the templates apply it.
- **Label language (`labels: en | ko`).** One document uses one label language for every fixed label — the section
  eyebrow, the appendix label, the badge and kicker text inside components. Default by plan `audience`: `developer` → `en`
  (English category labels, the engineering-doc convention); `executive` / `user` → `ko`. The plan's optional
  `labels:` header key overrides the default. Body prose, titles and nav labels are Korean in both modes.
  Every fixed component label is a `⟦slot⟧` whose example is the `en` text; under `ko` replace it with the row below.

  | Where | `labels: en` (default) | `labels: ko` |
  |---|---|---|
  | Section eyebrow (`NN · …`) | `01 · SUMMARY` — English category, upper case | `01 · 요약` — Korean category, 1–3 words |
  | Cover eyebrow when the plan has no `eyebrow:` | `PROPOSAL · 관리자용` | `제안서 · 관리자용` |
  | Appendix eyebrow · nav link | `REFERENCE` · faint link with a superscript `ref` | `부록` · a plain nav link, no mark |
  | `before-after` badges | AS-IS · TO-BE | 지금 · 목표 |
  | `decision-block` | DECISION · DUE · OWNER · IF UNDECIDED · 권고 | 결정 · 기한 · 결정 주체 · 미결정 시 · 권고 |
  | `layer-map` | LAYER A · EXTERNAL · AS-IS | 층 A · 외부 · 지금 |
  | `decision-table` | IF · THEN | 조건 · 결과 |
  | `hub-spoke` | HUB | 허브 |
  | `use-case` system box | SYSTEM · system name | 시스템 · system name |
  | `screen-map` | TOP BAR · SIDEBAR · LIST · DETAIL … | 상단 바 · 사이드바 · 목록 · 상세 … |
  | `sequence` frames | ALT · OPT · LOOP | 분기 · 선택 · 반복 |

  The labels change; the colors, geometry and the semantic split do not (a `지금` badge is still the AS-IS color).
  Never mix: an executive document with `01 · SUMMARY` eyebrows and a `지금` badge is half-converted.
- **Lookup, don't compute geometry.** Every spanning connector uses the same table: span S columns →
  `margin:0 X%` with S=2 → 25%, 3 → 16.667%, 4 → 12.5%, 5 → 10%. Gantt bars: period k starts at grid
  line k+1. Bar heights: value ÷ max × 100.
- **Placement.** Lead paragraph first, then the figure (full width). Never put the figure before the
  lead. One primary figure per section; a support block (callout or small table) may follow it.
- **A `text-table` section is a pasted `table`, filled from its figure-data.** The plan carries
  `columns: … | rows: …` (never `none`) and the table's columns and rows are exactly those. A reference or
  appendix table (`sref`, or a secondary table that follows a figure) uses the table's soft header. A body table
  holds up to 7 rows; an **appendix glossary or source table may be longer** — up to 10 rows per table, and past that
  two tables of ≤10 rows each or the table's definition-list variant (a two-column "term — definition" list that keeps
  the `data-component="table"` root). Cell variants (a muted detail line under the first-column label, several value
  lines stacked in one cell) are listed in the table template's `HOW TO FILL`.
- **Counts must match.** If the lead says "세 가지 상태", the figure shows three.
- **A not-built thing never gets the built look (cross-component rule).** Anything the source calls
  planned, designed-only, not yet built or not decided — a module, a pipeline node, a tree child or leaf, a
  timeline item, an ALT/OPT frame of messages — is drawn in the **shared planned look**: muted dashed
  outline (on the soft fill where it is a box), muted text, plus a state chip carrying the source's own word (예정·계획·
  미설계·미구현·대기). The chip is **11px bold in the text-safe muted ink** — a 9px faint badge cannot be read. Its figure-data carries the marker `[planned]` right after it. Components with the
  variant: `layer-map`, `pipeline`, `tree`, `timeline`, `sequence`, and `before-after` (a planned cell inside the
  **TO-BE** zone only — the muted dashed look is neutral, so it does not break the zone's color rule; the AS-IS zone
  has no planned things); any other figure draws a planned thing the same way. A planned thing is never given the key-node, accent or success look — passing a design off as
  an existing system is the most common overstatement a diagram makes.
- **figure-data arrows.** Flow-shaped figure-data (`sequence`, `swimlane`, `state-machine`, `activity`,
  `pipeline`, `process-row`, …) may use the glyphs `→ ⇢ ↻` or ASCII: `->` for a request or transition,
  two hyphens followed by `>` for a response, `(self)` for internal processing. The plan validator
  accepts both. Per-component markers (state `●`/`◉` and `[ok]`/`[retry]`/`[negative]`/`[neutral]`, layer
  `[key]`/`[optional]`/`[external]`/`[legacy]`, layer-or-module `[state: 텍스트]` (built, but on sample data or with a caveat — chip text is the source's own words, e.g. 가짜 데이터), swimlane `◇`/`→[라벨]`/`↓`, gantt `(legacy) + (core)`, screen-map
  `[above]`/`[below]` for the 5th–6th region, `[planned]` on layer, pipeline, tree, timeline, sequence and before-after (TO-BE) items,
  before-after `[full]` for a full-width key cell, table `{보조 설명}` / ` ¶ ` for a first-column detail line / stacked cell lines)
  are documented in each template's `@data` line and HOW TO FILL header (`components/README.md`).

---

## 5. Document recipes (intent → skeleton → shapes)

Pick the recipe from the user's request words, then adapt; record its id as the plan's `doc-type`. Each
row is one numbered section; the shape column is the **default** — reclassify with §2 when the source
says otherwise. A recipe row the source cannot support is dropped, never padded.

**Section count follows the content.** The rows are a checklist, not a quota. A document on one subject usually lands
at ~6–9 numbered sections plus the appendix; when it covers **several products or systems**, each one gets its own
section(s) — what it is, who uses it, what works today, what is planned (recipe F's *system introduction* block applies
to any recipe) — and the relationship or migration between them gets a section of its own. Above ~9 numbered sections
group them into acts (`act-structure: act-grouped`; the dividers are `<div>`s, never `<section>`s). The audience does not
cap the count: `plan-schema` warns for an `executive` plan only above 12 numbered sections, and suggests acts.

**A. 설계·아키텍처 설명서** (`explainer`) — "설계", "구조", "아키텍처", "어떻게 동작", "소개"

| Section | Shape |
|---|---|
| 배경 — 왜 필요한가 | `none` or `peer-list` |
| 현재 문제 | `peer-list` |
| 개선 방향 | `before-after` (greenfield: `layered-structure`) |
| 시스템 구조 | `layered-structure` |
| 핵심 흐름 | `branching-flow` or `role-handoff` |
| 상태 규칙 | `lifecycle` |
| 시스템 연동 | `interaction` |
| 데이터 모델 | `entity-relations` |
| 범위·일정 | `schedule` |
| 리스크 | `risk` only if the source grades likelihood and impact, else `peer-list` |

**B. 프로젝트 상태 보고** (`status-report`) — "보고", "현황", "주간/월간", "진행 상황" (follows a fixed reporting order)

| Section | Shape |
|---|---|
| 요약 | `headline-metric` |
| 현재 상태 | `status` |
| 완료한 일 | `milestones` |
| 결정·가정 | `decision` (open ask) or `text-table` (recorded decisions) |
| 리스크·블로커 | `risk` only if graded, else `peer-list` |
| 다음 행동 | `schedule` (or `text-table` for a short list with owners) |
| 근거 | `text-table` |

**C. 의사결정 제안서** (`proposal`) — "결정", "승인", "제안", "어느 안"

| Section | Shape |
|---|---|
| 결정 요청 | `decision` |
| 배경 | `before-after` |
| 선택지 비교 | `option-compare` |
| 권고안의 구조 | `layered-structure` or `data-flow` |
| 영향·리스크 | `risk` only if graded, else `peer-list` |
| 실행 일정 | `schedule` |

**D. 기능·화면 소개** (`feature-guide`) — "사용법", "화면", "기능 소개", "가이드"

| Section | Shape |
|---|---|
| 누가 무엇을 하나 | `actor-goals` |
| 화면 구성 | `ui-surface` |
| 사용 흐름 | `role-handoff` or `branching-flow` |
| 상태 변화 | `lifecycle` |
| 권한 | `capability-matrix` |

**E. 분석·회고** (`analysis`) — "분석", "회고", "지표", "원인"

| Section | Shape |
|---|---|
| 핵심 지표 | `headline-metric` |
| 추이 | `trend` |
| 구성 | `share` |
| 원인 | `peer-list` or `data-flow` |
| 개선안 | `before-after` |
| 후속 일정 | `schedule` |

**F. 필요성·투자 설득** (`pitch`) — "필요성", "투자", "예산", "도입 설득", "왜 지금", "승인 요청"

| Section | Shape |
|---|---|
| 1 요약 | `headline-metric` |
| 2 현재 비용 | `headline-metric` (problem tiles) or `text-table` (문제·영향·근거) |
| 3 원인 | `peer-list` |
| 4 제안 구조 | `layered-structure` |
| 5 기대 효과 | `headline-metric`, or `quantity` with a baseline — values marked 목표 or (추정) |
| 6 대안 비교 | `option-compare` with a mandatory 현상 유지 row |
| 7 전환 계획 | `schedule` (legacy bars + a cutover milestone for a migration) |
| 8 리스크 | `risk` only if the source grades likelihood and impact, else `peer-list` |
| 9 요청 | `decision`, always the last numbered section |
| 근거 부록 | `text-table` with a source column (the `sref` appendix) |

**System introduction block (optional).** When a pitch has to introduce more than one product or system, the reader
must understand each one before judging the proposal — a single thin paragraph for all of them is the failure this block
prevents. Give **each product its own section(s)**, placed between 3 원인 and 4 제안 구조 (or as the body of 4 when
the proposal *is* the products), each answering three questions in this order — one section per row when the facts are
rich, the three folded into one section when they are few:

| Part | Question | Shape → component |
|---|---|---|
| 무엇인가 | what is it, who uses it | `peer-list` → `card-grid` (what it contains), or `actor-goals` → `use-case` (actors and their goals) |
| 어떻게 쓰나 | how is it used, step by step | `linear-steps` → `process-row`; `role-handoff` → `swimlane` when roles take turns; `branching-flow` → `activity` when it branches |
| 지금 상태 | what works today, what is planned | `layered-structure` → `layer-map` (planned parts carry `[planned]` — the not-built rule, §4) or `status` → `status-board` (built = 완료·정상, planned = 대기) |

The **relationship or migration between the products gets its own section** after the product sections — `schedule`
→ `gantt` (legacy bar + cutover milestone) or `milestones` → `timeline` — never folded into one product's section. Each
product keeps one name (the plan's term sheet, `## T — 용어` in `facts.md`); more products means more sections, and past ~9
the document is act-grouped (one act per product is a natural split).

Pitch rules: an explicit ask is required (the one `decision`, last); every number comes from the facts
ledger (`[Fnn]`) — an estimate or an owner statement renders with "(추정)" / "(소유자 진술)", and a
`designed` or `planned` fact is never written as if it already exists. Write **one plan per audience**
(`executive`, `user`, `developer`) from the same `facts.md`. The section count follows the content (see the note
above recipe A): an executive plan may merge 1+2, fold 3 into 2 or drop 4 or 8 when the source has nothing, but never
by squeezing several products into one section; it still opens with the metrics and ends with the request. An executive or user pitch uses `labels: ko` (Korean eyebrows and component labels, see §4) and the
style template's compact hero, so the first section's lead and its first figure row are visible without scrolling.
In an act-grouped pitch the **first act divider is the style's compact variant** — a one-line band — or is omitted when
act 1 is a single summary section; a boxed divider there would push the first lead and figure below the fold. Later
dividers may be either.

Recipes set the default shape per section; the narrative lens and the source decide the final
outline.

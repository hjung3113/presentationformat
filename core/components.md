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
| `layered-structure` | 시스템 구성·아키텍처·층/레이어·모듈 배치·연결 방식 | `layer-map` | 화살표 없는 박스 더미 |
| `data-flow` | 입력→처리→출력, 수집·정제·적재, 근거→판단→실행, 합류·분산 | `pipeline` | 단계 행 |
| `hierarchy` | 상위·하위 소속, 메뉴·정보 구조(IA), 조직, 분류 체계 | `tree` | 계층 맵 |
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
| `risk` | 리스크 + 가능성·영향(등급), 대응책 | `risk-matrix` | 등급 없는 나열 |
| `status` | 워크스트림·팀별 현재 상태(정상/주의/차단/완료), 진척 | `status-board` | 문단 |
| `milestones` | 날짜가 붙은 사건: 완료 이력·현재·다음 일정 | `timeline` | 단계 행 |
| `schedule` | 기간에 걸친 작업 계획, 겹침, 로드맵, MVP/이후 범위 | `gantt` | 날짜 목록 |
| `headline-metric` | 숫자 1–4개 자체가 메시지, 증감, 목표 대비 | `kpi-row` | 차트 |
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

---

## 2. Classification procedure (first "yes" wins)

Ask in this order. The order resolves overlaps (e.g. an approval flow that also has roles).

| # | Question | Yes → shape |
|---|---|---|
| 1 | Does the section ask the reader to **decide** something? | `decision` |
| 2 | Is the point that some conversion/shortcut is **forbidden**, with an allowed alternative? | `forbidden-path` |
| 3 | Is it the **current status** of several workstreams? | `status` |
| 4 | Is it **dated events** (done / now / next)? Work **spanning periods**? | `milestones` / `schedule` |
| 5 | Is the claim **a number**? 1–4 headline numbers → `headline-metric`; change over time → `trend`; parts of a whole → `share`; % toward a target → `progress`; sizes of ≤8 items → `quantity`; long-label ranking → `ranking` | (as listed) |
| 6 | Is it about **risks** with likelihood/impact? | `risk` |
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
- any `⟦` left in the document (outside comments) **fails**;
- a `data-component` value that is not a known component **fails**.

Warnings (non-blocking): fewer than 3 distinct figure components in a document with ≥5 numbered
sections; more than one third of numbered sections with shape `none`; a section with two primary
figures.

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
- **Lookup, don't compute geometry.** Every spanning connector uses the same table: span S columns →
  `margin:0 X%` with S=2 → 25%, 3 → 16.667%, 4 → 12.5%, 5 → 10%. Gantt bars: period k starts at grid
  line k+1. Bar heights: value ÷ max × 100.
- **Placement.** Lead paragraph first, then the figure (full width). Never put the figure before the
  lead. One primary figure per section; a support block (callout or small table) may follow it.
- **Counts must match.** If the lead says "세 가지 상태", the figure shows three.

---

## 5. Document recipes (intent → skeleton → shapes)

Pick the recipe from the user's request words, then adapt. Each row is one numbered section; the shape
column is the **default** — reclassify with §2 when the source says otherwise.

**A. 설계·아키텍처 설명서** — "설계", "구조", "아키텍처", "어떻게 동작", "소개"

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
| 리스크 | `risk` |

**B. 프로젝트 상태 보고** — "보고", "현황", "주간/월간", "진행 상황" (follows a fixed reporting order)

| Section | Shape |
|---|---|
| 요약 | `headline-metric` |
| 현재 상태 | `status` |
| 완료한 일 | `milestones` |
| 결정·가정 | `decision` (open ask) or `text-table` (recorded decisions) |
| 리스크·블로커 | `risk` |
| 다음 행동 | `schedule` (or `text-table` for a short list with owners) |
| 근거 | `text-table` |

**C. 의사결정 제안서** — "결정", "승인", "제안", "어느 안"

| Section | Shape |
|---|---|
| 결정 요청 | `decision` |
| 배경 | `before-after` |
| 선택지 비교 | `option-compare` |
| 권고안의 구조 | `layered-structure` or `data-flow` |
| 영향·리스크 | `risk` |
| 실행 일정 | `schedule` |

**D. 기능·화면 소개** — "사용법", "화면", "기능 소개", "가이드"

| Section | Shape |
|---|---|
| 누가 무엇을 하나 | `actor-goals` |
| 화면 구성 | `ui-surface` |
| 사용 흐름 | `role-handoff` or `branching-flow` |
| 상태 변화 | `lifecycle` |
| 권한 | `capability-matrix` |

**E. 분석·회고** — "분석", "회고", "지표", "원인"

| Section | Shape |
|---|---|
| 핵심 지표 | `headline-metric` |
| 추이 | `trend` |
| 구성 | `share` |
| 원인 | `peer-list` or `data-flow` |
| 개선안 | `before-after` |
| 후속 일정 | `schedule` |

Recipes set the default shape per section; the narrative lens and the source decide the final
outline. A recipe row the source cannot support is dropped, never padded.

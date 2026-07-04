# content-plan — FeedbackOps 설계 브리프

source-ref:
- `/Users/hyojung/Desktop/2026/FeedbackOps/PRODUCT.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/00-product-overview.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/01-domain-model.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/04-voc-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/05-finding-insight-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/06-task-project-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/10-cross-system-workflows.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/11-entity-linking.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/12-ui-ux-principles.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/13-mvp-roadmap.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/implementation/00-architecture.md`

has-as-is: true
metrics-mode: partial
act-structure: flat

## 1. 운영 맥락 — 끊어진 피드백 루프

intent: FeedbackOps가 해결하려는 현재 문제와 제품의 목적을 제시한다.

payload:
- 피드백 접수, triage 결정, evidence 수집, 실행 추적, outcome validation이 분리 도구에 흩어져 있다.
- FeedbackOps는 이 흔적을 `entity_links`와 감사 가능한 상태 전이로 일급화한다.
- 대상 독자는 제품/개발/운영 담당자이며, "무엇을 들었고 무엇을 했는지"를 재구성하지 않도록 하는 것이 중심이다.

figure-data:
- 현재: intake, triage, evidence, execution, outcome이 분리됨.
- 목표: one workspace, canonical link graph, action queue.
- 대표 use case: 사용자 VOC 등록, 담당자 후속 결정, 리뷰어 실행 승인.
- decision-maker points: 후속 누락 감소, backlog 보호, 개선 활동의 설명 가능성.

source-span:
- `PRODUCT.md` lines 20-33
- `docs/design/00-product-overview.md` lines 5-14

## 2. 시스템 지도 — 독립 시스템과 Integration Layer

intent: VOC, Task, Survey가 독립 시스템이며 Finding/Evidence/Entity Link가 연결 계층임을 설명한다.

payload:
- Core Platform, VOC System, Task System, Survey System은 독립적으로 동작한다.
- Integration Layer는 Finding/Insight, Evidence, Entity Linking, Action Dashboard/Coverage를 제공한다.
- 시스템 간 연결은 필수 흐름이 아니라 선택 기능이다.

figure-data:
- System map tree: Core, VOC, Task, Survey, Integration, Permission/Admin.

source-span:
- `docs/design/00-product-overview.md` lines 51-88

## 3. 핵심 불변식 — 강제 변환 금지와 상태 분리

intent: 설계가 무너지지 않게 하는 해석 규칙을 짧고 강하게 정리한다.

payload:
- Survey Response는 VOC를 만들지 않는다.
- VOC follow-up은 Task를 직접 만들지 않고 Task Request를 만든다.
- Task Done은 reporter-facing VOC 해결을 뜻하지 않는다.
- Dashboard는 모든 missing link가 아니라 정책상 기대되는 follow-up gap과 next action을 보여준다.
- Managed System이 MVP scope/default/permission 기준이다.

figure-data:
- numbered invariant cards.

source-span:
- `docs/design/00-product-overview.md` lines 68-88, 119-134
- `docs/design/10-cross-system-workflows.md` lines 25-38

## 4. 도메인 모델 — 소유 경계와 표준 객체

intent: 각 시스템이 소유하는 객체와 cross-system 관계가 어디에서 관리되는지 보여준다.

payload:
- VOC System owns VOC, VOC Cluster, Reporter-facing VOC Status, Public Update.
- Finding/Insight owns Finding and Evidence Highlight.
- Task owns Task Request, Task, Milestone, execution views.
- Survey owns Survey, Survey Response, Survey Result.
- Cross-system optional/many-to-many relationships use `entity_links`; strong ownership uses direct FKs.

figure-data:
- ownership matrix and relation rule.

source-span:
- `docs/design/01-domain-model.md` lines 290-330
- `docs/design/11-entity-linking.md` lines 3-29, 226-235

## 5. 실행 흐름 — VOC에서 Task까지의 검토 버퍼

intent: 사용자가 접수한 VOC가 바로 backlog를 오염시키지 않고 검토 가능한 실행 후보로 이동하는 과정을 설명한다.

payload:
- VOC triage에서 owner, severity, category, Analytics Area, 후속 흐름을 결정한다.
- synthesis가 필요하면 Finding을 만들고, 단일 VOC의 action이 명확하면 Finding을 우회할 수 있다.
- Task Request는 backlog pollution을 막는 buffer object다.
- approval과 conversion은 별도 도메인 결정이다.

figure-data:
- flow: VOC -> optional cluster -> optional Finding -> Task Request -> approve/reject/needs evidence/link existing -> Backlog Task.
- use case A: 단일 VOC가 명확한 버그면 Finding 없이 Task Request로 이동.
- use case B: 여러 VOC/Survey 결과가 섞이면 Finding으로 evidence를 먼저 합성.
- use case C: 이미 적절한 작업이 있으면 새 Task 대신 기존 Task를 연결.

source-span:
- `docs/design/04-voc-system.md` lines 153-191
- `docs/design/05-finding-insight-system.md` lines 101-132
- `docs/design/06-task-project-system.md` lines 73-206, 207-296

## 6. Entity Links — 느슨한 결합의 단일 기록

intent: `entity_links`가 왜 canonical cross-system history인지 설명한다.

payload:
- Entity Link는 VOC, Finding, Task, Survey, Dashboard, Permission 사이의 loose coupling layer다.
- common relation types include `related_to`, `evidence_of`, `supports`, `validates`, `follow_up_for`.
- source/target type and id, relation type, visibility, creator, timestamp를 저장한다.
- 직접 FK는 primary Managed System과 강한 소유관계에 사용하고, optional cross-system 관계는 entity links로 둔다.

figure-data:
- central graph hub around `core.entity_links`.

source-span:
- `docs/design/11-entity-linking.md` lines 3-119, 226-235

## 7. UI 운영 원칙 — 빠른 리스트, 보존되는 맥락

intent: 설계가 어떤 운영 UI로 나타나야 하는지 요약한다.

payload:
- Linear처럼 빠르고 밀도 높은 운영 도구를 기본으로 한다.
- VOC는 triage, ownership, reporter update 흐름을 유지한다.
- List + Detail Panel이 운영 객체의 기본이며, linked object 생성은 현재 맥락을 잃지 않아야 한다.
- 상태와 action은 source context와 next action을 분명히 보여줘야 한다.

figure-data:
- UI pattern cards: List-first, Detail Panel, contextual create, action queues, separated status.
- use case surfaces: VOC triage views, Task Request review queue, Integration evidence/detail surfaces.
- user modes: 일반 사용자 VOC 제출·상태 확인, Developer triage·evidence 정리, Reviewer Task Request 검토, Lead coverage·outcome 추적.

source-span:
- `docs/design/12-ui-ux-principles.md` lines 18-150, 211-223

## 8. MVP 경로 — 먼저 성공시킬 루프

intent: Alpha/MVP 범위와 첫 성공 흐름을 정리한다.

payload:
- Alpha: Core/AD/Workspace, 기본 권한, VOC 등록/Triage/Inbox, Managed System Registry, Basic Task, Entity Link.
- MVP: Finding, Task Request, VOC follow-up to Task Request, Survey to Finding path, similar VOC, Action Dashboard.
- recommended first success path: user submits VOC, Developer triages, similar VOC cluster, Finding, Task Request, approval to Backlog Task, manual reporter-facing status update, Action Dashboard tracking.
- explicit exclusions include Survey Response to VOC conversion, full automatic clustering, custom workflow builder, external integrations.

figure-data:
- roadmap bands: Alpha, MVP, Later.
- decision ask: Managed System 기준 권한과 Task Request buffer를 MVP 원칙으로 확정.

source-span:
- `docs/design/13-mvp-roadmap.md` lines 7-30, 124-156

## Reference

terms:
- VOC — 사내 AD 인증 사용자가 제출한 고객/사용자 목소리
- Managed System — 피드백과 개선 업무가 귀속되는 내부 시스템
- Finding — evidence를 실행 후보로 정리하는 bridge
- Task Request — Task backlog 진입 전 검토 버퍼
- Entity Link — cross-system 관계와 이력을 보존하는 loose coupling record
- Reporter-facing Status — Task 상태와 분리된 VOC 공개 진행 상태

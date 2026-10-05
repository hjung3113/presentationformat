---
doc-type: explainer
audience: user
reader-action: FeedbackOps의 시스템 구조와 핵심 흐름을 이해하고, 자기 역할이 어느 화면에서 무엇을 하는지 안다
has-as-is: true
metrics-mode: absent
act-structure: flat
narrative-lens: architecture-first
source-ref: FeedbackOps@87948f3 — PRODUCT.md, docs/design/00-product-overview.md, docs/design/04-voc-system.md, docs/design/06-task-project-system.md, docs/design/11-entity-linking.md, docs/design/12-ui-ux-principles.md, docs/design/13-mvp-roadmap.md, docs/implementation/06-entity-linking-contract.md, docs/adr/0020-shell-taxonomy-three-route-shells-and-50px-header-rhythm.md, packages/shared/src/entity-links.ts
title: FeedbackOps 설계 브리프 — 흔적이 이어지는 피드백 운영
thesis: VOC·설문·실행·효과 검증을 하나의 거대한 워크플로로 합치지 않고, 각 시스템이 혼자서도 완결되게 두며 필요한 순간에만 근거와 실행의 연결을 감사 가능한 이력으로 남긴다 [docs/design/00-product-overview.md L5]
cover-tokens: 독립=업무 시스템 VOC·Survey·Task [docs/design/00-product-overview.md L71] ; 정본=교차 이력 entity_links [PRODUCT.md L26] ; AD=사내 인증 전용 Admin › Developer › User [docs/design/00-product-overview.md L21] ; MVP=출시 범위 Alpha → Phase 2 [docs/design/13-mvp-roadmap.md L10-50]
as-of: 2026-10-05
---
## 1. 운영 맥락 — 흩어진 피드백 흔적
- intent: 피드백 접수부터 효과 검증까지가 도구마다 흩어진 현재와, 하나의 Workspace에서 흔적이 이어지는 목표를 대비한다
- shape: before-after
- payload: 접수·트리아지 결정·근거 수집·실행 추적·결과 검증이 각각 다른 도구에 있고, "무엇을 들었고 무엇을 했나"를 사람이 손으로 재구성한다. 목표는 한 Workspace 안에서 entity_links를 정본으로 흔적을 일급화하고, 트리아지 결정을 감사 가능하게 만드는 것. 단, 하나의 거대한 워크플로로 합치지 않는다.
- figure-data: before: 접수 도구, 트리아지 메모, 근거 수집(통점: 수작업 연결), 실행 트래커(통점: 이력 단절) | after: 루트 FeedbackOps Workspace → VOC, Finding, Task Request, Task (핵심: entity_links 정본) | before-tags: 손으로 재구성, 도구마다 단절 | after-tags: 감사 가능한 결정, 교차 이력 정본
- source-span: FeedbackOps PRODUCT.md L22-33; docs/design/00-product-overview.md L5-21

## 2. 시스템 구조 — 독립 시스템과 선택적 통합 계층
- intent: VOC·Task·Survey가 각자 완결되는 시스템이고, Integration Layer가 필요할 때만 잇는다는 구조를 보여 준다
- shape: layered-structure
- payload: 최상위 탐색은 Home, My Work, VOC, Surveys, Tasks, Integration, Admin. VOC·Task·Survey는 독립 동작하고 연결은 선택. Finding·Evidence·Entity Link·Coverage·Action Dashboard는 Integration Layer에 속한다. Core Platform이 Workspace·Actor·Managed System·권한을 맡는다. MVP 접근은 사내 AD 인증만.
- figure-data: layers: 독립 업무 시스템: VOC(Inbox·Triage·Cluster), Survey(Builder·Result), Task(Request·Board) ‖ Integration Layer [key, optional]: Finding(근거 종합), Entity Link(교차 이력 정본, key), Action Dashboard(후속 공백 큐), Coverage ‖ Core Platform: Workspace·Actor, Managed System(범위·기본값), Permission ‖ 외부 시스템 [external]: Active Directory | links: 독립 업무 시스템↕Integration Layer 선택적 링크(entity_links) · Integration Layer↕Core Platform 권한 확인·범위 필터 · Core Platform↕외부 시스템 AD 인증
- source-span: docs/design/00-product-overview.md L51-87; docs/design/12-ui-ux-principles.md L18-46

## 3. VOC 트리아지 — Task까지 가지 않는 결말
- intent: 트리아지가 VOC마다 다섯 갈래 중 하나를 결정하며, Task 요청이 아닌 결말도 정당하다는 점을 보여 준다
- shape: branching-flow
- payload: 새 VOC는 Untriaged로 시작한다. 담당·심각도·분류·Analytics Area를 정한 뒤 후속 경로를 결정한다: 공개 업데이트만, Finding(여러 근거 종합 필요), Task Request(단일 VOC로 조치가 명확), 정보 요청(Needs More Information), 후속 없음(Dismissed / Not Actionable). 정보 요청은 답변 후 다시 트리아지로 돌아온다. High Severity만으로 Finding을 강제하지 않는다.
- figure-data: start: VOC 접수(Untriaged) | actions: 담당 지정 → 심각도·분류·Analytics Area | decision: 후속 경로? | outcomes: [조치 명확] Task Request(target), [근거 종합] Finding(normal), [알림만] 공개 업데이트(normal), [정보 부족] 정보 요청(normal), [조치 없음] 후속 없음 종료(negative, 사유 기록) | loop: 정보 요청 → 답변 후 트리아지 | end: 없음(모든 결말이 종착)
- source-span: docs/design/04-voc-system.md L107-181

## 4. 실행 요청 인계 — 요청자·검토자·실행 담당
- intent: VOC 후속 실행이 Task Request를 거쳐 검토자 승인 후에만 Backlog Task가 되는 역할 간 인계를 보여 준다
- shape: role-handoff
- payload: 기여자가 VOC·Cluster·Finding에서 Request Task로 실행 후보를 만든다(근거 요약 포함). Admin 또는 같은 범위 Developer가 검토한다. 승인과 전환은 별개 결정이며, Convert to Task가 제목·담당·우선순위·기한을 확정한다. 전환된 Task는 Backlog에서 시작하고 출처 Finding·Evidence 링크를 보존한다. 실행 담당은 Todo·Doing으로 옮겨 실행한다.
- figure-data: lanes: 요청자(기여자), 검토자(Admin·같은 범위 Developer), 실행 담당 | steps: 요청자:Request Task(근거 요약) → 검토자:◇ 실행할 가치?(decision) →[승인] 검토자:Convert to Task(실행 필드 확정) → 실행 담당:Backlog Task(출처 링크 보존) ↓ 실행 담당:Todo·Doing 실행 →(결과) 요청자:근거와 함께 추적(key)
- source-span: docs/design/06-task-project-system.md L71-114; docs/design/06-task-project-system.md L236-294

## 5. Task Request 상태 — 승인과 전환의 분리
- intent: Task Request가 어떤 상태를 거치고 무엇이 상태를 바꾸는지, 그리고 Task 상태와 작성자 대면 상태가 서로 자동 연동되지 않음을 보여 준다
- shape: lifecycle
- payload: 검토 큐 보기는 Pending, Needs evidence, Approved, Rejected. 행동은 Approve, Reject, Request More Evidence, Convert to Task, Link Existing Task. 승인된 요청은 전환 전까지 Approved로 남을 수 있다. 결정은 감사된다. Task 상태(Backlog…Released)와 작성자 대면 VOC 상태는 별개이며 Task Done·Released가 VOC 상태를 자동으로 바꾸지 않는다.
- figure-data: states: Pending, Needs evidence, Approved, Rejected, Converted | main: ● → Pending →(Approve) Approved →(Convert to Task) Converted[ok] → ◉ | other: Pending →(Request More Evidence) Needs evidence[retry] · Needs evidence →(근거 보완) Pending[retry] · Pending →(Reject) Rejected[negative] · Approved →(Link Existing Task) 기존 Task 연결[ok] | callout: WARN Task Done·Released는 작성자 대면 VOC 상태를 자동으로 바꾸지 않는다
- source-span: docs/design/06-task-project-system.md L53-69; docs/design/06-task-project-system.md L280-294; docs/design/04-voc-system.md L86-97

## 6. 연결 모델 — entity_links 하나로 모이는 교차 이력
- intent: 시스템 사이 관계를 각 객체가 직접 소유하지 않고 entity_links 한 곳에 정본으로 남긴다는 중앙화를 보여 준다
- shape: hub
- payload: core.entity_links는 source·target·relation_type·visibility를 저장하는 느슨한 결합 계층이다. 등록된 관계: VOC→VOC related_to, VOC→Finding created_finding·evidence_of, Survey Response→Finding generated_finding·evidence_of, VOC Cluster→Finding created_finding·evidence_of, Finding→Task Request requested_task, VOC→Task Request requested_task, Task Request→Task converted_to, VOC→Task evidence_of. 링크 해제는 이력을 지우지 않고 detached로 남긴다.
- figure-data: hub: entity_links(교차 이력의 단일 정본, detach해도 이력 보존) | left: VOC(created_finding), Survey Response(generated_finding), VOC Cluster(evidence_of) | right: Finding(created_finding), Task Request(requested_task), Task(converted_to)
- source-span: docs/design/11-entity-linking.md L1-25; packages/shared/src/entity-links.ts L122-144; docs/design/11-entity-linking.md L53-66

## 7. 금지된 변환 — 설문 응답은 VOC가 되지 않는다
- intent: 설문 응답을 새 VOC로 만드는 지름길이 금지이며, 대신 근거로 연결되는 정식 경로가 있음을 보여 준다
- shape: forbidden-path
- payload: VOC는 사내 AD 인증 사용자가 직접 제출한 목소리다. Survey 응답은 새 VOC로 전환하지 않는다(generated_voc는 금지 관계). Survey 결과는 Finding·Task Request·Task의 근거가 되고, 정책·권한이 허용하면 기존 VOC에 근거로 첨부될 수 있다(상태는 자동 변경 없음).
- figure-data: allowed: Survey Response → Finding 근거(generated_finding), Finding 근거(evidence_of), Task Request 근거, 기존 VOC 근거 첨부 | forbidden: Survey Response ✕ 새 VOC 자동 생성 (이유: VOC는 AD 인증 사용자가 직접 제출한 목소리만 담는다)
- source-span: docs/design/00-product-overview.md L71-74; docs/implementation/06-entity-linking-contract.md L31-35; docs/design/04-voc-system.md L98-104

## 8. 화면 구성 — 목록 우선 운영 화면
- intent: 사용자가 어느 영역에서 무엇을 하는지, 목록+상세 셸의 영역과 역할을 보여 준다
- shape: ui-surface
- payload: 모든 화면은 PageShell·ListShell·WorkbenchShell 중 하나다. ListShell은 툴바·목록·선택 시 오른쪽 상세 패널을 가진다(VOC Inbox, Task Requests, Findings). 전역 시스템 레일과 선택된 시스템 사이드바는 별개 층이다. 오른쪽 상세 패널은 핵심 필드·Evidence·Linked Entities·Public Update·Next Action을 담는다.
- figure-data: layout: list-detail (ListShell) | regions: ①상단 툴바: 보기 탭·필터·검색·주 행동 ②시스템 사이드바: 선택한 시스템의 보기·큐 ③목록: 조밀한 행으로 우선순위 스캔 ④상세 패널: 핵심 필드·Evidence·Linked Entities·Public Update·Next Action
- source-span: docs/adr/0020-shell-taxonomy-three-route-shells-and-50px-header-rhythm.md L17-19; docs/design/12-ui-ux-principles.md L28-61

## 9. 출시 범위 — Alpha에서 Phase 2까지
- intent: 어떤 기능이 어느 출시 단계에 들어가는지 범위를 보여 준다
- shape: schedule
- payload: Alpha는 Core·AD·Workspace, 기본 권한, VOC 등록·Triage·Inbox, Managed System Registry, Analytics Area Catalog, Basic Task, Entity Link. MVP는 Finding, Task Request, VOC 후속 → Task Request, 선택적 Survey → Finding → Task Request → Task, VOC 유사 추천, Action Dashboard 기본형. Phase 1은 VOC Cluster 후보 자동 생성, 권한 요청 고도화, Coverage 고도화, Analytics Area별 리포트. Phase 2는 자동 요약, root cause 후보, priority score, 외부 도구 연동, Executive Report. 날짜는 출처에 없다.
- figure-data: periods: Alpha, MVP, Phase 1, Phase 2 | rows: Core·권한·Managed System = Alpha–Alpha (core) · VOC 등록·Triage = Alpha–Alpha (core) · Entity Link = Alpha–Alpha (core) · Finding·Task Request = MVP–MVP (core) · Action Dashboard = MVP–MVP (core) + Phase 1–Phase 1 (planned) · VOC Cluster 자동 생성 = Phase 1–Phase 1 (planned) · 자동 요약·root cause = Phase 2–Phase 2 (planned)
- source-span: docs/design/13-mvp-roadmap.md L10-50

## 용어
- intent: 문서에 나온 FeedbackOps 용어를 짧게 정의한다
- shape: none
- payload: VOC, Finding, Task Request, Managed System, entity_links, Reporter-facing status 정의
- figure-data: none
- source-span: docs/design/00-product-overview.md L118-131

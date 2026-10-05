---
doc-type: explainer
audience: developer
reader-action: 첫 메뉴의 화면 유형·조회 선언·이동 경로를 정하고, 7단계 가이드대로 메뉴 하나를 플랫폼 위에 얹는다
has-as-is: false
metrics-mode: partial
act-structure: act-grouped
narrative-lens: architecture-first
source-ref: analytics-platform@c20074d (2026-10-05); FeedbackOps main@87948f3 (2026-10-05) — 항목별 출처는 facts.md
facts: facts.md
as-of: 2026-10-05
title: analytics-platform 개발자 안내 — 메뉴를 플랫폼 위에 얹는 법
thesis: 메뉴를 만드는 일은 화면을 처음부터 짜는 일이 아니라 선언·조회·이동 계약을 채우는 일입니다. 문맥·권한·표·차트·상태 화면은 플랫폼이 맡고, 메뉴는 자기 데이터와 화면만 맡습니다. [F089][F064]
cover-tokens: 5종=화면 유형(Page Archetype) [F047] ; 8개=권한 키 [F166] ; 54개=계약 E2E 테스트 [F235] ; 7단계=메뉴 개발 가이드 [F113]
---
## 1. 층과 의존 방향 — 메뉴가 쓸 수 있는 것
- intent: 패키지가 어떤 층으로 나뉘고 import가 한 방향으로만 흐른다는 것, 메뉴는 그중 네 패키지만 쓴다는 것을 보여 준다
- shape: layered-structure
- payload: 의존 방향은 contracts → ui·kernel → components → shell → apps이고 역방향 import는 경계 lint가 막는다 [F001][F002]. 층별 역할: contracts = URL codec·메뉴 메타·응답 envelope·PlatformAdapter 포트 [F004]; ui = 토큰·shadcn primitive, @fops/ui 재수출 [F005][F020]; kernel = Registry·전역 Context·URL·Scope·useMenuQuery·i18n [F006]; components = PlatformPage·PlatformDataTable·AnalysisChartFrame·DetailDrawer 등 [F007]; shell = AppShell·사이드바·Scope 선택기·Context Bar [F008]; apps = platform-web(조립)·platform-e2e. 메뉴 패키지는 그룹당 하나(@ap/menu-<group>, 7개)이고 contracts·kernel·components·ui 네 개만 import한다 — 메뉴끼리 import 불가, 이동은 linkTo [F011][F015]. mock-server는 개발 전용이고 Kernel·components·shell은 mock을 모른다 [F009][F016]. 경계 lint 프리셋 10개, 커스텀 규칙 5개 [F013][F014].
- figure-data: layers: 앱(조립): platform-web(Registry 조립·어댑터 주입), platform-e2e(블랙박스 계약 검사) ‖ 셸·메뉴 [key]: 셸(AppShell·사이드바·Scope 선택기·Context Bar), 메뉴 패키지 7개(@ap/menu-<group>), key ‖ 공통 컴포넌트: PlatformPage, PlatformDataTable, AnalysisChartFrame, DetailDrawer·QueryView ‖ Kernel·UI: kernel(Registry·전역 Context·URL·useMenuQuery), ui(토큰·primitive, @fops/ui 재수출) ‖ 계약: contracts(URL codec·메뉴 메타·응답 envelope·PlatformAdapter), mock-server(개발 전용) | links: 앱 ↕ 셸·메뉴 = 앱이 Registry로 메뉴를 조립 · 셸·메뉴 ↕ 공통 컴포넌트 = 메뉴는 공개 진입점만 import · 공통 컴포넌트 ↕ Kernel·UI = 한 방향 의존(경계 lint) · Kernel·UI ↕ 계약 = 포트 타입만 공유
- source-span: facts.md F001–F025

## 2. 공간·그룹·메뉴 — 사이드바가 만들어지는 방식
- intent: 사이드바가 코드가 아니라 선언(공간 → 그룹 → 메뉴 manifest)으로 만들어지고, 지금 어떤 메뉴가 화면을 가졌는지 보여 준다
- shape: hierarchy
- payload: 공간은 06 기준 셋(분석·운영 콘솔·피드백)이지만 코드에 등록된 것은 분석과 운영 콘솔 둘이고 피드백 공간은 M5(FeedbackOps 2단계)에서 등록한다 [F026][F027][F028]. 소속 공간은 그룹이 선언한다 [F030]. 그룹 7개: 분석 공간 6(운영 개요·설비관리·기준정보관리·생산성 분석·지표관리·공지·VOC) + 운영 콘솔 1(관리·감사) [F031]. manifest 17개 = 화면 13 + 계획 4(공정 마스터·레시피 마스터·Wafer Journey·공지 — 셸이 '예정'으로 표시) [F033][F034][F035]. 사이드바에 안 보이는 상세 메뉴 3개(설비 상세·실행 상세·지표 상세) [F036]. createRegistry가 시작할 때 16종 위반(id·경로 충돌, primary 1개 등)을 거부한다 [F039]. 새 메뉴 때 사이드바·breadcrumb 코드를 고치지 않는다.
- figure-data: root: 플랫폼 Registry | children: 분석 공간[운영 개요, 설비관리, 기준정보관리(화면 예정), 생산성 분석, 지표관리, 공지·VOC], 운영 콘솔 공간[관리·감사(권한·감사·활용률·레지스트리)], 피드백 공간(M5 예정)[VOC·Task·설문 화면 이전 예정]
- source-span: facts.md F026–F046

## 3. 화면 유형 5종 — 페이지의 뼈대
- intent: 모든 메뉴 화면이 다섯 화면 유형 중 하나를 고르고, 유형마다 정해진 구역과 공통 레이아웃이 있다는 것을 표로 보여 준다
- shape: text-table
- payload: Page Archetype은 5종이고 manifest의 pageType이 고른다 [F047]. Overview = 상태 요약 + 다음 행동(슬롯 summary·trend·attention·trust) [F048]; Analysis = 조건 → 시각화 → 선택 → 드릴다운 → 상세 검증(kpi·chart·annotation·breakdown·trust), 공통 레이아웃 AnalysisLayout [F049][F057]; Management = 기준정보·사용자·설정 관리(filter·table·actions·drawer·history), 공통 레이아웃 ManagementLayout(필터 레일) [F050][F056]; Catalog = 정의·버전·사용처(list·definition·version·ownership·coverage·usage·history) [F051]; Workflow = 상태 전이가 있는 객체(queue·filter·detail·timeline·comments·related) — 쓰는 메뉴도 공통 레이아웃도 아직 없고 FeedbackOps 이전의 선행 과제 [F052][F060][F062]. 견본 17개 분포: management 9·analysis 3·catalog 3·overview 2·workflow 0 [F059].
- figure-data: columns: 유형(pageType), 다루는 화면, 콘텐츠 슬롯, 공통 레이아웃 · 견본 | rows: overview · 상태 요약 + 다음 행동 진입 · summary·trend·attention·trust · 점선 뼈대만, 견본 2개 ; analysis · 조건 → 시각화 → 선택 → 드릴다운 → 상세 검증 · kpi·chart·annotation·breakdown·trust · AnalysisLayout, 견본 3개 ; management · 기준정보·사용자·설정 관리 · filter·table·actions·drawer·history · ManagementLayout(필터 레일), 견본 9개 ; catalog · 정의·버전·사용처가 중요한 객체 · list·definition·version·ownership·coverage·usage·history · 점선 뼈대만, 견본 3개 ; workflow · 상태 전이가 있는 객체 · queue·filter·detail·timeline·comments·related · 레이아웃 없음(미구현), 견본 0개
- source-span: facts.md F047–F062

## 4. 화면 한 장의 구역 — 누가 무엇을 그리나
- intent: 관리 화면 한 장을 구역으로 나눠, 셸·PlatformPage·공통 부품이 대신 그리는 것과 메뉴가 직접 채우는 것을 구분해 보여 준다
- shape: ui-surface
- payload: PlatformPage가 레지스트리 라벨·breadcrumb·즐겨찾기·전역 Context Bar·Scope 게이트·같은 응답 배너를 자동으로 그리므로 메뉴는 날짜·Scope 선택기를 만들지 않는다 [F064]. Scope가 확인되지 않으면 본문 대신 상태 화면 [F065]. 표는 PlatformDataTable(서버 페이징, 정렬, 내보내기·복사는 표가 소유) [F074][F075][F077]. 상세는 DetailDrawer가 셸의 오른쪽 고정 슬롯에 그린다 [F082]. 조회 결과는 QueryView가 ok·empty·forbidden·too_large·timeout·error를 각자의 상태 화면으로 바꾼다 [F069]. 차트는 AnalysisChartFrame(Zoom·Brush·Reset·Compare·Annotate·Export·More 툴바, 상태 층 4개) [F078][F079]. 데이터 신뢰는 DataTrustIndicator [F084].
- figure-data: layout: list-detail | regions: ①전역 Context Bar: 기간·Scope·전역 문맥, 셸이 그림 ②페이지 머리: 제목·breadcrumb·즐겨찾기, PlatformPage가 그림 ③필터 레일: 페이지 필터, ManagementLayout 슬롯 ④표: PlatformDataTable — 정렬·내보내기·복사는 표가 소유 ⑤상세: DetailDrawer — 셸 오른쪽 고정 슬롯 ⑥상태 화면: QueryView — empty·forbidden·timeout 등 결과별 안내
- source-span: facts.md F063–F088

## 5. 데이터가 오는 길 — 선언 하나, 포트 하나
- intent: 메뉴 데이터가 선언 → 훅 → 포트 하나 → 서버로 흐르고, 서버가 선언 사본으로 판정한다는 경로를 보여 준다
- shape: data-flow
- payload: 메뉴는 endpoints.ts에 defineEndpoint로 권한·적용 Context·params·assessment kind·한도를 선언하고 화면은 useMenuQuery로 읽는다 [F066][F089]. 모든 조회는 PlatformAdapter의 menuQuery 하나로 간다 — 새 메뉴 때문에 포트 메서드를 늘리지 않는다 [F090][F092]. 서버는 요청이 아니라 자기 선언 사본으로 요청 모양 → params → 권한 → Scope → 한도 … 10단계 순서로 판정한다 [F094]. 응답 envelope의 outcome은 6가지(ok·empty·error·forbidden·too_large·timeout) [F070]. 지금 서버는 mock 어댑터뿐이고 실어댑터(HTTP, #154)와 사내 FastAPI(#155)는 저장소에 없다(계획) [F100][F101]. 운영 조립은 AP_PLATFORM_ASSEMBLY로 꽂고, 운영 빌드에 mock이 섞이면 CI가 실패한다 [F098][F105]. 메뉴 쓰기(변경) 계약은 아직 없다 [F109].
- figure-data: stages: 선언[endpoints.ts defineEndpoint] → 조회[useMenuQuery, QueryView] → 포트[PlatformAdapter.menuQuery] → 서버[mock 어댑터(개발), 실어댑터 HTTP #154(계획), FastAPI #155(계획)] | arrow-labels: 권한·Context·한도 선언, endpoint·context·params, 선언 사본으로 10단계 판정
- source-span: facts.md F089–F112

## 6. 메뉴 하나 만들기 — 7단계를 다섯 묶음으로
- intent: 사내 메뉴 개발 가이드 7단계를 순서대로 보여 주고, 생성기가 해 주는 것과 사람이 하는 것을 구분한다
- shape: linear-steps
- payload: 가이드 7단계: 1 시작 전 → 2 그룹·패키지 → 3 조회 선언 → 4 화면 → 5 서버 쪽 → 6 적합성 묶음 등록 → 7 검증 [F113]. 1 시작 전: 06 §5·§29를 읽고 화면 유형·공통 컴포넌트·연결할 메뉴를 먼저 적는다 [F114]. 2 그룹·패키지: 기존 그룹이면 manifest만 추가, 새 그룹이면 사람이 GroupId·GROUPS를 먼저 넣고 pnpm gen:menu — 생성기는 파일 11개 + 앱 배선 6줄을 만들고 --remove로 되돌린다(수정 안 한 경우만), 지금 7개 그룹은 모두 패키지가 있어 생성기는 새 그룹에만 쓴다 [F115][F123][F124][F127][F128]. 3 조회 선언: endpoints.ts [F116]. 4 화면: 페이지 작성 규칙 10개 [F117]. 5 서버 쪽: 개발 중에는 메뉴 src/mock/, 실서버에는 같은 엔드포인트 id로 FastAPI 핸들러 [F118]. 6 적합성 묶음: params 표본 등록 [F119]. 7 검증: pnpm lint && typecheck && test && build, 화면이 바뀌면 dev 도구의 역할·응답 시나리오로 확인 [F121][F243]. 하지 말 것은 별도 콜아웃으로(packages/* 수정, 포트 추가, 메뉴 간 import, URL 직접 조립, 화면의 권한 판단, wall-clock 시간대 변환) [F132]–[F137].
- figure-data: steps: 1 준비(가이드 1–2단계: 화면 유형·연결 메뉴 정하기, manifest 추가 또는 gen:menu) → 2 조회 선언(3단계: endpoints.ts에 권한·Context·한도) → 3 화면(4단계: PlatformPage + useMenuQuery + QueryView) → 4 서버(5–6단계: mock 핸들러 → 같은 id의 FastAPI, 적합성 묶음 표본) → 5 검증(7단계: lint·typecheck·test·build, 응답 시나리오 확인) | callout WARN: 메뉴 작업 중 packages/* 수정·포트 추가·메뉴 간 import·URL 직접 조립·화면의 권한 판단·시간대 변환은 하지 않는다
- source-span: facts.md F113–F143

## 7. 메뉴 사이 이동 — 문맥을 들고 가는 링크
- intent: 한 메뉴에서 다른 메뉴로 갈 때 목적지 ID와 분석 문맥을 분리해 넘기는 흐름을, 구현된 hop과 계획인 hop을 구분해 보여 준다
- shape: interaction
- payload: 플랫폼의 핵심 가치는 메뉴 수가 아니라 문맥을 들고 이동하는 것이다 [F144]. 이동은 linkTo(menuId, { params, page, global, returnTo })이고 목적지 ID(params)와 분석 문맥(global)을 섞지 않는다 [F073][F145]. 목적지가 지원하지 않는 문맥은 버리지 않고 '이 화면에서 미사용'으로 표시한다 [F147]. 예시 사슬: 사이클타임 상세(P95 꼬리) → 느린 실행 표 행 → linkTo('execution-detail') → 실행 상세의 XFR·FNC·PRC 타임라인 — 여기까지 구현 [F151][F152]. 마지막 'VOC 생성(현재 문맥과 함께)'은 미구현이고 실행 상세의 버튼은 'VOC 생성(예정)'이다 [F153]. FeedbackOps로 나가는 링크는 딥링크 계약(새 탭, voc-create·voc-detail·survey-detail 3종)을 따르고, 기간·설비·Scope는 보내지 않는다(FeedbackOps 검색 스키마가 strict) [F154][F156][F157][F160].
- figure-data: participants: 사용자, 사이클타임 상세, Kernel linkTo, 실행 상세, FeedbackOps | messages: 사용자→사이클타임 상세 P95 꼬리 필터 · 사이클타임 상세→Kernel linkTo 느린 실행 행 클릭(params·page·global) · Kernel linkTo→실행 상세 목적지 ID와 문맥을 나눠 전달 · 실행 상세↻ XFR·FNC·PRC 타임라인 · 실행 상세⇢사용자 실행 근거 · 사용자→실행 상세 VOC 생성(예정) · 실행 상세→FeedbackOps 딥링크 voc-create(새 탭, 기간·설비는 보내지 않음)
- source-span: facts.md F144–F165

## 8. 권한과 Scope — 누가 무엇을 보나
- intent: 견본 역할별로 어떤 권한과 메뉴를 갖는지 비교하고, 권한 판정은 서버가 하며 Scope가 없으면 아무것도 읽지 않는다는 규칙을 보여 준다
- shape: option-compare
- payload: 권한 키는 8개(platform·equipment·master·analytics·metrics·notice·voc 조회와 console:access) [F166]. 메뉴는 manifest에 permission과 requiresScope를, 엔드포인트는 자기 데이터 권한을 따로 선언한다 [F167]. mock 역할 3개(개발 전용): viewer(현업 문의자) 4개 권한·메뉴 5개, engineer(공정 엔지니어) 7개 권한·메뉴 13개, admin(플랫폼 관리자) 8개 권한·메뉴 17개 [F169][F170][F172]. 권한 판정은 서버가 매 요청 다시 한다 — URL의 scopeId는 권한 증명이 아니고 화면의 can()은 표시 힌트다 [F175]. Scope가 null이면 '전체 사이트'가 아니라 거부 [F178]. 권한 없음과 데이터 없음은 다른 안내를 쓴다 [F174]. FeedbackOps는 역할 3개 + Managed System 범위가 권한 경계이고, 플랫폼 Scope와의 매핑은 미정 [F186][F189][F193].
- figure-data: columns: viewer(현업 문의자), engineer(공정 엔지니어), admin(플랫폼 관리자) | rows: 조회 권한(platform·metrics·notice·voc): ✓ ✓ ✓ ; 설비·기준정보·분석 조회: ✕ ✓ ✓ ; 운영 콘솔(console:access): ✕ ✕ ✓ ; 부여된 room: 부분(ICH 1개) 부분(ICH 3·CJU 1) ✓(전체) ; 접근 가능한 메뉴: 부분(5개) 부분(13개) ✓(17개) | callout KEY: 권한 판정은 서버가 매 요청 다시 한다 — URL과 화면 표시는 증명이 아니다
- source-span: facts.md F166–F193

## 9. FeedbackOps 흐름 — 문의자 상태는 사람이 바꾼다
- intent: 문의자에게 보이는 VOC 상태가 어떤 순서로 바뀌고, Task 상태와 자동으로 연동되지 않는다는 것을 보여 준다
- shape: lifecycle
- payload: 제품 흐름은 접수 → 트리아지 → 근거(Finding) → 실행(Task Request → Task) → 결과(설문)이고 연결은 entity_links가 정본 [F194]. 문의자 상태는 8단계(접수됨·검토 중·담당자 배정됨·처리 중·해결 준비 중·해결됨·다시 처리 중·종료됨)이고 담당자가 직접 바꾼다 [F196]. VOC에는 서로 독립인 상태 기계가 3개(내부 트리아지·문의자 상태·Task 상태) [F197]. 상태를 바꾸려면 공개 업데이트를 쓰거나 건너뛰는 이유를 남긴다 [F200]. 입력창은 셋(공개 업데이트·리포터 답장·내부 코멘트)이고 섞이지 않는다 [F199]. Task가 released가 돼도 문의자 상태는 바뀌지 않고 공개 업데이트 검토 후보만 생긴다 [F208]. Task Request가 백로그를 지킨다(상태 5개) [F205]. 같은 문제는 클러스터(draft → confirmed)로 묶는다 [F202].
- figure-data: states: 접수됨, 검토 중, 담당자 배정됨, 처리 중, 해결됨, 해결 준비 중, 다시 처리 중, 종료됨 | main: ● → 접수됨 →(검토 시작) 검토 중 →(담당 지정) 담당자 배정됨 →(작업 착수) 처리 중 →(공개 업데이트와 함께) 해결됨[ok] → ◉ | other?: 처리 중 →(배포 준비) 해결 준비 중 · 해결 준비 중 →(확인) 해결됨[ok] · 해결됨 →(재발) 다시 처리 중[retry] · 해결됨 →(마감) 종료됨 | callout?: WARN Task가 released가 돼도 문의자 상태는 바뀌지 않는다 — 공개 업데이트 검토 후보만 생긴다
- source-span: facts.md F194–F215

## 10. FeedbackOps 이전 — 화면은 옮기고 백엔드는 둔다
- intent: FeedbackOps가 플랫폼으로 들어오는 단계와 지금 위치, 그리고 개발자에게 무엇이 바뀌는지 보여 준다
- shape: milestones
- payload: 1단계(연결, 2026-09-26 결정 — AP@c20074d:docs/integration/repository-layout.md L79-83): 독립 앱 유지 + 공유 SSO·디자인·딥링크, 분석 공간에 내 VOC·설문 이력 읽기 — 대부분 완료, 남은 4건(#81·#84·#85·#86)은 FeedbackOps·사내 SSO 답 대기 [F216][F217][F218]. 2단계 A안(2026-10-04 결정): 화면은 menus/feedback-*로, 백엔드는 FeedbackOps 도메인 API로 유지; B(앱 통째 마운트)·C(백엔드 재작성) 기각 [F219][F224]. 5단계 계획: 범위 확인 → 남은 결정 6개 이슈화 → 플랫폼 선행 3개(쓰기 계약·Workflow 레이아웃·셸 알림 슬롯) → 프로토타입 → 읽기 → 쓰기 → Task·Milestone → 설문 [F220][F221][F222][F234]. 거친 추정 4~8주(일정 승인 아님) [F223]. 개발자에게 바뀌는 것: 디자인은 이미 @fops/ui 재수출로 공유 [F226], 쓰기 계약(If-Match·Idempotency-Key)이 필요 [F230], 인증·세션 공유 방식 미정 [F231], 라우팅·화면 규칙이 다르다(3-shell vs 5 archetype) [F232].
- figure-data: items: 2026-09-26 · 1단계 결정 · 독립 앱 + 공유 SSO·디자인·딥링크 · done ; M3 · 1단계 연결 대부분 완료 · 남은 4건(#81·#84·#85·#86)은 SSO 답 대기 · current ; 2026-10-04 · 2단계 A안 결정 · 화면은 menus/feedback-*, 백엔드는 유지 · done ; 다음 · 범위 확인·남은 결정 6개 · 사용자 확인 대기 · planned ; 그 뒤 · 플랫폼 선행 3개 · 쓰기 계약·Workflow 레이아웃·알림 슬롯 · planned ; 이후 · 프로토타입 → 화면 이전 · 읽기 → 쓰기 → Task·Milestone → 설문 · planned | table: 바뀌는 것 / 지금 / 이전 뒤 — 화면 / FeedbackOps 앱(3-shell) / 플랫폼 메뉴(5 archetype) ; 백엔드 / FeedbackOps 도메인 API / 그대로 유지 ; 쓰기 / 메뉴 조회 포트는 읽기 전용 / 쓰기 계약 필요(If-Match·Idempotency-Key) ; 로그인 / FeedbackOps 세션 쿠키 / 사내 SSO 뒤 세션 공유(미정)
- source-span: facts.md F216–F234

## 부록 — 용어·검증·열린 질문
- intent: 자주 나오는 용어, 커밋 전에 돌릴 검증, 아직 열린 질문을 한곳에 모은다
- shape: text-table
- payload: 용어: Registry, manifest, pageType, Scope, Context, PlatformAdapter, envelope, mock, linkTo, Managed System. 검증: 커밋 전 pnpm lint && typecheck && test && build, 화면이 바뀌면 브라우저, Kernel·셸·공통 컴포넌트를 바꾸면 pnpm e2e [F243]; 계약 E2E 54개는 재시도 없이 통과해야 한다 [F235][F236]; lint의 디자인 규칙 6개 [F244]. 열린 질문: facts.md Q01–Q25 중 개발자에게 직접 걸리는 것(쓰기 계약, 사용자 설정 저장 위치, Line·Site 키 등). 숫자는 모두 정적 대조값이며 실행 결과가 아니다 [F252].
- figure-data: columns: 열린 질문, 지금 상태, 정하는 쪽 | rows: 쓰기 계약 · 메뉴 조회 포트는 읽기 전용, 쓰기 계약은 소비자가 늘 때까지 미룸 · 플랫폼 ; 사용자 설정 저장 위치 · 즐겨찾기·Scope·언어·표 열이 브라우저에만 저장 · 사용자(제품 결정) ; Line·Site 전역 Context 키 · 문서는 독립 축, 코드에 키 없음 · 사용자(제품 결정) ; 엔드포인트 선언 원본 · TS ↔ FastAPI 선언 공유(#148) · 사용자 + 사내 백엔드 담당 ; 메뉴 개발 위치 · 이 모노레포 vs 별도 저장소 · 사용자 — 용어 목록과 검증 명령은 표가 아니라 정의 목록·짧은 문단으로 둔다
- source-span: facts.md F235–F252, Q01–Q25

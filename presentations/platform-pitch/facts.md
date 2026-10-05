# facts — 관리자 제안서: MARS/CLAS 운영 기반 일원화 (12주 시범)

기준: analytics-platform@c20074d (2026-10-05), FeedbackOps main@87948f3 (2026-10-05), 소유자 진술(대화, 2026-10-05).
AP = hjung3113/analytics-platform, FO = hjung3113/FeedbackOps. 줄 번호는 위 커밋 기준.

## F — 사실

| id | 사실 | 값 | 단위 | 종류 | 상태 | 출처 | as-of | 독자 |
|---|---|---|---|---|---|---|---|---|
| F01 | 플랫폼 레포 생성(첫 커밋)부터 v0.2.0 릴리스까지 걸린 기간 (2026-09-17 → 2026-10-05) | 18 | 일 | measured | implemented | AP GitHub 레포 created_at 2026-09-17, 릴리스 v0.2.0 2026-10-05; AP@c20074d:.planning/README.md L13 | 2026-10-05 | exec,dev |
| F02 | 플랫폼 단계 8개 중 1–5단계 완료, 6단계(FeedbackOps 1단계) 대부분 완료, 7단계(사내 적용) 플랫폼 준비 끝·사내 답 대기, 8단계(FeedbackOps 2단계) 방향 결정 | 5/8 | 단계 완료 | doc | implemented | AP@c20074d:.planning/README.md L9-16 | 2026-10-05 | exec,dev |
| F03 | 플랫폼 계약 E2E 테스트 수, 재시도 없이(retries 0) 통과해야 함 | 54 | 개 | code | implemented | AP@c20074d:apps/platform-e2e/tests/contracts.spec.ts (test 54개); apps/platform-e2e/AGENTS.md L26 | 2026-10-05 | exec,dev |
| F04 | 플랫폼 테스트 코드 ÷ 제품 코드 (16,796줄 ÷ 15,768줄) | 1.07 | 배 | measured | implemented | AP@c20074d 소스 줄 수 집계(테스트 파일 107개) | 2026-10-05 | exec,dev |
| F05 | FeedbackOps 테스트 코드 ÷ 제품 코드 (약 13.4만 줄 ÷ 약 9.25만 줄) | 1.4 | 배 | measured | implemented | FO@87948f3 소스 줄 수 집계 | 2026-10-05 | exec,dev |
| F06 | FeedbackOps 마일스톤 32개 중 31개 완료(닫힘), MVP 슬라이스 0–9 완료 | 31/32 | 마일스톤 | measured | implemented | FO GitHub 마일스톤; FO@87948f3:docs/implementation/08-mvp-slice-plan.md L12-19 | 2026-10-05 | exec,user |
| F07 | FeedbackOps 사용자 매뉴얼 0–12장 작성 완료 | 0–12 | 장 | doc | implemented | FO@87948f3:docs/USER-MANUAL.md L29-340 | 2026-10-05 | exec,user |
| F08 | 메뉴 3곳(지표 카탈로그·설비 마스터·사이클타임)이 CSV 내보내기를 각자 만들었고, 한 곳은 엑셀에서 한글이 깨질 수 있었다 → 표 부품이 내보내기를 소유하도록 공통화 | 3 | 곳 | doc | implemented | AP@c20074d:docs/adr/0008-table-owned-export-fixed-toolbar.md L9 | 2026-10-05 | exec,dev |
| F09 | 필터 입력을 다섯 곳에서 각자 만들고 있었다 → 공통 필터 바로 통일 | 5 | 곳 | doc | implemented | AP@c20074d:docs/adr/0016-page-filter-bar.md L8 | 2026-10-05 | exec,dev |
| F10 | 플랫폼 성공 기준: "새 메뉴가 추가될 때 플랫폼 코드를 계속 고쳐야 한다면 플랫폼 설계가 실패한 것" | — | — | doc | designed | AP@c20074d:docs/06_platform_ui_contract.md L1195 | 2026-10-05 | exec,dev |
| F11 | 메뉴 개발 규칙: 메뉴 작업 중에 플랫폼 공통 코드(packages/*)를 고치지 않는다 | 0 | 건(목표) | doc | designed | AP@c20074d:docs/integration/in-house-rollout.md L105 | 2026-10-05 | dev |
| F12 | 사내 SSO 사양(#150) 답이 선행 조건인 작업: #86(실제 VOC 이력)·#98(권한 쓰기)·#154(실어댑터)·#155(플랫폼 API). #154는 #148·#149도, #155는 사내 백엔드 담당의 구현도 필요하다 | 4 | 건 | doc | planned | AP@c20074d:.planning/README.md L78-87; docs/integration/in-house-rollout.md L25-31 | 2026-10-05 | exec,dev |
| F13 | 사내 답을 기다리는 항목: SSO(#150, SSO 담당)·인프라(#151, 인프라 담당)·전송 형식(#149)·FastAPI 플랫폼 API(#155, 백엔드 담당) | 3 | 담당 영역 | doc | planned | AP@c20074d:.planning/README.md L78-81; docs/integration/in-house-rollout.md L25-31 | 2026-10-05 | exec |
| F14 | 플랫폼 쪽 사내 적용 준비는 끝났고, 남은 일의 대부분은 사내 입력(SSO 사양·배포 환경·백엔드 합의)에 막혀 있다 | — | — | doc | implemented | AP@c20074d:docs/integration/in-house-rollout.md L7-9 | 2026-10-05 | exec |
| F15 | 모든 메뉴 데이터는 mock 어댑터로 적합성 검사를 통과했다. 사내 실서버 대상 검증은 아직 0건 | 0 | 건(실서버 검증) | doc | planned | AP@c20074d:docs/integration/in-house-rollout.md L7, L29 | 2026-10-05 | exec,dev |
| F16 | FeedbackOps 2단계 결정(A안): 화면은 플랫폼 메뉴(menus/feedback-*)로 옮기고 백엔드는 FeedbackOps 도메인 API로 유지. B(앱 통째 마운트)·C(백엔드 재작성) 기각 | A | 안 | doc | designed | AP@c20074d:docs/adr/0018-feedbackops-stage2-screens-into-platform-menus.md L3, L12-20 | 2026-10-04 | exec,dev |
| F17 | FeedbackOps 2단계 거친 추정 4~8주 — 깊이 결정 전 값, 일정 승인 아님 | 4~8 | 주 | estimate | planned | AP@c20074d:.planning/README.md L48 | 2026-09-26 | exec |
| F18 | FeedbackOps 2단계 순서: 범위 확인 → 남은 결정 이슈화 → 플랫폼 선행 작업 → 프로토타입 → 읽기·쓰기·Task·설문 화면 이전 | 5 | 단계 | doc | planned | AP@c20074d:.planning/README.md L40-46 | 2026-10-05 | exec,dev |
| F19 | FeedbackOps 1단계(독립 앱 + 공유 SSO + 딥링크, 내 VOC·설문 읽기)는 대부분 완료. 남은 4개는 FeedbackOps·사내 SSO 답 대기 | 4 | 건 남음 | doc | implemented | AP@c20074d:.planning/README.md L14; docs/adr/0018-feedbackops-stage2-screens-into-platform-menus.md L8 | 2026-10-05 | exec |
| F20 | M2에서 플랫폼이 FeedbackOps 토큰·컴포넌트·셸 구조를 직접 쓰게 되어 화면을 옮기는 비용이 크게 줄었다 | — | — | doc | implemented | AP@c20074d:docs/adr/0018-feedbackops-stage2-screens-into-platform-menus.md L8 | 2026-10-04 | exec,dev |
| F21 | FeedbackOps 인증은 사내 IdP(OIDC) 전제인데 IdP가 아직 프로비저닝되지 않았다 — 실사용 배포의 선행 조건 | — | — | doc | planned | FO@87948f3:docs/adr/0006-authentication-and-actor-provisioning.md L3 | 2026-10-05 | exec |
| F22 | 담당자가 문의자 상태를 바꾸면 공개 업데이트를 쓰거나 건너뛰는 이유를 남겨야 한다. 이유도 감사 기록에 남는다 | — | — | code | implemented | FO@87948f3:docs/USER-MANUAL.md L138-145 | 2026-10-05 | exec,user |
| F23 | 문의자는 '내 VOC'에서 8단계 상태, 공개 타임라인, 연결된 Task를 직접 본다 | 8 | 단계 | code | implemented | FO@87948f3:docs/USER-MANUAL.md L78-99 | 2026-10-05 | exec,user |
| F24 | 같은 문제의 VOC를 클러스터로 묶어 한 번에 공개 업데이트를 보내고, 클러스터에서 바로 Task Request를 올린다 | — | — | code | implemented | FO@87948f3:docs/USER-MANUAL.md L151-163 | 2026-10-05 | exec,user |
| F25 | Task Request가 검토되지 않은 후보로부터 백로그를 보호한다(승인 뒤에만 Task) | — | — | code | implemented | FO@87948f3:docs/USER-MANUAL.md L188-190 | 2026-10-05 | exec,user |
| F26 | 관리자 대시보드는 차트가 아니라 행동 큐 6종(미배정 VOC, 고심각도 미연결, 실행 없는 Finding, 릴리스 후 미해결 VOC, 나쁜 결과 후속 없음, 권한 요청 대기) | 6 | 종 | code | implemented | FO@87948f3:packages/shared/src/dashboard.ts L31-39 | 2026-10-05 | exec |
| F27 | 연결 지표(Coverage) 6종에 VOC→Task 연결률(voc-task)과 릴리스 후 문의자 통지율(released-update)이 있다 | 6 | 종 | code | implemented | FO@87948f3:packages/shared/src/dashboard.ts L46 | 2026-10-05 | exec |
| F28 | Task가 릴리스되면 공개 업데이트 검토 후보가 만들어진다(문의자 상태를 자동으로 바꾸지는 않음) | — | — | code | implemented | FO@87948f3:docs/adr/0005-separate-voc-state-machines-and-no-auto-mapping.md L9, L17-19 | 2026-10-05 | exec,user |
| F29 | FeedbackOps는 Jira 전체를 대체하지 않는다 — 자체 VOC·Task·설문에 연결 계층을 더한다 | — | — | doc | designed | FO@87948f3:docs/design/00-product-overview.md L17-19 | 2026-10-05 | exec |
| F30 | 메뉴 사이 문맥 이동 설계: Cycle Time P95 → 느린 실행 → 실행 상세 → 로그 타임라인 → 현재 문맥으로 VOC 생성 | — | — | doc | designed | AP@c20074d:docs/06_platform_ui_contract.md L987-1003 | 2026-10-05 | exec,dev |
| F31 | 분석 화면에서 VOC 등록으로 문맥을 넘기는 딥링크 확장(VOC prefill)은 아직 열림(#81) | — | — | doc | planned | AP@c20074d:.planning/README.md L56 | 2026-10-05 | exec,dev |
| F32 | 생산성 분석 화면 3개(개요·사이클타임 상세·실행 상세) 구축, Wafer Journey 계획 | 3 | 화면 | code | implemented | AP@c20074d:menus/analytics/src/index.ts L15-39 | 2026-10-05 | exec,dev |
| F33 | 지표 카탈로그·지표 상세 구축 | 2 | 화면 | code | implemented | AP@c20074d:menus/metrics/src/index.ts | 2026-10-05 | dev |
| F34 | 기준정보: 설비 마스터는 조회 화면 구축, 공정·레시피 마스터는 등록만(예정) | 2 | 화면(예정) | code | planned | AP@c20074d:docs/09_equipment_master_wireframe.md L3; menus/master-data/src/index.ts L14-22 | 2026-10-05 | exec,dev |
| F35 | 운영 콘솔 4메뉴(권한·변경 감사·메뉴 활용률·메뉴 레지스트리) 구축. 시스템 모니터링·트레이스는 파서 담당 합의(#37) 대기 | 4 | 메뉴 | code | implemented | AP@c20074d:menus/admin/src/index.ts L15-38; .planning/inputs.md L12, L35 | 2026-10-05 | exec,dev |
| F36 | 공지: 메뉴 등록과 홈 배너 mock만 있음 | — | — | code | planned | AP@c20074d:menus/notice-voc/src/index.ts L15-19 | 2026-10-05 | exec |
| F37 | 표준로그 개발 관리: 플랫폼에 설계·메뉴 없음. 별도 레포(standard-log-lifecycle)가 후보로만 적혀 있음 | — | — | doc | n/a | AP@c20074d:.planning/backlog.md L70 | 2026-10-05 | exec,dev |
| F38 | 메뉴 등록 17개 = 화면 13 + 계획 4 | 17 | 메뉴 | code | implemented | AP@c20074d:menus/*/src/index.ts | 2026-10-05 | dev |
| F39 | 규모 요구: 동시 사용자 약 100명, on-prem, FastAPI 백엔드, 1개 Site/Line으로 시작 | 100 | 명 | doc | designed | AP@c20074d:docs/05_roadmap_and_open_questions.md L17 | 2026-09-22 | exec |
| F40 | 메뉴 생성기 `pnpm gen:menu`가 manifest·엔드포인트·mock·테스트·앱 배선을 만들고 `--remove`로 되돌린다 | — | — | code | implemented | AP@c20074d:tooling/AGENTS.md L9; package.json L12 | 2026-10-05 | dev |
| F41 | 메뉴 화면은 PlatformPage가 문맥 바·Scope·경로 표시·즐겨찾기를 자동으로 그려 준다 | — | — | code | implemented | AP@c20074d:apps/platform-web/README.md L35 | 2026-10-05 | dev |
| F42 | 백엔드가 둘이다: FeedbackOps(Fastify) vs 플랫폼(FastAPI 예정) | 2 | 개 | doc | designed | AP@c20074d:docs/adr/0018-feedbackops-stage2-screens-into-platform-menus.md L20; docs/03_backend_stack.md L7 | 2026-10-05 | exec,dev |
| F43 | FeedbackOps 레포에 CI 설정이 없다(.github 없음) | 0 | 개 | code | n/a | FO@87948f3 트리(.github 없음) | 2026-10-05 | dev |
| F44 | 두 레포 모두 GitHub 공개(private=false) | — | — | measured | n/a | GitHub API: hjung3113/analytics-platform, hjung3113/FeedbackOps | 2026-10-05 | exec |
| F45 | 두 레포의 개발·결정은 사실상 1인(AI 코딩 에이전트와 함께)이 해 왔다 | 1 | 명 | measured | n/a | AP·FO git log 작성자(동일 소유자 계정), ADR 결정자 "사용자" | 2026-10-05 | exec |
| F46 | 플랫폼 단계 6(FeedbackOps 1단계) 남은 4건 중 실 VOC 어댑터(#86)는 SSO(#150) 다음 | — | — | doc | planned | AP@c20074d:.planning/README.md L87 | 2026-10-05 | dev |
| F47 | FeedbackOps가 먼저 만들어졌다: 첫 슬라이스 완료 2026-05-16, 플랫폼 레포 생성은 2026-09-17 | 2026-05-16 | 날짜 | doc | implemented | FO@87948f3:docs/implementation/08-mvp-slice-plan.md L16; F01 | 2026-10-05 | exec |
| F48 | FeedbackOps는 사내 SSO 없이도 개발용 가짜 로그인(MockAuthProvider, 운영 환경에서는 꺼짐)으로 시연할 수 있다 — 회의에서 5분 시연(제안): VOC 2건 묶기 → 작업 요청 → 승인 → 공개 업데이트 → 문의자 '내 VOC' | — | — | doc | implemented | FO@87948f3:docs/adr/0006-authentication-and-actor-provisioning.md L18 | 2026-10-05 | exec |
| F49 | 운영 콘솔의 '메뉴 활용률'로 어떤 메뉴가 실제로 쓰이는지 잰다 | — | — | code | implemented | AP@c20074d:menus/admin/src/index.ts L29-31 | 2026-10-05 | exec |

### 소유자 진술 (종류 owner — 문서 근거가 아님, 렌더 시 "(소유자 진술)")

| id | 사실 | 값 | 단위 | 종류 | 상태 | 출처 | as-of | 독자 |
|---|---|---|---|---|---|---|---|---|
| F50 | VOC는 Jira로 받는다 | — | — | owner | n/a | 소유자 진술 2026-10-05 #1 | 2026-10-05 | exec |
| F51 | 작업(Task) 관리는 시스템으로 관리되는 것이 사실상 없다 | — | — | owner | n/a | 소유자 진술 #2 | 2026-10-05 | exec |
| F52 | 분석 시스템 하나는 EES에 묶인 데스크톱 앱이라 개발 자유도가 낮다 | — | — | owner | n/a | 소유자 진술 #3 | 2026-10-05 | exec |
| F53 | CLAS는 공통 기반 없이 메뉴를 합쳐 놓은 느낌이 강하다 | — | — | owner | n/a | 소유자 진술 #4 | 2026-10-05 | exec |
| F54 | 공지·설문 기능이 부족하고, 그 밖의 기능도 흩어져 있거나 시스템이 없다 | — | — | owner | n/a | 소유자 진술 #5-6 | 2026-10-05 | exec |
| F55 | Jira에서는 VOC 사이의 후속 조치를 공유하기 어렵다 | — | — | owner | n/a | 소유자 진술 #7 | 2026-10-05 | exec |
| F56 | Jira에서는 여러 VOC를 묶어 Task로 만들고 관리하기 어렵다 | — | — | owner | n/a | 소유자 진술 #8 | 2026-10-05 | exec |
| F57 | Jira에서는 VOC 처리를 성과로 보여 주기 어렵다 | — | — | owner | n/a | 소유자 진술 #9 | 2026-10-05 | exec |
| F58 | 기대: 문의자가 다른 메뉴와 묶인 VOC로 진행을 직접 확인해 같은 질문이 줄고 개발자 부담이 준다 (목표, 측정값 아님) | — | — | owner | planned | 소유자 진술 #10-12 | 2026-10-05 | exec |
| F59 | 플랫폼 목표: MARS/CLAS의 개발 지원(Task)·모니터링, 운영 지원(VOC·설문), 기준정보, 표준로그 개발 관리, 생산성 분석을 한 플랫폼에서 일원화·연계 | 6 | 업무 갈래 | owner | planned | 소유자 진술(플랫폼의 목표) | 2026-10-05 | exec |

### 이 제안이 정하는 값 (종류 estimate — 제안값, 렌더 시 "(제안)")

| id | 사실 | 값 | 단위 | 종류 | 상태 | 출처 | as-of | 독자 |
|---|---|---|---|---|---|---|---|---|
| F70 | 오늘 요청하는 결정 수(D1 준비 단계 승인과 시범 후보 팀, D2 SSO·인프라 협조 요청, D3 발표자 시간 배분, D4 보안 회신 확인) | 4 | 건 | derived | n/a | 이 문서 §7 | 2026-10-05 | exec |
| F71 | 시범 기간: 준비 2주 + 운영 8주 + 판정 2주. 12주는 착수일부터 센다 — 사내 로그인 연결이 늦으면 착수일을 미룬다 | 12 | 주 | estimate | planned | 이 문서 §6(제안); F21 | 2026-10-05 | exec |
| F72 | 시범 범위: 1개 팀 — 그 팀장의 사전 동의를 받는다 | 1 | 팀 | estimate | planned | 이 문서 §6(제안) | 2026-10-05 | exec |
| F73 | 협조를 요청하는 사내 담당: SSO·인프라. 백엔드 담당은 플랫폼 실서버 연결에만 필요하므로 2주 뒤 함께 올린다 | 2 | 영역 | derived | n/a | F13; F16 | 2026-10-05 | exec |
| F74 | 사내 담당 회신 요청 기한 | 2 | 주 | estimate | planned | 이 문서 §7(제안) | 2026-10-05 | exec |
| F75 | 기준선: 후보 팀의 지난 6개월 Jira VOC 기록 — 월 건수·첫 댓글까지 시간·재문의·중복 표본·개발 이슈가 연결된 비율 | 6 | 개월 | estimate | planned | 이 문서 §6(제안) | 2026-10-05 | exec |
| F76 | 판정 지표: Jira와 비교할 수 있는 두 가지(첫 응답 리드타임, 재문의)만 판정에 쓰고, 연결률·통지율·사내 메뉴 1개 개발 기간은 운영 점검으로 보고한다. 판정선 숫자는 기준선을 본 뒤 정한다 | 2 | 지표 | estimate | planned | 이 문서 §6(제안); F27 | 2026-10-05 | exec |
| F77 | 판정 규칙(제안): 두 판정 지표가 모두 기준선보다 나아지고 데이터 사고(VOC 유실·권한 밖 노출) 0건이면 두 결정을 올린다 — 그 팀 VOC 접수 일원화, FeedbackOps 화면을 플랫폼으로 옮기는 단계 착수. 미달이면 시범 팀은 FeedbackOps 사용을 멈춘다(Jira 접수는 그대로 있다) | 0 | 건(데이터 사고) | estimate | planned | 이 문서 §6(제안) | 2026-10-05 | exec |
| F78 | 새 예산 요청은 없다. 시범에는 사내 서버·DB가 필요하며 기존 자원 사용 여부와 비용은 인프라 회신 뒤 보고한다 | — | — | estimate | planned | 이 문서 §7(제안); Q03 | 2026-10-05 | exec |
| F79 | 오늘 승인 요청은 준비 단계 2주다 — 기준선 추출, 보안 사전 문의, 시범 팀 동의, SSO·인프라 협조 요청, 병행 기간 VOC 접수 경로 확정. 운영 8주는 2주 뒤 기준선 숫자와 함께 다시 올린다 | 2 | 주 | estimate | planned | 이 문서 §1·§7(제안) | 2026-10-05 | exec |

## Q — 열린 질문

| id | 질문 | 필요 섹션 | 누구 | 상태 |
|---|---|---|---|---|
| Q01 | 해당 팀의 Jira VOC 월 건수·처리 리드타임·재문의 비율(기준선) | 6 | 발표자(Jira 추출) | open — 시범 첫 2주 과제로 둔다(F75) |
| Q02 | 발표자가 본업(MARS/CLAS) 대비 이 일에 쓰는 시간 비율, 백업 개발자 후보 | 7 | 팀장 | open — D3에서 정한다 |
| Q03 | on-prem 서버·DB 비용 | 7 | 인프라 담당 | open — #151 답 뒤 별도 보고 |
| Q04 | 사내 기존 도구·상용 VOC 도구와의 비교가 필요한가 | 5 | 부서장 | open — 이번 문서는 현행·Jira 보강·CLAS 확장·본 안만 비교 |
| Q05 | EES 데스크톱 분석 앱을 플랫폼으로 옮길지 | 4 | 부서장 | open — 이번 요청 범위 밖 |
| Q06 | 시범 팀을 어느 팀으로 할지, 그 팀장이 동의하는지 | 6 | 팀장 | open — D1에서 후보를 정하고 준비 단계에 동의를 받는다 |
| Q07 | 병행 기간에 VOC가 FeedbackOps로 들어오는 경로(문의자 직접 등록 / Jira 건 이관, 이중 입력 여부) | 6 | 발표자·시범 팀장 | open — 준비 단계 과제 |
| Q08 | 레포 공개 범위·사내 정보 포함 여부·AI 코딩 도구 사용 규정 | 7 | 발표자 → 보안 담당 | open — 회의 전 사전 문의, 회신은 D4 |
| Q09 | Jira 보강안의 실현성 — 문의자가 Jira 계정·화면을 쓰는지, 워크플로·필드 변경 권한이 누구에게 있는지 | 3 | 발표자 | open — 준비 단계에서 확인 |

## C — 주장

| id | 주장 | 근거 F-ids | 한계 |
|---|---|---|---|
| C01 | 지금은 VOC 처리가 성과로 남지 않는다 | F50, F51, F55, F56, F57 | 소유자 진술, 정량 기준선 없음(Q01) |
| C02 | 묶기·Task화·문의자 통지·성과 집계 기능은 이미 만들어져 있다 | F22–F28, F06, F07 | 실사용 배포 전(F21), 실데이터 0건(F15) |
| C03 | 공통 기반이 메뉴마다 반복되는 일을 줄인다 | F08, F09, F10, F40, F41 | 레포 안 견본 메뉴의 사례, 사내 메뉴로는 미검증 |
| C04 | 다음 단계는 사내 담당 회신과 보안 확인 없이는 진행할 수 없다 | F12, F13, F14, F21 | 플랫폼 API(#155)는 사내 백엔드 담당이 구현해야 한다(in-house-rollout §2) — 회신만으로 끝나지 않는다 |
| C05 | 빠르게, 검증하며 만들었다 | F01, F03, F04, F05 | 1인 집중(F45) |
| C06 | 시범은 작고 되돌릴 수 있다 | F71, F72, F77, F79, F29 | 시범 기간에는 Jira와 병행이라 도구가 하나 늘고, 접수 경로(Q07)에 따라 이중 입력 부담이 생길 수 있다 |
| C07 | 팀장에게 직접 이로운 기능이 이미 있다 — 행동 큐, 연결 지표, 말 없는 상태 변경 차단 | F22, F26, F27 | 실사용 전(F21) |

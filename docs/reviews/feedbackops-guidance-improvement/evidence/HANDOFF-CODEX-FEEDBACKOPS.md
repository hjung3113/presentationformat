# HANDOFF — Codex FeedbackOps presentation build

> 작성일: 2026-07-04  
> 작업 폴더: `/Users/hyojung/Desktop/2026/presentationformat-feedbackops-codex`  
> 원본 폴더: `/Users/hyojung/Desktop/2026/presentationformat`  
> 산출물: FeedbackOps 설계 문서군을 `indigo-serif` 스타일의 scroll HTML 발표 문서로 변환

---

## 1. 현재 상태

- 원본 `presentationformat`은 수정하지 않았다.
- 원본 프로젝트를 아래 복사본으로 복제한 뒤, 복사본 안에서만 Codex용 임시 작업을 진행했다.
  - `/Users/hyojung/Desktop/2026/presentationformat-feedbackops-codex`
- 복사본은 원본과 같은 `design/authoring-harness` 브랜치 상태를 가진다.
- 복사본에는 이번 작업에서 만든 Codex용 지침, content plan, HTML 문서가 추가되어 있다.
- 정적 서버가 켜져 있다.
  - URL: `http://127.0.0.1:8765/examples/feedbackops-design-brief.dc.html`

---

## 2. 따른 지침

### 프로젝트 지침

- 최종 산출물은 PowerPoint가 아니라 vertical scroll HTML `.dc.html`이다.
- `core/`는 style-agnostic으로 유지한다.
  - 이번 작업에서는 `core/`를 수정하지 않았다.
- 스타일 값은 `styles/indigo-serif/`의 SSOT를 따른다.
  - `authoring-guide.md`
  - `composition-guide.md`
  - `design.md`
  - `template.dc.html`
- `.dc.html` 옆에는 byte-identical `support.js` sidecar가 있어야 한다.
  - 이번 문서는 `examples/support.js`를 사용한다.
- 문서는 HTTP로 서빙해야 한다.
  - `file://`로 열지 않았다.
- inline style 규칙을 지켰다.
  - 문서 자체에 CSS class 기반 색상/레이아웃 규칙을 추가하지 않았다.
- Korean register는 문어체 `~한다/~된다/~이다` 중심으로 유지했다.
- 의미 색상 규칙을 유지했다.
  - AS-IS/current/problem: slate + amber
  - TO-BE/target/key: indigo

### Codex 임시 지침

- 복사본 루트에 `AGENTS.md`를 새로 작성했다.
- 원본 `.claude/` 하네스는 보존했다.
- `.claude/`는 참고 tooling으로만 보고, product spec은 `core/`와 `styles/indigo-serif/`를 우선했다.

---

## 3. 주요 판단

### 3.1 원격 repo 기준 대신 로컬 FeedbackOps 문서를 사용

요청은 “내 원격레포중 FeedbackOps 설계 문서”였지만, 로컬 checkout을 확인한 결과:

- `/Users/hyojung/Desktop/2026/FeedbackOps`
- branch: `develop`
- remote: `https://github.com/hjung3113/FeedbackOps`
- local `develop`은 `origin/develop`보다 31 commits ahead

따라서 실제 최신 설계 판단은 로컬 문서에 더 많이 들어 있을 가능성이 높다고 보고, 로컬 설계 문서군을 기준으로 문서를 만들었다. 이 사실은 HTML hero note에 명시했다.

### 3.2 처음에는 정보 밀도가 낮았고, 이후 1.3배 수준으로 보강

초기 문서는 8개 섹션이 개념을 넓게 나누는 구조였다. 사용자가 “한 페이지 한 페이지에 정보가 나뉜 느낌”이라고 지적했고, 이후 긴 문단을 늘리는 대신 다음 방식으로 밀도를 올렸다.

- 섹션 하단에 판단용 mini-card 추가
- workflow 조건과 review 상태 추가
- 직접 FK vs Entity Link 기준 추가
- 사용자별 use case 추가
- 결정권자용 설득 포인트 추가

섹션 수는 유지했다. 이유는 이미 nav와 문서 흐름이 안정적이었고, 5섹션으로 압축하면 한 섹션이 과밀해질 가능성이 컸기 때문이다.

### 3.3 use case 중심으로 방향 전환

사용자가 “use case 위주로 조금 더 들어가면 좋겠다”고 요청했다. 이후 개념 설명보다 다음 사용 흐름이 보이도록 조정했다.

- `UC 01`: 사용자 VOC 등록
- `UC 02`: 담당자 후속 결정
- `UC 03`: 리뷰어 실행 승인
- `USE CASE A`: 단일 VOC가 명확하면 Finding 없이 Task Request
- `USE CASE B`: 여러 VOC/Survey 결과가 섞이면 Finding으로 합성
- `USE CASE C`: 이미 작업이 있으면 새 Task 대신 기존 Task 연결

### 3.4 결정권자 설득 포인트 추가

마지막 요청에 따라 “기능 목록”보다 “왜 좋은가”가 먼저 보이도록 메시지를 추가했다.

결정권자용 핵심 설득 축:

- 후속 누락을 운영 리스크로 관리한다.
- Task Request buffer로 backlog 오염을 막는다.
- VOC, Finding, Task, Outcome 사이의 연결을 남겨 개선 활동을 설명 가능하게 만든다.
- MVP는 화려한 분석보다 triage queue, request review, link trail을 먼저 완성해야 한다.

사용자별 사용 방식:

- `USER`: VOC 제출·상태 확인
- `DEV`: Triage·evidence 정리
- `REVIEWER`: Task Request 검토
- `LEAD`: Coverage·Outcome 추적

---

## 4. 만든 파일

### Codex 임시 지침

- `AGENTS.md`
  - Codex가 이 복사본에서 따라야 할 임시 entrypoint.
  - 원본 Claude/opencode 지침을 대체하지 않고, 복사본 작업에만 적용한다.

- `.codex/README.md`
  - 이 폴더가 Codex 임시 copy임을 기록.

### 문서 계획

- `examples/feedbackops-content-plan.md`
  - FeedbackOps 설계 문서를 요약한 style-agnostic content plan.
  - 이후 use case, 결정권자 설득 포인트, 사용자별 사용 방식도 반영했다.

### 최종 HTML 문서

- `examples/feedbackops-design-brief.dc.html`
  - 현재 브라우저에서 열려 있는 최종 scroll HTML 문서.
  - URL: `http://127.0.0.1:8765/examples/feedbackops-design-brief.dc.html`

### Sidecar

- `examples/support.js`
  - 기존 예제 sidecar를 그대로 사용.
  - gate에서 canonical support와 byte-identical 여부를 확인했다.

---

## 5. 사용한 FeedbackOps 소스

주요 입력 문서:

- `/Users/hyojung/Desktop/2026/FeedbackOps/PRODUCT.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/DESIGN.md`
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
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/frontend/ui-design-system.md`

---

## 6. 검증 결과

실행 위치:

```bash
cd /Users/hyojung/Desktop/2026/presentationformat-feedbackops-codex
```

기계 게이트:

```bash
node .claude/lib/verify-doc.mjs examples/feedbackops-design-brief.dc.html --accent '#4338CA' --canonical-support styles/indigo-serif/support.js
```

결과:

```text
PASS  keep-all
PASS  accent-present  #4338CA
PASS  sidecar-present
PASS  unique-ids
PASS  navlink-integrity
PASS  inline-only
VISUAL: UNVERIFIED (no headless browser)
```

브라우저 확인:

- Codex in-app browser에서 실제 렌더 확인.
- nav target 누락 0개.
- 섹션 수 9개.
- 결정권자 설득 포인트 존재 확인.
- 사용자 모드 `USER`, `DEV`, `REVIEWER`, `LEAD` 존재 확인.
- 현재 문서 높이 약 6387px.

---

## 7. 남은 한계

- `.claude/lib/verify-doc.mjs`의 visual tier는 로컬에서 headless browser를 찾지 못해 `UNVERIFIED`로 남았다.
  - 대신 Codex in-app browser로 렌더를 확인했다.
- HTML은 현재 초안 수준의 설득 문서다.
  - 발표용 최종 polish를 하려면 각 섹션의 밀도 균형, 모바일 viewport, 실제 source citation 표기 여부를 추가로 다듬어야 한다.
- FeedbackOps 원격 `origin/develop`이 아니라 local `develop` 기준으로 작성했다.
  - 로컬이 31 commits ahead라 의도적으로 그렇게 했다.

---

## 8. 다음 작업 추천

1. 브라우저에서 섹션별 시각 밀도를 훑고, 과밀한 곳은 카드 수를 줄인다.
2. 결정권자용 메시지를 더 강하게 하려면 1번 섹션의 `EXECUTIVE POINT`를 hero 바로 아래로 끌어올린다.
3. 사용자별 use case를 더 강조하려면 7번 섹션을 `USER / DEV / REVIEWER / LEAD` 중심의 4-column surface map으로 재구성한다.
4. 최종 배포 전에는 Playwright 또는 Chrome headless가 잡히는 환경에서 visual screenshot을 남긴다.

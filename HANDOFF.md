# HANDOFF — 스크롤형 발표 시스템

> 이 레포(발표 시스템)의 인수인계 문서. 파서 프로젝트 세션의 옛 핸드오프는 이 프로젝트와 무관해
> `archive/HANDOFF-parserimprove.md`로 이관됨. 이 문서는 **제품(발표 시스템 + 저작 하네스)** 상태만 다룬다.
>
> 최종 갱신: 2026-10-05 · **도식 계약(component contract) + 29종 그리드 컴포넌트 라이브러리 + 3번째 스타일 `feedbackops-light`**. 저추론 모델도 "내용의 모양 → 컴포넌트 붙여넣기"로 맞는 도식을 넣도록 지침·스킬·게이트를 재구성.

---

## 0. 한눈에

- **무엇**: 어떤 문서든 같은 저자의 작품처럼 읽히는 재사용 스크롤형 HTML 발표 시스템. `core/`(스타일 불가지) + `styles/<style>/`(스타일별 SSOT)로 분리. **스타일 셋**: `indigo-serif`(기본) · `teal-sans`(내부 엔지니어링 문서) · `feedbackops-light`(FeedbackOps 제품 디자인 언어).
- **도식 계약**: `core/components.md`(내용 shape → 컴포넌트, 판정 절차, 문서 레시피) + `core/components/*.html`(29종 템플릿) → 스타일별 붙여넣기용 `styles/<style>/components/` 자동 생성.
- **저작 하네스**: `.claude/`에 `/plan → /build` 2-스킬 파이프라인 + zero-dep Node 종료 게이트. 3개 에이전트 호스트(Claude Code · opencode · Codex)에서 host-neutral 동작.
- **상태**: 하네스 테스트 **24/24**. 게이트가 `--plan`으로 섹션별 shape→컴포넌트 일치를 강제. 워크드 예시 `examples/feedbackops-light-brief/`가 전체 파이프라인을 통과(9개 섹션, 9종 도식).

---

## 1. 레포 구조

```
core/runtime-spec.md          스타일 불가지 (셸·DOM계약·서빙, HEX 0, 크롬 토큰만)
core/components.md            도식 계약 — shape 어휘·판정 절차·shape→컴포넌트·게이트 규칙·문서 레시피 (HEX 0)
core/components/*.html        29종 컴포넌트 템플릿 (⟨role⟩ 자리표시·⟦slot⟧·HOW TO FILL) + 생성 인덱스 README
styles/indigo-serif/          기본 스타일 SSOT (serif+indigo)
  design.md(시각 SSOT) · design.tokens.md(미러) · authoring-guide.md
  composition-guide.md · style.md · template.dc.html · design-system.answerkey.dc.html
  support.js(사이드카)
styles/teal-sans/             2번째 스타일 SSOT (IBM Plex 슈퍼패밀리 + teal accent + slate/red vs teal)
  ↳ 같은 8-파일 구조. indigo-serif 복제 → 결정론적 매핑 변환 + 프로세 편집으로 생성
styles/feedbackops-light/     3번째 스타일 SSOT (FeedbackOps Pack 17 light: Inter+Pretendard, #1428A0, 평면, 6–8px)
styles/*/components/          (생성물) 붙여넣기용 컴포넌트 + README 인덱스, styles/*/components.gallery.dc.html
examples/                     워크드 예시 (feedbackops-light-brief ← 새 파이프라인 기준, feedbackops, feedbackops-design-report)
.claude/                      저작 하네스 (비규범 tooling)
  skills/{plan,build}/SKILL.md · lib/{gate,plan-schema,verify-doc,components}.mjs + test/
  README.md(하네스 개요 + 3-호스트 install 증거)
archive/                      동결 참고자료 (parserimprove — 제품 아님, provenance만)
docs/superpowers/             spec + plan 문서
ADDING-A-STYLE.md             스타일 추가 절차 + 불변식 게이트 (프로세스 문서, 값 미소유)
README.md · CLAUDE.md · AGENTS.md
```

핵심 불변식은 `CLAUDE.md` 참조 (core 제로-HEX · 스타일 self-contained · answer-key-wins · 시맨틱 색분리 · 인라인 스타일만 · support.js 사이드카).

---

## 2. 이 세션 작업 (2026-10-05) — 도식이 "안 쓰이는" 문제 해결

### 진단 (왜 컴포넌트를 못 썼나)
1. **조립 난이도** — 도식이 `design.md`의 산문 CSS 명세로만 존재. 시퀀스 다이어그램은 `position:absolute; top:76px; left:16%` 같은 픽셀 좌표를 직접 계산해야 해서 저추론 모델은 카드·표로 후퇴.
2. **선택 표의 중복·장황** — 스타일마다 거의 같은 40행 situation→device 표. 의도(한국어 요청어)와 도식을 잇는 신호어가 없음.
3. **plan의 figure-data에 구조가 없음** — 노드 이름만 있고 엣지(전이·호출·연결)가 없어 "화살표 없는 박스 더미"가 나옴(기존 예시의 시스템 지도가 그 사례).
4. **게이트가 도식 유무를 안 봄** — 구조 검사만 해서, 흐름 섹션을 카드로 그려도 통과.

### 해결
- **`core/components.md`(도식 계약)** — 닫힌 shape 어휘 32종(각 shape의 한국어 신호어), 첫 "예"가 이기는 17단계 판정 절차, shape→컴포넌트 표, 게이트 hard-fail, 붙여넣기 규칙, 문서 레시피 5종(설계 설명서·상태 보고·의사결정 제안·기능 소개·분석). 상태 보고 레시피는 FeedbackOps `docs/reporting` 8섹션 순서를 따른다.
- **`core/components/*.html` 29종** — 픽셀 계산 없는 그리드 배치. 가변 값은 `repeat(N,1fr)`, `grid-column:a / b`, 폭 %, 그리고 **한 개의 조회표**(걸치는 칸 S → `margin:0 X%`: 2→25%, 3→16.667%, 4→12.5%, 5→10%)뿐. 시퀀스(생명선=반복 배경, ALT 묶음), 스윔레인(엘보 연결선), 상태 머신(주 경로 + "그 밖의 전이" 목록으로 모든 전이를 노출), 액티비티(마름모·결말 그리드·되돌림 칩·포크/조인), 계층 맵, 데이터 흐름, 트리, ER 관계(카디널리티·선택 링크·금지 관계), 클래스, 허브, 유스케이스, 화면 맵(ListShell/PageShell/WorkbenchShell 프리셋), 금지 경로, 차트 4종, 상태 보드·타임라인·간트·리스크 매트릭스·결정 블록·결정 표·체크 매트릭스, 카드 그리드·콜아웃·표.
- **생성기 `.claude/lib/components.mjs`** — 템플릿 × 스타일 토큰(`design.tokens.md`의 `colors`/`rounded`/신규 `fontStacks`) → 스타일별 붙여넣기 파일·인덱스·갤러리. `check` 모드 + 테스트로 드리프트 차단.
- **새 스타일 `feedbackops-light`** — teal-sans 복제 + 매핑 변환(중립 램프까지 FeedbackOps 회색으로 교체, 그라디언트 히어로 → 단색, 반경 6–8px) + 정체성 산문 손편집. 답안지·템플릿·갤러리 렌더 검증.
- **`/plan`** — 섹션마다 `shape` 필수(어휘 밖이면 실패), 컴포넌트별 figure-data 형식, "엣지를 적어라" 규칙, `doc-type` 레시피 선택.
- **`/build`** — Step 4를 "shape → 표 조회 → 파일 붙여넣기 → ⟦⟧ 채우기"의 기계적 절차로 재작성. 게이트에 `--plan` 필수.
- **게이트** — `slots-filled`, `known-components`, `plan-alignment`, `plan-shapes`(shape가 요구하는 컴포넌트 없으면 FAIL) + `figures:*` 경고(커버리지·다양성·빈 섹션).
- **스타일 가이드** — 세 스타일의 §5.1 표를 계약 포인터 + 라이브러리 밖 장치 표(인용·구분자·도넛·히트맵 등)로 교체. composition-guide 프리플라이트를 shape/컴포넌트 열로 갱신.
- **드리프트 수정** — teal-sans `design.md`/`design.tokens.md` 반경(14/16/18)이 답안지(10/12/12)와 달라 답안지 기준으로 정정.

### 검증
- 테스트 24/24 (`node --test .claude/lib/test/*.test.mjs`). `components.mjs check` 통과.
- 세 스타일 갤러리·`feedbackops-light` 템플릿·답안지·워크드 예시를 Chromium으로 렌더해 육안 확인. 예시 게이트 PASS 10/10(`--plan` 포함), 9개 섹션 모두 shape에 맞는 컴포넌트.
- 렌더 환경 메모: 이 컨테이너는 unpkg/jsdelivr가 막혀 있어 React UMD·Pretendard를 npm에서 받아 Playwright 라우팅으로 대체해 확인했다. 게이트의 시각 tier(`VISUAL:`)는 PATH에 chromium이 없고 CDN이 막혀 UNVERIFIED.

---

## 2-prev. 이전 세션 작업 (2026-07-11)

### 2A. 하네스 위생 정리 (A)
- **문제**: `plan-schema.mjs`(validatePlan/parsePlan)가 `content-plan.template.md`와 필드 1:1 일치하는데도 **어느 SKILL.md에서도 호출 안 됨**(만들고 안 이은 orphan). build/SKILL.md의 `.claude/lib` 경로는 repo-relative라 Codex 전역 노출 시 깨질 수 있음.
- **결정**: "내부용 명시"가 아니라 **배선**. 필드가 정확히 일치 = stale 아님.
- `plan-schema.mjs`에 **CLI 부착**(verify-doc.mjs 패턴): exit 0 valid / 1 malformed(누락필드 나열) / 2 usage·read. 검증 **로직 무손**.
- `/build` Step 1에 **fail-fast 플랜 검증** 배선 + `/plan` Step 6 self-validate(대칭). Inputs 헤더키 드리프트(`narrative-lens` 누락) 수정. Step 8에 repo-relative 경로 주의 + fast-fail 안내.
- `.claude/README.md` 정정, CLI 스모크 테스트 3건 추가 → **테스트 13/13**.
- scope creep(placeholder 검출)은 각괄호 정상콘텐츠 false-positive 위험으로 제거.

### 2B. 2번째 스타일 `teal-sans` (B)
- **맥락**: 내부 엔지니어링/기술 문서용. 모던 sans(serif인 indigo-serif와 대비). deep-research로 근거(22소스·87 claim: Primer/Carbon/Geist/Tailwind/IBM Plex/USWDS) 수집 → 디자인 브리프 합성.
- **정체성**(사용자 승인): **IBM Plex 슈퍼패밀리**(Plex Sans 본문+제목, Plex Mono) · accent=**teal `#0F766E`** · 시맨틱 split = 현재/구=slate + 문제=**red** vs 목표/개선=**teal**, 성공=green(teal와 구별).
- **생성 방식**(핵심 자산): 인라인-HEX 전용이라 **매핑테이블 결정론적 변환**이 최적. indigo→teal 21 HEX, amber→red 9, green 유지, 폰트 3종, radius 타이트닝을 스크립트로 `design.md`·`template`·`answerkey`·`tokens`에 적용(support.js 무손) → 프로세만 손편집. **중립 그레이 램프는 유지**해 검증된 계층 보존.
- **게이트 8/8 통과**. `core/` 무손(git 확인). answerkey Playwright 렌더 검증(teal 그라디언트·red 문제·green 성공·Plex 렌더·한국어 OK). README 레지스트리 등록.
- `ADDING-A-STYLE.md` "After the second style" 섹션을 **결정 기록**으로 갱신: 변환 기법 문서화 · 스킬화는 **3번째 스타일로 연기** · D2 문서분리는 **깨끗한 seam 없음 → 계속 연기**.

> **비고**: deep-research 워크플로 synthesis가 stub(`"Test"`) 반환하는 버그 발견 — **Claude Code 하네스 빌트인** 이슈라 이 레포와 무관(드롭). 리서치 데이터는 journal.jsonl에서 복구.

---

## 2-old. 이전 세션 작업 (2026-07-04)

### 2.1 parserimprove 아카이브
- `reference/parserimprove/` → `archive/parserimprove/` (git rename, 히스토리 보존). 파서 프로젝트의 디자인 참고자료였을 뿐 이 제품과 무관.
- `HANDOFF.md`(파서 세션) → `archive/HANDOFF-parserimprove.md`. `archive/README.md` 추가.
- `CLAUDE.md`·`README.md`의 "canonical worked example" 포인터를 parserimprove → `examples/`로 재지정.
- 죽은 TODO들(TSV 스펙·DB 스키마·Config 파서·spec_extensions 병합·converter_pilot 등)은 전부 파서 종속 → 아카이브와 함께 소멸.

### 2.2 다중 호스트 install 브릿지
- **발견**: CC + opencode는 `.claude/skills/` clone 시 자동 발견(install 불필요). Codex만 갭 — `$CODEX_HOME/skills/<name>/` 디렉토리 스캔 방식(프로젝트 `.claude/skills/` 안 봄).
- **`install.sh`** (repo root): Codex용 심링크 설치. `.claude/skills/{plan,build}` → `$CODEX_HOME/skills/`. 멱등, 실디렉토리/외부심링크 가드, 재시작 안내. CC/opencode는 no-op.
- **`AGENTS.md`** (thin, 비규범): Codex+opencode가 읽음(**CC는 CLAUDE.md**). `CLAUDE.md`/`.claude/README.md` 지목, 재작성 안 함. Codex는 repo 안에서만 기능(lib 경로 cwd 의존) 명시.
- **`.claude/README.md`**: Codex discovery 실증 증거 추가.
- **`install.test.mjs`**: 심링크/멱등/실디렉토리-skip 검증 (3 tests).
- **실증**: `codex debug prompt-input`에 plan+build 둘 다 model-visible 로드 확인 (심링크 타겟까지 해석). opencode `debug skill` 선례 미러.
- 문서: `docs/superpowers/specs/2026-07-04-multi-host-install-design.md` + `.../plans/2026-07-04-multi-host-install.md`.

### 2.4 스타일 추가 지침 단일 문서화 (`ADDING-A-STYLE.md`)
- **문제**: "스타일 추가" 지침이 4곳 흩어짐 — `CLAUDE.md`(불변식) · `README.md:24`(한 줄) · `styles/indigo-serif/style.md`(매니페스트) · `HANDOFF.md`(D2 seam). 실행자가 6-파일 SSOT 경계 + 불변식 직접 기억해야 함.
- **`ADDING-A-STYLE.md`** (root, HANDOFF와 peer): 파일별 rewrite 표 + 9-스텝 절차 + 8-항목 불변식 게이트. **프로세스 문서** — SSOT 지목만, 값 복제 0.
- **실제 style 보고 보강**(README 한 줄 누락분): ① 새 스타일이 core에 6 크롬 토큰 슬롯 공급 필수 ② `design.tokens.md` 재-미러 ③ 시맨틱 split 재정의(1회 규범 명시, 문서 내 혼용 금지) ④ `support.js` 사이드카 두 `.dc.html` 모두.
- 배선: `README.md` 포인터 + `CLAUDE.md` repo-map 행.
- **스킬화 판단 → 지금 아니오**: 빈도 극저(평생 몇 번) + 재사용 경계 미검증. n=1에서 스킬 = 조기 추상화. 트리거: **2번째 스타일 손으로 추가 → 절차 안정 실증 후** 3번째에서 재검토. 문서에 트리거 명시.

### 2.3 스타일 문서 분리 검토 → 연기
- 큰 파일: `design.md`(559줄), `design-system.answerkey.dc.html`(1087줄).
- **결정**: 분리 **안 함**. 이유: answerkey는 단일 렌더 문서라 분리 불가(제품 전제). design.md는 §5 다이어그램 카탈로그(~150줄)만 깔끔한 seam이나, 각 문서는 이미 책임 하나씩(design=토큰·컴포넌트, authoring=보이스, composition=밀도)이고 큰 건 내용량 탓. HANDOFF 옛 D2("깨끗한 seam 없음, 2번째 스타일까지 연기") 논리 유지. 재사용 경계가 실증되기 전 분리는 조기 최적화.

---

## 3. 핵심 결정

- **D0** — 호스트별 커스텀 에이전트(`.claude/agents/`·`.opencode/agent/`·codex roles) **안 만듦**. 포맷이 호스트마다 달라 host-neutral 원칙 위반. SKILL.md 공통 서브셋이 올바른 seam.
- **D1** — Codex install = **심링크**(config.toml 안 건드림). `[[skills.config]]`는 비활성화 오버라이드 레지스트리지 discovery allowlist 아님(chronicle이 무등록 발견됨으로 실증). 심링크 discovery 실증 성공.
- **D2(계승)** — 스타일 문서 분리는 **2번째 스타일 등장 시** 재검토. 지금은 재사용 경계 미검증.

---

## 4. 후속 작업

### 하네스 (비규범, 선택적 하드닝)
- [x] ~~`build/SKILL.md`의 `.claude/lib/` 경로 cwd-robust~~ — **완료(2A)**: repo-relative 명시 + fast-fail 안내 문서화.
- [x] ~~`plan-schema.mjs` orphan~~ — **완료(2A)**: CLI 부착 + `/plan`·`/build` 양쪽 배선.
- [ ] 토큰 CSS 변수화 + allowlist 린터 (인라인 토큰 드리프트 방지) — 필요 생길 때. **teal-sans 추가로 스타일이 둘 → 토큰 드리프트 감시 가치 소폭 상승**(여전히 트리거 대기).
- [ ] `support.js`의 `cssToObj` data-URI 맹글링 수정 (SVG 엣지 예외 개방 선행조건) — 트리거 있을 때.

### 도식 계약 (이번 세션 후속)
- [ ] **저추론 모델 실측** — 작은 모델로 `/plan → /build`를 2–3회 돌려 `plan-shapes` 실패율·shape 오분류 패턴을 기록하고, `core/components.md` §1 신호어/§2 순서를 보정.
- [ ] **figure-data → 컴포넌트 자동 채움(선택)** — 형식이 고정된 shape(gantt·timeline·status-board·kpi-row)부터 CLI로 슬롯을 채우는 도구를 검토. 지금은 수작업 붙여넣기.
- [ ] `figures:*` 경고를 2–3개 승인 산출물로 보정한 뒤 일부를 hard fail로 승격 검토.
- [ ] FeedbackOps 레포 `docs/reporting/report-template.html`(구 다크 토큰)을 이 시스템의 `feedbackops-light` + 상태 보고 레시피로 대체할지 FeedbackOps 쪽에서 결정 필요(이번 세션은 FeedbackOps 레포 무수정).

### 스타일 시스템
- [x] ~~2번째 스타일 추가~~ — **완료: `teal-sans`**. 절차(`ADDING-A-STYLE.md`) 실증, 게이트 8/8.
- [x] ~~3번째 스타일~~ — **완료: `feedbackops-light`**. `/add-style` 스킬화는 n=3에서도 보류(결정 기록: `ADDING-A-STYLE.md`). D2 문서분리는 "도식 구성"이라는 seam이 나타나 `core/components/`로 분리.
- [x] ~~3번째 스타일 요청 시 (a)(b)(c) 재검토~~ — 위 항목으로 처리 완료.
- [ ] **teal-sans 실사용**: 아직 워크드 예시(`examples/`)가 indigo-serif뿐 → teal-sans로 실제 문서 하나 `/plan → /build` 해보면 voice/composition 가이드의 엔지니어링 레지스터가 실전 검증됨(현재는 스펙만 존재).

---

## 5. 커밋

### 이 세션 (2026-07-11)
- **A(하네스 위생) + B(teal-sans) 한 커밋** — `.claude/lib` plan-schema CLI·배선·테스트, `styles/teal-sans/` 신규, README/CLAUDE/ADDING-A-STYLE/HANDOFF 갱신. 브랜치에서 작업 후 통합.

### 이전 세션 (2026-07-04)
| 커밋 | 내용 |
|------|------|
| `4b93de1` | parserimprove 아카이브 + install spec/plan |
| `250aca3` | 다중 호스트 install 브릿지 (install.sh + AGENTS.md + 테스트 + 증거) |
| `76bf3ce` | merge → main (push 완료) |
| `0962807` | 스타일 추가 지침 단일 문서화 (`ADDING-A-STYLE.md` + README/CLAUDE 배선, ff-merge → main push) |

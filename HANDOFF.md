# HANDOFF — 스크롤형 발표 시스템

> 이 레포(발표 시스템)의 인수인계 문서. 파서 프로젝트 세션의 옛 핸드오프는 이 프로젝트와 무관해
> `archive/HANDOFF-parserimprove.md`로 이관됨. 이 문서는 **제품(발표 시스템 + 저작 하네스)** 상태만 다룬다.
>
> 최종 갱신: 2026-07-04 · 스타일 추가 지침 단일 문서화(`ADDING-A-STYLE.md`) 완료(`main` 머지 + push).

---

## 0. 한눈에

- **무엇**: 어떤 문서든 같은 저자의 작품처럼 읽히는 재사용 스크롤형 HTML 발표 시스템. `core/`(스타일 불가지) + `styles/<style>/`(스타일별 SSOT)로 분리. 현재 스타일 하나: `indigo-serif`.
- **저작 하네스**: `.claude/`에 `/plan → /build` 2-스킬 파이프라인 + zero-dep Node 종료 게이트. 3개 에이전트 호스트(Claude Code · opencode · Codex)에서 host-neutral 동작.
- **상태**: 제품·하네스 모두 **완성**. 하네스 테스트 10/10. 3-호스트 install 검증 완료.

---

## 1. 레포 구조

```
core/runtime-spec.md          스타일 불가지 (셸·DOM계약·서빙, HEX 0, 크롬 토큰만)
styles/indigo-serif/          현 유일 스타일 SSOT
  design.md(559줄, 시각 SSOT) · design.tokens.md(미러) · authoring-guide.md
  composition-guide.md · style.md · template.dc.html · design-system.answerkey.dc.html(1087줄)
  support.js(사이드카)
examples/                     워크드 예시 (feedbackops, feedbackops-design-report)
.claude/                      저작 하네스 (비규범 tooling)
  skills/{plan,build}/SKILL.md · lib/{gate,plan-schema,verify-doc}.mjs + test/
  README.md(하네스 개요 + 3-호스트 install 증거)
archive/                      동결 참고자료 (parserimprove — 제품 아님, provenance만)
docs/superpowers/             spec + plan 문서
ADDING-A-STYLE.md             스타일 추가 절차 + 불변식 게이트 (프로세스 문서, 값 미소유)
README.md · CLAUDE.md · AGENTS.md
```

핵심 불변식은 `CLAUDE.md` 참조 (core 제로-HEX · 스타일 self-contained · answer-key-wins · 시맨틱 색분리 · 인라인 스타일만 · support.js 사이드카).

---

## 2. 이 세션 작업 (2026-07-04)

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
- [ ] `build/SKILL.md`의 `.claude/lib/` 경로를 cwd-robust하게(또는 fast-fail 메시지) — Codex 전역 노출 시 repo 밖 호출 대비. 현재는 문서화(repo-scoped)로 갈음.
- [ ] `plan-schema.mjs`가 어느 SKILL.md에서도 호출 안 됨(`grep` 결과 verify-doc.mjs만 참조). `/plan`이 content-plan 검증에 써야 하는지 확인 or 내부용 명시.
- [ ] 토큰 CSS 변수화 + allowlist 린터 (인라인 토큰 드리프트 방지) — 필요 생길 때.
- [ ] `support.js`의 `cssToObj` data-URI 맹글링 수정 (SVG 엣지 예외 개방 선행조건) — 트리거 있을 때.

### 스타일 시스템
- [ ] **2번째 스타일 추가 시**: 절차 = `ADDING-A-STYLE.md`(복제 → 토큰·voice·template 교체 → 크롬 토큰 6슬롯 배선 → README 등록 → 8-항목 게이트). `core/` 무손. 이때 D2(문서 분리 seam) + 스킬화 트리거 재검토.

---

## 5. 커밋 (이 세션, `main`)

| 커밋 | 내용 |
|------|------|
| `4b93de1` | parserimprove 아카이브 + install spec/plan |
| `250aca3` | 다중 호스트 install 브릿지 (install.sh + AGENTS.md + 테스트 + 증거) |
| `76bf3ce` | merge → main (push 완료) |
| `0962807` | 스타일 추가 지침 단일 문서화 (`ADDING-A-STYLE.md` + README/CLAUDE 배선, ff-merge → main push) |

> 적대적 리뷰 1회(Explore 서브에이전트) GO-WITH-CHANGES 5개 must-fix 전부 반영: C1(심링크 discovery 실증), M1(재시작 안내), M2(repo-scoped 문서화), M3(AGENTS 호스트 문구 정정), config 등록 회피.

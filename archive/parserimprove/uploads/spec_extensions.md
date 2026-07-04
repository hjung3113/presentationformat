# SPEC EXTENSIONS — 컴포넌트·계약 문서군을 위한 확장 팩

> 적대적 리뷰(`monorepo_docs_review.md`가 아니라 발표시스템 리뷰, 워크플로우 산출)의 상위 로드맵을 기존 스펙(`design.md`·`authoring-guide.md`·`composition-guide.md`)에 접어 넣기 위한 **확장 스펙**이다. 각 항목은 어느 코어 파일에 병합될지 명시한다. 값·형식은 코어 스펙 토큰을 그대로 재사용한다(드리프트 방지).
>
> **왜 필요한가**: 캐노니컬 예시(v2.dc.html) 같은 '프로젝트 브리프' 형은 현 스펙으로 재현 가능하나, 이번 소스의 지배적 형인 **컴포넌트 설계문서 / 통합 계약**(책임경계·계약표·다대다 상호작용·폴리글랏 언어경계)은 대응 장치가 없어 즉흥 제작→드리프트를 유발한다. 이 문서가 그 빈 슬롯을 채운다.
>
> ⚠️ 세부 구현이 아니라 **온스펙 컴포넌트·페이지타입·도식·프로세스**를 정의한다. CSS는 전부 순수 div·인라인 스타일(코어 원칙 §0 준수), SVG 없음.

---

## 0. 색법칙 결정 (선행 — 전 항목의 전제)

리뷰의 최대 충돌: 모노-휴 색법칙(색은 오직 old-vs-new + 상태만 인코딩)이 폴리글랏·소유권·책임경계라는 **범주 차원**을 표현 못 한다.

**결정: 모노-휴 색법칙을 유지한다. 대신 두 채널을 신설한다.**

1. **중립 경계 톤 (scope-neutral)** — In-Scope/Out-of-Scope의 out-of-scope는 **NOTE-그레이 계열**(`fill-50 #F8F9FD` / `border #E7E9F3` / label `muted-500 #8A91A6`)로 칠한다. **앰버·그린 절대 금지** — out-of-scope는 "나쁨"이 아니라 "경계"다(`design.md §8.2` 안티패턴 준수).
2. **범주 채널 = 색이 아닌 mono-tag** — 언어(.NET/Py)·소유자는 색으로 인코딩하지 않고 **모노 뱃지**로 표기한다(§A.2). 색은 여전히 의미(old/new/state)만 나른다.

> 이 결정으로 이후 모든 신규 컴포넌트가 색법칙을 깨지 않으면서 컴포넌트·계약 문서를 표현할 수 있다.

---

## A. 새 토큰 (→ `design.md §1`)

### A.1 scope-neutral (책임경계 중립)
기존 토큰 재사용, 신규 HEX 없음. 규칙만 고정한다.

| 의미 | 재사용 토큰 | 규칙 |
|------|-------------|------|
| In-Scope (하는 일) | `accent-050 #EEF0FF` fill · `accent #4338CA` | 키 처리 |
| Out-of-Scope (안 하는 일) | `fill-50 #F8F9FD` · `border #E7E9F3` · `muted-500 #8A91A6` | **중립 그레이. 앰버/그린 금지** |
| 위임 대상 (누가 대신) | `muted-400 #9AA0B2` | `→ 담당 컴포넌트` 표기 |

### A.2 category mono-tag (폴리글랏·소유자)
언어/소유자 범주 뱃지. 색이 아니라 **글리프·모노폰트**로 구분.

```
.NET 뱃지:  700 9.5px/1 'JetBrains Mono'; letter-spacing:.04em; color:#4338CA; background:#EEF0FF; border:1px solid #C9CEF4; border-radius:5px; padding:3px 7px;   → 텍스트 ".NET"
Python 뱃지: 같은 형태, color:#5A6175; background:#F1F3F7; border:1px solid #DDE1EA;   → 텍스트 "Py"
```

- 두 뱃지는 **채도가 아니라 명도/텍스트로만** 구분(indigo-fill vs slate-fill). old-vs-new 의미와 충돌하지 않도록, 이 뱃지는 항상 노드 우상단 코너에 작게 부착하고 본문 색과 분리한다.
- 3개 이상 언어면 뱃지 대신 범례를 두고 노드에 모노 이니셜(`N`/`P`)만.

---

## B. 새 컴포넌트 (→ `design.md §4`)

### B.1 책임경계 (In-Scope / Out-of-Scope)  ★최우선
모든 컴포넌트 설계문서의 반복 시그니처(§2 하는 일/하지 않는 일). Do/Don't(초록/앰버)로 대체하면 out-of-scope가 '나쁨'으로 오인코딩되므로 **전용 컴포넌트**를 둔다.

```
container: display:grid; grid-template-columns:1fr 1fr; gap:16px;
IN 패널:  border:1px solid #DADEF8; border-radius:14px; padding:20px 22px; background:linear-gradient(160deg,#F5F6FF,#fff);
          헤더: [●] 600 13px #4338CA "하는 일 (In-Scope)"
          행: 500 13px/1.6 #3E4658, 앞에 · 마커 (accent)
OUT 패널: border:1px solid #E7E9F3; border-radius:14px; padding:20px 22px; background:#F8F9FD;   ← 중립 그레이
          헤더: [○] 600 13px #8A91A6 "하지 않는 일 (Out-of-Scope)"
          행: 500 13px/1.6 #5A6175 — 항목  +  → 담당 (400 12px #9AA0B2)
```

- **색법칙 준수**: IN=indigo, OUT=중립 그레이. 앰버/그린 없음.
- 좌우 대칭, 행 수 ±1 이내(병렬성). 각 OUT 항목은 "누가 대신"을 `→`로 명시.
- 가로형이므로 full-width, 좌우 분할(1fr 1fr)은 이 컴포넌트 내부 구조일 뿐 도해-좌우배치 규칙과 무관.

### B.2 계약 통합지점 카드 (→ 인터페이스/계약 페이지타입 D.2의 핵심)
`integration_contracts` ①~⑦처럼 "번호 붙은 통합지점 + 전송/입력/출력/실패 4필드"를 담는다.

```
card: border:1px solid #E7E9F3; border-radius:14px; padding:18px 20px;
head: [번호배지 ①] (circled numeral, accent) + 600 15px #15172B 지점명 + (우측) category mono-tag
body: 2×2 미니 그리드 — 각 셀:
      라벨 700 10px/1 'JetBrains Mono' letter-spacing:.06em #8A91A6 (전송/입력/출력/실패)
      값   400 12.5px/1.6 #5A6175
실패 셀만 라벨 #B4543F 허용(WARN 계열, 실패는 정당한 negative 신호).
```

- 지점이 언어경계(★)면 head 우측에 `.NET`↔`Py` 두 뱃지.
- 4~7개 카드는 2열 그리드. 7개 초과면 표(§4.7)로 승격.

### B.3 합의/호환 체크리스트
`integration_contracts §5`의 착수 전 합의 리스트. Do/Don't·check-matrix와 구별되는 **단일 열 [ ] 항목**.

```
list: border:1px solid #E7E9F3; border-radius:12px; padding:16px 20px; background:#FCFCFE;
row:  display:flex; gap:10px; padding:7px 0; border-top:1px solid #F0F1F6 (첫 행 제외)
      box: 13px 사각 border:1.5px solid #C9CEF4; border-radius:4px; (빈 체크박스)
      text: 400 13px/1.6 #3E4658, 키워드만 ink bold
```

- 부정/경고 아님 → 색 없음(중립). 완료 표시가 필요하면 box에 `✓ #4338CA`.

### B.4 provenance 마스트헤드
각 설계문서가 갖는 "작성 목적·근거 문서·충돌 시 상위 우선" 서두 blockquote를 규격화(커버 thesis·closing disclaimer와 구분).

```
block: border-left:3px solid #C9CEF4; background:#F8F9FD; border-radius:0 10px 10px 0; padding:14px 18px; margin-bottom:8px;
text:  400 12.5px/1.7 #5A6175; 라벨 성격 어구(근거·상위문서)만 ink bold
```

- 섹션이 아니라 **커버 직후 또는 첫 섹션 리드 위** 1회. 문서군에서 문서 간 관계를 일관되게 읽히게 한다.

---

## C. 새 도식 (→ `design.md §5`)

### C.1 N×N 상호작용 / RACI 매트릭스  ★다대다 그래프의 온스펙 대안
다대다 라벨드 그래프(교차·역방향 엣지)는 no-SVG로 못 그린다. **행·열이 같은 집합인 매트릭스**로 대체한다(계약 맵의 본질 형태). §4.14 check-matrix(옵션×기준)와 구별 — 여기는 **동일 집합 N×N**.

```
grid: display:grid; grid-template-columns:120px repeat(N,1fr); gap:6px;
축 헤더(행/열): 600 11px #4338CA, 대각(자기 자신) 셀은 background:#F1F3F7 빗금 느낌(#EDEEF4)
셀: min-height:34px; border-radius:6px; background:#FAFBFE; border:1px solid #EEF0F6;
    관계 있으면: background:#EEF0FF; 안에 관계유형 라벨 500 10px #4338CA (예: "수집명령", "가공결과")
    관계 없으면: 빈 셀 (background:#FCFCFE)
방향: 행=from, 열=to (문서에 1회 명시). 양방향은 셀에 ↔ 접두.
범례: from→to 규칙 + 매체(파일/DB/gRPC) 색-무관 텍스트 태그.
```

- 색은 '관계 유무'만(indigo=있음), 관계 종류는 텍스트로. 색법칙 준수.
- 노드 위치 문제(팬아웃 허브)를 매트릭스로 흡수 → SVG 불필요.

### C.2 계층 / 티어 스택
`scheduler §3`의 상태→정책→메커니즘 계층('정책=무엇 / 메커니즘=어떻게')처럼 **수직 순서·의존 방향**을 인코딩. 평면 카드로 그리면 계층 의미가 소실됨.

```
stack: display:flex; flex-direction:column; gap:0; (층이 맞닿음)
layer: border:1px solid #E2E5F0; padding:14px 18px;
       상단 층 border-radius:12px 12px 0 0, 하단 층 0 0 12px 12px, 중간 층 각짐
       좌측 3px accent 바로 '깊이' 표시(위=진한 #4338CA, 아래=연한 #C9CEF4 그라데이션 단계)
       head: 600 13px #15172B 층 이름 + (우측) 400 12px #9AA0B2 역할('무엇을'/'어떻게')
       body: 400 12.5px/1.55 #5A6175 한 줄
층간 의존: 층 사이 중앙에 ↓(#B6BBD6) 또는 '읽기/쓰기' 라벨
```

- 위→아래 = 상위→하위(의존 방향). subgraph처럼 하위 flow를 감싸야 하면 layer body 안에 중첩 노드 그리드.

### C.3 스키마 표 + ER 관계
DB 정규화가 핵심 주제인데 장치 없음. 엔티티 스키마 표 + 1:N 커넥터.

```
엔티티 표: §4.7 table 변형 — 헤더 soft(#F3F4FA), 4열: 필드 / 타입 / 필수 / 의미
           필드 컬럼 600 12.5px #3A4255(첫 열 강조), 필수=● #4338CA / ○ #C2C8D4
관계: 두 엔티티 표 사이 커넥터 — "1 ──< N" (크로우풋 텍스트 글리프), 500 11px #9AA0B2
정규화 before/after: §5.2 before/after 패널 재사용 — BEFORE=한 테이블(혼재, slate), AFTER=분리된 표 2~3개(indigo)
```

---

## D. 새 페이지타입 (→ `authoring-guide §2 스켈레톤 + §4`)

### D.1 컴포넌트 설계 문서 arc  ★
현 스켈레톤은 '프로젝트 브리프' 아크(배경/문제/방향/리스크)만 상정 → 컴포넌트 문서를 패딩하게 만든다. 대체 아크를 추가한다.

| 순서 | 페이지 | eyebrow 예 | 무게중심 |
|------|--------|-----------|----------|
| 1 | Cover (컴포넌트명 + 한 줄 정의) | `COMPONENT · 한 줄 정의` | h1 |
| 2 | 정의·배경 (왜 분리) | `01 · OVERVIEW` | 리드 또는 단일 도해 |
| 3 | 책임 경계 (In/Out-of-Scope) | `02 · SCOPE` | **B.1 책임경계 컴포넌트** |
| 4 | 설계 원칙 | `03 · PRINCIPLES` | 카드 그리드(열거) |
| 5 | 입출력 (계약) | `04 · INTERFACE` | 표 또는 B.2 카드 |
| 6 | 내부 구조 | `05 · INTERNALS` | 도해(flow/스택/시퀀스) |
| 7 | 테스트·범위·미정 | `06 · SCOPE&TESTS` | 표 / 로드맵 |
| — | 용어 (필요 시) | `REFERENCE` | 없음 |

- 얇은 컴포넌트 문서는 5·7을 병합해 **5~6섹션**으로. (§F 밀도 폴백 참조)
- greenfield(대비할 AS-IS 없음) → `authoring-guide §4.4` 준용: before/after 대신 target-structure 도해, slate/amber 잠듦, indigo 단색. 정체성은 세리프·figure·`~한다`로 유지.

### D.2 인터페이스 / 계약 페이지타입
`integration_contracts` 형. 통합지점 번호배지 + B.2 4필드 카드 + 하단 B.3 합의 체크리스트로 마감.

- 상황→장치 표(`authoring-guide §5.1`)에 **행 추가**: "컴포넌트 간 계약 → 통합지점 카드(B.2)", "다대다 관계 → N×N 매트릭스(C.1)", "책임 경계 → In/Out-of-Scope(B.1)".

---

## E. mermaid → CSS 캐노니컬 매핑 (→ `authoring-guide §5` 또는 신규 프로세스 절)

원문 설계문서 도해는 전부 mermaid다. 무손실 매핑이 없으면 같은 도해가 저자/AI마다 다르게 그려진다. **결정적 대응표**를 고정한다.

| mermaid | 조건 | CSS 컴포넌트 |
|---------|------|-------------|
| `flowchart LR A-->B-->C` (선형) | 3~5 단계 | process step row (`§4.9`) |
| `flowchart TB` 수직 선형 | 분기 없음 | vertical flow (`§5.7`) |
| `flowchart` 조건 분기(`A-->|yes|`) | 분기 1~2 | UML activity 다이아몬드(`§5.4`) |
| `flowchart` 다대다·팬아웃·양방향 | 노드 ≥5, 교차 엣지 | **N×N 매트릭스(C.1)** (그래프 아님) |
| `sequenceDiagram` (alt 없음) | ≤4 참여자 | UML sequence(`§5.17`) |
| `sequenceDiagram` + `alt/opt` | 분기 지배 | UML activity(`§5.4`)로 우회 + KEY 콜아웃으로 조건 명시 |
| `subgraph` 계층 | 상태/정책/메커니즘류 | **계층 스택(C.2)** |
| `erDiagram` / YAML 스키마 | 필드·관계 | **스키마 표+ER(C.3)** |
| `flowchart` 트리(1→다) | 위상 | tree(`§5.7`) |

> 규칙: 한 문서 안에서 같은 mermaid 형은 같은 CSS 컴포넌트로만 옮긴다. 캐노니컬이 컨버터 흐름을 2가지로 렌더한 것이 드리프트의 실증이다.

---

## F. 문서군(suite) 오소링 규칙 (→ `authoring-guide` 신규 절)

`authoring-guide`는 '한 편'만 규율한다. 교차참조하는 6~8편 문서군에는 세트 일관성 규칙이 필요하다(`monorepo_docs_review`가 07/09 중복·breaking 4파일 drift로 실증).

1. **공유 마스트헤드**: 모든 문서 커버 eyebrow에 세트 태그 공통(`PARSER V2 · <문서명>`). 네비 브랜드도 세트명 고정.
2. **크로스도크 참조 표기**: 다른 문서 참조는 `` `file.md §N` `` 형식 1가지로 통일. 상세는 재서술 않고 링크.
3. **개념 정본/참조**: 각 개념(carryover·SSOT·시나리오…)은 **한 문서가 정본**, 나머지는 참조. breaking 목록·용어는 단일 소스(`monorepo_skeleton`의 GLOSSARY/01).
4. **eyebrow 넘버링 정합**: 세트 내 문서는 같은 카테고리 어휘(OVERVIEW/SCOPE/INTERFACE…) 사용.
5. **provenance 마스트헤드(B.4)**: 각 문서 서두에 근거·상위문서·우선순위 1회.
6. **밀도 프로파일 통일**: 세트 내 문서는 같은 페이지타입 아크(D.1)를 따라 편차를 줄인다.

---

## G. 토큰 거버넌스 (→ `design.md §0` / 프로세스)

인라인 HEX·"검증 안 함" 모델은 드리프트의 근본 원인. 캐노니컬 v2조차 오프토큰(`#A8AEC4`·`#C0A8E0`, v2 line 92·96)을 쓴다.

1. **CSS 커스텀 프로퍼티화**: 색 토큰을 helmet `<style>`의 `:root { --accent:#4338CA; … }`로 고정하고, 본문은 `var(--accent)` 참조. 토큰 변경이 1회 편집이 되고 오프토큰이 눈에 띈다. (인라인 스타일 원칙과 병행 — 색만 변수화.)
2. **allowlist 린터**: 생성 HTML에서 팔레트 밖 HEX·시맨틱 색법칙 위반(AS-IS zone의 indigo 등)을 탐지하는 검증기. `tools/`.
3. **range→단일값 확정**: radius/타입의 range 토큰(`r-node-lg 9–10`, `t-body 14–14.5`)을 단일값으로 접어 '두 저자 모두 준수하며 다른 값' 문제를 제거. 머신 미러(design.tokens.md)의 점값과 일치시킨다.
4. **캐노니컬 정정**: v2의 오프토큰을 팔레트 내 값으로 교체(골드 표준부터 무결하게).

---

## H. 후속·미검증 (지금 열지 말 것)

- **라벨드 노드-링크 토폴로지 그래프(SVG 엣지 예외)**: 다대다의 진짜 그래프 표현. 단 **선행조건** — `support.js`의 `cssToObj`가 인라인 style을 순진하게 split해 **SVG data-URI를 깨뜨림**(line 674). 속성 allowlist + data-URI는 helmet `<style>`/`<img>`로만 규칙이 선행돼야 개방. 그 전에는 **C.1 매트릭스로 근사**.
- **반응형 인터랙션 레시피 + teardown 레지스트리**: 탭/필터를 setState로 넣을 때만. 진행바·active-nav가 명령형이라 리렌더가 지움 → 상태구동 전환 필요. 인터랙티브 위젯 도입 시에만.
- **캐노니컬 ↔ composition-guide 정합화**: v2 §3이 밀도 예산 초과 → 리팩터하거나 grandfathered 표기. 미검증 §5 도식(§5.11/5.12/5.17~5.23)에 워크드 참조 페이지 추가.

---

## 적용 우선순위 요약

| 우선 | 항목 | 병합 대상 | 노력 |
|------|------|-----------|------|
| 상 | B.1 책임경계 컴포넌트 + A.1 중립 톤 | design.md §4 | 소 |
| 상 | D.1 컴포넌트 문서 arc | authoring §2 | 소 |
| 상 | D.2 인터페이스/계약 페이지타입 + B.2 | authoring §2·§4, design §4 | 중 |
| 상 | C.1 N×N 매트릭스 | design §5 | 중 |
| 상 | F 문서군 규칙 | authoring 신규절 | 중 |
| 상 | E mermaid→CSS 매핑 | authoring §5 | 중 |
| 상 | G 토큰 거버넌스(1·2·3·4) | design §0 + tools | 중 |
| 상 | A.2 category mono-tag | design §1 | 중 |
| 중 | C.2 계층 스택 / C.3 스키마·ER / B.3 체크리스트 / B.4 마스트헤드 | design §4·§5 | 소~중 |
| 하 | H 후속(SVG 엣지·인터랙션·정합화) | — | 대 |

> 파일럿 검증: 이 확장 팩의 상위 항목(D.1·B.1·greenfield·밀도폴백)을 `converter_pilot.dc.html`로 실제 제작해 컴포넌트 문서 형이 v2 밀도로 재현되는지 확인한다.

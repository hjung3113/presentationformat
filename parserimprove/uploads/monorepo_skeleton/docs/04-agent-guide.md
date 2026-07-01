# 04. 코드 에이전트 가이드

*owner: TBD · status: draft · last-updated: 2026-07-01*

> 07(agent-instructions, 영어) + 09(task-prompt) + 10(impact-template)을 **하나로 통합**하고 한국어로 통일. contract-first 원칙.

## 핵심 원칙

1. `contracts/`(표준 로그 스펙·기준정보·정규화/보정·진행상태·골든)를 source of truth로 본다.
2. 의존성을 코드로만 추측하지 않는다. 계약과 컴포넌트 README를 먼저 본다.
3. 경로·DB 접속을 하드코딩하지 않는다.
4. 스펙/스키마/기준정보/진행상태를 바꿀 때 영향 컴포넌트를 식별한다.
5. 불명확하면 추측하지 말고 "명시 필요"로 보고한다.

## 작업 전 읽는 순서 (contract-first)

1. `README.md` → 2. `docs/00-system-and-structure.md` → 3. `docs/01-contracts-and-change-policy.md`
4. 관련 `contracts/*` → 5. 대상 컴포넌트 `README.md` → 6. 그 다음에야 `src/`

> 무작위 소스부터 읽지 않는다. 계약 그래프를 먼저 이해한다.

## 코드/계약 변경 전 자문

- 어떤 컴포넌트를 바꾸는가? (.NET/Python)
- 어떤 계약(스펙·기준정보·규칙·진행상태)을 읽고 쓰는가?
- 표준 로그 스펙·TSV 포맷·DB 스키마·carryover가 영향받는가?
- breaking인가? (`docs/01`의 단일 정본 목록으로 판정)
- **골든테스트가 필요한가?** (가공 로직 변경이면 필수)

## 보고 형식

```txt
## 요약
## 관련 파일 (계약 우선)
## 컴포넌트/계약 관계
## 계약 영향 (스펙/기준정보/진행상태/스키마)
## Breaking 여부 (docs/01 기준)
## 권고 변경 (우선순위)
## 검증 계획 (골든테스트·단위테스트·로컬 실행)
```

## 검증 기대치

- **골든 파일(동등성) 테스트** (가공 결과 diff) — 1급
- 정규화·보정 데이터 기반 테스트
- 영향 컴포넌트 단위 테스트
- 계약 문법/필수필드 검증 (도구 구현 상태는 `tools/README.md` 확인)

## 주의

- DW 개념(mart/raw, S3/parquet, dashboard consumer, dataset별 freshness SLA)을 도입하지 않는다 — 이 프로젝트에 없는 개념이다.
- 시나리오(live/rework/따라잡기)는 스케줄러만 안다. 다른 컴포넌트에 넣지 않는다.

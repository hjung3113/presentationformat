# 설비 로그파서 파이프라인 모노레포

> 이 레포는 반도체 설비 이벤트 로그파서의 여러 컴포넌트(스케줄러·파일수집기·컨버터·표준파서·Configuration파서)와 이들 사이의 **계약**을 하나의 공간에서 관리한다.
>
> ⚠️ 이 문서군은 일반 DW/BI ETL 템플릿이 아니다. S3/parquet/Spark·mart 계층·dashboard consumer 개념은 쓰지 않는다. 그 배경은 `../monorepo_docs_review.md` 참조.

## 4가지 메타 원칙

1. **경로·설정을 코드에 하드코딩하지 않는다.** AP서버 경로·DB 접속·표준 로그 스펙 위치는 계약(`contracts/`)에서 해석한다.
2. **모든 산출물은 owner와 명시적 계약을 가진다.** (표준 로그 스펙, 기준정보, 진행상태, 골든세트)
3. **변경 영향도는 PR 단계에서 점검한다.** (경량 체크 — 아래 PR 템플릿)
4. **에이전트·신규 인력은 코드보다 계약을 먼저 읽는다.** (contract-first, `docs/04-agent-guide.md`)

## 문서 인덱스 (어디부터 읽나)

| 순서 | 문서 | 언제 읽나 |
|------|------|-----------|
| 1 | `docs/00-system-and-structure.md` | 전체 그림·컴포넌트·레포 구조·폴리글랏·토폴로지 |
| 2 | `docs/01-contracts-and-change-policy.md` | 계약 대상이 무엇인지 + 변경정책(breaking 정본) |
| 3 | `docs/02-development-guide.md` | 컴포넌트 개발 규약(.NET/Python 빌드·테스트) |
| 4 | `docs/03-lineage-and-ownership.md` | 컴포넌트/데이터 흐름·owner |
| 5 | `docs/04-agent-guide.md` | 코드 에이전트에게 작업 시킬 때 |
| — | `docs/GLOSSARY.md` | 용어 단일 정의 (수시 참조) |

## 상세 설계문서 (이 레포 밖, 단일 정본)

컴포넌트 상세 설계는 아래 문서가 정본이다. 본 모노레포 문서는 이를 **중복 서술하지 않고 참조**한다.

- 파일 수집기: `../file_collector_design.md`
- 스케줄러: `../scheduler_design.md`
- 컴포넌트 간 통합·인터페이스 계약: `../integration_contracts_design.md`
- 프로젝트 전체: `../parser_project_revised.md`

## 주요 디렉터리

```txt
contracts/       계약: 표준 로그 스펙 / 기준정보 마스터 / 진행상태·carryover / 정규화·보정 규칙 / 골든세트
components/       각 컴포넌트 (.NET: 파서·컨버터 / Python: 스케줄러·수집기·Config파서)
libs/            공통 라이브러리 (언어별: libs/dotnet, libs/python)
tools/           계약 검증·골든테스트 러너 등 (구현상태 표기)
docs/            시스템·계약·개발·에이전트 문서
.github/         PR 템플릿, CI (언어 매트릭스)
```

## 문서 소유·갱신 규칙

- 각 문서 상단에 `owner` / `status`(draft·approved) / `last-updated` 를 둔다.
- 계약(`contracts/`)이 코드보다 우선한다. 코드가 계약과 다르면 코드가 틀린 것.
- **단일 정본 규칙**: 같은 정보(breaking 목록·용어·PC그래프 예시)를 여러 문서에 복제하지 않고 한 곳에 두고 링크한다.

## PR 전 경량 체크 (MVP 기준)

- [ ] 변경 요약
- [ ] breaking 여부 (표준 로그 스펙·DB 스키마·기준정보 구조 변경이면 breaking)
- [ ] 영향 컴포넌트 (.NET/Python 어느 쪽)
- [ ] 골든테스트 결과 (해당 시)
- [ ] 로컬 실행 확인

---

*owner: TBD · status: draft · last-updated: 2026-07-01*

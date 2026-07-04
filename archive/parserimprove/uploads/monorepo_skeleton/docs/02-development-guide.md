# 02. 개발 가이드 (컴포넌트·파일·스케줄러)

*owner: TBD · status: draft · last-updated: 2026-07-01*

> 폴리글랏(.NET + Python) 모노레포에서 컴포넌트를 개발하는 공통 규약. 스케줄러/수집기 상세는 각 설계문서 참조.

## 컴포넌트 공통 규약

각 컴포넌트 폴더는 다음을 가진다.

```txt
components/<component>/
  README.md      책임·입출력·실행법
  src/
  tests/
  (.NET: *.csproj / Python: pyproject.toml)
```

- 입출력(원본 위치·산출 위치·DB 대상)은 **계약을 통해 해석**. 경로 하드코딩 금지.
- 컴포넌트별 로직은 자기 폴더에. 공유 로직만 `libs/<lang>/`.
- 다른 컴포넌트 내부 코드 직접 import 금지.

## 폴리글랏 빌드·테스트

| | .NET (파서·컨버터) | Python (스케줄러·수집기·Config파서) |
|---|---|---|
| 프로젝트 | `*.csproj` / 솔루션 | `pyproject.toml` / venv |
| 공유 | `libs/dotnet` (NuGet) | `libs/python` (pip) |
| 빌드/테스트 | `dotnet build` / `dotnet test` | `make test` 등 |
| CI | **언어 매트릭스** — 변경 경로 감지 후 .NET / Python 잡 분리 | |

- 크로스 언어 공유는 코드가 아니라 **계약/스키마로만** (`../integration_contracts_design.md`).
- 언어·런타임 버전은 고정(핀). CI가 두 언어를 모두 검증.

## 경로·설정 관리 (하드코딩 금지 재정의)

DW 템플릿의 `s3://...` 예시는 폐기. 이 프로젝트의 나쁜/좋은 예:

```text
나쁜 예:  하드코딩된 AP서버 경로/DB 접속 문자열을 소스에 직접 작성
좋은 예:  계약(log-spec 위치·경로 규약·DB 대상)을 통해 해석
```

- 파일 경로·네이밍·쓰기 원자성 규약은 `../integration_contracts_design.md` §2(②) 참조.
- `tools/`의 린터는 `s3://`가 아니라 **온프렘 경로/DB 접속 하드코딩 패턴**을 탐지.

## 스케줄러 개발 (요지만 — 상세는 설계문서)

> 정본: `../scheduler_design.md`. 여기서는 개발 시 지켜야 할 경계만.

- 스케줄링 축은 **dataset DAG가 아니라 "설비 단위 주기 팬아웃"**.
- 시나리오(live/rework/따라잡기)는 스케줄러만 안다. 수집기·파서는 모른다.
- 상태는 DB(SSOT). 스케줄러가 자체 보유 금지.
- 가공 전 **probe(원본 존재 확인) → 없으면 collect(수집 명령)**.
- 부하 평준화·CPU 기반 분배는 메커니즘 계층. (MVP는 최소, 고도화에서 확장)
- ⚠️ backfill과 "live 따라잡기"는 다른 개념 — 혼용 금지(`../scheduler_design.md` §4).

## 테스트

- **골든 파일(동등성) 테스트가 1급 검증**: 기존 파서 출력 vs 신규 출력 diff. `contracts/golden/` 세트 사용.
- 정규화·보정은 (입력, 기대출력) 쌍의 **데이터 기반 파라미터화 테스트**.
- 신규 컴포넌트는 처음부터 단위 테스트 가능한 구조(작은 함수·의존성 주입).

## PR 전 체크

README의 경량 PR 체크 항목 사용. (breaking 여부·영향 컴포넌트·골든테스트·로컬 실행)

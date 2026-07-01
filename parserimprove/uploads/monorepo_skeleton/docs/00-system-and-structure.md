# 00. 시스템 개요 및 레포 구조

*owner: TBD · status: draft · last-updated: 2026-07-01*

## 목적

설비 이벤트 로그파서는 설비가 실시간으로 남기는 로그를 정형 데이터로 가공해 공정 DB에 적재하는 파이프라인이다. 이 레포는 그 컴포넌트들과 컴포넌트 간 **계약**을 한곳에서 관리한다.

## 컴포넌트 (책임 분리)

| 컴포넌트 | 언어 | 책임 | 상세 |
|----------|------|------|------|
| **스케줄러** | Python | 컨트롤타워. 시나리오 결정·구간 산정·CPU 기반 부하 평준화·상태(DB SSOT) 관리 | `../scheduler_design.md` |
| **파일 수집기** | Python | 원본 확보·가용성 관리. 시나리오는 모름 | `../file_collector_design.md` |
| **컨버터** | .NET | 비표준 로그 → 표준 로그 스펙 형식으로 변환 | (설계 예정) |
| **표준 로그 파서** | .NET | 표준 로그 가공 (값 정규화·보정·start/end 병합 내부 포함) | (설계 예정) |
| **Configuration 파서** | Python | 표준/비표준과 성격이 다른 설정 파일 가공 | (설계 예정) |

> 컴포넌트 간 상호작용·데이터 계약은 `../integration_contracts_design.md`가 정본.

## 데이터 흐름

```txt
설비 → (실시간 로그: 표준 TSV / 비표준)
  → 파일 수집기(원본 확보)
  → [비표준] 컨버터(표준화)
  → 표준 로그 파서(값 정규화·보정·start/end 병합)
  → 공정 DB (결과 + 설비별 진행상태 SSOT)
```

> ⚠️ raw→mart 계층 모델이 아니다. "mart 테이블/일 집계"가 아니라 설비 로그의 연속 가공이다.

## 인프라 토폴로지 (온프렘)

```txt
DB 서버 (공정 데이터·기준정보·진행상태 SSOT)
  └─ AP 서버 (담당 설비 근처, 수집·가공 수행)
       └─ 담당 설비들
```

- S3/오브젝트스토리지/Spark 없음. AP서버 로컬 파일시스템 + 공정 DB.
- 스케줄러·수집기·워커(파서/컨버터)는 대개 같은 AP서버에 co-locate. (고도화 시 Docker+Airflow/n8n, 대량 처리량은 큐+워커)

## 폴리글랏 구조

파서·컨버터(.NET)와 나머지(Python)가 한 레포에 공존한다. 언어 경계는 **프로세스/파일/DB**로만 넘는다(객체 직접 전달 금지). 세부 계약(인코딩·TSV·타임존·job 페이로드 등)은 `../integration_contracts_design.md` 참조.

```txt
components/
  parser/        .NET (csproj/솔루션)
  converter/     .NET
  scheduler/     Python (pyproject)
  collector/     Python
  config-parser/ Python
libs/
  dotnet/        공유 .NET 라이브러리 (NuGet)
  python/        공유 Python 패키지 (pip)
```

## 레포 구조

```txt
repo/
  README.md
  docs/
  contracts/
    log-specs/       표준 로그 스펙 (TSV 스키마)
    reference-data/  기준정보 마스터 (설비/모델/메이커/모듈타입/alias)
    normalization/   값 정규화·보정 규칙 카탈로그
    state/           설비별 진행상태·carryover 모델
    golden/          골든파일(동등성) 세트 메타
  components/
  libs/
  tools/
  .github/
```

## 금지사항

- 다른 컴포넌트의 내부 코드를 직접 import하지 않는다 (공유는 `libs/` 언어별로).
- 파일 경로·DB 접속을 코드에 하드코딩하지 않는다.
- 계약(표준 로그 스펙·기준정보) 없이 새 산출 형식을 만들지 않는다.
- 진행상태를 스케줄러 내부에 자체 보유하지 않는다 (DB SSOT).

# 용어집 (GLOSSARY)

*owner: TBD · status: draft · last-updated: 2026-07-01*

> 용어의 단일 정의처. 다른 문서는 재정의하지 않고 여기를 참조한다. (상위 `../parser_project_revised.md` §0과 정합)

| 용어 | 정의 |
|------|------|
| **표준 로그 스펙** | 회사 내부 표준 로그 양식. 설비사에 전달해 이 형식으로 로그를 생성하게 함. TSV(txt) |
| **표준 로그 / 비표준 로그** | 스펙 준수 로그 / 설비사 자체 양식 로그(컨버터로 표준화 필요) |
| **컨버터** | 비표준 로그를 표준 로그 스펙 형식으로 변환하는 컴포넌트(.NET) |
| **값 정규화(normalization)** | 설비사·모델별 제각각 표현(alias·코드·모듈타입)을 일관 형태로 정렬 |
| **보정(correction·enrichment)** | 로그 결함을 메움 — 누락 보강 + 잘못된 값 교정. 값 정규화와 별개 단계 |
| **carryover** | 파일이 시간단위로 분리되어 start/end가 다른 파일에 나뉠 때, 다음 파일로 이월하는 미완료/흐름 정보 |
| **기준정보 마스터** | 설비/모델/메이커 식별·매핑 + 모듈타입·alias 등 파서 동작을 좌우하는 마스터 데이터 |
| **진행상태(SSOT)** | 설비별 "어디까지 처리했는지" watermark. DB가 단일 진실 원천 |
| **시나리오** | 가공의 축. live / rework(재처리) / live 따라잡기(catch-up). "수집"과 분리 |
| **따라잡기(catch-up)** | 밀린 실시간 처리를 하루 단위씩 순차 소화. ⚠️ DW의 backfill과 다른 개념 |
| **probe / collect** | 스케줄러가 원본 존재 확인(probe) 후 없으면 수집기에 수집 명령(collect) |
| **골든 파일(동등성) 테스트** | 실제 로그 입력에 대해 기존 파서 출력과 신규 출력을 diff해 의도치 않은 차이를 검출 |
| **AP 서버 / DB 서버** | 설비 근처에서 수집·가공하는 앱 서버 / 공정 데이터·기준정보·진행상태를 보유한 DB 서버 |
| **폴리글랏 경계** | .NET(파서·컨버터)↔Python(스케줄러·수집기·Config파서)이 프로세스/파일/DB로만 데이터 교환하는 지점 |

## 쓰지 않는 용어 (DW 템플릿 잔재 — 도입 금지)

`mart` / `raw dataset` / `dataset_id` DAG / `dashboard·ML consumer` / dataset별 `freshness SLA` / `parquet`·`S3` storage / versioned dataset(`_v2`)·deprecation deadline.

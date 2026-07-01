# 01. 계약과 변경 정책

*owner: TBD · status: draft · last-updated: 2026-07-01*

> 이 문서는 **계약 대상**과 **변경 정책(breaking 목록의 단일 정본)**을 정의한다. breaking 목록은 이 문서에만 두고, 다른 문서·PR 템플릿은 여기를 링크한다.

## 계약 대상 (이 도메인의 SSOT)

일반 DW의 "dataset contract" 대신, 이 프로젝트의 계약 대상은 다음이다.

| 계약 | 위치 | 내용 | 정본 소유 |
|------|------|------|-----------|
| **표준 로그 스펙** | `contracts/log-specs/` | 표준 로그 TSV의 컬럼 순서·이름·타입·필수여부·의미 | 이 스펙 파일 |
| **기준정보 마스터** | `contracts/reference-data/` | 설비/모델/메이커/모듈타입/alias 매핑 | DB(스키마는 계약) |
| **정규화·보정 규칙** | `contracts/normalization/` | 값 정규화 + 보정 규칙 카탈로그(50종+), 데이터 기반 케이스 | 규칙 카탈로그 |
| **진행상태·carryover** | `contracts/state/` | 설비별 "어디까지 처리" watermark + 파일경계 carryover 모델 | DB(SSOT) |
| **골든 세트** | `contracts/golden/` | (입력 로그, 기대 출력) 동등성 검증 세트 메타 | 골든 세트 |

> 각 계약 항목의 실제 필드·스키마는 `../integration_contracts_design.md`의 "단일 소스" 규칙을 따른다.

## 계약에 공통으로 포함할 것

- `id`, `description`, `owner`
- 대상(설비/모델/메이커 범위 또는 전역)
- 버전 (호환 깨짐 감지용)
- 변경 정책 (아래 breaking 판정 적용)

## 기본 원칙

1. 모든 산출 형식은 계약을 가진다.
2. 코드는 계약에 선언된 것(스펙·스키마·규칙)을 참조한다.
3. 스펙/스키마 변경은 아래 호환성 규칙을 따른다.
4. **골든테스트가 계약 준수의 실행 검증이다** — 계약 변경은 골든 세트 갱신과 함께.

## Breaking 판정 (단일 정본)

다음 변경은 **breaking**이다.

- 표준 로그 스펙: 컬럼 삭제·rename·타입 변경·순서 변경, 필수여부 강화, TSV 구분자/인코딩/줄바꿈 변경
- 기준정보: 값 형식 변경(단일↔리스트), 키 의미 변경, 테이블 구조 변경
- 진행상태: watermark/carryover 의미·저장위치 변경
- DB 결과 스키마: 컬럼 삭제·타입 변경·PK 의미 변경
- 정규화·보정: 기존 케이스의 기대 출력 변경(신규 케이스 추가는 non-breaking)

다음은 **non-breaking**이다.

- 표준 로그 스펙에 nullable 컬럼 추가(맨 뒤)
- description 수정, consumer/owner 정보 갱신
- 신규 정규화·보정 케이스 추가 (데이터만 추가)
- warning-only 품질 규칙 추가

## 변경 절차 (경량 — MVP 기준)

무거운 다팀 승인·versioned dataset·deprecation deadline 절차는 **도입하지 않는다**(단일 소비자=설비 DB). 대신:

1. breaking 여부 판정 (위 목록)
2. breaking이면: 영향 컴포넌트(.NET/Python) 식별 + **골든테스트로 동등성 확인**
3. 스펙/스키마 버전 표기 갱신
4. PR에서 영향도 경량 체크 (README PR 항목)

> 고도화(멀티팀·외부 소비자 생김) 단계에서 승인·버저닝 절차 도입을 재검토한다. 지금은 조기 도입 금지.

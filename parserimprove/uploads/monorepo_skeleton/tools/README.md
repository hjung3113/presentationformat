# Tools

*owner: TBD · status: draft*

> ⚠️ 구현 상태를 명시한다. 미구현 도구를 규칙의 전제로 삼지 않는다(초안 문서군의 실수). MVP는 골든테스트 러너만 우선.

| 도구 | 상태 | 해야 할 일 |
|------|------|-----------|
| `run_golden.py` (또는 .NET 러너) | **TODO (MVP 우선)** | 골든 세트로 기존 vs 신규 출력 diff, 의도된 차이만 허용 |
| `validate_contracts` | TODO | YAML 문법·필수필드·id 중복·버전 표기 검사 (log-spec/reference/state/normalization) |
| `check_hardcoded_paths` | TODO | src에서 **온프렘 경로·DB 접속 문자열** 하드코딩 탐지 (⚠️ `s3://` 아님) |
| `gen_component_graph` | 나중 (고도화) | 컴포넌트↔계약 관계도 생성 |

## 원칙

- 도구가 없으면 PR 체크리스트에서 해당 항목을 "해당 없음"으로 두고, 규칙이 사람 체크에만 의존하지 않게 한다.
- CI는 **언어 매트릭스**(.NET / Python)로 구성한다.

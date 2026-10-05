---
has-as-is: false
metrics-mode: absent
act-structure: flat
narrative-lens: architecture-first
source-ref: docs/source.md@abc123
---
## 1. 처리 흐름
- intent: 요청 처리 순서
- shape: flowchart
- payload: 접수 후 검토와 승인
- figure-data: steps: 접수 → 검토 → 승인
- source-span: docs/source.md L1-9

## 2. 상태 규칙
- intent: 요청의 상태 전이
- shape: lifecycle
- payload: 대기, 검토 중, 승인, 반려
- figure-data: none
- source-span: docs/source.md L10-20

---
has-as-is: true
metrics-mode: present
act-structure: flat
narrative-lens: architecture-first
doc-type: explainer
source-ref: docs/source.md@abc123
---
## 1. 현행 수집 경로
- intent: 현재 파이프라인의 병목을 보여준다
- shape: headline-metric
- payload: 수집기가 파일당 단일 스레드로 처리, 피크시 30분 지연
- figure-data: tiles: 처리량=120 files/min · 피크 지연=30min
- source-span: docs/source.md L12-40

## 2. 개선된 병렬 경로
- intent: 워커 풀 도입 후의 처리 흐름
- shape: data-flow
- payload: N-워커 팬아웃, 지연 3분으로 감소
- figure-data: stages: 수집[파일 큐] → 처리[워커 1..N] → 적재[DB] | arrow-labels: 분배, 병합
- source-span: docs/source.md L41-70

---
has-as-is: true
metrics-mode: present
act-structure: flat
source-ref: docs/source.md@abc123
---
## 1. 현행 수집 경로
- intent: 현재 파이프라인의 병목을 보여준다
- payload: 수집기가 파일당 단일 스레드로 처리, 피크시 30분 지연
- figure-data: throughput=120 files/min, peak-delay=30min
- source-span: docs/source.md L12-40

## 2. 개선된 병렬 경로
- intent: 워커 풀 도입 후의 처리량 변화
- payload: N-워커 팬아웃, 지연 3분으로 감소
- figure-data: throughput=900 files/min, peak-delay=3min
- source-span: docs/source.md L41-70

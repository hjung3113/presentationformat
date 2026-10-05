---
doc-type: <explainer | status-report | proposal | feature-guide | analysis | pitch>
audience: <executive | user | developer>
reader-action: <one line — what the reader decides or does after reading>
has-as-is: <true | false — is there a current/old state to contrast?>
metrics-mode: <present | absent | partial>
act-structure: <flat | act-grouped>
narrative-lens: <architecture-first | use-case-first | decision-first>
source-ref: <path/to/source.md@hash-or-mtime>
title: <document title>
thesis: <one sentence>
cover-tokens: <값=라벨 [cite] ; 값=라벨 [cite]>
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

---
doc-type: pitch
audience: developer
reader-action: 수집 파이프라인에 워커 풀을 도입할지 판단한다
has-as-is: true
metrics-mode: present
act-structure: flat
narrative-lens: architecture-first
source-ref: docs/source.md@abc123
title: 로그 수집기 병렬화
thesis: 단일 스레드 수집기를 워커 풀로 바꾸면 피크 지연이 30분에서 3분으로 줄어든다. [docs/source.md L21-45]
cover-tokens: 120=files/min 현행 처리량 [docs/source.md L1-20] ; 30=분 피크 지연 [docs/source.md L1-20]
facts: facts-sample.md
as-of: 2026-10-05
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

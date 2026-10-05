---
doc-type: explainer
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
---
## 1. 개요
- intent: 배경 설명
- shape: none
- payload: 시스템 목적 서술
- figure-data:

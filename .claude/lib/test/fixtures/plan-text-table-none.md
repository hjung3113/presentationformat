---
doc-type: proposal
audience: developer
reader-action: 워커 풀 도입 여부를 결정한다
has-as-is: true
metrics-mode: present
act-structure: flat
narrative-lens: decision-first
source-ref: docs/source.md@abc123
title: 로그 수집기 병렬화 제안
thesis: 합니다체로 적은 plan 의 문장도 허용된다 — /build 가 문서의 문체(~한다)로 바꿔 쓴다. [docs/source.md L21-45]
cover-tokens: 120=files/min 현행 처리량 [docs/source.md L1-20] ; 30=분 피크 지연 [docs/source.md L1-20]
---
## 1. 문제와 효과
- intent: 문제 → 해결 → 효과를 한 표로 대응시킨다
- shape: text-table
- payload: 단일 스레드 병목 → 워커 풀 → 피크 지연 감소
- figure-data: none
- source-span: docs/source.md L12-40

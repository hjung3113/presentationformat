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
## 1. 로그인 호출 순서
- intent: 로그인 요청이 어떤 순서로 처리되는지 보여준다
- shape: interaction
- payload: 사용자가 API에 로그인하면 API가 DB를 조회하고 토큰을 발급한다
- figure-data: participants: 사용자, API, DB | messages: 사용자 -> API 로그인 · API -> DB 조회 · DB --> API 결과 · API (self) 토큰 발급 · API --> 사용자 응답
- source-span: docs/source.md L12-40

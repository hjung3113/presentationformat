---
doc-type: explainer
audience: executive
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
## 1. 배경
- intent: 문서의 맥락
- shape: peer-list
- payload: 세 가지 배경
- figure-data: none
- source-span: docs/source.md L1-9

## 2. 호출 순서
- intent: 서비스 간 호출을 보여준다
- shape: interaction
- payload: 사용자, API, DB 사이의 호출
- figure-data: participants: 사용자, API, DB | messages: 사용자 -> API 로그인 · API -> DB 조회 · DB --> API 결과
- source-span: docs/source.md L10-20

## 3. 부록성 설명
- intent: 보충
- shape: peer-list
- payload: 보충 항목
- figure-data: none
- source-span: docs/source.md L21-30

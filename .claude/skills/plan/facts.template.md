<!--
facts.md ledger — the traceable base of one or more content plans (copy to <topic>/facts.md and fill).
Written by /plan Step 0. A plan cites a row as [F07]; /build never reads a source, only the plan
(and this ledger through the plan), so a fact that is not in this file cannot reach the document.

종류 (kind)  : measured | doc | code | estimate | owner | derived
  measured  = a number someone measured (dashboard, log, survey)        doc = stated in a document
  code      = confirmed in code / migration / schema                      derived = computed from other F rows (write the formula, list the inputs)
  estimate  = a guess that is not measured                  → renders "(추정)"
  owner     = a statement by the owner / decision maker, not in any file → renders "(소유자 진술)"
상태 (status): implemented | designed | planned | n/a
  implemented = confirmed in code or running (a doc alone is NOT enough)   designed = a design/ADR exists, not built
  planned     = roadmap / backlog only                                      n/a = not a feature (a cost, a headcount, a date)
  designed / planned facts are never written in the present tense ("지원한다" is wrong, "계획이다" is right).
출처 (source): repo@sha:path Lx-y   (several repos → one row cites its own repo; owner facts: owner@YYYY-MM-DD 이름)
독자 (audience): exec | user | dev   (comma separated; the plan for an audience uses only rows that include it)
용어 시트 (T) : OPTIONAL `## T — 용어` table, one row per concept the document names, fixed in /plan Step 1 BEFORE any payload is written.
  용어 = the one word the document uses for the concept (one term per concept; everyday words for an executive/user audience)
  뜻 = one plain sentence in the reader's words                         처음 나올 때 = the form used at the first mention, e.g. 작업(Task)
  쓰지 않을 말 = comma-separated variants the document body must not use (substring match, Latin case-sensitive, Hangul exact)
  Gate: `terms-consistent` FAILS when a banned variant appears outside the appendix; `terms:first-use` warns when the 처음 나올 때 form never appears.
  Delete the whole section when the document needs no term sheet (a one-product note); never leave the placeholder row filled in.
Rules: a claim with no F row is dropped · estimate and owner values keep their marker everywhere they appear ·
       an open question stays a Q row until someone answers it (never fill it from general knowledge).
Replace every <…>. Delete these comment lines when done.
-->
# facts — <주제>

기준일: <YYYY-MM-DD>

## F — 사실

| id | 사실 | 값 | 단위 | 종류 | 상태 | 출처 | as-of | 독자 |
|---|---|---|---|---|---|---|---|---|
| F01 | <출처의 표현에 가깝게 한 문장> | <값 또는 —> | <단위 또는 —> | <종류> | <상태> | <repo@sha:path Lx-y> | <YYYY-MM-DD> | <exec,user,dev> |
| F02 | <…> | <…> | <…> | <…> | <…> | <…> | <…> | <…> |

## T — 용어 (선택)

| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |
|---|---|---|---|
| <문서가 쓰는 단 하나의 말> | <독자의 말로 쓴 한 문장 정의> | <본문에서 처음 쓸 때의 모양 — 예: 작업(Task)> | <쉼표로 구분한 금지 변형 — 예: 태스크, 업무> |

## Q — 열린 질문

| id | 질문 | 필요 섹션 | 누구 | 상태 |
|---|---|---|---|---|
| Q01 | <계획에 필요한데 출처에 없는 것> | <s5 처럼 필요한 섹션> | <답할 수 있는 사람> | open |

## C — 주장 (pitch 전용)

| id | 주장 | 근거 F-ids | 한계 |
|---|---|---|---|
| C01 | <문서가 말하려는 한 문장> | <F01, F02> | <이 근거가 보여 주지 못하는 것> |

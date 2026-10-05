---
doc-type: <explainer | status-report | proposal | feature-guide | analysis | pitch — the recipe in core/components.md §5 that seeded the TOC>
audience: <executive | user | developer — one plan per audience, all written from the same facts.md>
reader-action: <one line — what the reader decides or does after reading this document>
has-as-is: <true | false — is there a current/old state to contrast? drives whether /build uses the style's AS-IS (current/problem) half of its semantic color law>
metrics-mode: <present | absent | partial — are there measurable numbers? absent or partial means no standalone Data/Metrics section, see the style's authoring-guide §4.6>
act-structure: <flat | act-grouped — flat for ~6-9 sections; act-grouped with dividers (a div, never a section element) once the count exceeds ~9, see the style's authoring-guide §2>
narrative-lens: <architecture-first | use-case-first | decision-first — controls whether the section sequence explains structure, scenarios, or decision context first>
source-ref: <repo@sha or path@mtime for every source consumed, comma separated — a staleness fingerprint; several repos are listed one by one>
title: <the document title printed in the hero — a noun phrase, 1-2 lines>
eyebrow: <optional — the hero eyebrow printed verbatim, e.g. PROPOSAL · 관리자용; delete this line to get the default "DOC-TYPE in English caps · audience in Korean">
thesis: <the one-sentence hero thesis, in any register (notes, ~합니다 …) — /build renders it in the style's register; may end with a citation such as [F03]>
cover-tokens: <2-4 hero tokens written 값=라벨 [cite] and separated by semicolons — every token cites a fact id [F07] or a source span [PRODUCT.md L12]; a token with no source is not planned>
facts: <path to facts.md, relative to this plan — required for doc-type pitch; delete this line when there is no ledger>
as-of: <YYYY-MM-DD, the date printed in the hero meta line; delete this line when unused>
---
## <1. Noun-phrase section title — the number N becomes the document id sN; titles are noun phrases, not sentences (the style's authoring-guide §2)>
- intent: <one line — what this section conveys to the reader>
- shape: <exactly one shape from core/components.md §1, chosen with the §2 procedure (first "yes" wins) — e.g. lifecycle, role-handoff, layered-structure, peer-list, none. /build maps it to a component by lookup>
- payload: <structured content/notes drawn from source — facts and information ONLY, not final Korean prose (voice and register are /build's job, the style's authoring-guide §3.1). Cite every number and claim with its fact id [F07]; mark estimates (추정) and owner statements (소유자 진술)>
- figure-data: <the values behind the figure in the shape's figure-data format (core/components/README.md, last column) — start with the format's first key, name every edge/transition/message/link, not just the boxes; cite [Fnn] on numbers; "none" only for shape none / peer-list. A text-table section is NOT none: it carries the table, `columns: 열1, 열2, 열3 | rows: 값 · 값 · 값 …`>
- source-span: <the covering citation for this section's payload: docs/source.md L12-40, repo@sha:path Lx-y, or fact ids [F03] [F07] — mandatory; a field with no covering span must instead become a Q row in facts.md and a resolved question before this template is filled in (/plan Step 5)>

## <2. Next noun-phrase section title>
- intent: <...>
- shape: <...>
- payload: <...>
- figure-data: <...>
- source-span: <...>

## <부록 — Reference appendix title (no leading number: it becomes the document id sref; delete this section when there is no appendix)>
- intent: <...>
- shape: <...>
- payload: <...>
- figure-data: <...>
- source-span: <...>

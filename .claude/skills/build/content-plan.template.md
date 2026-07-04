---
has-as-is: <true | false — is there a current/old state to contrast? see spec §5 header keys; drives whether the dormant slate+amber half of the palette is used at /build time>
metrics-mode: <present | absent | partial — are there measurable numbers? see spec §5 header keys; drives whether /build creates a standalone Data/Metrics section, cf. authoring-guide §4.6 (Method/Validation's no-metrics guidance — no dedicated Data/Metrics page type exists)>
act-structure: <flat | act-grouped — flat for ~6-9 sections; act-grouped with dividers once section count exceeds ~9, cf. authoring-guide §2>
source-ref: <path/to/source.md@hash-or-mtime — every source doc consumed, with a staleness fingerprint; see spec §5 header keys>
---
## <N. Noun-phrase section title — cf. authoring-guide §2 skeleton row this maps to; titles are noun phrases, not sentences>
- intent: <one line — what this section conveys to the reader; see spec §5 per-section fields>
- payload: <structured content/notes drawn from source — facts and information ONLY, not final Korean prose; voice/register is /build's job per authoring-guide §3.1; see spec §5 per-section fields>
- figure-data: <raw values for any figure on this section — bar values, gantt when×how-much, matrix rows; leave empty/"none" if this section carries no figure; see spec §5 per-section fields>
- source-span: <the covering citation for this section's payload, e.g. docs/source.md L12-40 — mandatory; a field with no covering span must instead become a resolved question before this template is filled in, see spec §4 step 4>

## <N+1. Next noun-phrase section title>
- intent: <...>
- payload: <...>
- figure-data: <...>
- source-span: <...>

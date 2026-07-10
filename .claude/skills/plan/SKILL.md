---
name: plan
description: Interview the user against their source docs to produce a content-plan.md — a style-agnostic, data-carrying plan of what goes in each section of a scroll-style explainer document. Use before /build, whenever a user wants to turn source material (specs, notes, tickets, transcripts) into a planned document outline. Refuses and routes out if no real source is provided; this is not a general brainstorming or ideation skill.
---

# /plan — section content interview

This skill grills the user against their **source docs** to agree on what information goes on
each section of a future document, and emits that agreement as `content-plan.md`. It does not
write final prose, does not choose a visual style, and does not invent content that isn't in the
source. A second skill, `/build`, later renders the confirmed content-plan into an actual
document in a chosen style.

## Precondition — a real source is required

Before doing anything else, check what the user has handed you.

- If the user supplies source docs (specs, requirements, meeting notes, existing docs, data
  files, tickets, transcripts — anything with actual facts in it), proceed.
- If the user has **no source**, or what they hand you is **thin** (a paragraph or two with no
  real substance to interview against), or it is a **vague idea** ("I want a doc about improving
  our onboarding" with nothing behind it), **refuse and route out**. Say plainly that this skill
  grounds a document in source material and is not open-ended brainstorming; ask the user to
  bring source docs, or point them at a brainstorming approach instead. Do not attempt to
  fabricate content or interview the user about their opinions to fill the gap — that is exactly
  the failure mode this skill must not fall into.

Only once a real source is confirmed does the interview begin.

## Style-agnostic boundary

This skill produces content, not layout. Never decide, discuss, or bake in:

- which page type a section renders as (Cover, Background, Problems, Direction, etc.),
- which diagram or figure device is used,
- which color token or semantic state (current/target) a section gets,
- any exact visual value.

Those are `/build`'s job, derived later from the chosen style's specs. If the user asks about
layout or look during the interview, note that it's decided at `/build` time and steer back to
content.

## Flow — propose, then confirm (two gates)

### Step 1 — Read the source

Read all supplied source docs in full before proposing anything. Note, for later use:

- whether there is a current/old state described anywhere that a target/new state is meant to
  improve on (this becomes the `has-as-is` header value),
- whether the source contains any measurable numbers/metrics (this becomes `metrics-mode`),
- roughly how many distinct topics of substance the source supports (feeds the TOC count below).

### Step 2 — Detect greenfield / metric-less topics up front

Before drafting the TOC, decide:

- **No current state (greenfield).** If the source describes a brand-new policy/system/product
  with nothing to contrast against, do not invent a fake "before." Plan sections the way a
  greenfield topic is planned: target-structure or principles→mechanism content instead of a
  before→after section (mirrors authoring-guide §4.4). Set `has-as-is: false`.
- **No or partial metrics.** If the source has no measurable numbers, or only some, do not
  fabricate a chart's worth of figures. Plan to drop any standalone Data/Metrics section content
  and instead note where a deferred-quantification footnote belongs (mirrors authoring-guide
  §4.6's Method/Validation no-metrics guidance — there is no dedicated Data/Metrics page type).
  Set `metrics-mode` to `absent` or `partial` accordingly; only use `present` when the
  source genuinely carries measurable figures.

Carry these decisions into every later step — they change what questions get asked and what
`payload`/`figure-data` content is legitimate to plan.

### Step 2.5 — Declare the narrative lens

Before drafting the TOC, choose and record one narrative lens:

- `architecture-first` — the outline explains structure first; use cases are supporting examples.
- `use-case-first` — the outline follows actors/scenarios/journeys first; architecture supports the journey later.
- `decision-first` — the opening states the decision context, recommendation tradeoffs, or open questions; this is decision framing, not a hidden approval request.

Ask the user only if the source or request is ambiguous enough that the lens would change section
order. If the user later asks for "more use cases", "decision-maker framing", "more detail", or
similar expansion that would change this lens, stop and ask whether to reorganize the outline or
only add examples inside the existing outline.

### Step 3 — Propose the TOC (Gate 1)

Propose a full section sequence as noun-phrase titles only (no content yet) — a table of
contents draft. Use a generic narrative arc as a checklist — roughly context → problem →
proposed direction → detail/deep-dive → validation → outcome → risk → plan → reference — but
adapt freely to what the source actually supports; don't force a beat the source doesn't back.
This arc is a content-sequencing aid only, not a page-type taxonomy — which page type each
section renders as is decided later at `/build` time from the chosen style's own skeleton (see
its authoring-guide).

- **Validate the count**: target roughly 6–9 numbered sections plus a reference appendix.
  - Below that range, merge thin rows — don't pad with a section the source can't support.
  - Above roughly 9, plan for act-grouped structure (dividers grouping sections into acts) and
    set `act-structure: act-grouped`; otherwise `act-structure: flat`.
- Check the sequence against the narrative lens from Step 2.5. A `use-case-first` lens must put
  actors/scenarios/journey before architecture detail; a `decision-first` lens must surface the
  decision context early, not bury it in the final section.
- Present the TOC to the user and **stop — this is Gate 1**. Do not draft section content until
  the user has reviewed and agreed on the TOC (adding, dropping, renaming, or reordering rows as
  they like). Re-propose and re-gate if they request changes.

### Step 4 — Draft each section from source

Once the TOC is agreed, draft each section's plan entry. For every section, working strictly
from the source:

- `intent` — one line: what this section is meant to convey.
- `payload` — the facts/information to place there, as structured notes, **not finished Korean
  prose**. Voice and register are decided at `/build` time (authoring-guide §3.1); this skill
  only carries content.
- `figure-data` — if the section warrants a figure, the raw values behind it (bar values, a
  gantt's when×how-much, a matrix's rows) so `/build` can pick a device without re-reading
  source. Leave empty if the section has no figure.
- `source-span` — the exact citation in the source that covers this content (e.g. a file path
  plus line range).

### Step 5 — The source-span rule (mechanical, no judgment calls)

Apply this rule uniformly, per field, while drafting:

- **No covering span found** for something a section needs → the field is *underdetermined*.
  Do not guess or fill it in from general knowledge. Instead, add it to a **batched list of
  questions** and ask the user once the section drafts are otherwise complete (batch rather than
  interrupting after every single field).
- **Conflicting spans** — two or more parts of the source disagree on the same fact → the field
  is *high-consequence*. Never auto-pick one side. Surface the conflict explicitly to the user as
  its own question (what the two spans say, and where), and let them resolve it.
- A field with a single, unambiguous covering span needs no question — draft it directly and
  cite the span.

Ask all batched and high-consequence questions together after drafting, get answers, then update
the affected section entries (and their `source-span` — a question's answer counts as new source
material; cite it as such, e.g. "user-clarification" plus a short description, if no doc span
exists for it).

### Step 6 — Emit content-plan.md

Fill in `.claude/skills/build/content-plan.template.md` with the agreed header and section
entries, replacing every placeholder. Keep the header fields honest to what was actually
determined in Steps 1–2:

- `has-as-is` — true only if a real current/old state exists in source.
- `metrics-mode` — `present` / `partial` / `absent`, matching Step 2's detection.
- `act-structure` — `flat` or `act-grouped`, matching the Step 3 count check.
- `narrative-lens` — `architecture-first`, `use-case-first`, or `decision-first`, matching Step 2.5.
- `source-ref` — every source doc consumed, with a path and a hash or mtime, so `/build` can
  detect if the source has since changed (staleness guard) without re-reading it.

Before presenting it, mechanically self-check the emitted plan so no placeholder or missing field
reaches the user (this is the same shape gate `/build` runs at ingest, run here first):

```
node .claude/lib/plan-schema.mjs <content-plan.md>
```

Exit `0` = shaped correctly, go to Step 7. Exit `1` = the CLI lists the header keys or per-section
fields still missing — fill them in and re-run before Gate 2. (Repo-relative path — run from the
repo root; if `node` cannot find `.claude/lib/`, this skill is running outside its repo.)

### Step 7 — Confirm before handoff (Gate 2)

Present the completed `content-plan.md` — every section's `intent`, `payload`, and `figure-data`
— to the user for review. This is **Gate 2**: do not consider the plan final, and do not point
the user at `/build`, until the user has confirmed it. If they request changes, edit and
re-present; `/build` should never have to guess at unconfirmed content.

## What this skill does not do

- It does not write final Korean (or any language's) prose — `payload` is notes, not copy.
- It does not choose a page type, diagram device, or color for any section.
- It does not consult or reference a specific style's design docs — the plan is style-agnostic
  by construction, referencing style concepts (if at all) only by pointer, never by re-stating
  them.
- It does not proceed without source, and it does not become a general ideation tool when source
  runs out mid-interview — if the user pivots to "what if we also did X" with nothing behind it,
  treat that new thread the same as thin source: ask for material, or park it out of scope.

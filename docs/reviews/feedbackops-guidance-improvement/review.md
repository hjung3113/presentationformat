# FeedbackOps Brief Guidance Improvement Review

Date: 2026-07-04
Target artifact: `examples/feedbackops-design-brief.dc.html`
Scope: project instructions, authoring skills, verification gates, and clarification prompts that could prevent recurrence.
Non-goal: mobile/narrow viewport support. The user clarified this document is expected to be read on company computers.

## Verdict

The major failures are not caused by missing visual tokens or Korean voice rules. They come from three weaker control points:

1. Existing composition rules are not enforced before or after generation.
2. Diagram-selection guidance is present, but too generic for branching workflow, relationship schema, UI surface, and ownership matrix cases.
3. When the user asks for more content, use cases, or decision-maker framing, the workflow appends cards instead of forcing a re-slot/split decision or asking a clarifying question.

So this is partly a documentation problem, but not because the docs are empty. It is mostly a compliance/gate problem plus a few specific mapping-table gaps.

## What Is Not Really A Guidance Gap

### Section overload

`s1` carries before/after context, three use cases, and three executive points. `s5` carries workflow, rule notes, review states, and three use cases. `s7` carries principles, use cases, and role surfaces.

The project already says one section should have one thesis, one focal anchor, limited top-level blocks, and role-based density. This failure is therefore not primarily "missing instruction." It is a failure to run a section-budget preflight after the content expanded.

Improvement: promote the existing rule into a required preflight and review gate.

### Card-heavy visual structure

The docs already distinguish diagrammable content from peer enumerations, and already warn against competing focal anchors. The artifact still used stacked grids because the generation process treated "more density" as "append another grid."

Improvement: add a hard negative rule: do not answer density requests by appending grids under a valid figure.

### Decision ask placement

The decision ask appears inside a small card in the MVP section. The docs already describe Scope/Plan and open questions, but they do not force decision asks into a visible decision block.

Improvement: make decision placement mandatory, not stylistic.

## Real Guidance And Gate Gaps

### 1. Diagram selection needs a stronger mapping table

The current situation-to-diagram table is useful, but it is not specific enough for product/design briefs where several visual forms look superficially similar.

Add this table to `authoring-guide.md` or a build skill:

| Content shape | Use | Do not use | Reviewer question |
|---|---|---|---|
| Linear happy path only | Process step row | UML activity | Are there no branch states, bypass paths, or loops? |
| Workflow with optional synthesis, bypass, approval, rejection, or needs-more-evidence | UML activity or swimlane | Flat process row | Does every terminal/loop state have a visible path? |
| Actor-specific operational flow | Swimlane | Generic card grid | Can the reader see who acts next? |
| Lifecycle/status transitions | State machine | Status chips under a process row | Are allowed transitions visible? |
| Bounded systems plus optional integration layer | Layered architecture map | Tree of boxes only | Are ownership, optionality, and connectors visible? |
| Ownership across domain objects | Matrix | Equal cards | Are rows/columns carrying distinct meanings? |
| Entity link as conceptual centralization | Hub-and-spoke | Table | Is the point centralization rather than schema detail? |
| Entity link relation names/cardinality/rules | Table or matrix | Decorative relation chips | Are relation names schema facts? |
| UI principles by user role | Surface map or lane map | Principle cards only | Can the reader see screen, action, and handoff per role? |
| Executive decision | Decision block or open-question table | Peer mini-card | Is the ask visually impossible to miss? |

### 2. Add a diagram-selection preflight

Before writing HTML, require a compact table:

| Section | Page type | Claim type | Primary device | Why not cards/table? | Expected count | Figure budget |
|---|---|---|---|---|---:|---:|
| 05 실행 흐름 | Direction / workflow | Branching process | UML activity | Review outcomes branch and loop | 4 decisions | 1 figure |

Hard fail conditions:

- `claim type = branching process` with `primary device = process row`.
- `claim type = ownership` with only equal cards.
- `claim type = UI operation` with no UI surface or role lane.
- Figure requires the word "and" to explain its reading task.

### 3. Add a density-change protocol

When the user says "more detail", "more use cases", "why it is good", or similar, do not append by default.

Protocol:

1. Classify each new item as `core`, `support`, or `aside`.
2. If it is `core`, promote it to the outline or split the section.
3. If it is `support`, keep it only if the section stays within block budget.
4. If it is `aside`, move it to footnote/reference or delete it.
5. Re-read the title sequence after the change. If the lens changed, rewrite the outline before HTML edits.

Hard rule: preserving section count is not a default goal. It is valid only if the governing lens has not changed.

### 4. Add narrative-lens declaration

Before a build, write one line:

`narrative lens: architecture-first | use-case-first | decision-first`

Rules:

- If `use-case-first`, the first numbered sections must follow actor/scenario/journey. Architecture supports the journey later.
- If `decision-first`, the opening must state the decision ask and the deck proves it.
- If `architecture-first`, use cases are examples, not the main spine.
- If the user changes the lens mid-task, ask whether to reorganize the outline or only add examples.

### 5. Add clarification prompts for ambiguous user requests

Add these to the authoring/build skill as stop-questions:

1. "Should this persuade decision-makers first, walk through user scenarios first, or explain architecture first?"
2. "When you say use-case centered, should I reorganize the whole outline around actors/scenarios, or only add examples inside the existing architecture outline?"
3. "Is the decision ask a final approval request, an open question list, or a subtle recommendation?"
4. "For more content, should I add depth to the same sections, add new sections, or replace low-value overview blocks with concrete scenarios?"
5. "Which audience is primary: executive sponsor, product/operator, developer/reviewer, or mixed peer review?"
6. "If this section already has a diagram, should the new material replace the diagram, become a new section, or move to appendix?"

Ask only when the answer changes structure. If the answer only changes wording, proceed without interruption.

### 6. Clarify desktop-only support

Mobile is out of scope for this project lane. The docs should say that directly, because the runtime currently says desktop-first but still talks about intrinsic mobile resilience.

Recommended wording:

> Supported reading target is desktop/company-computer view. Minimum review viewport is 1366x768; preferred review viewport is 1440x900 or wider. Narrow/mobile overflow is not a release blocker unless explicitly requested for a given artifact.

This does not mean visual verification can be skipped. It means verification should check desktop composition rather than mobile responsiveness.

### 7. Improve verification gates

Current `verify-doc.mjs` is structural. It checks shell-level facts but not composition quality. Keep those checks, then add a desktop visual/composition tier.

Recommended checks:

- Serve over HTTP and capture at `1366x768` and `1440x900`.
- Report section heights and number of visible meaning blocks per viewport.
- Flag 3+ stacked grids in one section.
- Flag a figure panel that contains multiple unrelated card grids.
- Flag text-card grids with `repeat(4,1fr)` except stat tiles.
- Flag sections where primary figure is absent despite plan labels such as `workflow`, `map`, `matrix`, `state`, or `surface`.
- Flag decision ask text if it appears only inside a low-emphasis peer card.

These should start as warnings, not hard failures, until the project has two or three known-good artifacts to calibrate against.

## Responsibility Split

| Issue | Primary cause | Preventable by docs/skill? | Recommended fix |
|---|---|---:|---|
| Section role overload | User/editorial expansion handled additively | Yes | Density-change protocol and section-budget preflight |
| Decision ask too late | Late-added executive framing | Yes | Decision block rule and narrative-lens declaration |
| Architecture-first after use-case request | Lens changed but outline stayed fixed | Yes | Stop-question: reorganize outline or add examples? |
| Wrong workflow diagram | Existing mapping too generic and unenforced | Yes | Branching workflow mapping + hard fail |
| System map too decorative | Mapping under-specific | Yes | Layered architecture map rule |
| Ownership cards instead of matrix | Content plan said matrix but HTML ignored it | Yes | Preflight: claim type ownership -> matrix |
| UI section lacks UI surface | Device mapping gap | Yes | UI operation -> surface/lane map |
| Mobile overflow | Out of scope | No for this lane | Explicit desktop-only support statement |

## Concrete Patch Targets

1. `styles/indigo-serif/authoring-guide.md`
   - Add the expanded mapping table.
   - Add narrative-lens declaration.
   - Add decision ask placement rule.
   - Add clarification prompts.

2. `styles/indigo-serif/composition-guide.md`
   - Add density-change protocol.
   - Add hard negative rule against appending grids below a valid diagram.
   - Add section preflight table example.

3. `core/runtime-spec.md`
   - Replace ambiguous mobile-resilience wording with explicit desktop-only support bounds for this style/project lane, or defer the support target to style docs if core must remain style-agnostic.

4. `.claude/lib/verify-doc.mjs`
   - Add warning-only desktop composition tier.
   - Keep current structural checks as hard failures.

## Bottom Line

The best fix is not "add more design taste." The project needs a small authoring control loop:

1. Declare narrative lens.
2. Preflight each section's job and primary device.
3. Use the stronger mapping table.
4. When new content arrives, re-budget instead of appending.
5. Run a desktop composition verifier that catches stacked grids and missing diagrams.

That would have prevented most of the FeedbackOps brief issues without requiring mobile support.

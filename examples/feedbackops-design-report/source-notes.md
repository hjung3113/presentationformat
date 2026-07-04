# FeedbackOps Design Report Source Notes

Artifact: `feedbackops-design-report.dc.html`

Purpose: introduce FeedbackOps to people who need to understand why it exists, when to use it, how to use it, what each system owns, and how the systems connect.

Primary sources:

- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/00-product-overview.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/01-domain-model.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/04-voc-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/05-finding-insight-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/06-task-project-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/07-survey-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/08-dashboard-system.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/09-permission-access.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/10-cross-system-workflows.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/11-entity-linking.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/12-ui-ux-principles.md`
- `/Users/hyojung/Desktop/2026/FeedbackOps/docs/design/13-mvp-roadmap.md`

Narrative lens:

- Architecture-first introduction.
- The core message is independent local systems plus optional integration.
- The report avoids presenting FeedbackOps as Jira, Zendesk, Typeform, BI, or Productboard replacement.

Included emphasis:

- Why needed: fragmented feedback, evidence, execution, and validation trails.
- When useful: VOC triage, survey validation, evidence synthesis, execution request review, follow-up gap recovery.
- How to use: submit VOC, triage, synthesize Finding when needed, request Task, convert approved work, update reporter-facing status separately, watch Dashboard/Integration queues.
- System roles: Core, VOC, Survey, Finding/Evidence, Task/Task Request, Entity Linking, Dashboard/Integration, Permission/Admin.
- Connection rules: Survey Response never creates VOC; VOC follow-up creates Task Request not Task; Task Done does not resolve Reporter-facing VOC; missing links are actionable only by policy or configured workflow.

Diagram pass added:

- VOC branch activity: triage can end in reporter info request, public update only, Finding, Task Request, or no-follow-up-needed.
- Survey path comparison: allowed Evidence/Finding/Task Request/existing-VOC evidence attachment vs forbidden Survey Response to new VOC.
- Task Request state machine: pending review, needs more evidence, approved, rejected, converted, and link-existing-Task alternative.
- Parallel status machines: internal Task status and Reporter-facing VOC status are independent.
- Recovery decision table: queue inclusion depends on policy expectation, follow-up presence, permission/visibility, and explicit resolution state.

Style-system follow-up:

- `styles/indigo-serif/design.md` now documents complex branch, forbidden path, parallel state-machine, and recovery decision-table patterns.
- `styles/indigo-serif/authoring-guide.md` now maps those content shapes to the correct diagram choice.
- `styles/indigo-serif/design-system.answerkey.dc.html` now includes rendered reusable examples under "12 · COMPLEX WORKFLOWS".

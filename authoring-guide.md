# AUTHORING GUIDE — Writing in this voice

> A reusable guide for producing scroll-style HTML explainer documents that feel authored by the same person — **whatever the subject** (a system redesign, a research summary, a process proposal, a product brief…).
> This file governs **voice, structure, content patterns, and when-to-use decisions.** For exact visual values, see `design.md`. The two are meant to be used together: this guide tells you *what to write and which device to reach for*; `design.md` tells you *exactly how it should look*.

---

## 1. Document DNA (applies to any topic)

- **Genre:** a peer-to-peer **"direction / explainer" document**, not an approval request and not a slide deck. It says *"here is how we're thinking about this and where it's going,"* and explains rather than persuades.
- **Reader:** a knowledgeable peer. Assume domain literacy → don't over-explain basics; push glossaries to a low-emphasis appendix.
- **Density:** keep the substance plus the *necessary* elaboration. Trim secondary asides, not the core. (One-sentence compression ✗ / a tight 1–2 line paragraph ✓.)
- **Voice:** calm, explanatory, declarative. No drama, no "it's not X, it's Y," no suspense, no hype, no imperative punchlines. Titles describe; they don't deliver verdicts.

---

## 2. Standard skeleton (adapt the content, keep the bones)

A document in this voice almost always follows this arc. Rename freely; keep the shape.

| Page type | Typical role | Eyebrow example |
|-----------|--------------|-----------------|
| Cover | Title + one-line thesis + a few framing stats | `PROJECT BRIEF · …` |
| Background / Overview | Why this exists; current state at a glance | `01 · BACKGROUND` |
| Problems / Findings | The issues, grouped and numbered | `02 · PROBLEMS` |
| Direction / Approach | The proposed model; **before→after**; how it works | `03 · DIRECTION` |
| Deep-dive(s) | Operational / architectural detail, subsection by subsection | `04 · …` |
| Method / Validation | How it's tested or proven | `05 · …` |
| Mapping / Outcome | problem↔fix↔effect matrix; expected results | `06 · OUTCOME` |
| Risks | Risk → mitigation | `07 · RISK` |
| Scope / Plan | Now vs later; **roadmap**; open questions | `08 · SCOPE` |
| Reference | Glossary / appendix (de-emphasized) | `REFERENCE` |

- Eyebrows: always `NN · ENGLISH (UPPERCASE)`.
- **Titles are noun phrases** ("Current Problems", "Direction — Separation of Concerns"), never punchy sentences. The titles read end-to-end like a table of contents: a reader skimming only the headings should follow the whole story.

---

## 3. Voice & sentence craft

- Plain declaratives. Split long sentences in two.
- Lead with the point, then the qualifier (in a short clause or parentheses).
- Use `·` for peer enumeration ("collect · delete · transform"); `→` for transformation/flow.
- Expand an acronym once, then abbreviate.
- **1–2 bold emphases per paragraph, max.** Bold only true keywords.
- When a number matters, bold it ("organized into **six groups**").
- Keep parallel structure across siblings: items in the same grid should be similar length and grammatical shape.

---

## 4. Content patterns by page type

> Match the page's *job* to its density, structure, and devices. (Visual values: `design.md` §6.)

### 4.1 Cover
Write: an eyebrow tag, a noun-phrase title (1–2 lines), one paragraph stating the thesis, an optional one-line "purpose of this doc" note, and 3–4 framing stats (number + 2-line label). Nothing else. No bullet lists.

### 4.2 Background / Overview
Write: a lead paragraph that frames *why this matters* and the current state in 2–4 sentences, then either a short set of "current limitations" cards **or** a single orienting diagram (a current-state flow). Low density; let it breathe. Don't start enumerating fine-grained problems here — that's the next page.

### 4.3 Problems / Findings
Write: a one-line lead that says how many groups, then **numbered** items (number chip + heading + 2–4 line description) in a 2-column grid. Each item is self-contained. This is the evidence base for "AS-IS" — keep it factual, not alarmist.

### 4.4 Direction / Approach
The heart of the document. Write: a short lead, then the **before→after comparison** as the centerpiece, then concise component/role descriptions (one line each is fine), then a **process diagram** (flow or UML activity) for anything with steps or branches. Prose here can be denser, but always pair structure with a diagram.

### 4.5 Deep-dive sections
Write each subsection as a consistent unit: **sub-heading → explanatory paragraph → figure panel with its diagram.** Same order every time. If a point is diagrammable (a flow, a contrast, a hierarchy, a schedule), diagram it; don't leave it as prose.

### 4.6 Method / Validation
Write: a lead on the overall strategy, make the single most important mechanism a diagram (e.g. an input→two-outputs→diff comparison), and list the rest as compact cards.

### 4.7 Mapping / Outcome
Write: a 3-column matrix (e.g. problem / fix / effect). Then split outcomes into "near-term" vs "end-state" using a highlight card and a dark summary card for contrast.

### 4.8 Risks
Write: risk cards with a left indigo accent border — each = risk name + (muted) description + `→` mitigation. Keep symmetrical.

### 4.9 Scope / Plan
Write: paired "Now (MVP)" highlight card + "Later" outline card, then a **roadmap/Gantt** encoding *when × how-much*, then an open-questions table (item / current direction / needs-decision).

### 4.10 Reference
Write: compact two-column term lists, muted styling, at the very end. Short definitions only.

---

## 5. Decision tables

### 5.1 Situation → diagram (if it's diagrammable, diagram it)
| Situation | Device |
|-----------|--------|
| Current vs target **structure** | Before/After comparison panel |
| A multi-step **procedure** | Vertical flow (nodes + ↓) |
| A procedure with a **branch/condition** | UML activity (diamond) or a conditional dashed box |
| **Transform / converge** (X becomes Y, paths merge) | Horizontal flow (→, merge label) |
| **Centralization** (scattered → one) | Before (scattered chips) → After (single hub box) |
| **Quantities / load / time** | Bar chart |
| **Schedule / phased plan** | Gantt roadmap |
| **Hierarchy / partition** of roles | 3-up card grid |
| **System / topology** | Tree (parent→children→leaves) |
| **Data / log example** | Mono-font box (start=green, end=amber) |
| Plain many-to-many comparison | Table |

### 5.2 Situation → color / token
| Intent | Token (HEX) |
|--------|-------------|
| Current / legacy / problem (AS-IS) | **slate `#94A0B4` / `#C2C8D4`** + ink body |
| Pain point emphasis | **amber `#B4543F` on `#FBF1EE`/`#FBF3EC`** |
| Improvement / target / key (TO-BE) | **indigo `#4338CA`** + `#EEF0FF` |
| Key component node | `bg #EEF0FF; border 1.5px #4338CA; #4338CA` |
| Data / store | dashed border `#B9BEDB` |
| Conditional / optional | dashed indigo on lilac `#F3F1FE` + qualifier badge |
| Normal / success / endpoint | green `#1F8A5B` / `#E6F5EE` |
| Body text | `#5A6175` (cards) / `#3E4658` (lead) |
| Headings | `#15172B` |
| Captions / footnotes | `#9AA0B2` (prefix `*`) |
| Low-priority section | grey eyebrow `#B6BBCB`, heading `#6A7187` |

> **Never** put indigo in an AS-IS zone or amber/slate in a TO-BE zone. The color *is* the meaning.

### 5.3 Emphasis choice
- Ordinary keyword → `<b style="color:#15172B">` (or `#3A4255`).
- "Improvement/key" keyword → `<b style="color:#4338CA">`.
- On dark backgrounds → white + translucent bottom-border highlight.
- Never underline; never italicize for emphasis.

---

## 6. Consistency checklist (does it feel "same author"?)

1. [ ] Eyebrows all `NN · ENGLISH`; titles all noun phrases.
2. [ ] Reading titles only tells the whole story, like a TOC.
3. [ ] Every section lead is 16px/1.85, max-width 760.
4. [ ] Body `#5A6175`, headings `#15172B`, emphasis `#4338CA` / ink bold.
5. [ ] AS-IS = slate + amber, TO-BE = indigo — never violated.
6. [ ] Anything diagrammable is diagrammed (not left as prose).
7. [ ] Every subsection is "text (top) → diagram (below, figure panel)".
8. [ ] Node radius 8–10, card 14–16, comparison panel 18 — uniform.
9. [ ] Same-kind bars/nodes share identical size & position (nothing random).
10. [ ] ≤ 1–2 bold emphases per paragraph; no drama/hype.
11. [ ] `word-break:keep-all` is on (natural word-level line breaks).
12. [ ] Glossary lives at the end, de-emphasized.
13. [ ] **Page type matches its job** (cover sparse, deep-dive dense, reference muted — §4).

---

## 7. Quick start for a new document
1. Write the **title sequence first** (one noun-phrase title per section). Read them back as a TOC; revise until they tell the story alone.
2. Lay out the skeleton (§2) and decide each page's **type** (§4 / `design.md` §6).
3. For each section: lead paragraph → core content → **decide if it's diagrammable (§5.1)** → build the figure.
4. Apply color/emphasis by intent (§5.2–5.3); copy exact visual values from `design.md`.
5. Run the §6 checklist before shipping.

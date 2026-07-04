# Authoring Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a host-neutral 2-skill authoring harness (`/plan` → `/build`) that drives source docs to a verified scroll-HTML `.dc.html`, with a machine-checkable verification gate.

**Architecture:** Two prose skills (`SKILL.md`) connected by one file-based seam (`content-plan.md`). `/plan` interviews the user against source docs and emits a style-agnostic, data-carrying plan; `/build` renders it against a chosen style and runs a two-tier exit gate (a Node mechanical hard-gate that always runs + an optional capability-checked headless render). A schema validator and the gate are real scripts (TDD); the skills are prose validated by fixture dry-runs.

**Tech Stack:** Markdown `SKILL.md` (minimal common subset for Claude Code + opencode), Node.js (zero external deps) for the validator + gate, `node:test` for tests, headless Chrome (optional, capability-checked) for the visual render.

## Global Constraints

- **Host-neutral, co-equal Claude Code + opencode.** Skills = minimal common SKILL.md subset; no Claude-Code-only tool calls (no `Workflow()`); install documented per host (`.claude/skills/` for CC, `.opencode/` for opencode) and one skill load-verified under opencode.
- **Scripts use Node.js with zero external npm dependencies** (`node:test`, `node:fs`, `node:child_process` only) so they run identically under both hosts without an install step.
- **Respect repo invariants (CLAUDE.md):** core zero-HEX; style self-contained; answer-key-wins; semantic color split (as-is = slate `#…`+amber, to-be = indigo `#4338CA`); inline styles only; `support.js` byte-identical sidecar (no build step); `word-break: keep-all`.
- **Repo = install; product/tooling boundary stays clean** — harness docs live under `.claude/`, never as a normative layer inside the product CLAUDE.md.
- Spec of record: `docs/superpowers/specs/2026-07-04-authoring-harness-design.md`.

---

## File Structure

- `.claude/lib/plan-schema.mjs` — content-plan.md parse + validate (header + per-section fields). Pure, testable.
- `.claude/lib/gate.mjs` — mechanical hard-gate checks over a `.dc.html` string. Pure, testable.
- `.claude/lib/verify-doc.mjs` — CLI wrapper: runs gate.mjs, then capability-checks + optional headless render, prints PASS / FAIL / UNVERIFIED.
- `.claude/lib/test/plan-schema.test.mjs`, `.claude/lib/test/gate.test.mjs` — `node:test` suites with fixtures.
- `.claude/lib/test/fixtures/` — a valid + several invalid `content-plan.md` and `.dc.html` fixtures.
- `.claude/skills/plan/SKILL.md` — the `/plan` interview skill.
- `.claude/skills/build/SKILL.md` — the `/build` render+verify skill.
- `.claude/skills/build/content-plan.template.md` — the seam template `/plan` fills, `/build` reads.
- `.claude/README.md` — harness overview + host-neutral install (CC + opencode paths) + non-normative boundary note.
- `README.md` (repo root) — one pointer line to `.claude/README.md`.

---

### Task 1: content-plan.md schema validator

**Files:**
- Create: `.claude/lib/plan-schema.mjs`
- Test: `.claude/lib/test/plan-schema.test.mjs`
- Create fixtures: `.claude/lib/test/fixtures/plan-valid.md`, `.claude/lib/test/fixtures/plan-missing-source-span.md`

**Interfaces:**
- Produces: `parsePlan(md: string) => { header: {hasAsIs, metricsMode, actStructure, sourceRef}, sections: Array<{title, intent, payload, figureData, sourceSpan}> }` and `validatePlan(md: string) => { ok: boolean, errors: string[] }`. `/build` (Task 5) relies on these field names.

- [ ] **Step 1: Write the failing test**

```js
// .claude/lib/test/plan-schema.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePlan, parsePlan } from '../plan-schema.mjs';

const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');

test('valid plan passes and parses all fields', () => {
  const md = read('plan-valid.md');
  const res = validatePlan(md);
  assert.equal(res.ok, true, res.errors.join('; '));
  const p = parsePlan(md);
  assert.equal(p.header.hasAsIs, true);
  assert.equal(p.sections.length, 2);
  assert.ok(p.sections[0].sourceSpan.length > 0);
});

test('section missing source-span fails validation', () => {
  const res = validatePlan(read('plan-missing-source-span.md'));
  assert.equal(res.ok, false);
  assert.match(res.errors.join('\n'), /source-span/);
});
```

- [ ] **Step 2: Create fixtures**

```markdown
<!-- .claude/lib/test/fixtures/plan-valid.md -->
---
has-as-is: true
metrics-mode: present
act-structure: flat
source-ref: docs/source.md@abc123
---
## 1. 현행 수집 경로
- intent: 현재 파이프라인의 병목을 보여준다
- payload: 수집기가 파일당 단일 스레드로 처리, 피크시 30분 지연
- figure-data: throughput=120 files/min, peak-delay=30min
- source-span: docs/source.md L12-40

## 2. 개선된 병렬 경로
- intent: 워커 풀 도입 후의 처리량 변화
- payload: N-워커 팬아웃, 지연 3분으로 감소
- figure-data: throughput=900 files/min, peak-delay=3min
- source-span: docs/source.md L41-70
```

```markdown
<!-- .claude/lib/test/fixtures/plan-missing-source-span.md -->
---
has-as-is: false
metrics-mode: none
act-structure: flat
source-ref: docs/source.md@abc123
---
## 1. 개요
- intent: 배경 설명
- payload: 시스템 목적 서술
- figure-data:
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test .claude/lib/test/plan-schema.test.mjs`
Expected: FAIL — `Cannot find module '../plan-schema.mjs'`.

- [ ] **Step 4: Implement plan-schema.mjs**

```js
// .claude/lib/plan-schema.mjs
const HEADER_KEYS = ['has-as-is', 'metrics-mode', 'act-structure', 'source-ref'];
const SECTION_KEYS = ['intent', 'payload', 'figure-data', 'source-span'];

export function parsePlan(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  const header = {};
  if (fm) for (const line of fm[1].split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (m) header[m[1]] = m[2].trim();
  }
  const body = fm ? md.slice(fm[0].length) : md;
  const sections = [];
  const blocks = body.split(/^##\s+/m).slice(1);
  for (const b of blocks) {
    const title = b.split('\n')[0].trim();
    const field = (k) => {
      const m = b.match(new RegExp(`^-\\s*${k}:\\s*(.*)$`, 'm'));
      return m ? m[1].trim() : '';
    };
    sections.push({
      title,
      intent: field('intent'),
      payload: field('payload'),
      figureData: field('figure-data'),
      sourceSpan: field('source-span'),
    });
  }
  return {
    header: {
      hasAsIs: header['has-as-is'] === 'true',
      metricsMode: header['metrics-mode'] || '',
      actStructure: header['act-structure'] || '',
      sourceRef: header['source-ref'] || '',
    },
    sections,
  };
}

export function validatePlan(md) {
  const errors = [];
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) errors.push('missing YAML header block');
  else for (const k of HEADER_KEYS)
    if (!new RegExp(`^${k}:`, 'm').test(fm[1])) errors.push(`header missing key: ${k}`);
  const { sections } = parsePlan(md);
  if (sections.length === 0) errors.push('no sections found');
  sections.forEach((s, i) => {
    for (const k of ['intent', 'payload', 'source-span']) {
      const key = k === 'source-span' ? 'sourceSpan' : k;
      if (!s[key]) errors.push(`section ${i + 1} (${s.title || '?'}) missing ${k}`);
    }
  });
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test .claude/lib/test/plan-schema.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add .claude/lib/plan-schema.mjs .claude/lib/test/plan-schema.test.mjs .claude/lib/test/fixtures/plan-valid.md .claude/lib/test/fixtures/plan-missing-source-span.md
git commit -m "feat(harness): content-plan.md schema validator"
```

---

### Task 2: Mechanical hard-gate checks

**Files:**
- Create: `.claude/lib/gate.mjs`
- Test: `.claude/lib/test/gate.test.mjs`
- Create fixtures: `.claude/lib/test/fixtures/doc-pass.dc.html`, `doc-dup-id.dc.html`, `doc-no-keepall.dc.html`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: `runGate(html: string, opts: {accentHex: string, sidecarPresent: boolean}) => { ok: boolean, checks: Array<{name, ok, detail}> }`. `verify-doc.mjs` (Task 3) and `/build` (Task 5) rely on this signature.
- Checks: `keep-all` present; no `<style>` class rules beyond the allowed globals (font/word-break/selection/scrollbar); unique section ids; every `[data-navlink]` target resolves to an id; accent HEX present.

- [ ] **Step 1: Write the failing test**

```js
// .claude/lib/test/gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runGate } from '../gate.mjs';

const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');
const opts = { accentHex: '#4338CA', sidecarPresent: true };

test('clean doc passes all checks', () => {
  const r = runGate(read('doc-pass.dc.html'), opts);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
});

test('duplicate section id fails', () => {
  const r = runGate(read('doc-dup-id.dc.html'), opts);
  assert.equal(r.ok, false);
  assert.ok(r.checks.find(c => c.name === 'unique-ids' && !c.ok));
});

test('missing keep-all fails', () => {
  const r = runGate(read('doc-no-keepall.dc.html'), opts);
  assert.equal(r.ok, false);
  assert.ok(r.checks.find(c => c.name === 'keep-all' && !c.ok));
});
```

- [ ] **Step 2: Create fixtures**

`doc-pass.dc.html` — minimal doc containing `word-break: keep-all`, `#4338CA`, two sections with unique ids `s1`/`s2`, a `[data-navlink="s1"]`, and no class-based `<style>` rules. `doc-dup-id.dc.html` — same but both sections use `id="s1"`. `doc-no-keepall.dc.html` — same as pass but with the `keep-all` declaration removed. (Keep each fixture under ~30 lines.)

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test .claude/lib/test/gate.test.mjs`
Expected: FAIL — `Cannot find module '../gate.mjs'`.

- [ ] **Step 4: Implement gate.mjs**

```js
// .claude/lib/gate.mjs
export function runGate(html, opts) {
  const checks = [];
  const add = (name, ok, detail = '') => checks.push({ name, ok, detail });

  add('keep-all', /word-break\s*:\s*keep-all/.test(html));
  add('accent-present', html.includes(opts.accentHex), opts.accentHex);
  add('sidecar-present', opts.sidecarPresent === true);

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  add('unique-ids', dup.length === 0, dup.join(','));

  const navTargets = [...html.matchAll(/data-navlink=["']([^"']+)["']/g)].map(m => m[1]);
  const dangling = navTargets.filter(t => !ids.includes(t));
  add('navlink-integrity', dangling.length === 0, dangling.join(','));

  // inline-only: <style> may hold only allowed globals, no class/element rulesets with color
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  const classRule = styleBlocks.join('\n').match(/(^|\})\s*\.[\w-]+\s*\{/);
  add('inline-only', !classRule, classRule ? classRule[0].trim() : '');

  return { ok: checks.every(c => c.ok), checks };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test .claude/lib/test/gate.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add .claude/lib/gate.mjs .claude/lib/test/gate.test.mjs .claude/lib/test/fixtures/doc-pass.dc.html .claude/lib/test/fixtures/doc-dup-id.dc.html .claude/lib/test/fixtures/doc-no-keepall.dc.html
git commit -m "feat(harness): mechanical hard-gate checks"
```

---

### Task 3: verify-doc CLI + sidecar byte-check + capability-gated render

**Files:**
- Create: `.claude/lib/verify-doc.mjs`
- Test: `.claude/lib/test/verify-doc.test.mjs`

**Interfaces:**
- Consumes: `runGate` from Task 2.
- Produces: CLI `node .claude/lib/verify-doc.mjs <doc.dc.html> --accent <hex> --canonical-support <path>`, exit 0 = PASS, 1 = FAIL, 0-with-`UNVERIFIED` note when no browser. Exposes `sidecarByteIdentical(docDir, canonicalPath)` and `hasHeadlessChrome()` for testing.

- [ ] **Step 1: Write the failing test**

```js
// .claude/lib/test/verify-doc.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasHeadlessChrome, sidecarByteIdentical } from '../verify-doc.mjs';

test('capability check returns a boolean and never throws', () => {
  assert.equal(typeof hasHeadlessChrome(), 'boolean');
});

test('sidecar byte-check is false when file absent', () => {
  assert.equal(sidecarByteIdentical('/nonexistent', '/also/nope'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test .claude/lib/test/verify-doc.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement verify-doc.mjs**

```js
// .claude/lib/verify-doc.mjs
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { runGate } from './gate.mjs';

export function hasHeadlessChrome() {
  for (const c of ['google-chrome', 'chromium', 'chromium-browser']) {
    try { execSync(`command -v ${c}`, { stdio: 'ignore' }); return true; } catch {}
  }
  return false;
}

export function sidecarByteIdentical(docDir, canonicalPath) {
  const sidecar = join(docDir, 'support.js');
  if (!existsSync(sidecar) || !existsSync(canonicalPath)) return false;
  return readFileSync(sidecar).equals(readFileSync(canonicalPath));
}

function main() {
  const [doc, , accent, , canonical] = process.argv.slice(2);
  const html = readFileSync(doc, 'utf8');
  const sidecarPresent = sidecarByteIdentical(dirname(doc), canonical);
  const r = runGate(html, { accentHex: accent, sidecarPresent });
  for (const c of r.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
  if (!r.ok) { console.error('GATE FAILED'); process.exit(1); }
  if (!hasHeadlessChrome()) { console.log('VISUAL: UNVERIFIED (no headless browser)'); return; }
  console.log('VISUAL: render available — see /build step for serve+screenshot');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test .claude/lib/test/verify-doc.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/lib/verify-doc.mjs .claude/lib/test/verify-doc.test.mjs
git commit -m "feat(harness): verify-doc CLI with sidecar byte-check + capability-gated render"
```

---

### Task 4: `/plan` skill

**Files:**
- Create: `.claude/skills/plan/SKILL.md`
- Create: `.claude/skills/build/content-plan.template.md`

**Interfaces:**
- Produces: a `content-plan.md` that passes `validatePlan` (Task 1). `/build` (Task 5) consumes it.

- [ ] **Step 1: Write the template**

Create `.claude/skills/build/content-plan.template.md` mirroring the Task-1 valid fixture exactly (same header keys + per-section field names), with `<...>` placeholders and a one-line comment per field pointing at the owning spec section.

- [ ] **Step 2: Write SKILL.md**

Author `.claude/skills/plan/SKILL.md` (minimal-subset frontmatter: `name`, `description` only) encoding spec §4: precondition (refuse if no/thin source — do not become a brainstormer); read source → propose noun-phrase TOC, validate ~6–9 count → **Gate 1** user review; draft each section from source; **source-span rule** (no covering span → mandatory batched question; conflicting span → high-consequence question; never auto-pick); greenfield/metric-less detection (no fake AS-IS); emit `content-plan.md` from the template → **Gate 2** user confirms before `/build`. State the style-agnostic boundary: no page-type / device / color decisions here.

- [ ] **Step 3: Fixture dry-run verification**

Run the skill against `.claude/lib/test/fixtures/` source (create a short `source-sample.md`), producing `/tmp/content-plan.out.md`, then:
Run: `node -e "import('./.claude/lib/plan-schema.mjs').then(m=>{const md=require('fs').readFileSync('/tmp/content-plan.out.md','utf8');const r=m.validatePlan(md);if(!r.ok){console.error(r.errors);process.exit(1)}console.log('PLAN VALID')})"`
Expected: `PLAN VALID`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/plan/SKILL.md .claude/skills/build/content-plan.template.md
git commit -m "feat(harness): /plan interview skill + content-plan template"
```

---

### Task 5: `/build` skill

**Files:**
- Create: `.claude/skills/build/SKILL.md`

**Interfaces:**
- Consumes: `content-plan.md` (Task 1 schema), `verify-doc.mjs` (Task 3).
- Produces: a `doc.dc.html` + byte-identical `support.js` sidecar that passes `verify-doc`.

- [ ] **Step 1: Write SKILL.md**

Author `.claude/skills/build/SKILL.md` (minimal-subset frontmatter) encoding spec §6: linear build (no fan-out); `--style <id>` arg (validate section count/shape vs skeleton); clone the style's `template.dc.html`; map `intent`→page-type (authoring-guide §4), `figure-data`→device (§5.1), state→semantic color (design.md §1.4); render `payload` notes into the style's Korean voice/register (voice is `/build`'s job); **answer key (`design-system.answerkey.dc.html`) is the visual oracle**, not design.md prose; `support.js` = literal byte-copy from the canonical path (never regenerated); run the exit gate `node .claude/lib/verify-doc.mjs <out> --accent <hex> --canonical-support <path>` and treat non-zero as "not built."

- [ ] **Step 2: Integration dry-run**

Build from `.claude/lib/test/fixtures/plan-valid.md` with `--style indigo-serif` into `/tmp/build-out/doc.dc.html`, copy the canonical `support.js` beside it, then:
Run: `node .claude/lib/verify-doc.mjs /tmp/build-out/doc.dc.html --accent '#4338CA' --canonical-support styles/indigo-serif/support.js`
Expected: all `PASS` lines, exit 0 (VISUAL line either render-available or UNVERIFIED).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/build/SKILL.md
git commit -m "feat(harness): /build render+verify skill"
```

---

### Task 6: Host-neutral install + opencode load verification

**Files:**
- Create: `.claude/README.md`
- Modify: `README.md` (repo root) — add one pointer line under a new "Authoring harness" note.

- [ ] **Step 1: Write `.claude/README.md`**

Document: what the harness is (2-skill pipeline), the non-normative boundary (this is tooling, not the product spec), and **host-neutral install** — the CC discovery path (`.claude/skills/`, works on clone) and the opencode path (`.opencode/`; document the copy-or-symlink step to expose the two skills), plus the Node/`node --test` prerequisite and the optional headless-browser note for the visual tier.

- [ ] **Step 2: Verify one skill loads under opencode**

Perform the documented opencode install step for `plan`, then confirm opencode lists/loads it (record the exact command + output in `.claude/README.md` under a "Verified under opencode" line). If a gap is found, fix the install doc until it loads.

- [ ] **Step 3: Add repo-root pointer**

Add to root `README.md`: a short "Authoring harness" line linking `.claude/README.md`, explicitly noting it is tooling separate from the product spec.

- [ ] **Step 4: Commit**

```bash
git add .claude/README.md README.md
git commit -m "docs(harness): host-neutral install + opencode load verification"
```

---

### Task 7: Full pipeline smoke test + CLAUDE.md boundary note

**Files:**
- Modify: `CLAUDE.md` — add a fenced, explicitly non-normative pointer to `.claude/README.md`.

- [ ] **Step 1: End-to-end smoke run**

With a real short source doc, run `/plan` → confirm gates → `/build --style indigo-serif` → confirm the exit gate passes (or UNVERIFIED only on the visual tier). Serve the output over http and eyeball if a browser is available.

- [ ] **Step 2: Run the whole test suite**

Run: `node --test .claude/lib/test/`
Expected: all suites PASS.

- [ ] **Step 3: Add the CLAUDE.md boundary pointer**

Add a short fenced note to `CLAUDE.md` stating the authoring harness lives under `.claude/` and is tooling (non-normative); link `.claude/README.md`. Do not move product invariants into it.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: point CLAUDE.md at the non-normative authoring harness"
```

---

## Self-Review

**Spec coverage:** §2 host-neutral → Tasks 6, plus Global Constraints + zero-dep Node throughout. §3 two-skill file seam → Tasks 4, 5. §4 `/plan` (precondition, TOC gate, source-span rule, greenfield, 2nd gate) → Task 4 Step 2. §5 seam schema → Task 1. §6 `/build` (linear, style arg, answer-key oracle, literal sidecar, two-tier gate) → Tasks 2, 3, 5. §7 deferrals → not built (correct). §2.4 product/tooling boundary → Tasks 6, 7.

**Placeholder scan:** none — every script step carries full code; skill steps enumerate exact spec clauses to encode.

**Type consistency:** `validatePlan`/`parsePlan` field names (`sourceSpan`, `figureData`, `hasAsIs`) consistent across Tasks 1, 4. `runGate(html, {accentHex, sidecarPresent})` consistent across Tasks 2, 3, 5. `sidecarByteIdentical`/`hasHeadlessChrome` consistent across Task 3.

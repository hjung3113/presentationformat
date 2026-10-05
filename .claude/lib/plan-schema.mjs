import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { listTemplates, shapeMap } from './components.mjs';

// Header contract: see the content-plan template (.claude/skills/build/content-plan.template.md).
export const DOC_TYPES = ['explainer', 'status-report', 'proposal', 'feature-guide', 'analysis', 'pitch'];
export const AUDIENCES = ['executive', 'user', 'developer'];
// Label language of eyebrows, the appendix label and component badges (core/components.md §4 "Label language").
export const LABELS = ['en', 'ko'];
// Default when the optional `labels:` header key is absent: engineering audience → English categories, the others → Korean.
export const labelLanguage = (header) =>
  LABELS.includes(header.labels) ? header.labels : (header.audience === 'developer' ? 'en' : 'ko');
const ENUMS = {
  'doc-type': DOC_TYPES,
  audience: AUDIENCES,
  'has-as-is': ['true', 'false'],
  'metrics-mode': ['present', 'absent', 'partial'],
  'act-structure': ['flat', 'act-grouped'],
  'narrative-lens': ['architecture-first', 'use-case-first', 'decision-first'],
  labels: LABELS,
};
// Optional header keys (not in REQUIRED): `facts` (required for doc-type pitch), `as-of`, `eyebrow` (the hero
// eyebrow, verbatim; any non-placeholder text — /build writes `DOC-TYPE · 대상` when it is absent), `labels` (en | ko,
// overrides the audience-derived label language — see labelLanguage()).
const REQUIRED = ['doc-type', 'audience', 'reader-action', 'has-as-is', 'metrics-mode', 'act-structure',
  'narrative-lens', 'source-ref', 'title', 'thesis', 'cover-tokens'];
const EXEC_BANNED_SHAPES = ['code-structure', 'interaction', 'entity-relations', 'rule-table'];
// A `content` component normally needs no figure-data (peer-list → card-grid, `callout`). The exception: a
// text-table section is a pasted `table` filled from its figure-data columns/rows, so it carries them like a figure.
const FIGURE_DATA_CONTENT_SHAPES = new Set(['text-table']);

// Closed shape vocabulary = every @shape declared by a core component template, plus `none`.
// `figureShapes` are the shapes whose component is a figure/chart/report (they need figure-data), plus the
// content shapes in FIGURE_DATA_CONTENT_SHAPES (`text-table`).
export function shapeVocabulary(templates = listTemplates()) {
  const all = new Set(['none']);
  const figureShapes = new Set();
  for (const t of templates)
    for (const s of t.meta.shapes) {
      all.add(s);
      if (t.meta.kind !== 'content' || FIGURE_DATA_CONTENT_SHAPES.has(s)) figureShapes.add(s);
    }
  return { all, figureShapes };
}

// ---------- parsing ----------

// `key: value` fields; a line indented ≥2 spaces continues the open value, any other line closes it.
function parseFields(lines, keyRe) {
  const fields = {};
  let open = null;
  for (const line of lines) {
    const m = line.match(keyRe);
    if (m) { open = m[1]; fields[open] = m[2].trim(); }
    else if (open && /^[ \t]{2,}\S/.test(line)) fields[open] = `${fields[open]} ${line.trim()}`.trim();
    else open = null;
  }
  return fields;
}

const HEADER_KEY = /^([\w-]+):[ \t]*(.*)$/;
const FIELD_KEY = /^-[ \t]*([\w-]+):[ \t]*(.*)$/;

export function parseCoverTokens(v) {
  return (v || '').split(';').map(s => s.trim()).filter(Boolean).map(raw => {
    const m = raw.match(/^([^=]+?)\s*=\s*([^[]+?)\s*\[([^\]]+)\]\s*$/);
    return m ? { value: m[1], label: m[2], cite: m[3], raw } : { raw };
  });
}

const sectionIdOf = (title) => {
  const m = title.match(/^(\d+)[.)](?!\d)/);
  return m ? `s${Number(m[1])}` : 'sref';
};

export function parsePlan(md) {
  md = md.replace(/\r\n?/g, '\n');
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  const raw = fm ? parseFields(fm[1].split('\n'), HEADER_KEY) : {};
  const body = fm ? md.slice(fm[0].length) : md;
  const sections = body.split(/^##[ \t]+/m).slice(1).map(b => {
    const lines = b.split('\n');
    const title = lines[0].trim();
    const f = parseFields(lines.slice(1), FIELD_KEY);
    return {
      id: sectionIdOf(title),
      title,
      intent: f.intent || '',
      shape: (f.shape || '').replace(/`/g, '').split(/\s+/)[0] || '',
      payload: f.payload || '',
      figureData: f['figure-data'] || '',
      sourceSpan: f['source-span'] || '',
      fields: f,
    };
  });
  return {
    header: {
      raw,
      hasAsIs: raw['has-as-is'] === 'true',
      metricsMode: raw['metrics-mode'] || '',
      actStructure: raw['act-structure'] || '',
      narrativeLens: raw['narrative-lens'] || '',
      docType: raw['doc-type'] || '',
      sourceRef: raw['source-ref'] || '',
      audience: raw.audience || '',
      readerAction: raw['reader-action'] || '',
      title: raw.title || '',
      eyebrow: raw.eyebrow || '', // optional: the hero eyebrow verbatim; /build falls back to `DOC-TYPE · 대상` when empty
      labels: raw.labels || '', // optional enum en | ko; empty → labelLanguage() derives it from audience
      thesis: raw.thesis || '',
      coverTokens: parseCoverTokens(raw['cover-tokens']),
      facts: raw.facts || '',
      asOf: raw['as-of'] || '',
    },
    sections,
    hasFrontMatter: !!fm,
  };
}

// ---------- validation ----------

const isEmpty = (v) => !v || /^(none|n\/a|-|—|없음)$/i.test(v.trim());
// Template placeholders: `<true | false — …>` or a value that opens with `<…>`.
const isPlaceholder = (v) => /^<[^>]*>/.test(v.trim()) || /<[^\s>][^>]*\|[^>]*>/.test(v);
const looksLikeCitation = (v) =>
  /[/@]|\.(?:md|mdx|ts|tsx|js|jsx|mjs|json|ya?ml|sql|py|html|css|txt|csv|pdf|toml)\b|\bL\d+|\[F\d+\]/i.test(v);
const keyRe = (key) => new RegExp(`(^|[|\\s])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(\\([^)]*\\))?\\s*:`);
const isIsoDate = (v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(d) && d.toISOString().startsWith(v);
};
const ARROW = /→|⇢|->|↻|\(self\)/;

// component → { first key, needs an arrow } from its @data line. Key annotations like `layers (위→아래):`
// do not make a component "flow-like".
function figureSpecs(templates) {
  const spec = {};
  for (const t of templates) {
    const first = t.meta.dataKeys && t.meta.dataKeys[0];
    const body = (t.meta.data || '').replace(/([\w-]+)\s*\([^)]*\)\s*\??:/g, '$1:');
    spec[t.meta.component] = { key: first ? first.key : null, arrow: /→|⇢|->|↻/.test(body) };
  }
  return spec;
}

function validateHeader(plan, opts, errors) {
  const { raw } = plan.header;
  if (!plan.hasFrontMatter) { errors.push('missing YAML header block'); return; }
  for (const k of REQUIRED)
    if (!(k in raw)) errors.push(`header missing key: ${k}`);
    else if (!raw[k]) errors.push(`header key ${k} is empty`);
  for (const [k, v] of Object.entries(raw)) {
    if (v && isPlaceholder(v)) errors.push(`header ${k} is still a template placeholder: ${v.slice(0, 40)}`);
    else if (v && ENUMS[k] && !ENUMS[k].includes(v)) errors.push(`header ${k} "${v}" is not one of: ${ENUMS[k].join(', ')}`);
  }
  const { docType, facts, asOf } = plan.header;
  if (docType === 'pitch' && !('facts' in raw)) errors.push('header missing key: facts (required for doc-type pitch)');
  if (facts && !isPlaceholder(facts) && opts.planDir && !existsSync(resolve(opts.planDir, facts)))
    errors.push(`header facts file not found: ${resolve(opts.planDir, facts)}`);
  if (asOf && !isPlaceholder(asOf) && !isIsoDate(asOf))
    errors.push(`header as-of "${asOf}" must be YYYY-MM-DD`);
  const ct = raw['cover-tokens'];
  if (ct && !isPlaceholder(ct)) {
    const items = ct.split(';').map(s => s.trim()).filter(Boolean);
    if (items.length < 2 || items.length > 4) errors.push(`header cover-tokens needs 2–4 tokens separated by ";" (found ${items.length})`);
    for (const it of items)
      if (!/^\s*[^=]+=\s*[^[]+\[[^\]]+\]\s*$/.test(it)) errors.push(`header cover-tokens item "${it}" must look like 값=라벨 [cite]`);
  }
}

function validateSections(plan, specs, vocab, shapes, errors) {
  const { all, figureShapes } = vocab;
  const { sections } = plan;
  if (sections.length === 0) errors.push('no sections found');
  const seen = new Set();
  sections.forEach((s, i) => {
    const where = `section ${i + 1} (${s.title || '?'})`;
    if (seen.has(s.id)) errors.push(`${where} duplicates section id ${s.id} — number every section but the one appendix (sref)`);
    seen.add(s.id);
    if (isPlaceholder(s.title)) errors.push(`${where} title is still a template placeholder`);
    for (const k of ['intent', 'shape', 'payload', 'source-span']) {
      const v = s.fields[k] === undefined ? '' : k === 'shape' ? s.shape : s.fields[k];
      if (!v) errors.push(`${where} missing ${k}`);
      else if (isPlaceholder(v)) errors.push(`${where} ${k} is still a template placeholder`);
    }
    if (s.figureData && isPlaceholder(s.figureData)) errors.push(`${where} figure-data is still a template placeholder`);
    if (s.sourceSpan && !isPlaceholder(s.sourceSpan) && !looksLikeCitation(s.sourceSpan))
      errors.push(`${where} source-span "${s.sourceSpan.slice(0, 40)}" is not a citation (path, L12-40, [F03] or repo@sha)`);
    if (s.shape && !all.has(s.shape))
      errors.push(`${where} shape "${s.shape}" is not in the vocabulary (core/components.md §1): ${[...all].join(', ')}`);
    if (figureShapes.has(s.shape)) {
      if (isEmpty(s.figureData))
        errors.push(`${where} shape "${s.shape}" needs figure-data in its component's format (core/components/README.md)`);
      else if (!isPlaceholder(s.figureData)) checkFigureData(where, s, specs, shapes, errors);
    }
  });
}

// figure-data must start from the component's required key and, for flow-like formats, show an arrow.
function checkFigureData(where, s, specs, shapes, errors) {
  const comps = (shapes[s.shape] || []).filter(c => specs[c]);
  if (!comps.length) return;
  const keyed = comps.filter(c => !specs[c].key || keyRe(specs[c].key).test(s.figureData));
  if (!keyed.length) {
    errors.push(`${where} figure-data for shape "${s.shape}" must contain the key ${comps.map(c => `"${specs[c].key}:"`).join(' or ')} (${comps.join('|')} format, core/components/README.md)`);
    return;
  }
  if (!keyed.some(c => !specs[c].arrow || ARROW.test(s.figureData)))
    errors.push(`${where} figure-data for shape "${s.shape}" shows no flow: use → (or ASCII ->, -->, (self), ⇢, ↻) between its steps`);
}

function planWarnings(plan) {
  const out = [];
  const nums = plan.sections.filter(s => /^s\d+$/.test(s.id));
  const decisions = plan.sections.filter(s => s.shape === 'decision');
  if (decisions.length > 2) out.push(`${decisions.length} sections have shape "decision" (${decisions.map(s => s.id).join(',')}) — the request itself is one decision; the rest are probably peer-list or text-table`);
  if (plan.header.audience === 'executive') {
    // the section count follows the content (a plan covering several products needs a section set per product);
    // past ~9 sections the document is act-grouped, and past 12 even an executive reader needs acts to find the way
    if (nums.length > 12) out.push(`executive plan has ${nums.length} numbered sections (>12) — group them into acts (act-structure: act-grouped, dividers between acts) or merge sections the reader does not need to decide`);
    const heavy = nums.filter(s => EXEC_BANNED_SHAPES.includes(s.shape));
    if (heavy.length) out.push(`executive plan uses developer-grade shapes: ${heavy.map(s => `${s.id}=${s.shape}`).join(', ')}`);
    if (nums.length && !['headline-metric', 'decision'].includes(nums[0].shape)) out.push(`executive plan should open with headline-metric or decision (first numbered section is "${nums[0].shape}")`);
    if (nums.length && nums[nums.length - 1].shape !== 'decision') out.push(`executive plan should end with a decision section (last numbered section is "${nums[nums.length - 1].shape}")`);
  }
  return out;
}

// opts: { planDir?: string (resolves `facts:`), templates?: listTemplates() result (inject for tests) }
export function validatePlan(md, opts = {}) {
  const errors = [];
  const templates = opts.templates || listTemplates();
  const plan = parsePlan(md);
  validateHeader(plan, opts, errors);
  validateSections(plan, figureSpecs(templates), shapeVocabulary(templates), shapeMap(templates), errors);
  return { ok: errors.length === 0, errors, warnings: planWarnings(plan) };
}

// CLI: `node plan-schema.mjs <content-plan.md>` — exits non-zero with the error list if the
// plan is malformed, so /plan and /build can fail-fast before rendering.
async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node plan-schema.mjs <content-plan.md>');
    process.exit(2);
  }
  let md;
  try {
    md = readFileSync(path, 'utf8');
  } catch (e) {
    console.error(`cannot read plan: ${path} (${e.code || e.message})`);
    process.exit(2);
  }
  const { ok, errors, warnings } = validatePlan(md, { planDir: dirname(resolve(path)) });
  const warn = ok ? console.log : console.error;
  if (ok) {
    const { sections } = parsePlan(md);
    console.log(`content-plan OK: ${path}`);
    for (const s of sections) console.log(`  ${s.id.padEnd(5)} ${s.shape.padEnd(18)} ${s.title}`);
  } else {
    console.error(`content-plan INVALID: ${path}`);
    for (const err of errors) console.error(`  - ${err}`);
  }
  for (const w of warnings) warn(`WARN  ${w}`);
  process.exit(ok ? 0 : 1);
}

// Symlink- and encoding-safe entry guard (raw `file://${argv[1]}` breaks under paths with spaces/Korean).
const isMain = () => {
  try { return !!process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (isMain()) main();

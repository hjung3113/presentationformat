import { listTemplates } from './components.mjs';

const HEADER_KEYS = ['has-as-is', 'metrics-mode', 'act-structure', 'narrative-lens', 'source-ref'];
export const DOC_TYPES = ['explainer', 'status-report', 'proposal', 'feature-guide', 'analysis'];

// Closed shape vocabulary = every @shape declared by a core component template, plus `none`.
// `figureShapes` are the shapes whose component is a figure/chart/report (they need figure-data).
export function shapeVocabulary() {
  const all = new Set(['none']);
  const figureShapes = new Set();
  for (const t of listTemplates())
    for (const s of t.meta.shapes) {
      all.add(s);
      if (t.meta.kind !== 'content') figureShapes.add(s);
    }
  return { all, figureShapes };
}

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
      shape: field('shape').replace(/`/g, '').split(/\s+/)[0] || '',
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
      narrativeLens: header['narrative-lens'] || '',
      docType: header['doc-type'] || '',
      sourceRef: header['source-ref'] || '',
    },
    sections,
  };
}

const isEmpty = (v) => !v || /^(none|n\/a|-|—|없음)$/i.test(v.trim());

export function validatePlan(md) {
  const errors = [];
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) errors.push('missing YAML header block');
  else for (const k of HEADER_KEYS)
    if (!new RegExp(`^${k}:`, 'm').test(fm[1])) errors.push(`header missing key: ${k}`);
  const { header, sections } = parsePlan(md);
  if (header.docType && !DOC_TYPES.includes(header.docType))
    errors.push(`header doc-type "${header.docType}" is not one of: ${DOC_TYPES.join(', ')}`);
  const { all, figureShapes } = shapeVocabulary();
  if (sections.length === 0) errors.push('no sections found');
  sections.forEach((s, i) => {
    const where = `section ${i + 1} (${s.title || '?'})`;
    for (const k of ['intent', 'shape', 'payload', 'source-span']) {
      const key = k === 'source-span' ? 'sourceSpan' : k;
      if (!s[key]) errors.push(`${where} missing ${k}`);
    }
    if (s.shape && !all.has(s.shape))
      errors.push(`${where} shape "${s.shape}" is not in the vocabulary (core/components.md §1): ${[...all].join(', ')}`);
    if (figureShapes.has(s.shape) && isEmpty(s.figureData))
      errors.push(`${where} shape "${s.shape}" needs figure-data in its component's format (core/components/README.md)`);
  });
  return { ok: errors.length === 0, errors };
}

// CLI: `node plan-schema.mjs <content-plan.md>` — exits non-zero with the error list if the
// plan is malformed, so /plan and /build can fail-fast before rendering. Mirrors the
// import.meta.url guard used by verify-doc.mjs.
async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node plan-schema.mjs <content-plan.md>');
    process.exit(2);
  }
  const { readFileSync } = await import('node:fs');
  let md;
  try {
    md = readFileSync(path, 'utf8');
  } catch (e) {
    console.error(`cannot read plan: ${path} (${e.code || e.message})`);
    process.exit(2);
  }
  const { ok, errors } = validatePlan(md);
  if (ok) {
    const { sections } = parsePlan(md);
    console.log(`content-plan OK: ${path}`);
    for (const s of sections) console.log(`  ${s.shape.padEnd(18)} ${s.title}`);
    process.exit(0);
  }
  console.error(`content-plan INVALID: ${path}`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

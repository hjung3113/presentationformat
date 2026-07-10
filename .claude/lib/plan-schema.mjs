const HEADER_KEYS = ['has-as-is', 'metrics-mode', 'act-structure', 'narrative-lens', 'source-ref'];

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
      narrativeLens: header['narrative-lens'] || '',
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
    console.log(`content-plan OK: ${path}`);
    process.exit(0);
  }
  console.error(`content-plan INVALID: ${path}`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

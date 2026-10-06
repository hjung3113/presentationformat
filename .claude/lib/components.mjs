// Component library generator (tooling — non-normative).
//
// Source of structure: core/components/<id>.html — style-agnostic templates that name design
// tokens by role (⟨accent⟩, ⟨r:card⟩, ⟨f:body⟩) and mark fill-in text as ⟦slot⟧.
// Source of values:    styles/<style>/design.tokens.md front matter (colors / rounded / fontStacks).
// Output (committed):  styles/<style>/components/<id>.html  — paste-ready, literal values
//                      styles/<style>/components/README.md — generated index
//                      styles/<style>/components.gallery.dc.html — rendered gallery (visual oracle
//                      for the component layer)
//
// CLI:
//   node .claude/lib/components.mjs build [--style <id>]   regenerate outputs
//   node .claude/lib/components.mjs check                  exit 1 if any output is stale
//   node .claude/lib/components.mjs list [--style <id>]    print id · shape · use, one per line
//   node .claude/lib/components.mjs shapes                 print shape → component map as JSON
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CORE_DIR = join(ROOT, 'core', 'components');
export const STYLES_DIR = join(ROOT, 'styles');
export const SLOT_OPEN = '⟦';
export const SLOT_CLOSE = '⟧';

// ---------- tokens ----------

// Minimal front-matter reader for the three flat maps the components consume.
export function loadTokens(styleId) {
  const file = join(STYLES_DIR, styleId, 'design.tokens.md');
  const md = readFileSync(file, 'utf8');
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${file}: no front matter`);
  const maps = { colors: {}, rounded: {}, fontStacks: {} };
  let current = null;
  for (const line of fm[1].split('\n')) {
    const top = line.match(/^([A-Za-z][\w-]*):\s*$/);
    if (top) { current = maps[top[1]] ? top[1] : null; continue; }
    if (/^\S/.test(line)) { current = null; continue; }
    if (!current) continue;
    const kv = line.match(/^ {2}([\w-]+):\s*"([^"]*)"/);
    if (kv) maps[current][kv[1]] = kv[2];
  }
  return maps;
}

export function listStyles() {
  return readdirSync(STYLES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(STYLES_DIR, d.name, 'design.tokens.md')))
    .map(d => d.name)
    .sort();
}

// ---------- templates ----------

export function listTemplates(dir = CORE_DIR) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.html') && !f.startsWith('_'))
    .sort()
    .map(f => {
      const src = readFileSync(join(dir, f), 'utf8');
      const meta = parseMeta(src);
      // Guards the metadata comment against an early `-->` and the root against a missing marker.
      if (!bodyOf(src).startsWith(`<div data-component="${meta.component}"`))
        throw new Error(`${f}: body must start with <div data-component="${meta.component}"> right after the metadata comment`);
      return { file: f, src, meta };
    })
    .sort((a, b) => (a.meta.order - b.meta.order) || a.meta.component.localeCompare(b.meta.component));
}

export function parseMeta(src) {
  const c = src.match(/^<!--([\s\S]*?)-->/);
  if (!c) throw new Error('component template must start with a metadata comment');
  const meta = { order: 999 };
  for (const line of c[1].split('\n')) {
    const m = line.match(/^@([\w-]+)\s+(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  meta.shapes = (meta.shape || '').split(/\s+/).filter(Boolean);
  meta.dataKeys = parseDataKeys(meta.data);
  meta.limitsX = parseLimitsX(meta['limits-x']);
  meta.order = Number(meta.order || 999);
  for (const k of ['component', 'kind', 'title', 'use'])
    if (!meta[k]) throw new Error(`component metadata missing @${k}`);
  return meta;
}

// `@limits-x key=min..max key=min..max …` → { key: { min, max } }: the machine-readable twin of the `@limits` prose line
// (the plan check counts a figure-data against `max`; a drift test ties every range to the prose). A malformed token throws.
export function parseLimitsX(text) {
  const out = {};
  for (const tok of (text || '').split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^([a-z][a-z0-9-]*)=(\d+)\.\.(\d+)$/);
    if (!m) throw new Error(`@limits-x: "${tok}" is not key=min..max`);
    const [min, max] = [Number(m[2]), Number(m[3])];
    if (min > max) throw new Error(`@limits-x: ${m[1]}=${min}..${max} has min above max`);
    if (m[1] in out) throw new Error(`@limits-x: key "${m[1]}" is repeated`);
    out[m[1]] = { min, max };
  }
  return out;
}

// `@data k1: eg | k2?: eg | …` → [{ key, optional }]. The first key is the required one (never optional);
// a `(annotation)` between key and colon is tolerated; segments without a `key:` head are prose.
export function parseDataKeys(data) {
  const keys = [];
  for (const seg of (data || '').split(' | ')) {
    const m = seg.trim().match(/^([\w-]+)\s*(?:\([^)]*\))?\s*(\?)?:/);
    if (m) keys.push({ key: m[1], optional: !!m[2] && keys.length > 0 });
  }
  return keys;
}

export function shapeMap(templates = listTemplates()) {
  const map = {};
  for (const t of templates)
    for (const s of t.meta.shapes) (map[s] ||= []).push(t.meta.component);
  return map;
}

export function componentIds() {
  return listTemplates().map(t => t.meta.component);
}

// Replace ⟨role⟩ placeholders with literal values from one style's tokens.
export function renderTemplate(src, tokens) {
  const missing = new Set();
  const out = src.replace(/⟨([rf]:)?([\w-]+)⟩/g, (all, prefix, key) => {
    const map = prefix === 'r:' ? tokens.rounded : prefix === 'f:' ? tokens.fontStacks : tokens.colors;
    if (map[key] === undefined) { missing.add(all); return all; }
    return map[key];
  });
  return { out, missing: [...missing] };
}

export const stripSlots = (html) => html.split(SLOT_OPEN).join('').split(SLOT_CLOSE).join('');

// The component body = everything after the metadata comment.
const bodyOf = (src) => src.replace(/^<!--[\s\S]*?-->\s*/, '');

// ---------- outputs ----------

function snippetFile(styleId, t, rendered) {
  return `<!-- GENERATED for style "${styleId}" from core/components/${t.file} by .claude/lib/components.mjs — do not edit here.
     Paste the <div data-component="${t.meta.component}"> block into a section, then replace EVERY ⟦…⟧ (the exit gate fails on any left over). -->
${rendered}`;
}

// Style-agnostic index of every template (no values) — what /plan reads for figure-data formats.
function coreIndexFile(templates) {
  const rows = templates.map(t =>
    `| \`${t.meta.component}\` | ${t.meta.shapes.map(s => `\`${s}\``).join(' ') || '—'} | ${t.meta.use} | ${t.meta.avoid || '—'} | ${t.meta.limits || '—'} | ${t.meta.data ? `\`${t.meta.data.replace(/\|/g, '\\|')}\`` : '—'} |`);
  return `# Component templates — index

> GENERATED by \`.claude/lib/components.mjs\` from the metadata header of each \`*.html\` here — do not edit.
> Selection rules live in \`../components.md\`. Paste-ready, valued copies live in each style's \`components/\` folder.
> The **figure-data format** column is what \`/plan\` writes into a section's \`figure-data\` field for that shape.
> **Limits** is each template's \`@limits\` prose; every countable part also has a machine-readable \`@limits-x\` token
> (\`key=min..max\`, in the template's metadata comment) that the plan check counts a figure-data against and warns above \`max\`.

| Component | Shape(s) | Use when | Do not use when | Limits | figure-data format |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
}

function readmeFile(styleId, templates) {
  const rows = templates.map(t =>
    `| \`${t.meta.component}\` | ${t.meta.kind} | ${t.meta.shapes.map(s => `\`${s}\``).join(' ') || '—'} | ${t.meta.use} | ${t.meta.limits || '—'} | [${t.meta.component}.html](${t.meta.component}.html) |`);
  return `# Component library — ${styleId}

> GENERATED by \`.claude/lib/components.mjs\` — do not edit. Structure comes from
> \`core/components/\`, values from \`../design.tokens.md\`. Pick a component with the shape table in
> \`core/components.md\`, open its file here, paste the \`<div data-component=…>\` block, fill every
> \`⟦…⟧\`. Rendered gallery: \`../components.gallery.dc.html\`.

| Component | Kind | Shape(s) | Use when | Limits | File |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
}

function galleryFile(styleId, templates, tokens, renderedById) {
  const tpl = readFileSync(join(STYLES_DIR, styleId, 'template.dc.html'), 'utf8');
  const head = tpl.slice(0, tpl.indexOf('</helmet>') + '</helmet>'.length);
  const script = tpl.slice(tpl.indexOf('<script type="text/x-dc" data-dc-script>'));
  const c = tokens.colors, r = tokens.rounded, f = tokens.fontStacks;
  const groups = [
    ['figure', '도식 · UML', 'DIAGRAMS'],
    ['chart', '차트 · 수치', 'CHARTS'],
    ['report', '보고 · 결정', 'REPORT'],
    ['content', '기본 콘텐츠', 'CONTENT'],
  ];
  const nav = groups.map(([kind, label], i) =>
    `<a data-navlink="g${i + 1}" href="#g${i + 1}" style="text-decoration:none; font:500 13px/1 ${f.body}; color:${c['muted-500']}; white-space:nowrap;">${label}</a>`).join('\n        ');
  const sections = groups.map(([kind, label, eng], i) => {
    const items = templates.filter(t => t.meta.kind === kind).map(t => `
      <div style="padding:30px 0 34px; border-top:1px solid ${c['border-section'] || c.border};">
        <div style="display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:6px;">
          <span style="font:600 18px/1.4 ${f.body}; color:${c['ink-900']};">${t.meta.title}</span>
          <span style="font:600 11.5px/1 ${f.mono}; color:${c.accent}; background:${c['accent-050']}; border-radius:${r['pill-sm']}; padding:5px 8px;">${t.meta.component}</span>
          ${t.meta.shapes.map(s => `<span style="font:500 11px/1 ${f.mono}; color:${c['muted-500']};">shape: ${s}</span>`).join(' ')}
        </div>
        <div style="display:flex; gap:10px; background:${c['accent-050']}; border-radius:${r['card-sm']}; padding:11px 14px; margin:10px 0 18px;"><span style="font:700 11px/1.6 ${f.body}; letter-spacing:.03em; color:${c.accent}; white-space:nowrap;">언제 쓰나</span><span style="font:400 12.5px/1.6 ${f.body}; color:${c.body};">${t.meta.use}${t.meta.avoid ? ` <span style="color:${c['muted-400']};">· 쓰지 않을 때: ${t.meta.avoid}</span>` : ''}</span></div>
        ${stripSlots(bodyOf(renderedById[t.meta.component]))}
      </div>`).join('\n');
    return `
    <section id="g${i + 1}" data-screen-label="${String(i + 1).padStart(2, '0')} ${label}" style="padding:48px 0 24px;">
      <div style="font:700 13px/1 ${f.body}; letter-spacing:.08em; color:${c.accent}; margin-bottom:14px;">${String(i + 1).padStart(2, '0')} · ${eng}</div>
      <h2 style="font:600 30px/1.34 ${f.display}; color:${c['ink-900']}; margin:0 0 6px;">${label}</h2>
      ${items}
    </section>`;
  }).join('\n');
  return `${head}
<!-- GENERATED by .claude/lib/components.mjs — do not edit. Gallery of core/components rendered in "${styleId}". -->
<div style="font-family:${f.body}; color:${c['ink-800']}; background:${c['page-bg']}; min-height:100vh;">
  <div style="position:fixed; top:0; left:0; right:0; height:3px; background:transparent; z-index:60;"><div id="rprog" style="height:100%; width:0%; background:${c.accent};"></div></div>
  <div style="position:sticky; top:0; z-index:50; background:rgba(255,255,255,.86); backdrop-filter:blur(10px); border-bottom:1px solid ${c['border-node']};">
    <div style="max-width:1100px; margin:0 auto; padding:0 min(40px,5vw); display:flex; align-items:center; gap:20px; height:54px;">
      <a href="#top" style="text-decoration:none; font:700 14px/1 ${f.body}; color:${c['ink-900']}; white-space:nowrap;">Components <span style="color:${c.accent};">${styleId}</span></a>
      <div class="nav-scroll" style="display:flex; gap:18px; overflow-x:auto; margin-left:auto;">
        ${nav}
      </div>
    </div>
  </div>
  <div id="top" style="max-width:1100px; margin:0 auto; padding:56px min(64px,6vw) 8px;">
    <div style="font:700 13px/1 ${f.body}; letter-spacing:.08em; color:${c.accent}; margin-bottom:14px;">COMPONENT LIBRARY · ${styleId}</div>
    <h1 style="font:700 40px/1.25 ${f.display}; color:${c['ink-900']}; margin:0 0 14px;">컴포넌트 라이브러리</h1>
    <p style="font:400 16px/1.85 ${f.body}; color:${c['body-lead']}; margin:0; max-width:760px;">도식은 내용의 모양(shape)으로 고른다. 각 항목의 HTML은 <span style="font:500 14px/1 ${f.mono}; color:${c.accent};">styles/${styleId}/components/&lt;id&gt;.html</span>에 있고, 붙여 넣은 뒤 모든 &#x27E6;…&#x27E7; 자리를 채운다. 선택 규칙은 core/components.md에 있다.</p>
  </div>
  <div style="max-width:1100px; margin:24px auto 0; background:${c.white}; border-radius:${r.panel} ${r.panel} 0 0; padding:8px min(64px,6vw) 100px;">
${sections}
  </div>
</div>
</x-dc>

${script}`;
}

export function buildStyle(styleId) {
  const tokens = loadTokens(styleId);
  const templates = listTemplates();
  const files = {};
  const renderedById = {};
  const missing = [];
  for (const t of templates) {
    const { out, missing: miss } = renderTemplate(t.src, tokens);
    if (miss.length) missing.push(`${t.file}: ${miss.join(' ')}`);
    renderedById[t.meta.component] = out;
    files[join('components', `${t.meta.component}.html`)] = snippetFile(styleId, t, out);
  }
  if (missing.length) throw new Error(`style "${styleId}" lacks tokens:\n  ${missing.join('\n  ')}`);
  files[join('components', 'README.md')] = readmeFile(styleId, templates);
  files['components.gallery.dc.html'] = galleryFile(styleId, templates, tokens, renderedById);
  return files;
}

function writeStyle(styleId) {
  const files = buildStyle(styleId);
  mkdirSync(join(STYLES_DIR, styleId, 'components'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) writeFileSync(join(STYLES_DIR, styleId, rel), content);
  // drop snippets whose template was removed
  for (const f of readdirSync(join(STYLES_DIR, styleId, 'components')))
    if (!files[join('components', f)]) unlinkSync(join(STYLES_DIR, styleId, 'components', f));
  return Object.keys(files).length;
}

export function staleFiles() {
  const stale = [];
  const idx = join(CORE_DIR, 'README.md');
  if (!existsSync(idx) || readFileSync(idx, 'utf8') !== coreIndexFile(listTemplates())) stale.push('core/components/README.md');
  for (const styleId of listStyles()) {
    const files = buildStyle(styleId);
    for (const [rel, content] of Object.entries(files)) {
      const p = join(STYLES_DIR, styleId, rel);
      if (!existsSync(p) || readFileSync(p, 'utf8') !== content) stale.push(join('styles', styleId, rel));
    }
    const dir = join(STYLES_DIR, styleId, 'components');
    if (existsSync(dir))
      for (const f of readdirSync(dir))
        if (!files[join('components', f)]) stale.push(join('styles', styleId, 'components', f) + ' (orphan)');
  }
  return stale;
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const si = rest.indexOf('--style');
  const only = si >= 0 ? rest[si + 1] : null;
  const styles = only ? [only] : listStyles();
  if (cmd === 'build') {
    writeFileSync(join(CORE_DIR, 'README.md'), coreIndexFile(listTemplates()));
    for (const s of styles) { const n = writeStyle(s); console.log(`built ${s}: ${n} files`); }
  } else if (cmd === 'check') {
    const stale = staleFiles();
    if (stale.length) {
      console.error('component outputs are stale — run `node .claude/lib/components.mjs build`:');
      for (const s of stale) console.error(`  - ${s}`);
      process.exit(1);
    }
    console.log('component outputs up to date');
  } else if (cmd === 'list') {
    for (const t of listTemplates())
      console.log(`${t.meta.component.padEnd(16)} ${t.meta.kind.padEnd(8)} ${(t.meta.shapes.join(',') || '-').padEnd(22)} ${t.meta.use}`);
  } else if (cmd === 'shapes') {
    console.log(JSON.stringify(shapeMap(), null, 2));
  } else {
    console.error('usage: node .claude/lib/components.mjs build|check|list|shapes [--style <id>]');
    process.exit(2);
  }
}

// Symlink- and encoding-safe entry guard (raw `file://${argv[1]}` breaks under paths with spaces/Korean).
const isMain = () => {
  try { return !!process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (isMain()) main();

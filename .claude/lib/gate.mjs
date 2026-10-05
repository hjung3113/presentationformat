// Pure gate checks over a document's HTML. No I/O here — verify-doc.mjs reads files and wires options.
import { visibleBlocks, parseTerms, bannedTermHits, missingFirstUse, proseWarnings } from './prose.mjs';
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
const stripScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, '');

// Split a document into its <section> elements (in order), comments removed.
export function splitSections(html) {
  const body = stripComments(html);
  const starts = [...body.matchAll(/<section\b[^>]*>/g)];
  return starts.map((m, i) => {
    const idm = m[0].match(/\bid=["']([^"']+)["']/);
    const end = i + 1 < starts.length ? starts[i + 1].index : body.length;
    const chunk = body.slice(m.index, end);
    const components = [...chunk.matchAll(/data-component=["']([^"']+)["']/g)].map(c => c[1]);
    return { id: idm ? idm[1] : '', components };
  });
}

// ---------- inline-only ----------

// First class selector found in a CSS text (any nesting depth, incl. @media and `.a, .b {` lists).
// Attribute/element/pseudo selectors, at-rule preludes, and the scrollbar/selection pseudo-elements
// (global CSS that cannot be inlined) stay allowed.
export function findClassSelector(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/([^{};]+)\{/g)) {
    const prelude = m[1].trim();
    if (prelude.startsWith('@')) continue;
    for (const sel of prelude.split(',')) {
      const bare = sel.replace(/\[[^\]]*\]/g, '').replace(/(["'])(?:(?!\1).)*\1/g, '');
      const cls = bare.match(/(?<!\d)\.[A-Za-z_-][\w-]*/);
      if (cls && !/::(?:-webkit-scrollbar|-moz-selection|selection)/.test(bare)) return sel.trim();
    }
  }
  return null;
}

// ---------- palette ----------

// #abc → #AABBCC; #RRGGBBAA / #RGBA → alpha dropped. Other lengths are not colors.
export function normHex(h) {
  let x = h.replace('#', '').toUpperCase();
  if (x.length === 3 || x.length === 4) x = [...x].map(c => c + c).join('');
  return x.length === 6 || x.length === 8 ? `#${x.slice(0, 6)}` : null;
}

// Hex colors used in style attributes, color-ish presentation attributes and <style> text
// (comments, <script>, &#…; entities, id/href fragments and url(#…) are ignored by construction).
export function usedHexes(html) {
  const live = stripScripts(stripComments(html));
  const chunks = [...live.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
  for (const m of live.matchAll(/(?<![\w-])(?:style|fill|stroke|stop-color|flood-color|color|bgcolor)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi))
    chunks.push(m[1] ?? m[2]);
  const found = [];
  for (const c of chunks)
    for (const m of c.replace(/url\([^)]*\)/gi, '').matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      const n = normHex(m[0]);
      if (n) found.push({ lit: m[0], norm: n });
    }
  return found;
}

// ---------- grid-consistency ----------

// [start, end) of every [data-component] root element, by tag balancing (falls back to the next root).
function componentSpans(body) {
  const roots = [...body.matchAll(/<(\w+)\b[^>]*\bdata-component=["']([^"']+)["'][^>]*>/g)];
  return roots.map((m, i) => {
    const tag = m[1];
    const re = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi');
    re.lastIndex = m.index;
    let depth = 0, end = -1;
    for (let t; (t = re.exec(body));) {
      if (t[2] === '/' && t[1] === '') continue; // self-closing
      depth += t[1] === '/' ? -1 : 1;
      if (depth === 0) { end = t.index + t[0].length; break; }
    }
    if (end < 0) end = i + 1 < roots.length ? roots[i + 1].index : body.length;
    return { name: m[2], start: m.index, end };
  });
}

// For each component root: every repeat(M,1fr) must equal N when the root uses calc(100% / N).
export function gridInconsistencies(html) {
  const body = stripComments(html);
  const spans = componentSpans(body);
  const bad = [];
  for (const s of spans) {
    let text = body.slice(s.start, s.end);
    // nested component roots are judged on their own, not as part of the outer one
    for (const c of spans.filter(c => c !== s && c.start > s.start && c.end <= s.end).sort((a, b) => b.start - a.start))
      text = text.slice(0, c.start - s.start) + text.slice(c.end - s.start);
    const ns = [...new Set([...text.matchAll(/calc\(\s*100%\s*\/\s*(\d+(?:\.\d+)?)\s*\)/g)].map(m => m[1]))];
    if (!ns.length) continue;
    const ms = [...new Set([...text.matchAll(/repeat\(\s*(\d+)\s*,\s*(?:1fr|minmax\(\s*0\s*,\s*1fr\s*\))\s*\)/g)].map(m => m[1]))];
    const off = ms.filter(m => !ns.includes(m));
    if (off.length) bad.push(`${s.name}: calc(100%/N) N=${ns.join(',')} but repeat(M,1fr) M=${ms.join(',')}`);
  }
  return bad;
}

// ---------- numbers-traced ----------

const NUM = /\d+(?:,\d{3})*(?:\.\d+)?/g;
const normNum = (t) => t.replace(/,/g, '').replace(/^0+(?=\d)/, '');
// Source line refs (`L12-40`, `L7`) and ledger ids (`F07`, `Q01`, `C03`) name a place, not a value — they
// must not "trace" a number the document shows, and a ledger id the document cites is not a value either.
const scrubRefs = (text) => text
  .replace(/\bL\d+(?:\s*[-–]\s*L?\d+)?/g, ' ')
  .replace(/\b[FQC]\d{1,3}(?:\s*[-–]\s*[FQC]?\d{1,3})?\b/g, ' ');
// Plan section headings (`## 3. …`) number the plan, not the subject.
const numSet = (text) => new Set([...scrubRefs(text.replace(/^##\s+\d+\.\s/gm, '## ')).matchAll(NUM)].map(m => normNum(m[0])));

// Visible text nodes of a markup fragment: comments, <script>, <style>, <helmet>, tags and entities gone.
function textNodes(fragment) {
  return fragment
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<helmet>[\s\S]*?<\/helmet>/gi, '')
    .replace(/<[^>]*>/g, '\u0001')
    .split('\u0001')
    .map(s => s.replace(/&#?\w+;/g, ' ').trim())
    .filter(Boolean);
}

// Numerals shown to the reader that appear nowhere in `tracedText` (plan + facts ledger).
// Exempt: `NN ·` eyebrows, 1–2 digit-only text nodes inside sections (step/number badges),
// `N.`/`N)` list markers, sN/sref ids. Hero text (before the first <section>) is checked in full.
export function untracedNumbers(html, tracedText) {
  const body = stripComments(html);
  const first = body.search(/<section\b/);
  const hero = first < 0 ? '' : body.slice(0, first);
  const rest = first < 0 ? body : body.slice(first);
  const known = numSet(tracedText);
  const out = new Map();
  const scan = (nodes, inHero) => {
    for (let t of nodes) {
      if (!inHero && /^\d{1,2}$/.test(t)) continue;
      t = scrubRefs(t.replace(/^\d{2}\s*·/, ' ').replace(/^\d{1,2}[.)]\s+/, ' ').replace(/\bs\d{1,2}\b/g, ' '));
      for (const m of t.matchAll(NUM)) {
        const n = normNum(m[0]);
        if (known.has(n) || out.has(n)) continue;
        out.set(n, `…${t.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).trim()}…`);
      }
    }
  };
  scan(textNodes(hero), true);
  scan(textNodes(rest), false);
  return [...out].map(([num, ctx]) => ({ num, ctx }));
}

// opts: { accentHex, sidecarPresent,
//         knownComponents?: string[], figureComponents?: string[],
//         plan?: { sections: [{ id, title, shape }] }, shapeMap?: { [shape]: string[] },
//         paletteHexes?: string[],                          // active style's design.md palette → `palette`
//         planText?: string, factsText?: string,            // with plan → `numbers-traced`; a `## T — 용어` table in the
//                                                           //   facts → `terms-consistent` + `terms:first-use`
//         factsError?: string }                             // facts file named by the plan could not be read
// → { ok, checks, warnings, notes }: `warnings` never fail the gate (figures:*, prose:*, terms:first-use); `notes` say
//   which optional check did not run and why.
export function runGate(html, opts) {
  const checks = [];
  const warnings = [];
  const notes = [];
  const add = (name, ok, detail = '') => checks.push({ name, ok, detail });
  const live = stripComments(html);
  let cached;
  const blocks = () => (cached ??= visibleBlocks(html)); // the reader's text, parsed once for terms and prose

  add('keep-all', /word-break\s*:\s*keep-all/.test(html));
  add('accent-present', html.toLowerCase().includes(String(opts.accentHex).toLowerCase()), opts.accentHex);
  add('sidecar-present', opts.sidecarPresent === true);

  // ids and nav links are read from the live markup: a commented-out block (the template's `VARIANT compact hero`)
  // is not in the DOM, so an `id="top"` inside it must not collide with the real one.
  const ids = [...live.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  add('unique-ids', dup.length === 0, dup.join(','));

  const navTargets = [...live.matchAll(/data-navlink=["']([^"']+)["']/g)].map(m => m[1]);
  const dangling = navTargets.filter(t => !ids.includes(t));
  add('navlink-integrity', dangling.length === 0, dangling.join(','));

  // inline-only: <style> may hold only allowed globals — no class selectors, however nested or listed
  const styleBlocks = [...live.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  const classSel = findClassSelector(styleBlocks.join('\n'));
  add('inline-only', !classSel, classSel ? `class selector in <style>: ${classSel}` : '');

  // pasted components: every ⟦slot⟧ filled and every ⟨role⟩ resolved (comments are ignored)
  const leftover = [...live.matchAll(/⟦([^⟧]{0,40})/g)].map(m => m[1]);
  add('slots-filled', leftover.length === 0, leftover.length ? `${leftover.length} left, e.g. ⟦${leftover[0]}⟧` : '');
  const roles = [...live.matchAll(/⟨([^⟩\n]{0,40})⟩?/g)].map(m => m[0]);
  add('no-role-placeholders', roles.length === 0, roles.length ? `${roles.length} left, e.g. ${roles[0]}` : '');

  if (opts.paletteHexes) {
    const allowed = new Set(opts.paletteHexes.map(normHex).filter(Boolean));
    const off = [...new Set(usedHexes(html).filter(h => !allowed.has(h.norm)).map(h => h.lit))];
    add('palette', off.length === 0, off.length ? `${off.length} color(s) not in the style's design.md: ${off.slice(0, 8).join(' ')}` : '');
  }

  const gridBad = gridInconsistencies(html);
  add('grid-consistency', gridBad.length === 0, gridBad.join(' ; '));

  const sections = splitSections(html);
  if (opts.knownComponents) {
    const used = sections.flatMap(s => s.components);
    const unknown = [...new Set(used.filter(c => !opts.knownComponents.includes(c)))];
    add('known-components', unknown.length === 0, unknown.join(','));
  }

  if (opts.plan && opts.shapeMap) {
    const planSecs = opts.plan.sections;
    const want = planSecs.map(p => p.id);
    const have = sections.map(s => s.id);
    const missing = want.filter(id => !have.includes(id));
    const extra = have.filter(id => /^s\d+$/.test(id) && !want.includes(id));
    const aligned = missing.length === 0 && extra.length === 0;
    add('plan-alignment', aligned, aligned ? '' :
      `plan expects ${want.join(',')}; document has ${have.join(',') || 'no <section>s'}` +
      `${missing.length ? ` — missing: ${missing.join(',')}` : ''}${extra.length ? ` — not in plan: ${extra.join(',')}` : ''}`);
    const misses = [];
    for (const p of planSecs) {
      if (!p.shape || p.shape === 'none') continue;
      const sec = sections.find(s => s.id === p.id);
      if (!sec) continue; // reported by plan-alignment
      const need = opts.shapeMap[p.shape] || [];
      if (!need.some(c => sec.components.includes(c)))
        misses.push(`${p.id} (shape ${p.shape}) needs ${need.join('|') || '?'}; found ${sec.components.join(',') || 'no component'}`);
    }
    add('plan-shapes', misses.length === 0, misses.join(' ; '));

    if (opts.planText !== undefined) {
      if (opts.factsError) add('numbers-traced', false, opts.factsError);
      else {
        const untraced = untracedNumbers(html, `${opts.planText}\n${opts.factsText || ''}`);
        add('numbers-traced', untraced.length === 0, untraced.length
          ? `${untraced.length} number(s) not in the plan or facts: ${untraced.slice(0, 8).map(u => `${u.num} ${u.ctx}`).join(' ; ')}` : '');
        const terms = parseTerms(opts.factsText);
        if (terms.length) {
          const hits = bannedTermHits(blocks(), terms);
          add('terms-consistent', hits.length === 0, hits.length
            ? `${hits.length} banned variant(s) in the body: ${hits.slice(0, 8).map(h => `${h.id} "${h.variant}" (use ${h.term}) ${h.ctx}`).join(' ; ')}` : '');
          const missing = missingFirstUse(blocks(), terms);
          if (missing.length)
            warnings.push({ name: 'terms:first-use', detail: `${missing.length} term(s) never appear in their first-use form: ${missing.slice(0, 8).map(t => t.first).join(' ; ')}` });
        } else {
          notes.push({ name: 'terms-consistent', detail: opts.factsText === undefined
            ? 'not checked — the plan names no facts file with a "## T — 용어" table (see .claude/skills/plan/facts.template.md)'
            : 'not checked — the facts file has no "## T — 용어" table (optional; see .claude/skills/plan/facts.template.md)' });
        }
      }
    }
  }

  // non-blocking figure coverage
  if (opts.figureComponents) {
    const numbered = sections.filter(s => /^s\d+$/.test(s.id));
    const figs = numbered.map(s => s.components.filter(c => opts.figureComponents.includes(c)));
    const distinct = new Set(figs.flat());
    const bare = numbered.filter((s, i) => figs[i].length === 0).map(s => s.id);
    if (numbered.length >= 5 && distinct.size < 3)
      warnings.push({ name: 'figures:low-variety', detail: `${distinct.size} distinct figure component(s) across ${numbered.length} numbered sections — check core/components.md §2 for missed shapes` });
    if (numbered.length && bare.length > numbered.length / 3)
      warnings.push({ name: 'figures:bare-sections', detail: `${bare.length}/${numbered.length} numbered sections have no pasted figure component (hand-drawn figures without data-component are not counted): ${bare.join(',')}` });
    numbered.forEach((s, i) => {
      if (figs[i].length > 2) warnings.push({ name: 'figures:crowded-section', detail: `${s.id} has ${figs[i].length} figures (${figs[i].join(',')}) — one idea per figure, ≤2 per section` });
    });
    warnings.push({ level: 'INFO', name: 'figures:coverage', detail: numbered.map((s, i) => `${s.id}=${figs[i].join('+') || '—'}`).join(' ') });
  }

  // non-blocking Korean prose heuristics (never fail the gate)
  warnings.push(...proseWarnings(blocks()));

  return { ok: checks.every(c => c.ok), checks, warnings, notes };
}

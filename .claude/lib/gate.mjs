const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

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

// opts: { accentHex, sidecarPresent,
//         knownComponents?: string[], figureComponents?: string[],
//         plan?: { sections: [{ title, shape }] }, shapeMap?: { [shape]: string[] } }
export function runGate(html, opts) {
  const checks = [];
  const warnings = [];
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

  // pasted components: every ⟦slot⟧ filled (comments are ignored)
  const live = stripComments(html);
  const leftover = [...live.matchAll(/⟦([^⟧]{0,40})/g)].map(m => m[1]);
  add('slots-filled', leftover.length === 0, leftover.length ? `${leftover.length} left, e.g. ⟦${leftover[0]}⟧` : '');

  const sections = splitSections(html);
  if (opts.knownComponents) {
    const used = sections.flatMap(s => s.components);
    const unknown = [...new Set(used.filter(c => !opts.knownComponents.includes(c)))];
    add('known-components', unknown.length === 0, unknown.join(','));
  }

  if (opts.plan && opts.shapeMap) {
    const planSecs = opts.plan.sections;
    const aligned = planSecs.length === sections.length;
    add('plan-alignment', aligned, aligned ? '' : `plan has ${planSecs.length} sections, document has ${sections.length} <section>s`);
    if (aligned) {
      const misses = [];
      planSecs.forEach((p, i) => {
        if (!p.shape || p.shape === 'none') return;
        const need = opts.shapeMap[p.shape] || [];
        const have = sections[i].components;
        if (!need.some(c => have.includes(c)))
          misses.push(`${sections[i].id || `#${i + 1}`} (shape ${p.shape}) needs ${need.join('|') || '?'}; found ${have.join(',') || 'no component'}`);
      });
      add('plan-shapes', misses.length === 0, misses.join(' ; '));
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
      warnings.push({ name: 'figures:bare-sections', detail: `${bare.length}/${numbered.length} numbered sections have no figure: ${bare.join(',')}` });
    numbered.forEach((s, i) => {
      if (figs[i].length > 2) warnings.push({ name: 'figures:crowded-section', detail: `${s.id} has ${figs[i].length} figures (${figs[i].join(',')}) — one idea per figure, ≤2 per section` });
    });
    warnings.push({ level: 'INFO', name: 'figures:coverage', detail: numbered.map((s, i) => `${s.id}=${figs[i].join('+') || '—'}`).join(' ') });
  }

  return { ok: checks.every(c => c.ok), checks, warnings };
}

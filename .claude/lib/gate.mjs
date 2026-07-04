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

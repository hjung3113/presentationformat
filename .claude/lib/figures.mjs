// Figure checks over a document's HTML — pure functions, no I/O (gate.mjs wires them into runGate; verify-doc.mjs supplies
// the active style's colors). They read three opt-in markers that the component templates carry, each appended after the
// element's `style="…"` and kept by the author when the component is pasted:
//
//   data-value="N"            on a bar / row / segment: the number its label shows   → `chart-proportions` (hard; a chart with a
//                             marked and an unmarked bar is also noted)
//   data-item                 on one counted item of a figure (card, step, stage, tile) → `figures:lead-count` (warning)
//   data-zone="as-is|to-be"   on an AS-IS or TO-BE zone                              → `zone-colors` (hard)
//
// A document without markers is not judged: each check then prints a NOTE saying how many figures it could not check, so
// documents built before the markers existed pass unchanged. (gate.mjs imports this file and this file imports two palette
// helpers back from it; both sides only call the other's function declarations at run time, so the cycle is harmless.) The tag
// index below (markup, elementsWith, parentIndex …) is exported for facts.mjs, which reads `data-f` and `data-state` with it.
import { normHex, usedHexes } from './gate.mjs';
import { visibleBlocks } from './prose.mjs';

export const CHART_COMPONENTS = ['bar-chart', 'hbar-chart', 'stacked-bar', 'status-board'];
export const ITEM_COMPONENTS = ['card-grid', 'process-row', 'pipeline', 'kpi-row'];
export const ZONE_COMPONENTS = ['before-after', 'gantt', 'layer-map'];
export const TOLERANCE = 2; // percentage points a bar may sit off its value (rounding of 33.3 → 33)

// ---------- a small tolerant tag index ----------

const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);

// The live markup (comments, <script>, <style> gone) and every tag in it.
export function markup(html) {
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  const tags = [...body.matchAll(TAG)].map(m => {
    const name = m[2].toLowerCase();
    return { close: !!m[1], name, attrs: m[3], self: !!m[4] || VOID.has(name), start: m.index, end: m.index + m[0].length };
  });
  return { body, tags };
}

// Value of an attribute (`''` for a bare one), null when absent.
export function attrOf(attrs, name) {
  if (!attrs.includes(name)) return null;
  const m = attrs.match(new RegExp(`(?<![\\w-])${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?(?![\\w-])`));
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : null;
}

// Index just past the element's closing tag (tag balancing by name); an unclosed element ends with its own tag.
export function endOf(tags, i) {
  const t = tags[i];
  if (t.self) return t.end;
  let depth = 1;
  for (let j = i + 1; j < tags.length; j++) {
    const u = tags[j];
    if (u.name !== t.name || u.self) continue;
    depth += u.close ? -1 : 1;
    if (depth === 0) return u.end;
  }
  return t.end;
}

// Every element carrying `attr` (or, with `names`, every element of those tag names): { ...tag, value, endAt }.
export function elementsWith(mk, attr, names) {
  const out = [];
  mk.tags.forEach((t, i) => {
    if (t.close || (names && !names.includes(t.name))) return;
    const value = attr ? attrOf(t.attrs, attr) : '';
    if (value !== null) out.push({ ...t, value, endAt: endOf(mk.tags, i) });
  });
  return out;
}

// parent[i] = index of the tag that contains tag i (-1 at the top): the nesting a tolerant stack gives, as prose.mjs's tree does.
export function parentIndex(mk) {
  const parent = new Array(mk.tags.length).fill(-1);
  const stack = [];
  mk.tags.forEach((t, i) => {
    if (t.close) {
      const k = stack.findLastIndex(j => mk.tags[j].name === t.name);
      if (k >= 0) stack.length = k;
      return;
    }
    parent[i] = stack.length ? stack.at(-1) : -1;
    if (!t.self) stack.push(i);
  });
  return parent;
}

export const within = (outer, inner) => inner.start >= outer.start && inner.endAt <= outer.endAt;
export const htmlOf = (mk, el) => mk.body.slice(el.start, el.endAt);
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
// `&#55;` and `&#x37;` are the character they name (`7`); a code point that is not a character, or an entity name we do not know, reads as a space
function entity(_, e) {
  if (e[0] !== '#') return NAMED[e.toLowerCase()] ?? ' ';
  const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
  return code > 0 && code <= 0x10FFFF && !(code >= 0xD800 && code <= 0xDFFF) ? String.fromCodePoint(code) : ' ';
}
export const textOf = (fragment) => fragment.replace(/<[^>]*>/g, ' ').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, entity).replace(/\s+/g, ' ').trim();
export const clip = (s, n = 18) => (s.length > n ? `${s.slice(0, n)}…` : s);
const r1 = (x) => Math.round(x * 10) / 10;

// `70` · `70%` · `1,200` → number; anything else (`—`, `N/A`, a leftover slot) → null (not checked).
function valueOf(raw) {
  const t = raw.trim().replace(/[%％]$/, '').replace(/,/g, '');
  return /^\d+(?:\.\d+)?$/.test(t) ? Number(t) : null;
}
const numerals = (text) => [...text.matchAll(/\d+(?:,\d{3})*(?:\.\d+)?/g)].map(m => Number(m[0].replace(/,/g, '')));
const cssProp = (style, prop) => (style || '').match(new RegExp(`(?<![\\w-])${prop}\\s*:\\s*([^;]+)`))?.[1].trim();
const pctOf = (style, prop) => { const p = cssProp(style, prop)?.match(/^(\d+(?:\.\d+)?)%$/); return p ? Number(p[1]) : null; };
// the first `width:N%` on the element or anything inside it (the fill of a progress track)
function firstWidthPct(fragment) {
  for (const m of fragment.matchAll(/(?<![\w-])style\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const p = pctOf(m[1] ?? m[2], 'width');
    if (p !== null) return p;
  }
  return null;
}

// "bar-chart#2": the n-th figure of that kind in the document
const ordinal = (comps, c) => `${c.value}#${comps.filter(x => x.value === c.value && x.start <= c.start).length}`;

// ---------- chart-proportions ----------

// Every marked bar, row and segment must be drawn at the size its number says, and must show that number. A chart has one
// scale, k = size ÷ value, read off its largest-value mark; every other mark must sit at value × k (±2), and the largest must fit
// its track (value_max × k ≤ 102). A chart drawn to its largest value (k = 100 ÷ max) and a chart on an absolute axis (percent
// bars on 0–100, k = 1) both pass; a mark that breaks the proportion fails.
//   bar-chart     height%: proportional to the value
//   hbar-chart · status-board   width%: equal to the value when the row's label carries `value%`, else proportional to it
//   stacked-bar   width% ≈ value, and the marked segments add up to 100
// The label test is the same everywhere: data-value must equal a numeral the element shows (a textless segment is skipped).
// A chart that marks some of its bars and not others is reported in `partial` (the unmarked ones are not read).
// A chart that draws no bar at all (a `status-board` built without its progress column) has nothing to mark and is not counted as `unmarked`.
// → { charts, values, unmarked: [component id…], partial: [string…], violations: [string…] }
export const OVERFLOW = 102; // percent a bar may reach: 100 + the rounding of the largest one
const SIZE_PROP = { 'bar-chart': 'height', 'hbar-chart': 'width', 'status-board': 'width', 'stacked-bar': 'width' };

// items: [{ e, size }] (size = the drawn percentage) → { k, top } with top = the largest-value item, or null when there is nothing to scale by
const scaleOf = (items) => {
  const top = items.reduce((a, x) => (!a || x.e.v > a.e.v ? x : a), null);
  return top ? { top, k: top.e.v > 0 ? top.size / top.e.v : 0 } : null;
};

// Proportionality of one chart's marks: the largest-value mark sets k, each other mark must sit within TOLERANCE of value × k, and the
// largest must not overflow its track. `say(e, size, want, top)` words the disagreement.
function proportional(items, say, overflow) {
  const scale = scaleOf(items);
  if (!scale) return;
  const { top, k } = scale;
  for (const x of items) {
    const want = x.e.v * k;
    if (x !== top && Math.abs(x.size - want) > TOLERANCE) say(x.e, x.size, want, top);
  }
  if (top.e.v > 0 && top.e.v * k > OVERFLOW) overflow(top.e, top.size);
}

// Elements of a chart that are drawn by a percentage size (`height:N%` / `width:N%`) yet carry no data-value and neither sit inside a
// marked element (the fill of a marked row) nor wrap one (the column of a marked bar): the bars the gate cannot read. Leaves only.
function unmarkedBars(mk, chart, marked, prop) {
  const styled = elementsWith(mk, 'style').filter(el => el.start !== chart.start && within(chart, el) && pctOf(el.value, prop) !== null);
  const free = styled.filter(el => !marked.some(m => within(m, el) || within(el, m)));
  return free.filter(el => !free.some(o => o !== el && within(el, o)));
}

export function chartProportions(html) {
  const mk = markup(html);
  const comps = elementsWith(mk, 'data-component').filter(c => CHART_COMPONENTS.includes(c.value));
  const marks = elementsWith(mk, 'data-value');
  const res = { charts: 0, values: 0, unmarked: [], partial: [], violations: [] };
  for (const c of comps) {
    const marked = marks.filter(m => within(c, m));
    const mine = marked.map(m => {
      const fragment = htmlOf(mk, m);
      return { v: valueOf(m.value), raw: m.value, own: attrOf(m.attrs, 'style'), fragment, text: textOf(fragment) };
    });
    if (!mine.length) { // nothing marked: a chart that draws bars the gate cannot read is noted; one that draws none (a status-board without its 진척 column) has nothing to mark
      if (unmarkedBars(mk, c, marked, SIZE_PROP[c.value]).length) res.unmarked.push(c.value);
      continue;
    }
    res.charts++;
    const id = ordinal(comps, c);
    const loose = unmarkedBars(mk, c, marked, SIZE_PROP[c.value]).length;
    if (loose) res.partial.push(`${id} has ${loose} ${SIZE_PROP[c.value]}:N% bar(s) with no data-value next to ${mine.length} marked`);
    const bad = (k, e, why) => res.violations.push(`${id} ${c.value === 'bar-chart' ? 'bar' : c.value === 'stacked-bar' ? 'segment' : 'row'} ${k + 1} "${clip(e.text)}": ${why}`);
    const numeric = mine.map((e, k) => ({ ...e, k })).filter(e => e.v !== null);
    res.values += numeric.length;
    for (const e of numeric) {
      const shown = numerals(e.text);
      if (shown.length && !shown.some(n => Math.abs(n - e.v) <= 0.5)) bad(e.k, e, `data-value ${e.raw} is not a number it shows (${shown.join(', ')})`);
    }
    if (c.value === 'bar-chart') {
      const sized = [];
      for (const e of numeric) {
        const size = pctOf(e.own, 'height');
        if (size === null) bad(e.k, e, `data-value ${e.raw} but no height:N% on the bar`);
        else sized.push({ e, size });
      }
      proportional(sized,
        (e, h, want, top) => bad(e.k, e, `height ${h}% but ${e.v} of max ${top.e.v} (drawn at ${top.size}%) is ${r1(want)}%`),
        (e, h) => bad(e.k, e, `height ${h}% runs out of the plot (a bar is at most 100%)`));
    } else if (c.value === 'stacked-bar') {
      let sum = 0;
      for (const e of numeric) {
        const w = pctOf(e.own, 'width');
        if (w === null) { bad(e.k, e, `data-value ${e.raw} but no width:N% on the segment`); continue; }
        sum += w;
        if (Math.abs(w - e.v) > TOLERANCE) bad(e.k, e, `width ${w}% but data-value ${e.raw}`);
      }
      if (numeric.length > 1 && Math.abs(sum - 100) > TOLERANCE) res.violations.push(`${id}: the marked segments add up to ${r1(sum)}%, not 100% (mark every segment)`);
    } else {
      // a row whose label shows `N%` is a percentage and is drawn at N; the other rows (counts, `70/100건`) share one proportional scale
      const sized = [];
      for (const e of numeric) {
        const size = firstWidthPct(e.fragment);
        const pct = [...e.text.matchAll(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*[%％]/g)].some(m => Math.abs(Number(m[1].replace(/,/g, '')) - e.v) <= 0.5);
        if (size === null) bad(e.k, e, `data-value ${e.raw} but no width:N% inside the row`);
        else if (pct) { if (Math.abs(size - e.v) > TOLERANCE) bad(e.k, e, `width ${size}% but the label shows ${e.v}%`); }
        else sized.push({ e, size });
      }
      proportional(sized,
        (e, w, want, top) => bad(e.k, e, `width ${w}% but ${e.v} of max ${top.e.v} (drawn at ${top.size}%) is ${r1(want)}%`),
        (e, w) => bad(e.k, e, `width ${w}% runs out of the track (a bar is at most 100%)`));
    }
  }
  return res;
}

// ---------- zone-colors ----------

// The style's colors by role, from its design.tokens.md `colors` map: the accent family (target / improvement: `accent` and every
// `accent-*` token) and the problem family (current / legacy / problem — warn and slate tones). A literal both families share says
// nothing and is dropped from the problem family. `accentNames` says which token a family hex is (for a message).
export function zoneRoles(colors) {
  const set = (names) => new Set(names.map(n => colors[n]).filter(Boolean).map(normHex).filter(Boolean));
  const accentTokens = Object.keys(colors).filter(k => k === 'accent' || k.startsWith('accent-'));
  const accentFamily = set(accentTokens);
  const accentNames = new Map();
  for (const t of accentTokens) { const h = normHex(colors[t] || ''); if (h && !accentNames.has(h)) accentNames.set(h, t); }
  const problem = set(['warn', 'warn-2', 'warn-bg', 'warn-line', 'slate', 'slate-bar', 'mono-tint', 'mono-dashed']);
  for (const h of accentFamily) problem.delete(h);
  return { accent: normHex(colors.accent), accentFamily, accentNames, problem };
}

// Hex literals set as a background (style `background` / `background-color`, `fill`, `bgcolor`) anywhere inside a fragment.
// Borders and text are left out on purpose: a style may reuse one literal for a border and a problem fill. An element drawn at 2px
// or less in either direction is a rule or a divider, not a zone fill: the style paints its hairlines in the same literal as its
// slate bars, so a rule would otherwise read as a problem fill.
export const RULE_PX = 2;
const isRule = (style) => ['height', 'width'].some(p => { const px = cssProp(style, p)?.match(/^(\d+(?:\.\d+)?)px$/); return px && Number(px[1]) <= RULE_PX; });
function backgroundFills(fragment) {
  const out = [];
  const hexes = (v) => [...v.replace(/url\([^)]*\)/gi, '').matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => normHex(m[0])).filter(Boolean);
  for (const t of markup(fragment).tags) {
    if (t.close || isRule(attrOf(t.attrs, 'style'))) continue;
    for (const m of (attrOf(t.attrs, 'style') || '').matchAll(/(?<![\w-])background(?:-color)?\s*:\s*([^;]+)/g)) out.push(...hexes(m[1]));
    for (const a of ['fill', 'bgcolor']) out.push(...hexes(attrOf(t.attrs, a) || ''));
  }
  return out;
}

// An AS-IS zone must not use the accent or any color of its family (`accent-050` and the other accent tints are the target
// state's too: design.md §8.2); a TO-BE zone must not be mostly warn/slate fills (one slate chip is fine).
// → { zones, unmarked: [component id…], toBeSkipped, violations }; `accent` = the accent hex, `roles` = zoneRoles() (optional: without it
// the to-be half is skipped and counted in toBeSkipped, and the AS-IS half knows only the accent itself).
export function zoneColors(html, { accent, roles } = {}) {
  const mk = markup(html);
  const comps = elementsWith(mk, 'data-component');
  const zones = elementsWith(mk, 'data-zone');
  const res = { zones: zones.length, unmarked: [], toBeSkipped: 0, violations: [] };
  // A before-after always has two sides to mark. A gantt or layer-map has an AS-IS part only when it draws a legacy bar or
  // layer, which the style paints in a problem-family fill; without the style's roles every unmarked one is reported.
  for (const c of comps.filter(c => ZONE_COMPONENTS.includes(c.value)))
    if (!zones.some(z => within(c, z)) && (c.value === 'before-after' || !roles || backgroundFills(htmlOf(mk, c)).some(h => roles.problem.has(h))))
      res.unmarked.push(c.value);
  const acc = accent ? normHex(accent) : null;
  const family = new Set([...(roles?.accentFamily ?? []), ...(acc ? [acc] : [])]);
  for (const z of zones) {
    const owner = comps.filter(c => within(c, z)).at(-1);
    const where = owner ? ordinal(comps, owner) : 'a figure outside any component';
    const fragment = htmlOf(mk, z);
    const kind = z.value.trim().toLowerCase();
    if (kind === 'as-is') {
      const hit = usedHexes(fragment).filter(h => family.has(h.norm));
      if (hit.length) {
        const at = fragment.toLowerCase().indexOf(hit[0].lit.toLowerCase());
        const near = clip(textOf(fragment.slice(fragment.indexOf('>', at) + 1)), 24); // the text of the element that sets it
        const what = hit[0].norm === acc ? `the accent ${acc}` : `the accent-family color ${hit[0].norm}${roles?.accentNames?.has(hit[0].norm) ? ` (${roles.accentNames.get(hit[0].norm)})` : ''}`;
        res.violations.push(`${where} as-is zone uses ${what} ×${hit.length} (near "${near}") — the accent and its tints mean target, never current state`);
      }
    } else if (kind === 'to-be') {
      if (!roles) { res.toBeSkipped++; continue; }
      const fills = backgroundFills(fragment);
      const good = fills.filter(h => roles.accentFamily.has(h)).length;
      const bad = fills.filter(h => roles.problem.has(h)).length;
      if (bad > good) res.violations.push(`${where} to-be zone has ${bad} warn/slate fill(s) against ${good} accent-family fill(s) — warn and slate mean current state or problem, never target`);
    } else res.violations.push(`${where}: data-zone="${z.value}" is neither "as-is" nor "to-be"`);
  }
  return res;
}

// ---------- lead-count ----------

// "다섯 갈래", "7단계", "두 곳" … — a count the lead states. Native numerals and digits both need a counting unit, so a
// bare "두 시스템" or "2주" is not a claim about the figure. 1 is never a count ("한 곳", "하나로"); 10 and up are never a
// figure's item count (no marked figure holds more) and usually name something else ("10단계 판정"); "N개 중 M개" keeps only N.
// `개` counts only as a counter ("7개다", "7개를"), never inside 개월 / 개선 / 개발.
const UNIT = '(?:가지|단계|곳|개(?![가-힣])|개(?=에서?|가|는|를|은|의|로|와|과|도|만|다|씩|이|째|짜리|뿐|까지|부터|나)|층|갈래|구간|축|종(?!료|합))';
const COUNT = new RegExp(`(?<![가-힣])(두|세|네|다섯|여섯|일곱|여덟|아홉)\\s?${UNIT}|(?<![\\d.,A-Za-z])(\\d{1,2})\\s?${UNIT}`, 'g');
const NATIVE = { 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9 };
export const MAX_COUNT = 9;

export function countWords(text) {
  const out = [];
  for (const m of text.matchAll(COUNT)) {
    const n = m[1] ? NATIVE[m[1]] : Number(m[2]);
    if (n < 2 || n > MAX_COUNT) continue;
    if (/중\s*$/.test(text.slice(Math.max(0, m.index - 4), m.index))) continue; // the M of "N개 중 M개"
    out.push({ text: m[0], n });
  }
  return out;
}

// The lead of each numbered section (its first <p> of 25+ characters) against the item count of the section's first figure
// that carries data-item markers. Warns only when NO count in the lead equals the figure's count.
// → { marked, checked: [{ id, component, items, words }], warnings: [string…], unmarked: [component id…] }  (marked = data-item count)
export function leadCounts(html, blocks) {
  const mk = markup(html);
  const comps = elementsWith(mk, 'data-component');
  const items = elementsWith(mk, 'data-item');
  const res = { marked: items.length, checked: [], warnings: [], unmarked: [] };
  for (const c of comps.filter(c => ITEM_COMPONENTS.includes(c.value)))
    if (!items.some(i => within(c, i))) res.unmarked.push(c.value);
  if (!items.length) return res;
  const all = blocks ?? visibleBlocks(html);
  for (const s of elementsWith(mk, 'id', ['section'])) {
    if (!/^s\d+$/.test(s.value)) continue;
    const fig = comps.find(c => within(s, c) && items.some(i => within(c, i)));
    if (!fig) continue;
    const lead = all.find(b => b.id === s.value && b.tag === 'p' && [...b.text].length >= 25);
    if (!lead) continue;
    const n = items.filter(i => within(fig, i)).length;
    const words = countWords(lead.text);
    res.checked.push({ id: s.value, component: fig.value, items: n, words });
    if (words.length && !words.some(w => w.n === n))
      res.warnings.push(`${s.value} lead counts ${words.map(w => `"${w.text}"`).join(', ')} but its ${fig.value} marks ${n} item(s) — make the lead and the figure agree (core/components.md §4 "Counts must match")`);
  }
  return res;
}

// ---------- the gate rows ----------

const list = (names) => [...new Set(names)].join(', ');

// opts: { accentHex, zoneRoles?: zoneRoles(), blocks?: visibleBlocks() output or a function returning it }
// → { checks: [{ name, ok, detail }], warnings: [{ level?, name, detail }], notes: [{ name, detail }] }
// A check row exists only when its marker does; a figure that could carry a marker but does not gets a NOTE.
export function figureChecks(html, opts = {}) {
  const checks = [], warnings = [], notes = [];

  const cp = chartProportions(html);
  if (cp.charts) {
    checks.push({ name: 'chart-proportions', ok: !cp.violations.length, detail: cp.violations.length
      ? `${cp.violations.length} disagreement(s): ${cp.violations.slice(0, 8).join(' ; ')}`
      : `${cp.charts} chart(s), ${cp.values} value(s) drawn at the size they show` });
  }
  if (cp.partial.length)
    notes.push({ name: 'chart-proportions', detail: `partly checked — ${cp.partial.length} chart(s) draw a bar the gate cannot read (${cp.partial.join(' ; ')}); keep the template's data-value on every bar and row` });
  if (cp.unmarked.length)
    notes.push({ name: 'chart-proportions', detail: `not checked — ${cp.unmarked.length} chart(s) carry no data-value (${list(cp.unmarked)}); keep the template's data-value attributes and fill each with the number its label shows` });

  const zc = zoneColors(html, { accent: opts.accentHex, roles: opts.zoneRoles });
  if (zc.zones) {
    checks.push({ name: 'zone-colors', ok: !zc.violations.length, detail: zc.violations.length
      ? `${zc.violations.length} zone(s) break the AS-IS / TO-BE color split: ${zc.violations.slice(0, 8).join(' ; ')}`
      : `${zc.zones - zc.toBeSkipped} zone(s) checked` });
    if (zc.toBeSkipped)
      notes.push({ name: 'zone-colors', detail: `${zc.toBeSkipped} to-be zone(s) not checked — the warn/slate roles come from the style's tokens (pass --style)` });
  }
  if (zc.unmarked.length)
    notes.push({ name: 'zone-colors', detail: `not checked — ${zc.unmarked.length} figure(s) carry no data-zone (${list(zc.unmarked)}); keep the template's data-zone attributes on the AS-IS and TO-BE sides (a gantt or layer-map only when it draws legacy bars or a legacy layer)` });

  const lc = leadCounts(html, typeof opts.blocks === 'function' ? opts.blocks() : opts.blocks);
  for (const w of lc.warnings) warnings.push({ name: 'figures:lead-count', detail: w });
  if (lc.marked)
    warnings.push({ level: 'INFO', name: 'figures:lead-count', detail: lc.checked.length
      ? `${lc.checked.length} lead(s) read against their figure's data-item count: ${lc.checked.map(c => `${c.id}=${c.items}${c.words.length ? ` (lead: ${c.words.map(w => w.text).join(', ')})` : ' (lead states no count)'}`).join(' ')}`
      : 'no numbered section with a lead holds a figure with data-item markers' });
  if (lc.unmarked.length)
    notes.push({ name: 'figures:lead-count', detail: `not checked — ${lc.unmarked.length} figure(s) carry no data-item (${list(lc.unmarked)}); keep the template's data-item attributes so a lead like "다섯 단계" is compared with the figure` });

  return { checks, warnings, notes };
}

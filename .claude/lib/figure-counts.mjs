// Plan-time counts of a figure-data against its component's `@limits-x` (tooling — non-normative). Pure functions, no I/O.
//
// `core/components/<id>.html` states its countable limits twice: as prose in `@limits` and as `key=min..max` tokens in
// `@limits-x` (parsed by components.mjs `parseLimitsX`). plan-schema.mjs calls countWarnings() for every section whose
// shape has a component with `@limits-x`; a count above `max` is a non-blocking warning (a figure that plainly exceeds its
// component's limit has to be split anyway, and the plan is the cheapest place to say so).
//
// COUNTERS is the registry: component → limit key → how to count that key in the component's figure-data format
// (core/components/README.md, from each template's `@data`). A counter returns [{ subject?, n }] — one entry per thing
// counted (`subject` names the actor, layer, option … when the limit is per item). It under-counts rather than over-counts:
// a separator it cannot tell apart yields fewer items, never a false warning. The drift test in plan-schema.test.mjs holds
// every `@limits-x` key to a counter and every `@limits-x` range to the `min–max` in the template's `@limits` prose.

// ---------- figure-data reading ----------

const OPEN = '([{（';
const CLOSE = ')]}）';

// Split on top-level separators only: a separator inside ( ) [ ] { } belongs to the item ("메뉴 패키지(a, b)" is one module),
// and a comma inside a number ("1,200") is a thousands separator, not a list separator.
export function splitTop(text, seps) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (OPEN.includes(ch)) depth++;
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
    const digitGroup = ch === ',' && /\d$/.test(cur) && /^\d{3}(?!\d)/.test(text.slice(i + 1));
    if (depth === 0 && seps.includes(ch) && !digitGroup) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}

// The text with everything inside ( ) [ ] { } removed (and the brackets themselves): what the item says at its own level.
function topLevel(text) {
  let depth = 0;
  let out = '';
  for (const ch of text) {
    if (OPEN.includes(ch)) depth++;
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out;
}

// The contents of every top-level `[…]` of an item, in order.
function bracketGroups(text) {
  const out = [];
  let depth = 0;
  let from = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (OPEN.includes(ch)) { if (ch === '[' && depth === 0) from = i + 1; depth++; }
    else if (CLOSE.includes(ch)) {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && ch === ']' && from >= 0) { out.push(text.slice(from, i)); from = -1; }
    }
  }
  return out;
}

// `name(inner)` → { name, inner } (inner = the first top-level parenthesis, '' when absent)
function nameAndParens(item) {
  const i = item.search(/[(（]/);
  if (i < 0) return { name: item.trim(), inner: '' };
  let depth = 0;
  for (let j = i; j < item.length; j++) {
    if (OPEN.includes(item[j])) depth++;
    else if (CLOSE.includes(item[j]) && --depth === 0) return { name: item.slice(0, i).trim(), inner: item.slice(i + 1, j) };
  }
  return { name: item.slice(0, i).trim(), inner: item.slice(i + 1) };
}

// The ` | `-separated `key: value` segment of a figure-data (a `(annotation)` before the colon is tolerated). `until` is a
// list of keys that END a multi-segment value: the older layer-map format separates layers by ` | ` too, so after `layers`
// every following segment up to `links` / `external` is another layer (joined with ‖). Without `until` it is the one segment.
export function fieldValue(figureData, key, until = null) {
  const segs = figureData.split(/\s\|\s/).map(sg => sg.trim());
  const head = new RegExp(`^${key}\\s*(?:\\([^)]*\\))?\\s*\\??:\\s*`);
  const i = segs.findIndex(sg => head.test(sg));
  if (i < 0) return null;
  const mine = [segs[i].replace(head, '')];
  if (until) {
    const end = new RegExp(`^(?:${until.join('|')})\\s*(?:\\([^)]*\\))?\\s*\\??:`);
    for (const sg of segs.slice(i + 1)) { if (end.test(sg)) break; mine.push(sg); }
  }
  return mine.join(' ‖ ');
}

// every segment with that key (a key repeated on purpose, e.g. two `decision:` questions)
function fieldValues(figureData, key) {
  const head = new RegExp(`^${key}\\s*(?:\\([^)]*\\))?\\s*\\??:\\s*`);
  return figureData.split(/\s\|\s/).map(sg => sg.trim()).filter(sg => head.test(sg)).map(sg => sg.replace(head, ''));
}

const COMMA = ',，';
const SEMI = ';；';
const arrows = (text) => text.replace(/-->|->/g, '→');
const items = (text, seps = COMMA) => (text === null ? [] : splitTop(text, seps));
const whole = (n, subject) => ({ n, ...(subject ? { subject } : {}) });

// ---------- the three counters that predate @limits-x (their names and shapes are exported for plan-schema) ----------

// use-case: `actors: 행위자 A: 목표, 목표 ‖ 행위자 B: 목표` → [{ name, n }]
export function useCaseGoals(figureData) {
  const v = fieldValue(figureData, 'actors');
  return v === null ? [] : splitTop(v, '‖').map(a => {
    const k = a.indexOf(':');
    return { name: k < 0 ? a : a.slice(0, k).trim(), n: k < 0 ? 0 : splitTop(a.slice(k + 1), ',，、').length };
  });
}

// layer-map: `layers: 레이어 [태그]: 모듈(설명), 모듈 [planned], key ‖ 레이어: …` → [{ name, n }]. Bracket tags and a bare `key`
// marker are not modules.
export function layerModules(figureData) {
  const v = fieldValue(figureData, 'layers', ['links', 'external']);
  return v === null ? [] : splitTop(v, '‖').map(l => {
    const plain = l.replace(/\[[^\]]*\]/g, ' ');
    const k = plain.indexOf(':');
    return { name: (k < 0 ? plain : plain.slice(0, k)).replace(/\s+/g, ' ').trim(), n: k < 0 ? 0 : splitTop(plain.slice(k + 1), ',，、').filter(m => !/^key$/i.test(m)).length };
  });
}

// table: `columns: … | rows: 값 · 값 ; 값 · 값` → number of `;`-separated rows
export function tableRowCount(figureData) {
  const v = fieldValue(figureData, 'rows');
  return v === null ? 0 : splitTop(v, SEMI).length;
}

// ---------- the registry ----------

// A counter: { unit, per?, fix?, tail?(range, limits), count(figureData, { id }) → [{ subject?, n }] }.
//   message = `${id} (${shape}): ${subject ?? component} has ${n} ${unit} (>${max}) — ${tail}`
//   tail    = `${component} shows ${min}–${max} per ${per}|${unit}; ${fix}` unless the counter brings its own `tail`.
const perItem = (rows, keyOf) => rows.map(r => ({ subject: keyOf(r), n: r.n }));

// gantt `rows:` → { pieces, n }: one row per `;` piece, or one per ` = ` when the author separated rows with ` · `
function ganttRows(figureData) {
  const v = fieldValue(figureData, 'rows');
  if (v === null) return null;
  const pieces = splitTop(v, SEMI);
  return { pieces, n: Math.max(pieces.length, (topLevel(v).match(/\s=\s/g) || []).length) };
}

// pipeline `stages: 입력[노드 A, 노드 B] → 처리[…]` → [{ name, n }]
function pipelineStages(figureData) {
  const v = fieldValue(figureData, 'stages');
  return v === null ? [] : splitTop(arrows(v), '→').map(st => {
    const group = bracketGroups(st)[0];
    return { name: st.replace(/\[.*$/s, '').trim(), n: group === undefined ? 0 : splitTop(group, COMMA).length };
  });
}

// tree `children: 이름[잎, 잎 [planned]], 이름 [planned][잎]` → [{ name, n }] (the leaf group is the bracket that is not `[planned]`)
function treeLeaves(figureData) {
  return items(fieldValue(figureData, 'children')).map(c => {
    const leaves = bracketGroups(c).filter(g => !/^\s*planned\s*$/i.test(g)).at(-1);
    return { name: c.replace(/\[.*$/s, '').trim(), n: leaves === undefined ? 0 : splitTop(leaves, COMMA).length };
  });
}

// decision-block `options: A 이름(+장점, −단점), B …` → [{ name, pros, cons }]
function optionLines(figureData) {
  return items(fieldValue(figureData, 'options')).map(o => {
    const { name, inner } = nameAndParens(o);
    const lines = splitTop(inner, COMMA);
    return { name, pros: lines.filter(l => /^\+/.test(l)).length, cons: lines.filter(l => /^[−–-]/.test(l)).length };
  });
}

// class-diagram `children: 이름(+속성, +메서드), …` → [{ name, n }]
function classMembers(figureData) {
  return items(fieldValue(figureData, 'children')).map(c => {
    const { name, inner } = nameAndParens(c);
    return { name, n: splitTop(inner, COMMA).length };
  });
}

export const COUNTERS = {
  activity: {
    decisions: { unit: 'decisions', count: (fd) => [whole(fieldValues(fd, 'decision').flatMap(v => splitTop(v, `‖${SEMI}`)).length)] },
    outcomes: { unit: 'outcomes', count: (fd) => [whole(items(fieldValue(fd, 'outcomes')).length)] },
  },
  'bar-chart': {
    bars: { unit: 'bars', count: (fd) => [whole(items(fieldValue(fd, 'bars')).length)] },
  },
  'before-after': {
    // the TO-BE root node (the part before ` / `) is the centre node, not one of its elements
    'nodes-per-side': {
      unit: 'nodes', per: 'side', fix: 'merge or drop nodes, or split the figure',
      count: (fd) => {
        const out = [];
        const before = fieldValue(fd, 'before');
        if (before !== null) out.push({ subject: 'before side', n: items(before).length });
        const after = fieldValue(fd, 'after');
        if (after !== null) {
          const parts = splitTop(after, '/');
          out.push({ subject: 'after side', n: items(parts.length > 1 ? parts.slice(1).join(' / ') : after).length });
        }
        return out;
      },
    },
    'tags-per-side': {
      unit: 'tags', per: 'side', fix: 'keep the two that carry the point',
      count: (fd) => ['before', 'after'].filter(k => fieldValue(fd, `${k}-tags`) !== null)
        .map(k => ({ subject: `${k} side`, n: items(fieldValue(fd, `${k}-tags`)).length })),
    },
  },
  'card-grid': {
    items: { unit: 'cards', count: (fd) => [whole(items(fieldValue(fd, 'items'), SEMI).length)] },
  },
  'class-diagram': {
    children: { unit: 'child classes', count: (fd) => [whole(items(fieldValue(fd, 'children')).length)] },
    'members-per-class': {
      unit: 'members', per: 'class', fix: 'keep the members the claim needs',
      count: (fd) => perItem(classMembers(fd), c => `class "${c.name}"`),
    },
  },
  'decision-block': {
    options: { unit: 'options', count: (fd) => [whole(items(fieldValue(fd, 'options')).length)] },
    'pros-cons': {
      unit: 'lines', per: 'side', fix: 'keep the 1–3 that decide it',
      count: (fd) => optionLines(fd).flatMap(o => [{ subject: `option "${o.name}" pros`, n: o.pros }, { subject: `option "${o.name}" cons`, n: o.cons }]),
    },
  },
  'decision-table': {
    conditions: { unit: 'condition columns', count: (fd) => [whole(items(fieldValue(fd, 'conditions')).length)] },
    // one rule per `;` piece, or one per `→ 결과` when the author separated rules some other way
    rules: { unit: 'rules', count: (fd) => { const v = fieldValue(fd, 'rules'); return v === null ? [] : [whole(Math.max(splitTop(v, SEMI).length, (arrows(topLevel(v)).match(/→/g) || []).length))]; } },
  },
  'er-relations': {
    entities: { unit: 'entities', count: (fd) => [whole(items(fieldValue(fd, 'entities'), `${COMMA}${SEMI}`).length)] },
    // a relation shows its cardinality pair (`1—N`, `0..1—N`); counting those is independent of the separator between relations
    relations: {
      unit: 'relations',
      count: (fd) => {
        const v = fieldValue(fd, 'relations');
        if (v === null) return [];
        const pairs = (v.match(/(?<![\w.])(?:0\.\.[1N]|[1N])\s*[—–-]{1,2}\s*(?:0\.\.[1N]|[1N])(?![\w.])/g) || []).length;
        return [whole(pairs || splitTop(v, `${SEMI}·`).length)];
      },
    },
  },
  'forbidden-path': {
    // `allowed: 출발 → 대안, 대안`: the alternatives after the arrow
    allowed: {
      unit: 'allowed paths',
      count: (fd) => { const v = fieldValue(fd, 'allowed'); if (v === null) return []; const parts = splitTop(arrows(v), '→'); return [whole(items(parts.length > 1 ? parts.slice(1).join('→') : v).length)]; },
    },
    forbidden: { unit: 'forbidden paths', count: (fd) => { const v = fieldValue(fd, 'forbidden'); return v === null ? [] : [whole((topLevel(v).match(/✕|✗/g) || []).length)]; } },
  },
  gantt: {
    periods: { unit: 'period columns', count: (fd) => [whole(items(fieldValue(fd, 'periods')).length)] },
    rows: { unit: 'rows', count: (fd) => { const r = ganttRows(fd); return r ? [whole(r.n)] : []; } },
    'bars-per-row': {
      unit: 'bars', per: 'row', fix: 'move one bar to its own row',
      // only when the rows can be told apart (`;` pieces): a row's bars are its `(core|partial|planned|risk|legacy)` kinds
      count: (fd) => {
        const r = ganttRows(fd);
        if (!r || r.pieces.length < r.n) return [];
        return r.pieces.map(p => ({ subject: `row "${p.split(/\s=\s/)[0].trim()}"`, n: (p.match(/\((?:core|partial|planned|risk|legacy)\)/g) || []).length }));
      },
    },
  },
  'hbar-chart': {
    rows: { unit: 'rows', count: (fd) => [whole(items(fieldValue(fd, 'rows')).length)] },
  },
  'hub-spoke': {
    spokes: { unit: 'spokes', count: (fd) => [whole(items(fieldValue(fd, 'left')).length + items(fieldValue(fd, 'right')).length)] },
    'spokes-per-side': {
      unit: 'spokes', per: 'side', fix: 'move spokes to the other side or split the hub',
      count: (fd) => ['left', 'right'].filter(k => fieldValue(fd, k) !== null).map(k => ({ subject: `${k} side`, n: items(fieldValue(fd, k)).length })),
    },
  },
  'kpi-row': {
    tiles: { unit: 'tiles', count: (fd) => [whole(items(fieldValue(fd, 'tiles'), SEMI).length)] },
  },
  'layer-map': {
    layers: { unit: 'layers', count: (fd) => [whole(layerModules(fd).length)] },
    'modules-per-layer': {
      unit: 'modules', per: 'layer', fix: 'group modules or split the layer',
      count: (fd) => perItem(layerModules(fd), l => `layer "${l.name}"`),
    },
  },
  matrix: {
    rows: { unit: 'rows', count: (fd) => [whole(items(fieldValue(fd, 'rows'), SEMI).length)] },
    columns: { unit: 'columns', count: (fd) => [whole(items(fieldValue(fd, 'columns')).length)] },
  },
  pipeline: {
    stages: { unit: 'stages', count: (fd) => [whole(pipelineStages(fd).length)] },
    'nodes-per-stage': {
      unit: 'nodes', per: 'stage', fix: 'merge nodes or split the stage',
      count: (fd) => perItem(pipelineStages(fd), s => `stage "${s.name}"`),
    },
  },
  'process-row': {
    steps: { unit: 'steps', count: (fd) => { const v = fieldValue(fd, 'steps'); return v === null ? [] : [whole(splitTop(arrows(v), '→').length)]; } },
  },
  'risk-matrix': {
    // `R1 … ; R2 …`: the distinct R-numbers, else the `;` pieces
    risks: {
      unit: 'risks',
      count: (fd) => { const v = fieldValue(fd, 'risks'); if (v === null) return []; const ids = new Set(v.match(/(?<![\w])R\d+(?![\w])/g)); return [whole(ids.size || splitTop(v, SEMI).length)]; },
    },
  },
  'screen-map': {
    // the numbered markers ①–⑥ of `regions:`, else its comma items
    regions: { unit: 'regions', count: (fd) => { const v = fieldValue(fd, 'regions'); if (v === null) return []; const marks = new Set(v.match(/[①-⑳]/g)); return [whole(marks.size || items(v).length)]; } },
  },
  sequence: {
    participants: { unit: 'participants', count: (fd) => [whole(items(fieldValue(fd, 'participants')).length)] },
    // one arrow (→ ⇢ ↻, or their ASCII forms) per message, counted outside any parenthesis
    messages: {
      unit: 'messages',
      count: (fd) => { const v = fieldValue(fd, 'messages'); return v === null ? [] : [whole((topLevel(v.replace(/\(self\)/g, '↻').replace(/-->/g, '⇢').replace(/->/g, '→')).match(/→|⇢|↻/g) || []).length)]; },
    },
    groups: { unit: 'ALT/OPT groups', count: (fd) => { const v = fieldValue(fd, 'alt'); return v === null ? [] : [whole((topLevel(v).match(/\s=\s/g) || []).length)]; } },
  },
  'stacked-bar': {
    parts: { unit: 'parts', count: (fd) => [whole(items(fieldValue(fd, 'parts')).length)] },
  },
  'state-machine': {
    // the states on the main path: the pieces between arrows, minus the ●/◉ end points and the `(전이)` labels
    'main-states': {
      unit: 'main-path states',
      count: (fd) => {
        const v = fieldValue(fd, 'main');
        if (v === null) return [];
        const states = splitTop(arrows(v), '→').map(p => p.replace(/^\s*\([^)]*\)\s*/, '').trim()).filter(p => p && !/^[●◉]$/.test(p));
        return [whole(states.length)];
      },
    },
    'other-transitions': {
      unit: 'other transitions',
      count: (fd) => { const v = fieldValue(fd, 'other'); return v === null ? [] : [whole((arrows(topLevel(v)).match(/→/g) || []).length)]; },
    },
  },
  'status-board': {
    rows: { unit: 'rows', count: (fd) => [whole(items(fieldValue(fd, 'rows'), SEMI).length)] },
  },
  swimlane: {
    lanes: { unit: 'lanes', count: (fd) => [whole(items(fieldValue(fd, 'lanes')).length)] },
    steps: { unit: 'steps', count: (fd) => { const v = fieldValue(fd, 'steps'); return v === null ? [] : [whole(splitTop(arrows(v), '→↓').length)]; } },
  },
  table: {
    columns: { unit: 'columns', count: (fd) => [whole(items(fieldValue(fd, 'columns')).length)] },
    // a body table runs to `rows`, the sref appendix term/source table to `appendix-rows`
    rows: {
      unit: 'rows',
      tail: (r, L) => `split it into two tables, or move reference rows to the appendix (only the sref appendix may run past ${r.max}, up to ${L['appendix-rows'].max})`,
      count: (fd, { id }) => (id === 'sref' ? [] : [whole(tableRowCount(fd), 'table')]),
    },
    'appendix-rows': {
      unit: 'rows',
      tail: (r) => `split it into two tables of at most ${r.max} rows, or use the definition-list variant`,
      count: (fd, { id }) => (id === 'sref' ? [whole(tableRowCount(fd), 'appendix table')] : []),
    },
  },
  timeline: {
    items: { unit: 'items', count: (fd) => [whole(items(fieldValue(fd, 'items'), SEMI).length)] },
  },
  tree: {
    children: { unit: 'children', count: (fd) => [whole(items(fieldValue(fd, 'children')).length)] },
    'leaves-per-child': {
      unit: 'leaves', per: 'child', fix: 'group leaves or split the child into its own figure',
      count: (fd) => perItem(treeLeaves(fd), c => `"${c.name}"`),
    },
  },
  'use-case': {
    actors: { unit: 'actors', count: (fd) => { const v = fieldValue(fd, 'actors'); return v === null ? [] : [whole(splitTop(v, '‖').length)]; } },
    'goals-per-actor': {
      unit: 'goals', per: 'actor', fix: 'merge goals or split the actor',
      count: (fd) => perItem(useCaseGoals(fd), a => `"${a.name}"`),
    },
  },
};

// The generic engine: every `@limits-x` key of the component that has a counter, warning on count > max only.
// → [message…]; `section` = { id, shape }. A key without a counter is skipped here (the drift test fails it).
export function countWarnings(component, limits, figureData, section) {
  const out = [];
  for (const [key, range] of Object.entries(limits || {})) {
    const counter = COUNTERS[component]?.[key];
    if (!counter) continue;
    for (const { subject, n } of counter.count(figureData, section)) {
      if (n <= range.max) continue;
      const tail = counter.tail
        ? counter.tail(range, limits)
        : `${component} shows ${range.min}–${range.max} ${counter.per ? `per ${counter.per}` : counter.unit}; ${counter.fix || `split the figure or cut ${counter.unit}`}`;
      out.push(`${section.id} (${section.shape}): ${subject ?? component} has ${n} ${counter.unit} (>${range.max}) — ${tail}`);
    }
  }
  return out;
}

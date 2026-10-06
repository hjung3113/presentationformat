// Fact bindings (tooling — non-normative). Pure functions, no I/O (gate.mjs wires them into `numbers-traced` and `planned:unmarked`).
//
// A document marks the element that shows a number with `data-f="F03"` (or `data-f="F03 F07"`), naming the facts-ledger row(s)
// the number comes from. The gate then does not ask "does this numeral appear somewhere in the plan or the ledger" (set
// membership, which a wrong-but-existing number passes) but "is this numeral a number of the row it cites":
//   - an id that is not a row of the ledger fails;
//   - a numeral the element shows that is in none of the cited rows' 값 or 사실 fails (the 사실 sentence is accepted too:
//     the ledger states 16,796 and 15,768 in the sentence of F04, whose 값 is the ratio 1.07);
//   - a cited row whose 상태 is designed or planned must be marked as such near the element — a warning, not a failure.
// A number without data-f keeps the set-membership check, so documents written before data-f existed pass unchanged.
import { cells } from './prose.mjs';
import { markup, elementsWith, parentIndex, endOf, htmlOf, textOf, attrOf, clip } from './figures.mjs';

// ---------- numerals ----------

export const NUM = /\d+(?:,\d{3})*(?:\.\d+)?/g;
// thousands commas, leading zeros and trailing decimal zeros do not make a different number: 1,200 = 1200, 007 = 7, 1.070 = 1.07, 2.0 = 2
export const normNum = (t) => t.replace(/,/g, '').replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
// Source line refs (`L12-40`, `L7`) and ledger ids (`F07`, `Q01`, `C03`) name a place, not a value — they
// must not "trace" a number the document shows, and a ledger id the document cites is not a value either.
export const scrubRefs = (text) => text
  .replace(/\bL\d+(?:\s*[-–]\s*L?\d+)?/g, ' ')
  .replace(/\b[FQC]\d{1,3}(?:\s*[-–]\s*[FQC]?\d{1,3})?\b/g, ' ');
// normalized numerals of a text, as a Set
export const numeralsOf = (text) => new Set([...scrubRefs(text).matchAll(NUM)].map(m => normNum(m[0])));

// ---------- the ledger ----------

// → Map id → { id, fact, value, unit, status }: every `F\d+` row of every table in the facts file that has an `id` header
// cell and a 사실 or 값 header cell (the F tables may be split under sub-headings; Q, C and T tables carry other headers).
// `status` is the 상태 cell's first word, lower-cased (implemented | designed | planned | n/a | '').
export function parseFacts(factsText) {
  const facts = new Map();
  if (!factsText) return facts;
  let head = null;
  for (const line of factsText.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const row = cells(line);
    const idCol = row.findIndex(c => /^id$/i.test(c));
    if (idCol >= 0) {
      const col = (re) => row.findIndex(c => re.test(c));
      head = col(/^사실/) >= 0 || col(/^값/) >= 0
        ? { id: idCol, fact: col(/^사실/), value: col(/^값/), unit: col(/^단위/), status: col(/^상태/) }
        : null;
      continue;
    }
    if (!head || !/^F\d+$/.test(row[head.id] || '')) continue;
    const at = (i) => (i >= 0 ? (row[i] || '') : '');
    facts.set(row[head.id], {
      id: row[head.id], fact: at(head.fact), value: at(head.value), unit: at(head.unit),
      status: (at(head.status).match(/[\w/-]+/) || [''])[0].toLowerCase(),
    });
  }
  return facts;
}

// the numerals a row vouches for: its 값 and its 사실 sentence
const rowNumerals = (row) => numeralsOf(`${row.value} ${row.fact}`);

// ---------- the bindings of a document ----------

export const PLANNED_STATUS = new Set(['designed', 'planned']);
export const PLANNED_WORDS = /계획|예정|미구현|미설계|제안|요청|대기/; // words that plainly say "not built yet"
export const PLANNED_STATES = new Set(['planned', 'caveat']);
const LEVELS = 3; // the element itself and this many ancestors may carry the marker

const idsOf = (value) => value.split(/[\s,;]+/).filter(Boolean);

// What an element shows by itself: its content with every nested data-f element taken out (`<b data-f="F01">18일<i data-f="F04">1.07</i></b>`
// shows 18 for F01; 1.07 is the nested element's number, checked against the row it cites). `withoutBound` reads the fragment, so
// the element's own tags are cut away first — it would otherwise remove the whole element.
function ownText(mk, el) {
  const close = mk.body.lastIndexOf('</', el.endAt - 1);
  return textOf(withoutBound(el.endAt > el.end && close >= el.end ? mk.body.slice(el.end, close) : ''));
}

// The document with every data-f element removed (comments, <script> and <style> too): what the set-membership fallback
// of `numbers-traced` should still read, because a bound number has been checked against its row.
export function withoutBound(html) {
  const mk = markup(html);
  const outer = [];
  for (const el of elementsWith(mk, 'data-f').sort((a, b) => a.start - b.start))
    if (!outer.length || el.start >= outer.at(-1).endAt) outer.push(el); // an element inside one already taken goes with it
  let out = mk.body;
  // a space where an element was: "1<i data-f>…</i>3건" must not read as 13건 (the text either side is not one number)
  for (const el of outer.reverse()) out = out.slice(0, el.start) + ' ' + out.slice(el.endAt);
  return out;
}

// → { count, violations: [string…], planned: { cited, unmarked: [string…] } }
//   count       data-f elements in the document
//   violations  an empty data-f, an id that is not a ledger row, a numeral the element shows that no cited row states
//   planned     elements citing a designed/planned row, and those of them with no marker near them
export function factBindings(html, facts) {
  const mk = markup(html);
  const els = elementsWith(mk, 'data-f');
  const res = { count: els.length, violations: [], planned: { cited: 0, unmarked: [] } };
  if (!els.length) return res;
  const parent = parentIndex(mk);
  const indexAt = new Map(mk.tags.map((t, i) => [t.start, i]));
  const absent = facts.size === 0 ? ' (the plan names no facts file with an F table)' : '';
  for (const el of els) {
    const ids = idsOf(el.value);
    const shown = clip(textOf(htmlOf(mk, el)), 28);
    if (!ids.length) { res.violations.push(`data-f is empty on "${shown}"`); continue; }
    const unknown = ids.filter(id => !facts.has(id));
    if (unknown.length) { res.violations.push(`data-f="${el.value}" on "${shown}": ${unknown.join(', ')} is not a row of the facts ledger${absent}`); continue; }
    const rows = ids.map(id => facts.get(id));
    const allowed = new Set(rows.flatMap(r => [...rowNumerals(r)]));
    const stray = [...numeralsOf(ownText(mk, el))].filter(n => !allowed.has(n));
    if (stray.length)
      res.violations.push(`data-f="${el.value}" on "${shown}": shows ${stray.join(', ')}, which ${rows.length > 1 ? 'none of those rows state' : `${rows[0].id} does not state`} (값 ${rows.map(r => `${r.id}=${r.value || '—'}`).join(', ')})`);
    const plannedRows = rows.filter(r => PLANNED_STATUS.has(r.status));
    if (!plannedRows.length) continue;
    res.planned.cited++;
    if (!plannedMarked(mk, parent, indexAt.get(el.start), els))
      res.planned.unmarked.push(`${plannedRows.map(r => `${r.id} (${r.status})`).join(', ')} on "${shown}"`);
  }
  return res;
}

// A planned/designed fact must not read as built. Marked = the element or one of its 3 nearest ancestors carries
// data-state="planned|caveat", or its text says 계획 / 예정 / 미구현 / 미설계 / 제안 / 요청 / 대기. An ancestor that holds other data-f elements
// is a shared container (a row of tiles, a layer of modules): its text belongs to all of them, so only its data-state counts.
function plannedMarked(mk, parent, tagIndex, els) {
  let i = tagIndex;
  for (let level = 0; level <= LEVELS && i >= 0; level++, i = parent[i]) {
    const tag = mk.tags[i];
    if (PLANNED_STATES.has((attrOf(tag.attrs, 'data-state') || '').trim().toLowerCase())) return true;
    const [start, end] = [tag.start, endOf(mk.tags, i)];
    if (els.filter(e => e.start >= start && e.endAt <= end).length > 1) continue;
    if (PLANNED_WORDS.test(textOf(mk.body.slice(start, end)))) return true;
  }
  return false;
}

// Text-level gate logic over a document's HTML — pure functions, no I/O (verify-doc.mjs reads the files).
//   visibleBlocks()  → the reader's text, one entry per paragraph-like block, in document order, tagged with its region id
//   parseTerms()     → the `## T — 용어` table of facts.md
//   bannedTermHits() → `terms-consistent` (hard)      missingFirstUse() · firstUseOrder() → `terms:first-use` (warnings)
//   proseWarnings()  → `prose:*` Korean-writing heuristics (warnings only — they never fail the gate)

// ---------- visible text ----------

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', ndash: '–', mdash: '—', hellip: '…', rarr: '→', larr: '←' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
  if (e[0] === '#') {
    const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    try { return String.fromCodePoint(n); } catch { return ' '; }
  }
  return NAMED[e.toLowerCase()] ?? ' ';
});

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);
// Elements that flow inside a line of prose (their text joins the surrounding text). `span` is here because the
// identifier chips of a paragraph are spans; a span that lays itself out as a block/flex item is not inline (below).
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'cite', 'code', 'del', 'em', 'font', 'i', 'ins', 'kbd', 'mark', 'q', 's', 'samp',
  'small', 'span', 'strong', 'sub', 'sup', 'time', 'tt', 'u', 'var']);
const BLOCKISH = /display\s*:\s*(?:block|flex|grid|inline-flex|inline-grid|table|list-item)|position\s*:\s*(?:absolute|fixed)/i;
const FLEX = /display\s*:\s*(?:inline-)?(?:flex|grid)/i;
const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;

// A small tolerant tree: comments, <script>, <style> and <helmet> are gone; unclosed/stray tags do not throw.
function parse(fragment) {
  const live = fragment.replace(/<!--[\s\S]*?-->/g, '').replace(/<!(?!--)[^>]*>/g, '').replace(/<(script|style|helmet)\b[\s\S]*?<\/\1>/gi, '');
  const root = { tag: '#root', attrs: '', children: [] };
  const stack = [root];
  let last = 0;
  for (const m of live.matchAll(TAG)) {
    if (m.index > last) stack.at(-1).children.push(live.slice(last, m.index));
    last = m.index + m[0].length;
    const [, close, name, attrs, selfClose] = m;
    const tag = name.toLowerCase();
    if (close) {
      const i = stack.findLastIndex(n => n.tag === tag);
      if (i > 0) stack.length = i;
    } else {
      const node = { tag, attrs, children: [] };
      stack.at(-1).children.push(node);
      if (!selfClose && !VOID.has(tag)) stack.push(node);
    }
  }
  if (last < live.length) stack.at(-1).children.push(live.slice(last));
  return root;
}

const isInline = (n) => INLINE.has(n.tag) && !BLOCKISH.test(n.attrs) && n.children.every(c => typeof c === 'string' || isInline(c));
const inlineText = (n) => n.children.map(c => (typeof c === 'string' ? decode(c) : inlineText(c))).join('');

// Paragraph-like blocks: inline elements (<b>, identifier chips, <a>) join the text around them, every block-level
// element, <br>, and every child of a flex/grid container starts a new block. → [{ text, tag }]
function collect(node, out) {
  let run = '';
  const flush = () => {
    const text = run.replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, tag: node.tag });
    run = '';
  };
  const flexy = FLEX.test(node.attrs);
  for (const c of node.children) {
    if (typeof c === 'string') { run += decode(c); if (flexy) flush(); continue; }
    if (!flexy && isInline(c)) { run += inlineText(c); continue; }
    flush();
    collect(c, out);
  }
  flush();
}

// The document split, in document order, into the numbered/appendix <section>s (comments removed) and the text between
// and around them: `hero` = everything before the first <section> (nav, cover, thesis), `divider` = what sits between two
// sections (act dividers), `closing` = what follows the last section (closing line). Empty dividers/closing are dropped;
// `hero` is always first. <section>s do not nest.
export function regions(html) {
  const body = html.replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  let n = 0;
  let pos = 0;
  for (const m of body.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/gi)) {
    const gap = body.slice(pos, m.index);
    if (n === 0 || gap.trim()) out.push({ id: n === 0 ? 'hero' : 'divider', html: gap });
    pos = m.index + m[0].length;
    n++;
    const id = (m[0].match(/^<section\b[^>]*?(?<![\w-])id=["']([^"']+)["']/i) || [])[1] || `section${n}`;
    out.push({ id, html: m[0] });
  }
  const tail = body.slice(pos);
  if (n === 0 || tail.trim()) out.push({ id: n === 0 ? 'hero' : 'closing', html: tail });
  return out;
}

// Everything a reader sees, block by block in document order, each tagged with its region id (`hero` before the first
// section, `divider` between sections, `closing` after the last, `sref` = appendix, otherwise the section id).
export function visibleBlocks(html) {
  const blocks = [];
  for (const r of regions(html)) {
    const found = [];
    collect(parse(r.html), found);
    for (const b of found) blocks.push({ id: r.id, ...b });
  }
  return blocks;
}

// ---------- terms ledger (`## T — 용어` in facts.md) ----------

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.replace(/\\\|/g, '|').trim());
const unwrap = (v) => v.trim().replace(/^[`"'“‘「]+|[`"'”’」]+$/g, '').trim();
const isBlank = (v) => !v || /^(?:—|-|–|none|n\/a|없음)$/i.test(v);
const isPlaceholder = (v) => /^<[^>]*>$/.test(v.trim());

// → [{ term, meaning, first, banned: string[] }]; [] when facts.md has no T table (or only template placeholders).
export function parseTerms(factsText) {
  if (!factsText) return [];
  const lines = factsText.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex(l => /^##\s+T\b(?![\w가-힣])/.test(l));
  if (start < 0) return [];
  const rows = [];
  for (const l of lines.slice(start + 1)) {
    if (/^##\s/.test(l)) break;
    if (l.trim().startsWith('|')) rows.push(cells(l));
  }
  const header = rows.findIndex(r => r.some(c => c.includes('용어')));
  if (header < 0) return []; // no `용어` header cell → not a term sheet (the header row would otherwise parse as a term)
  const head = rows[header];
  const col = (re, fallback) => { const i = head.findIndex(c => re.test(c)); return i >= 0 ? i : fallback; };
  const [iTerm, iMean, iFirst, iBan] = [col(/^용어/, 0), col(/^뜻/, 1), col(/처음/, 2), col(/쓰지|금지/, 3)];
  const out = [];
  for (const r of rows.slice(header + 1)) {
    if (r.every(c => /^:?-{2,}:?$/.test(c) || !c)) continue; // separator / empty row
    const term = unwrap(r[iTerm] || '');
    if (isBlank(term) || isPlaceholder(term)) continue;
    const first = unwrap(r[iFirst] || '');
    const banned = (r[iBan] || '').split(/[,，、]/).map(unwrap).filter(v => !isBlank(v) && !isPlaceholder(v));
    out.push({ term, meaning: unwrap(r[iMean] || ''), first: isBlank(first) || isPlaceholder(first) ? '' : first, banned });
  }
  return out;
}

// Banned variants in the reader's text outside the `sref` appendix (Latin case-sensitive, Hangul exact). A variant made only
// of Latin letters, digits and ` . _ -` is matched as a whole token — not inside a longer Latin/digit run, so banned `AD`
// does not hit `LOAD` or `ADR-0008` but does hit `AD 계정` and `AD는`; a Hangul or mixed variant is an exact substring
// ("업무" hits "업무량"). A longer chosen term or first-use form that contains a variant ("작업(Task)" holds "Task") is
// masked first, so the form the ledger itself prescribes never trips its own ban.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LATIN_ONLY = /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/;
const variantRe = (v) => (LATIN_ONLY.test(v) ? new RegExp(`(?<![A-Za-z0-9])${escapeRe(v)}(?![A-Za-z0-9])`, 'g') : new RegExp(escapeRe(v), 'g'));

export function bannedTermHits(blocks, terms) {
  const known = [...new Set(terms.flatMap(t => [t.term, t.first]).filter(Boolean))];
  const hits = [];
  for (const b of blocks) {
    if (b.id === 'sref') continue;
    const here = [];
    for (const t of terms) for (const v of t.banned) {
      let text = b.text;
      for (const w of known) if (w.length > v.length && w.includes(v)) text = text.split(w).join('\u0002'.repeat(w.length));
      for (const m of text.matchAll(variantRe(v)))
        here.push({ at: m.index, variant: v, term: t.term, id: b.id, ctx: `…${b.text.slice(Math.max(0, m.index - 14), m.index + v.length + 14)}…` });
    }
    hits.push(...here.sort((a, b2) => a.at - b2.at));
  }
  return hits;
}

// Terms whose 처음 나올 때 form (whitespace-insensitive) appears nowhere in the document's visible text.
export function missingFirstUse(blocks, terms) {
  const flat = blocks.map(b => b.text).join('\n').replace(/\s+/g, '');
  return terms.filter(t => t.first && !flat.includes(t.first.replace(/\s+/g, '')));
}

// Terms whose bare form is read BEFORE their 처음 나올 때 form (core/components.md §4 "Terms and first use"). Order is the
// document order of `blocks`: the `hero` region (everything before the first section — nav, cover, thesis) reads first,
// then each numbered section, with act dividers (`divider`) and the closing line (`closing`) at their real positions; the
// `sref` appendix is a glossary, not a use, so its bare terms never count.
//   · the hero thesis counts as the first occurrence: when the first-use form is in the hero, the hero's bare terms are
//     excluded from the check (and everything after it is fine); when it is not, a bare term in the hero is out of order.
//     Only the pre-section `hero` has this power — a first-use form that appears only in a divider or the closing line
//     introduces nothing before it, so earlier bare uses are still reported;
//   · nav labels, the fixed document title (hero blocks tagged a / nav / h1) and section titles (h2) are exempt — they
//     neither count as a first use nor as a bare use;
//   · a longer term or first-use form that contains the bare term ("작업 요청" holds "작업") is masked, so it is not a bare use.
// A term whose first-use form appears nowhere is left to missingFirstUse(); a term with no distinct first-use form is skipped.
// → [{ term, first, id, ctx }] (the first out-of-order use of each term)
const NAV_OR_TITLE = new Set(['a', 'nav', 'h1']);
const looseRe = (form) => new RegExp([...form.replace(/\s+/g, '')].map(escapeRe).join('\\s*'), 'u');
const MASK = '\u0002';

export function firstUseOrder(blocks, terms) {
  const known = [...new Set(terms.flatMap(t => [t.term, t.first]).filter(Boolean))];
  // Section titles (h2) are exempt too: a heading may name a term that its own lead defines right below it.
  const reader = blocks.filter(b => !(b.id === 'hero' && NAV_OR_TITLE.has(b.tag)) && b.tag !== 'h2');
  const out = [];
  for (const t of terms) {
    if (!t.first || t.first.replace(/\s+/g, '') === t.term.replace(/\s+/g, '')) continue;
    if (missingFirstUse(blocks, [t]).length) continue;
    const form = looseRe(t.first);
    if (reader.some(b => b.id === 'hero' && form.test(b.text))) continue; // the thesis introduces the term
    const longer = known.filter(w => w !== t.first && w.length > t.term.length && w.includes(t.term));
    for (const b of reader) {
      if (b.id === 'sref') continue;
      const at = b.text.search(form);
      let masked = b.text.replace(new RegExp(form.source, 'gu'), (m) => MASK.repeat(m.length));
      for (const w of longer) masked = masked.split(w).join(MASK.repeat(w.length));
      const bare = masked.indexOf(t.term);
      if (bare >= 0 && (at < 0 || bare < at)) { out.push({ term: t.term, first: t.first, id: b.id, ctx: `…${b.text.slice(Math.max(0, bare - 14), bare + t.term.length + 14)}…` }); break; }
      if (at >= 0) break; // the first-use form comes first
    }
  }
  return out;
}

// ---------- Korean prose warnings ----------

export const LONG_SENTENCE = 110; // characters (spaces included) — a Korean sentence past this is two ideas
export const DOT_CHAIN = 4;       // `·` per sentence — a noun pile
export const LEAD_DASHES = 3;     // `—` per section lead
export const MIN_SENTENCE_NODE = 25;

const len = (s) => [...s].length;
// Prose, not a label: 25+ characters that end like a sentence. Headings, the appendix and chip-length text are out.
const sentenceLike = (t) => len(t) >= MIN_SENTENCE_NODE && /(?:[.!?。]|[다요까])["'”’)\]」』]*$/.test(t);

// A sentence ends at . ! ? followed by space/end (so 3.5, v0.2.0 and file.md stay whole); a block's last `다` also ends one.
export function splitSentences(text) {
  const out = [];
  let start = 0;
  for (const m of text.matchAll(/[.!?。]+["'”’)\]」』]*(?=\s|$)/g)) {
    out.push(text.slice(start, m.index + m[0].length));
    start = m.index + m[0].length;
  }
  out.push(text.slice(start));
  return out.map(s => s.trim()).filter(Boolean);
}

const hasFinalB = (ch) => { const c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 && c % 28 === 17; }; // ㅂ batchim
const POLITE = /([가-힣])니[다까]|(?:해요|이에요|예요|세요|어요|아요|네요|군요)(?![가-힣])/g;

const TRANSLATIONESE = [
  { key: '~하는 것이다', re: /[는한된인은] 것이다/g },
  { key: '~것으로 보인다', re: /것으로 (?:보인다|보여진다|보입니다)/g },
  { key: '되어지다', re: /되어지|되어진|보여지|보여진|불려지|불려진|쓰여지|쓰여진/g },
  { key: '~에 있어서', re: /에 있어(?:서)?(?![가-힣])/g },
  { key: '~에 대한', re: /에 대한/g, perSection: 3 },
  { key: '~를 통해', re: /[을를] 통해(?:서)?(?![가-힣])/g, perSection: 3 },
];

const ctxOf = (text, i, n) => `…${text.slice(Math.max(0, i - 16), i + n + 16)}…`;
const clip = (s, n = 56) => (len(s) > n ? `${[...s].slice(0, n).join('')}…` : s);

export function proseWarnings(blocks) {
  const warnings = [];
  const prose = blocks.filter(b => b.id !== 'sref' && !/^h[1-6]$/.test(b.tag) && sentenceLike(b.text));
  const sents = prose.flatMap(b => splitSentences(b.text).map(text => ({ id: b.id, text })));

  const long = sents.filter(s => len(s.text) > LONG_SENTENCE).sort((a, b) => len(b.text) - len(a.text));
  if (long.length)
    warnings.push({ name: 'prose:long-sentence', detail: `${long.length} of ${sents.length} sentence(s) over ${LONG_SENTENCE} characters — split at the second idea; longest: ${long.slice(0, 2).map(s => `${s.id} (${len(s.text)}) "${clip(s.text)}"`).join(' ; ')}` });

  const chains = sents.filter(s => (s.text.match(/[·ㆍ]/g) || []).length >= DOT_CHAIN);
  if (chains.length)
    warnings.push({ name: 'prose:dot-chain', detail: `${chains.length} sentence(s) with ${DOT_CHAIN}+ "·" (a noun pile — write a clause): ${chains.slice(0, 2).map(s => `${s.id} "${clip(s.text)}"`).join(' ; ')}` });

  const dashed = sents.filter(s => (s.text.match(/—/g) || []).length > 1);
  const leads = [];
  for (const id of new Set(prose.map(b => b.id)))
    if (/^s\d+$/.test(id)) {
      const lead = blocks.find(b => b.id === id && b.tag === 'p' && len(b.text) >= MIN_SENTENCE_NODE);
      if (lead && (lead.text.match(/—/g) || []).length > LEAD_DASHES) leads.push(lead);
    }
  if (dashed.length || leads.length)
    warnings.push({ name: 'prose:dash', detail: `${dashed.length} sentence(s) with more than one "—", ${leads.length} section lead(s) with more than ${LEAD_DASHES}: ${[...dashed.map(s => `${s.id} "${clip(s.text)}"`), ...leads.map(b => `${b.id} lead "${clip(b.text)}"`)].slice(0, 2).join(' ; ')}` });

  const found = [];
  const perKey = new Map();
  for (const b of prose)
    for (const p of TRANSLATIONESE) {
      const ms = [...b.text.matchAll(p.re)];
      for (const m of ms) found.push({ key: p.key, id: b.id, ctx: ctxOf(b.text, m.index, m[0].length) });
      if (ms.length) perKey.set(`${p.key}\u0000${b.id}`, (perKey.get(`${p.key}\u0000${b.id}`) || 0) + ms.length);
    }
  const keep = found.filter(f => {
    const p = TRANSLATIONESE.find(x => x.key === f.key);
    return !p.perSection || perKey.get(`${f.key}\u0000${f.id}`) >= p.perSection;
  });
  if (keep.length) {
    const tally = new Map();
    for (const f of keep) tally.set(f.key, (tally.get(f.key) || 0) + 1);
    warnings.push({ name: 'prose:translationese', detail: `${keep.length} hit(s): ${[...tally].map(([k, n]) => `${k} ×${n}`).join(', ')} — write the verb directly; e.g. ${keep.slice(0, 2).map(f => `${f.id} ${f.ctx}`).join(' ; ')}` });
  }

  const polite = [];
  for (const b of prose)
    for (const m of b.text.matchAll(POLITE))
      if (!m[1] || hasFinalB(m[1])) polite.push({ id: b.id, ctx: ctxOf(b.text, m.index, m[0].length) });
  if (polite.length)
    warnings.push({ name: 'prose:register', detail: `${polite.length} polite ending(s) (~합니다·~습니다·~해요) — body text is ~한다; e.g. ${polite.slice(0, 2).map(p => `${p.id} ${p.ctx}`).join(' ; ')}` });

  return warnings;
}

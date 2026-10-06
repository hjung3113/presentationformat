import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFacts, numeralsOf, factBindings, withoutBound } from '../facts.mjs';
import { runGate } from '../gate.mjs';

// A small ledger in the real shape: an F table split under a sub-heading, the Q and C tables with other headers.
const LEDGER = `# facts

## F — 사실

| id | 사실 | 값 | 단위 | 종류 | 상태 | 출처 | as-of | 독자 |
|---|---|---|---|---|---|---|---|---|
| F01 | 플랫폼 레포 생성부터 v0.2.0 릴리스까지 걸린 기간 | 18 | 일 | measured | implemented | AP | 2026-10-05 | exec |
| F04 | 플랫폼 테스트 코드 ÷ 제품 코드 (16,796줄 ÷ 15,768줄) | 1.07 | 배 | measured | implemented | AP | 2026-10-05 | exec |
| F06 | 마일스톤 32개 중 31개 완료 | 31/32 | 마일스톤 | measured | implemented | FO | 2026-10-05 | exec |
| F07 | 사용자 매뉴얼 0–12장 작성 완료 | 0–12 | 장 | doc | implemented | FO | 2026-10-05 | exec |
| F12 | 사내 로그인 답이 먼저 필요한 작업 \\| #86·#98 | 4 | 건 | doc | planned | AP | 2026-10-05 | exec |
| F16 | 화면은 플랫폼 메뉴로 옮긴다(A안) | A | 안 | doc | designed | AP | 2026-10-04 | exec |

### 제안 값

| 독자 | id | 값 | 상태 | 사실 |
|---|---|---|---|---|
| exec | F71 | 12 | planned | 시범 기간 12주 |
| exec | F100 | — | n/a | 값이 없는 사실 |

## Q — 열린 질문

| id | 질문 | 필요 섹션 | 누구 | 상태 |
|---|---|---|---|---|
| Q01 | 기준선 | 6 | 발표자 | open |

## C — 주장

| id | 주장 | 근거 F-ids | 한계 |
|---|---|---|---|
| C01 | 빠르게 만들었다 | F01, F04 | 1인 집중 |
`;
const facts = parseFacts(LEDGER);

test('parseFacts: every F row of every table with an id header, columns found by header name, status first word; Q/C rows and escaped pipes handled', () => {
  assert.deepEqual([...facts.keys()], ['F01', 'F04', 'F06', 'F07', 'F12', 'F16', 'F71', 'F100']);
  assert.deepEqual(facts.get('F04'), { id: 'F04', fact: '플랫폼 테스트 코드 ÷ 제품 코드 (16,796줄 ÷ 15,768줄)', value: '1.07', unit: '배', status: 'implemented' });
  assert.equal(facts.get('F12').fact, '사내 로그인 답이 먼저 필요한 작업 | #86·#98'); // `\|` is a pipe in the cell
  assert.deepEqual([facts.get('F71').value, facts.get('F71').status, facts.get('F71').fact], ['12', 'planned', '시범 기간 12주']); // another column order
  assert.equal(facts.get('F16').status, 'designed');
  assert.equal(parseFacts(undefined).size, 0);
  assert.equal(parseFacts('| F01 | 건수 | 74 |').size, 0); // a row without a header is not a ledger
  assert.equal(parseFacts('| id | 질문 |\n|---|---|\n| F01 | x |').size, 0); // an id header without 사실/값 is another kind of table
});

test('numeralsOf: thousands commas and leading zeros normalize; ledger ids and line refs are not values', () => {
  assert.deepEqual([...numeralsOf('16,796줄 · 2026-05-16 · 0–12장 · 1.07배 · F04 · L12-40 · Q01')].sort(), ['0', '1.07', '12', '16', '16796', '2026', '5'].sort());
});

const doc = (inner) => `<html><body><section id="s1">${inner}</section></body></html>`;
const bind = (inner) => factBindings(doc(inner), facts);

test('data-f: a number the cited row states passes — its 값 or a number of its 사실 sentence (16,796 is in F04\'s sentence, not its 값)', () => {
  assert.deepEqual(bind('<b data-f="F01">18일</b> <b data-f="F04">1.07배</b> <b data-f="F04">16,796줄</b> <b data-f="F06">31/32</b>').violations, []);
  assert.equal(bind('<b data-f="F01">18일</b>').count, 1);
});

test('data-f: the numeral of another row, a rounded value and an unknown id fail; several ids pool their numbers', () => {
  const v = (inner) => bind(inner).violations;
  assert.match(v('<b data-f="F01">54개</b>').join(), /data-f="F01" on "54개": shows 54, which F01 does not state \(값 F01=18\)/); // F03's number cited to F01
  assert.equal(v('<b data-f="F04">1.1배</b>').length, 1); // 1.07 is not 1.1
  assert.match(v('<b data-f="F99">18일</b>').join(), /F99 is not a row of the facts ledger/);
  assert.match(v('<b data-f="F01 F99">18일</b>').join(), /F99 is not a row/);
  assert.match(v('<b data-f="">18일</b>').join(), /data-f is empty/);
  assert.deepEqual(v('<p data-f="F06 F07">개발 항목 32개 중 31개 완료 · 사용자 매뉴얼 0–12장</p>'), []); // F06 states 32 and 31, F07 states 0 and 12
  assert.match(v('<p data-f="F06 F07">개발 항목 40개 완료 · 0–12장</p>').join(), /shows 40, which none of those rows state/);
  assert.match(factBindings(doc('<b data-f="F01">18</b>'), parseFacts('')).violations.join(), /plan names no facts file with an F table/);
});

test('data-f: a number without data-f is not bound (the set-membership check stays its fallback); a ledger id in the text is not a value', () => {
  assert.deepEqual(bind('<p>54개 · 18일</p>'), { count: 0, violations: [], planned: { cited: 0, unmarked: [] } });
  assert.deepEqual(bind('<b data-f="F01">F01 18일</b>').violations, []);
});

test('withoutBound: removes every data-f element once, the outer of two nested ones, and leaves the rest', () => {
  const out = withoutBound(doc('<p>앞 <b data-f="F01">18<i data-f="F04">1.07</i></b> 뒤</p><p>그대로 99</p><!-- <b data-f="F01">77</b> -->'));
  assert.doesNotMatch(out, /18|1\.07|77|data-f/);
  assert.match(out, /앞\s+뒤/);
  assert.match(out, /그대로 99/);
});

// ---- planned markers: a designed/planned fact must not read as built ----

const planned = (inner) => bind(inner).planned;

test('planned:unmarked — an element citing a planned or designed fact needs 계획·예정·미구현·미설계·제안·요청·대기 text or data-state=planned|caveat within 3 levels', () => {
  assert.deepEqual(planned('<div><b data-f="F12">4건</b> 사내 담당의 회신을 기다리는 일</div>'), { cited: 1, unmarked: ['F12 (planned) on "4건"'] });
  assert.deepEqual(planned('<div><b data-f="F16">A안</b> 화면 이전은 계획이다</div>'), { cited: 1, unmarked: [] }); // text marker, designed fact
  for (const word of ['제안', '요청', '대기']) assert.deepEqual(planned(`<div><b data-f="F71">12주</b> 한 팀 시범(${word})</div>`).unmarked, [], word); // proposals, requests and waiting items say "not built yet"
  assert.equal(planned('<div><b data-f="F71">12주</b> 한 팀 시범</div>').unmarked.length, 1);
  assert.deepEqual(planned('<div data-state="planned"><b data-f="F12">4건</b></div>').unmarked, []);
  assert.deepEqual(planned('<div data-state="caveat"><b data-f="F12">4건</b></div>').unmarked, []);
  assert.deepEqual(planned('<div data-state="built"><b data-f="F12">4건</b></div>').unmarked.length, 1); // any other state is not a marker
  assert.deepEqual(planned('<b data-f="F12" data-state="planned">4건</b>').unmarked, []); // on the element itself
  assert.deepEqual(planned('<b data-f="F01">18일</b> <b data-f="F06">31/32</b>'), { cited: 0, unmarked: [] }); // implemented facts need nothing
});

test('planned:unmarked — the marker may sit 2 or 3 levels up, not 4; a sibling fact\'s marker in a shared container does not cover this one', () => {
  const el = '<b data-f="F12">4건</b>';
  const wrap = (up) => `<div data-state="planned">${'<div>'.repeat(up)}${el}${'</div>'.repeat(up)}</div>`;
  assert.equal(planned(wrap(2)).unmarked.length, 0); // marker is the 3rd ancestor (2 plain divs between)
  assert.equal(planned(wrap(3)).unmarked.length, 1); // 4 levels up
  const textWrap = (up) => `<div>예정 항목${'<div>'.repeat(up)}${el}${'</div>'.repeat(up)}</div>`;
  assert.equal(planned(textWrap(2)).unmarked.length, 0);
  assert.equal(planned(textWrap(3)).unmarked.length, 1);
  // two tiles in one row: the first says 예정, the second does not — the row's text belongs to both, so it covers neither
  const row = '<div><div><b data-f="F12">4건</b> 예정</div><div><b data-f="F71">12주</b> 한 팀</div></div>';
  assert.deepEqual(planned(row).unmarked, ['F71 (planned) on "12주"']);
  // …but a data-state on the shared row does cover both
  assert.deepEqual(planned(row.replace('<div><div>', '<div data-state="planned"><div>')).unmarked, []);
});

// ---- through the gate: numbers-traced and planned:unmarked ----

const opts = { accentHex: '#4338CA', sidecarPresent: true };
const gate = (inner, extra = {}) => runGate(
  `<!DOCTYPE html><html><head><style>body { word-break: keep-all; }</style></head><body><i style="color:#4338CA"></i>${doc(inner).replace('<html><body>', '').replace('</body></html>', '')}</body></html>`,
  { ...opts, plan: { sections: [{ id: 's1', shape: 'none' }] }, shapeMap: {}, planText: '요약 [F01]', factsText: LEDGER, ...extra });
const row = (r, name) => r.checks.find(c => c.name === name);

test('numbers-traced: a wrong fact id or a value the row does not state FAILS even though the number exists elsewhere in the ledger', () => {
  const ok = gate('<p>플랫폼은 <b data-f="F01">18일</b> 만에 나왔다.</p>');
  assert.equal(row(ok, 'numbers-traced').ok, true);
  assert.equal(row(ok, 'numbers-traced').detail, '1 number element(s) bound to their facts row via data-f');
  // 54 is not in the ledger rows used here but 31 is: set membership alone would pass `31` cited to F01
  const wrong = gate('<p>플랫폼은 <b data-f="F01">31일</b> 만에 나왔다.</p>');
  assert.equal(row(wrong, 'numbers-traced').ok, false);
  assert.match(row(wrong, 'numbers-traced').detail, /1 data-f binding\(s\) do not match the facts ledger: data-f="F01" on "31일": shows 31, which F01 does not state/);
  assert.equal(row(gate('<p>플랫폼은 31일 만에 나왔다.</p>'), 'numbers-traced').ok, true); // unbound: 31 is a number of the ledger (F06)
  const unknown = gate('<p><b data-f="F77">18일</b></p>');
  assert.equal(row(unknown, 'numbers-traced').ok, false);
  assert.match(row(unknown, 'numbers-traced').detail, /F77 is not a row of the facts ledger/);
});

test('numbers-traced: unbound numbers keep the set-membership fallback, bound ones are not read twice, a doc without data-f is unchanged', () => {
  const mixed = gate('<p><b data-f="F01">18일</b> 와 근거 없는 47건</p>');
  assert.equal(row(mixed, 'numbers-traced').ok, false);
  assert.match(row(mixed, 'numbers-traced').detail, /^1 number\(s\) not in the plan or facts: 47 /);
  assert.doesNotMatch(row(mixed, 'numbers-traced').detail, /data-f/);
  const plain = gate('<p>18일 · 31개</p>');
  assert.equal(row(plain, 'numbers-traced').ok, true);
  assert.equal(row(plain, 'numbers-traced').detail, '');
  assert.deepEqual(plain.warnings.filter(w => /^planned:/.test(w.name)), []);
});

test('planned:unmarked is a warning row, never a failure; an INFO row says when every planned citation is marked', () => {
  const unmarked = gate('<div><b data-f="F12">4건</b> 사내 담당의 회신을 기다리는 일</div>');
  assert.equal(unmarked.ok, true);
  const w = unmarked.warnings.find(x => x.name === 'planned:unmarked');
  assert.equal(w.level, undefined);
  assert.match(w.detail, /^1 of 1 element\(s\) citing a designed\/planned fact carry no .* within 3 levels: F12 \(planned\) on "4건"/);
  const marked = gate('<div data-state="planned"><b data-f="F12">4건</b></div>');
  assert.deepEqual(marked.warnings.filter(x => x.name === 'planned:unmarked'), [{ level: 'INFO', name: 'planned:unmarked', detail: '1 element(s) citing a designed/planned fact, all marked' }]);
});

// ---- nesting and numeral normalization ----

test('data-f nesting: an outer element is read without its nested data-f elements — their numerals belong to the inner binding, which is checked on its own', () => {
  const nested = '<b data-f="F01">18일<i data-f="F04">1.07</i></b>';
  assert.deepEqual(bind(nested).violations, []); // 1.07 is F04's, not F01's: both bindings are right
  assert.equal(bind(nested).count, 2);
  assert.match(bind('<b data-f="F01">19일<i data-f="F04">1.07</i></b>').violations.join(), /data-f="F01" on "19일 1\.07": shows 19, which F01 does not state/); // the outer's own number is still checked…
  assert.equal(bind('<b data-f="F01">19일<i data-f="F04">1.07</i></b>').violations.length, 1); // …and 1.07 is not counted against F01
  assert.match(bind('<b data-f="F01">18일<i data-f="F04">1.1</i></b>').violations.join(), /data-f="F04" on "1\.1": shows 1\.1, which F04 does not state/); // …and the inner one against its own row
  assert.equal(row(gate(`<p>${nested}</p>`), 'numbers-traced').ok, true); // through the gate
});

test('normNum: trailing decimal zeros do not make another number (1.070 = 1.07, 2.0 = 2); a whole number\'s own zeros stay (10, 100)', () => {
  assert.deepEqual([...numeralsOf('1.070배 · 2.0 · 10일 · 100건 · 0.50 · 1,200.00')].sort(), ['1.07', '2', '10', '100', '0.5', '1200'].sort());
  assert.deepEqual(bind('<b data-f="F04">1.070배</b> <b data-f="F01">18.0일</b>').violations, []);
  assert.equal(row(gate('<p>테스트는 제품 코드의 1.070배다.</p>'), 'numbers-traced').ok, true); // the unbound fallback reads it the same way
  assert.equal(bind('<b data-f="F04">1.7배</b>').violations.length, 1);
});

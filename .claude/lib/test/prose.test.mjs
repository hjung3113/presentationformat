import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleBlocks, parseTerms, bannedTermHits, missingFirstUse, firstUseOrder, splitSentences, proseWarnings, LONG_SENTENCE } from '../prose.mjs';

// A document around `body`: `hero` text outside the sections, then numbered sections given as [id, html] pairs.
const doc = (...secs) => `<!DOCTYPE html><html><body><div>표지 문구</div>${secs.map(([id, h]) => `<section id="${id}">${h}</section>`).join('')}</body></html>`;
const warn = (html, name) => proseWarnings(visibleBlocks(html)).find(w => w.name === name);
const filler = (n) => '가'.repeat(n);

// ----- visible blocks -----

test('visibleBlocks: inline elements join the paragraph, blocks / <br> / flex children split it, hidden markup is gone', () => {
  const html = doc(['s1', '<p style="m:0">오늘은 <b>준비 2주</b>만 승인하며 <span style="font:12px mono; white-space:nowrap">support.js</span>는 그대로 둔다.</p>' +
    '<div style="display:flex"><span>첫 항목</span><span>둘째 항목</span></div><p>줄<br>바꿈</p><div><div>안쪽 하나</div><div>안쪽 둘</div></div>' +
    '<!-- 숨김 주석 --><script>const x = "스크립트";</script><style>b{top:1px}</style><helmet><style>x{y:z}</style></helmet><p>A &amp; B &#39;따옴표&#39;</p>']);
  const texts = visibleBlocks(html).filter(b => b.id === 's1').map(b => b.text);
  assert.deepEqual(texts, ['오늘은 준비 2주만 승인하며 support.js는 그대로 둔다.', '첫 항목', '둘째 항목', '줄', '바꿈', '안쪽 하나', '안쪽 둘', "A & B '따옴표'"]);
});

test('visibleBlocks: text outside every <section> is `hero`; each block carries its section id and element tag', () => {
  const blocks = visibleBlocks(doc(['s1', '<h2>제목</h2><p>본문 문장이다.</p>'], ['sref', '<p>부록 문장이다.</p>']));
  assert.deepEqual(blocks.map(b => [b.id, b.tag, b.text]), [['hero', 'div', '표지 문구'], ['s1', 'h2', '제목'], ['s1', 'p', '본문 문장이다.'], ['sref', 'p', '부록 문장이다.']]);
});

test('visibleBlocks survives stray and unclosed tags', () => {
  assert.doesNotThrow(() => visibleBlocks('<div><p>열린 문단<section id="s1"><b>굵게</section></div></span><p>끝'));
  assert.ok(visibleBlocks('<p>a < b 이고 c > d</p>').some(b => b.text.includes('a < b')));
});

// ----- terms ledger -----

const LEDGER = `# facts

## F — 사실
| id | 사실 |
|---|---|
| F01 | x |

## T — 용어

| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |
|---|---|---|---|
| 작업 | 처리하는 일 한 건 | 작업(Task) | 태스크, \`업무\` , Task Request |
| 접수 | 처음 기록되는 일 | 접수 | — |
| <용어> | <뜻> | <처음> | <금지> |

## Q — 열린 질문
| id | 질문 |
|---|---|
| 용어 | 이 행은 T 표가 아니다 |
`;

test('parseTerms: reads the `## T — 용어` table by header name, splits variants on commas, drops blanks and placeholders', () => {
  assert.deepEqual(parseTerms(LEDGER), [
    { term: '작업', meaning: '처리하는 일 한 건', first: '작업(Task)', banned: ['태스크', '업무', 'Task Request'] },
    { term: '접수', meaning: '처음 기록되는 일', first: '접수', banned: [] },
  ]);
});

test('parseTerms: no T section (or only placeholders) means no ledger; columns may be reordered; "## Task" is not a T section', () => {
  assert.deepEqual(parseTerms('## F — 사실\n| id |\n|---|\n| F01 |'), []);
  assert.deepEqual(parseTerms(undefined), []);
  assert.deepEqual(parseTerms('## Task 목록\n| 용어 | 뜻 |\n|---|---|\n| 가 | 나 |'), []);
  assert.deepEqual(parseTerms('## T — 용어\n| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |\n|---|---|---|---|\n| <용어> | <뜻> | <…> | <…> |'), []);
  const swapped = '## T — 용어\n| 쓰지 않을 말 | 용어 | 처음 나올 때 | 뜻 |\n|---|---|---|---|\n| 티켓 | 작업 | 작업(Task) | 일 한 건 |';
  assert.deepEqual(parseTerms(swapped), [{ term: '작업', meaning: '일 한 건', first: '작업(Task)', banned: ['티켓'] }]);
});

const TERMS = parseTerms(LEDGER);
const hits = (html) => bannedTermHits(visibleBlocks(html), TERMS);

test('bannedTermHits: substring match in visible text, Latin case-sensitive, Hangul exact', () => {
  const found = hits(doc(['s1', '<p>태스크가 쌓인다. Task Request는 쓰지 않는다. 업무량도 본다.</p><p>task request와 Task requests는 다르다.</p>']));
  assert.deepEqual(found.map(h => [h.variant, h.term, h.id]), [['태스크', '작업', 's1'], ['Task Request', '작업', 's1'], ['업무', '작업', 's1']]);
  assert.match(found[0].ctx, /^…태스크가 쌓인다/);
  assert.equal(hits(doc(['s1', '<p>task request와 업 무와 테스크는 괜찮다.</p>'])).length, 0);
});

test('bannedTermHits: the appendix is exempt; hero, other sections and nav-like text outside sections are not', () => {
  const html = `<body><nav>업무 흐름</nav><div>표지</div><section id="s1"><p>본문</p></section><section id="sref"><p>태스크 = 작업의 옛 이름</p></section></body>`;
  assert.deepEqual(hits(html).map(h => [h.id, h.variant]), [['hero', '업무']]);
});

test('bannedTermHits: a longer chosen term or first-use form that contains a variant is not a hit (작업(Task) holds Task)', () => {
  const t = parseTerms('## T — 용어\n| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |\n|---|---|---|---|\n| 작업 | 일 | 작업(Task) | Task |\n| 작업 요청 | 승인 전 | 작업 요청(Task Request) | 요청 작업 |');
  const run = (h) => bannedTermHits(visibleBlocks(h), t).map(x => x.variant);
  assert.deepEqual(run(doc(['s1', '<p>작업(Task)을 만들고 작업 요청(Task Request)을 올린다.</p>'])), []);
  assert.deepEqual(run(doc(['s1', '<p>작업(Task)을 만든다. 나중에 Task라고 부른다.</p>'])), ['Task']);
});

test('bannedTermHits: a banned word split across inline tags is still found', () => {
  assert.equal(hits(doc(['s1', '<p>이 <b>태스크</b>는 느리다</p><p>업<b>무</b></p>'])).length, 2);
});

test('missingFirstUse: the first-use form must appear (whitespace-insensitive, appendix counts); bare terms need no form', () => {
  const miss = (h) => missingFirstUse(visibleBlocks(h), TERMS).map(t => t.term);
  assert.deepEqual(miss(doc(['s1', '<p>접수와 작업은 많다.</p>'])), ['작업']);
  assert.deepEqual(miss(doc(['s1', '<p>접수와 작업 (Task)은 많다.</p>'])), []);
  assert.deepEqual(miss(doc(['s1', '<p>접수</p>'], ['sref', '<p>작업(Task)</p>'])), []);
  assert.deepEqual(miss(doc(['s1', '<p>접수 <b>작업</b>(Task)</p>'])), []);
});

// ----- first-use order (the bare term must not come before its 처음 나올 때 form) -----

const ORD = parseTerms('## T — 용어\n| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |\n|---|---|---|---|\n| 접수 | 처음 기록 | 접수(VOC) | — |\n| 작업 | 일 한 건 | 작업(Task) | — |\n| 결과 확인 | 설문 | 결과 확인 | — |');
const early = (h, terms = ORD) => firstUseOrder(visibleBlocks(h), terms).map(e => [e.term, e.id]);

test('firstUseOrder: a bare term before its first-use form is reported once per term, with the section and context', () => {
  const r = firstUseOrder(visibleBlocks(doc(['s1', '<p>접수와 작업이 쌓인다. 작업 수도 센다.</p>'], ['s2', '<p>접수(VOC)와 작업(Task)을 나눠 본다.</p>'])), ORD);
  assert.deepEqual(r.map(e => [e.term, e.first, e.id]), [['접수', '접수(VOC)', 's1'], ['작업', '작업(Task)', 's1']]);
  assert.match(r[1].ctx, /^…접수와 작업이 쌓인다/);
});

test('firstUseOrder: the first-use form first means any later bare use is fine; bare-before-form in one block still counts', () => {
  assert.deepEqual(early(doc(['s1', '<p>접수(VOC)와 작업(Task)이 있다. 접수와 작업은 이어진다.</p>'], ['s2', '<p>작업이 끝나면 접수에 알린다.</p>'])), []);
  assert.deepEqual(early(doc(['s1', '<p>작업은 먼저 오고 작업(Task)은 뒤에 온다.</p>'])), [['작업', 's1']]);
  assert.deepEqual(early(doc(['s1', '<p>작업 (Task)을 연다. 작업은 이어진다.</p>'])), []); // whitespace inside the form is ignored, as in missingFirstUse
  assert.deepEqual(early(doc(['s1', '<p>결과 확인이 먼저 나온다.</p>'])), []); // a term whose first-use form is itself has no order to break
});

test('firstUseOrder: the hero thesis counts as the first occurrence', () => {
  // the form is in the hero → the hero and everything after it may use the bare term
  const heroForm = '<!DOCTYPE html><body><p>접수(VOC)가 작업(Task)으로 이어진다. 접수와 작업은 한 줄이다.</p><section id="s1"><h2>작업 흐름</h2><p>접수는 작업으로 간다.</p></section></body>';
  assert.deepEqual(early(heroForm), []);
  // the form is NOT in the hero → a bare term in the hero is out of order even though the form comes later
  const heroBare = '<!DOCTYPE html><body><p>작업이 느리다. 접수도 느리다.</p><section id="s1"><p>접수(VOC)와 작업(Task)을 본다.</p></section></body>';
  assert.deepEqual(early(heroBare), [['접수', 'hero'], ['작업', 'hero']]);
});

test('firstUseOrder: nav labels, the fixed document title and section titles are exempt; a lead is not', () => {
  const nav = '<div data-nav style="display:flex"><a href="#top">작업 운영 안내</a><a href="#s1">작업</a><a href="#s2">접수</a></div><h1>작업 운영</h1>';
  const intro = '<p>접수(VOC)와 작업(Task)을 나눠 본다.</p>';
  const html = (hero, h2, p) => `<!DOCTYPE html><body>${nav}${hero}<section id="s1"><h2>${h2}</h2><p>${p}</p></section></body>`;
  assert.deepEqual(early(html(intro, '처리 흐름', '작업은 이어진다.')), []); // nav + h1 are bare, the thesis introduces both
  assert.deepEqual(early(html('', '처리 흐름', '접수(VOC)와 작업(Task)을 만든다.')), []); // exempt blocks neither introduce nor use a term
  assert.deepEqual(early(html('', '작업 흐름', '작업(Task)을 만든다.')), []); // a heading may name the term its lead defines
  assert.deepEqual(early(html('', '처리 흐름', '작업이 먼저 나오고 작업(Task)은 뒤에 온다.')), [['작업', 's1']]); // a bare term in the lead before its form
});

test('firstUseOrder: a longer term holding the bare one, an appendix glossary and an absent form are not reported; a form only in the appendix is', () => {
  const t = parseTerms('## T — 용어\n| 용어 | 뜻 | 처음 나올 때 | 쓰지 않을 말 |\n|---|---|---|---|\n| 작업 | 일 | 작업(Task) | — |\n| 작업 요청 | 승인 전 | 작업 요청(Task Request) | — |');
  assert.deepEqual(early(doc(['s1', '<p>작업 요청(Task Request)을 올린다.</p>'], ['s2', '<p>작업(Task)이 뒤에 온다.</p>']), t), []); // 작업 요청 is not a bare 작업
  assert.deepEqual(early(doc(['s1', '<p>작업 요청(Task Request)이 먼저다. 작업이 뒤따른다.</p>'], ['s2', '<p>작업(Task)은 나중에 정의한다.</p>']), t), [['작업', 's1']]);
  assert.deepEqual(early(doc(['s1', '<p>작업(Task)을 만든다.</p>'], ['sref', '<p>작업 — 처리하는 일</p>']), t), []); // a glossary entry is not a use
  assert.deepEqual(early(doc(['s1', '<p>작업이 쌓인다.</p>']), t), []); // no form anywhere: missingFirstUse reports it, not the order check
  assert.deepEqual(early(doc(['s1', '<p>작업이 쌓인다.</p>'], ['sref', '<p>작업(Task) — 일</p>']), t), [['작업', 's1']]); // the form exists, but the body used the term first
});

// ----- sentence splitting -----

test('splitSentences: ends at . ! ? before a space or the end; decimals, versions and file names stay whole', () => {
  assert.deepEqual(splitSentences('처리량은 3.5배다. v0.2.0은 a.md를 쓴다! 맞는가? 끝'), ['처리량은 3.5배다.', 'v0.2.0은 a.md를 쓴다!', '맞는가?', '끝']);
  assert.deepEqual(splitSentences('그는 "간다." 그리고 (온다.) 뒤'), ['그는 "간다."', '그리고 (온다.)', '뒤']);
});

// ----- prose:long-sentence -----

test('prose:long-sentence: counts sentences over the limit (spaces included), reports the count and the two longest', () => {
  const s = (n) => `${filler(n)}.`;
  const w = warn(doc(['s2', `<p>${s(LONG_SENTENCE + 30)} ${s(LONG_SENTENCE + 10)} ${s(LONG_SENTENCE + 1)} ${s(LONG_SENTENCE - 1)}</p>`]), 'prose:long-sentence');
  assert.match(w.detail, /^3 of 4 sentence\(s\) over 110 characters/);
  assert.match(w.detail, /longest: s2 \(141\) "가+…" ; s2 \(121\)/);
  assert.equal(warn(doc(['s1', `<p>${s(LONG_SENTENCE - 1)} ${s(40)}</p>`]), 'prose:long-sentence'), undefined); // exactly 110 characters is fine
});

test('prose text is only sentence-like blocks of 25+ characters outside headings and the appendix', () => {
  const long = `${filler(130)}.`;
  assert.equal(warn(doc(['s1', `<h2>${long}</h2>`]), 'prose:long-sentence'), undefined); // heading
  assert.equal(warn(doc(['sref', `<p>${long}</p>`]), 'prose:long-sentence'), undefined); // appendix
  assert.equal(warn(doc(['s1', `<div>${filler(130)}</div>`]), 'prose:long-sentence'), undefined); // a label, not a sentence
  assert.equal(warn(doc(['s1', `<p>짧은 말.</p>`]), 'prose:long-sentence'), undefined);
  assert.match(warn(doc(['s1', `<div>${filler(130)}한다</div>`]), 'prose:long-sentence').detail, /^1 of 1/); // ends in 다 without a period
  assert.match(warn(`<body><p>${long}</p></body>`, 'prose:long-sentence').detail, /hero/); // hero text counts
});

// ----- prose:dot-chain -----

test('prose:dot-chain: 4+ middle dots in one sentence; three are fine; the NN · eyebrow is not prose', () => {
  const chain = '수집·정제·적재·집계·조회를 한 흐름으로 묶어 운영한다.';
  assert.match(warn(doc(['s1', `<p>${chain}</p>`]), 'prose:dot-chain').detail, /^1 sentence\(s\) with 4\+ "·".*s1 "수집·정제·적재·집계·조회를/);
  assert.equal(warn(doc(['s1', '<p>수집·정제·적재·집계를 한 흐름으로 묶어 운영한다.</p>']), 'prose:dot-chain'), undefined);
  assert.equal(warn(doc(['s1', '<p>수집·정제·적재를 맡는다. 집계·조회·알림을 맡는다.</p>']), 'prose:dot-chain'), undefined); // per sentence
  assert.equal(warn(doc(['s1', '<div>01 · 요약 · 문제 · 결정 · 일정</div>']), 'prose:dot-chain'), undefined);
});

// ----- prose:dash -----

test('prose:dash: more than one — in a sentence, or more than 3 in a section lead', () => {
  const two = warn(doc(['s1', '<p>요청은 하나다 — 작은 단계다 — 되돌리기 쉽다.</p>']), 'prose:dash');
  assert.match(two.detail, /^1 sentence\(s\) with more than one "—", 0 section lead\(s\)/);
  assert.equal(warn(doc(['s1', '<p>요청은 하나다 — 작은 단계다.</p>']), 'prose:dash'), undefined);
  const lead = (n) => `<h2>제목 — 부제</h2><p>${Array.from({ length: n }, (_, i) => `${i + 1}번째 문장은 이렇게 끝난다 — 여기까지다.`).join(' ')}</p><p>${'본문 문장은 이렇게 쓴다 — 하나다.'}</p>`;
  assert.match(warn(doc(['s1', lead(4)]), 'prose:dash').detail, /^0 sentence\(s\) with more than one "—", 1 section lead\(s\) with more than 3: s1 lead/);
  assert.equal(warn(doc(['s1', lead(3)]), 'prose:dash'), undefined); // 3 dashes in the lead is the limit
});

// ----- prose:translationese -----

test('prose:translationese: singletons fire on one hit; 에 대한 / 를 통해 only from 3 in one section', () => {
  const one = (text) => warn(doc(['s1', `<p>${text}</p>`]), 'prose:translationese');
  for (const bad of ['이 구조는 비용을 줄이는 것이다.', '효과가 큰 것으로 보인다.', '이 값은 자동으로 계산되어진다.', '이 경우에 있어서 지연이 생긴다.', '계획함에 있어 위험을 본다.', '이 화면에서 보여지는 값이다.'])
    assert.ok(one(`문장 앞부분을 길게 채운 뒤에 ${bad}`), bad);
  assert.equal(one('문장 앞부분을 길게 채운 뒤에 사용자가 직접 판단할 것이다.'), undefined); // 할 것이다 is not the pattern
  assert.equal(one('문장 앞부분을 길게 채운 뒤에 삭제가 된다. 아니다.'), undefined);
  const three = '권한에 대한 설명과 보안에 대한 설명과 비용에 대한 설명을 적는다.';
  assert.match(one(three).detail, /^3 hit\(s\): ~에 대한 ×3 — write the verb directly; e\.g\. s1 …/);
  assert.equal(one('권한에 대한 설명과 보안에 대한 설명을 적는다. 이것은 문장이다.'), undefined);
  assert.match(one('로그를 통해 확인하고 검사를 통해 막고 설정을 통해서 바꾼다.').detail, /~를 통해 ×3/);
});

test('prose:translationese: the 3-per-section rule counts one section at a time', () => {
  const two = '권한에 대한 설명과 보안에 대한 설명을 적는 것은 두 곳이다.';
  assert.equal(warn(doc(['s1', `<p>${two}</p>`], ['s2', `<p>${two}</p>`]), 'prose:translationese'), undefined); // 2 + 2 across sections
  const w = warn(doc(['s1', `<p>${two}</p><p>${two}</p>`], ['s2', `<p>${two}</p>`]), 'prose:translationese');
  assert.match(w.detail, /^4 hit\(s\): ~에 대한 ×4/);
  assert.match(w.detail, /s1 /);
  assert.doesNotMatch(w.detail, /s2 /);
});

// ----- prose:register -----

test('prose:register: polite endings in body text; plain ~다 and 아니다 are fine', () => {
  const w = warn(doc(['s1', '<p>이 문서는 시범을 제안합니다. 비용은 없습니다. 결과는 보고해요.</p>']), 'prose:register');
  assert.match(w.detail, /^3 polite ending\(s\)/);
  assert.match(w.detail, /s1 …/);
  for (const ok of ['이 문서는 시범을 제안한다. 비용은 없다. 이것은 설명이 아니다.', '그렇게 하니까 빨라진다. 이 값이 맞는지 확인한다.'])
    assert.equal(warn(doc(['s1', `<p>${ok}</p>`]), 'prose:register'), undefined, ok);
  assert.ok(warn(doc(['s1', '<p>승인하시면 이 시범을 바로 시작하는 쪽으로 진행합니까?</p>']), 'prose:register')); // 합니까 is polite too
});

test('a clean Korean document produces no prose warnings', () => {
  const html = doc(['s1', '<h2>요약 — 한 줄 설명</h2><p>요청은 하나다. 준비 2주만 승인을 구한다. 시범 동안 기존 접수는 그대로 둔다.</p><div>짧은 라벨</div>'],
    ['sref', '<p>부록은 검사하지 않는다 — 합니다 — 습니다.</p>']);
  assert.deepEqual(proseWarnings(visibleBlocks(html)), []);
});

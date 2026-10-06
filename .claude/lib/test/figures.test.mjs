import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartProportions, zoneColors, zoneRoles, leadCounts, countWords, figureChecks, textOf } from '../figures.mjs';
import { runGate } from '../gate.mjs';
import { loadTokens } from '../components.mjs';

const INDIGO = loadTokens('indigo-serif').colors;
const LIGHT = loadTokens('feedbackops-light').colors;
const indigoRoles = zoneRoles(INDIGO);
const lightRoles = zoneRoles(LIGHT);

// ---------- builders: the smallest markup the checks read ----------
const wrap = (id, inner) => `<div data-component="${id}" style="overflow-wrap:anywhere;">${inner}</div>`;
const bar = (h, v, label = v) => `<div style="flex:1 0 32px;"><div style="position:relative; width:100%; height:${h}%; background:#4338CA;" data-value="${v}"><span>${label}</span></div></div>`;
const hrow = (w, v, label) => `<div style="display:grid;" data-value="${v}"><span>항목</span><div style="height:18px;"><div style="width:${w}%; height:100%;"></div></div><span>${label}</span></div>`;
const seg = (w, v, label = '') => `<div style="width:${w}%; background:#4338CA;" data-value="${v}">${label}</div>`;
const srow = (w, v, text = `${v}%`) => `<div style="display:grid;" data-value="${v}"><div>작업</div><div style="flex:1; height:8px;"><div style="width:${w}%; height:100%;"></div></div><span>${text}</span></div>`;
const chart = (id, ...parts) => wrap(id, parts.join(''));
const viol = (html) => chartProportions(html).violations;

// ---------- chart-proportions ----------

test('chart-proportions: bars drawn at value ÷ max × 100 pass; a bar off by more than 2 points fails and says what it expected', () => {
  assert.deepEqual(viol(chart('bar-chart', bar(100, 100), bar(70, 70), bar(50, 50))), []);
  assert.deepEqual(viol(chart('bar-chart', bar(100, 120), bar(75, 90))), []); // max 120 → 90 is 75%
  const bad = viol(chart('bar-chart', bar(100, 100), bar(50, 70)));
  assert.equal(bad.length, 1);
  assert.match(bad[0], /^bar-chart#1 bar 2 "70": height 50% but 70 of max 100 \(drawn at 100%\) is 70%/);
  assert.deepEqual(viol(chart('bar-chart', bar(100, 100), bar(71.5, 70))), []); // ±2 absorbs rounding
});

test('chart-proportions probe: the max is per chart (two charts side by side with different scales) and numbering follows the document', () => {
  const two = chart('bar-chart', bar(100, 100), bar(50, 50)) + chart('bar-chart', bar(100, 8), bar(50, 4));
  assert.deepEqual(viol(two), []);
  const bad = viol(chart('bar-chart', bar(100, 100)) + chart('bar-chart', bar(100, 8), bar(80, 4)));
  assert.match(bad[0], /^bar-chart#2 bar 2 /);
});

test('chart-proportions: one scale per chart, read off the largest bar — percent bars on an absolute 0–100 axis pass, a bar off the proportion fails', () => {
  assert.deepEqual(viol(chart('bar-chart', bar(80, 80, '80%'), bar(60, 60, '60%'), bar(45, 45, '45%'))), []); // the largest is 80, drawn at 80 (k = 1)
  assert.deepEqual(viol(chart('bar-chart', bar(40, 80), bar(30, 60), bar(22.5, 45))), []); // any one scale, k = 0.5
  const off = viol(chart('bar-chart', bar(80, 80), bar(60, 60), bar(30, 45)));
  assert.equal(off.length, 1);
  assert.match(off[0], /^bar-chart#1 bar 3 "45": height 30% but 45 of max 80 \(drawn at 80%\) is 45%/);
  const over = viol(chart('bar-chart', bar(150, 100), bar(75, 50))); // proportional, but the largest bar runs out of the plot
  assert.equal(over.length, 1);
  assert.match(over[0], /^bar-chart#1 bar 1 "100": height 150% runs out of the plot/);
  assert.deepEqual(viol(chart('bar-chart', bar(102, 100), bar(51, 50))), []); // 102 is rounding, not overflow
});

test('chart-proportions: hbar rows that are not percentages share one proportional scale — progress to a target (70/100건 drawn at 70%) passes, one off the proportion fails', () => {
  assert.deepEqual(viol(chart('hbar-chart', hrow(70, 70, '70/100건'))), []);
  assert.deepEqual(viol(chart('hbar-chart', hrow(70, 70, '70/100건'), hrow(45, 45, '45/100건'), hrow(20, 20, '20/100건'))), []);
  assert.deepEqual(viol(chart('hbar-chart', hrow(100, 142, '142건'), hrow(50, 71, '71건'))), []); // scaled to the largest still passes
  const off = viol(chart('hbar-chart', hrow(70, 70, '70/100건'), hrow(60, 45, '45/100건')));
  assert.equal(off.length, 1);
  assert.match(off[0], /^hbar-chart#1 row 2 "항목 45\/100건": width 60% but 45 of max 70 \(drawn at 70%\) is 45%/);
  assert.match(viol(chart('status-board', srow(150, 100, '100건'), srow(75, 50, '50건')))[0], /row 1 .*width 150% runs out of the track/);
});

test('chart-proportions: a chart that marks some bars and not others is reported as partly checked, naming how many; a fully marked chart and the template\'s own column wrappers are not', () => {
  const column = (inner) => `<div style="flex:1 0 32px; height:100%; display:flex;">${inner}</div>`; // the template wraps every bar in a full-height column
  const loose = '<div style="flex:1 0 32px;"><div style="position:relative; width:100%; height:40%; background:#4338CA;"><span>40</span></div></div>';
  const partly = chartProportions(chart('bar-chart', column(bar(100, 100)), column(bar(70, 70)), loose));
  assert.deepEqual(partly.partial, ['bar-chart#1 has 1 height:N% bar(s) with no data-value next to 2 marked']);
  assert.deepEqual(partly.violations, []);
  assert.deepEqual(chartProportions(chart('bar-chart', column(bar(100, 100)), column(bar(70, 70)))).partial, []);
  assert.deepEqual(chartProportions(chart('hbar-chart', hrow(90, 90, '90%'), '<div><div style="height:18px;"><div style="width:60%; height:100%;"></div></div></div>')).partial,
    ['hbar-chart#1 has 1 width:N% bar(s) with no data-value next to 1 marked']); // the fill of an unmarked row; the fill inside a marked row is not counted
  assert.deepEqual(chartProportions(chart('stacked-bar', seg(60, 60, '60%'), seg(40, 40, '40%'))).partial, []);
  const noted = figureChecks(chart('bar-chart', bar(100, 100), loose)).notes;
  assert.equal(noted.length, 1);
  assert.match(noted[0].detail, /^partly checked — 1 chart\(s\) draw a bar the gate cannot read \(bar-chart#1 has 1 height:N% bar\(s\) with no data-value next to 1 marked\)/);
  assert.equal(figureChecks(chart('bar-chart', bar(100, 100), bar(70, 70))).notes.length, 0);
});

test('chart-proportions: a full-width ％ is a percent sign, and numeric character entities (&#55; &#x37;) read as the character they name', () => {
  assert.match(viol(chart('hbar-chart', hrow(70, 90, '90％')))[0], /width 70% but the label shows 90%/); // 90％ is a percentage row, drawn at 90
  assert.deepEqual(viol(chart('hbar-chart', hrow(90, 90, '90％'), hrow(70, '70％', '70％'))), []);
  assert.equal(viol(chart('hbar-chart', hrow(60, '70％', '70％'))).length, 1); // a data-value of "70％" is 70 (valueOf drops the full-width sign): a bar drawn at 60 fails; if the sign were kept it would be skipped as non-numeric
  assert.deepEqual(viol(chart('bar-chart', bar(100, 100), bar(70, 70, '&#55;0'), bar(50, 50, '&#x35;0'))), []); // "70" and "50", not " 0"
  assert.equal(textOf('a&#55;b &#x37; &#0; &#xD800; &#1114112; &foo; &amp; &nbsp;c'), 'a7b 7 & c');
});

test('chart-proportions: a bar whose label shows another number than its data-value fails even when the height matches the data-value', () => {
  const bad = viol(chart('bar-chart', bar(100, 100), bar(70, 70, 90)));
  assert.match(bad[0], /bar 2 "90": data-value 70 is not a number it shows \(90\)/);
  assert.deepEqual(viol(chart('bar-chart', bar(100, 1200, '1,200건'), bar(50, 600, '600건'))), []); // comma and unit
  assert.deepEqual(viol(chart('bar-chart', bar(100, 33.3, '33%'), bar(50, 16.7, '17%'))), []); // a label rounded to the integer
});

test('chart-proportions probe: hbar rows read as percentages when the label carries %, as counts scaled to the largest otherwise', () => {
  assert.deepEqual(viol(chart('hbar-chart', hrow(90, 90, '90%'), hrow(70, 70, '70%'))), []);
  assert.deepEqual(viol(chart('hbar-chart', hrow(100, 142, '142건'), hrow(50, 71, '71건'))), []);
  assert.deepEqual(viol(chart('hbar-chart', hrow(100, 142, '142건'), hrow(50, 71, '71건 (50%)'))), []); // a % in the label that is not the value
  assert.match(viol(chart('hbar-chart', hrow(100, 142, '142건'), hrow(100, 71, '71건')))[0], /row 2 "항목 71건": width 100% but 71 of max 142 \(drawn at 100%\) is 50%/);
  assert.match(viol(chart('hbar-chart', hrow(70, 90, '90%')))[0], /width 70% but the label shows 90%/);
});

test('chart-proportions probe: stacked-bar segments — rounding (33.3 vs 33), a 0% segment and a textless segment pass; a wrong segment or a total off 100 fails', () => {
  assert.deepEqual(viol(chart('stacked-bar', seg(33.3, 33, '33%'), seg(33.3, 33, '33%'), seg(33.4, 34, '34%'))), []);
  assert.deepEqual(viol(chart('stacked-bar', seg(60, 60, '60%'), seg(40, 40), seg(0, 0, '0%'))), []);
  assert.match(viol(chart('stacked-bar', seg(60, 60, '60%'), seg(30, 40, '40%')))[0], /segment 2 "40%": width 30% but data-value 40/);
  const sum = viol(chart('stacked-bar', seg(40, 40, '40%'), seg(30, 30, '30%')));
  assert.equal(sum.length, 1);
  assert.match(sum[0], /^stacked-bar#1: the marked segments add up to 70%, not 100%/);
});

test('chart-proportions probe: the 대기 row has no bar and no marker, a non-numeric data-value is skipped, an unmarked chart is silent and counted', () => {
  const waiting = '<div style="display:grid;"><div>작업 E</div><span>대기</span><span>—</span></div>';
  assert.deepEqual(viol(chart('status-board', srow(35, 35), srow(100, 100), waiting)), []);
  assert.deepEqual(viol(chart('status-board', srow(35, 35), `<div data-value="—"><span>—</span></div>`, `<div data-value="⟦35⟧"></div>`)), []);
  const none = chartProportions(chart('bar-chart', '<div style="height:50%;"><span>70</span></div>') + chart('hbar-chart', '<div><div style="width:10%;"></div></div>'));
  assert.deepEqual(none.violations, []);
  assert.equal(none.charts, 0);
  assert.deepEqual(none.unmarked, ['bar-chart', 'hbar-chart']);
  assert.match(viol(chart('status-board', srow(50, 35)))[0], /row 1 .*width 50% but the label shows 35%/);
});

test('chart-proportions: a zero scale is not a proportion — a largest value drawn at ~0%, or a chart whose values are all 0 with a bar drawn, fails', () => {
  const zero = viol(chart('bar-chart', bar(0, 100), bar(0, 70))); // every bar drawn at 0 used to be "proportional" (k = 0, want 0)
  assert.equal(zero.length, 1);
  assert.match(zero[0], /^bar-chart#1 bar 1 "100": the largest value 100 is drawn at 0%/);
  assert.match(viol(chart('bar-chart', bar(0, 70)))[0], /bar 1 "70": the largest value 70 is drawn at 0%/); // one bar, drawn at nothing
  assert.match(viol(chart('hbar-chart', hrow(0, 70, '70건')))[0], /row 1 "항목 70건": the largest value 70 is drawn at 0%/);
  assert.match(viol(chart('status-board', srow(0, 70, '70건'), srow(0, 35, '35건')))[0], /the largest value 70 is drawn at 0%/);
  assert.match(viol(chart('bar-chart', bar(1, 100), bar(1, 70), bar(1, 50)))[0], /the largest value 100 is drawn at 1%/); // ±2 at k ≈ 0 says nothing
  assert.match(viol(chart('bar-chart', bar(80, 0), bar(0, 0)))[0], /bar 1 "0": height 80% but 0 of max 0 \(drawn at 80%\) is 0%/); // all values 0: the "largest" is one of them and is checked too
  assert.equal(viol(chart('bar-chart', bar(0, 0), bar(80, 0))).length, 1); // wherever the drawn one sits
  // controls: a value of 0 drawn at 0 beside a drawn largest, and a chart that is only 0s drawn at nothing, pass
  assert.deepEqual(viol(chart('bar-chart', bar(100, 100), bar(0, 0))), []);
  assert.deepEqual(viol(chart('bar-chart', bar(0, 0), bar(0, 0))), []);
  assert.deepEqual(viol(chart('hbar-chart', hrow(0, 0, '0건'))), []);
  assert.deepEqual(viol(chart('bar-chart', bar(10, 100), bar(7, 70))), []); // a small scale that is still drawn (k = 0.1) is fine
});

test('chart-proportions: a percent row (label `N%`) that is drawn past the track fails like a proportional one — the largest must not run past 102%', () => {
  assert.match(viol(chart('status-board', srow(120, 120, '120%')))[0], /^status-board#1 row 1 "작업 120%": width 120% runs out of the track/);
  assert.match(viol(chart('hbar-chart', hrow(130, 130, '130％'), hrow(60, 60, '60%')))[0], /row 1 .*width 130% runs out of the track/);
  assert.deepEqual(viol(chart('hbar-chart', hrow(100, 100, '100%'), hrow(102, 102, '102%'))), []); // rounding of the largest, as for a proportional row
  assert.deepEqual(viol(chart('status-board', srow(100, 100), srow(35, 35))), []);
  assert.match(viol(chart('hbar-chart', hrow(120, 100, '100%')))[0], /width 120% but the label shows 100%/); // the existing mismatch message still wins over a second one
  assert.equal(viol(chart('hbar-chart', hrow(120, 100, '100%'))).length, 1);
});

test('chart-proportions: a bar-chart, hbar-chart or stacked-bar drawn in px with no data-value is noted as unmarked — only a status-board with no bar at all is exempt', () => {
  for (const id of ['bar-chart', 'hbar-chart', 'stacked-bar'])
    assert.deepEqual(chartProportions(chart(id, '<div style="height:50px; width:30px;">70</div>')).unmarked, [id], id); // nothing marked, nothing it can read: say so
  assert.deepEqual(chartProportions(chart('status-board', '<div style="display:flex;"><div>작업 F</div><span>다음 행동</span></div>')).unmarked, []);
  assert.equal(figureChecks(chart('bar-chart', '<div style="height:50px;">70</div>')).notes.length, 1);
});

test('chart-proportions: a status-board without its progress column draws no bar, so it has nothing to mark — not unmarked, no NOTE; the same board with a bar and no data-value still is', () => {
  const plain = '<div style="display:flex;"><div>작업 F</div><div style="flex:0 0 88px;"><span>정상</span></div><span>다음 행동</span></div>';
  const noProgress = chartProportions(chart('status-board', plain, plain));
  assert.deepEqual(noProgress, { charts: 0, values: 0, unmarked: [], partial: [], violations: [] });
  const gate = runGate(page(chart('status-board', plain, plain) + '<p>plain</p>'), opts);
  assert.equal(gate.ok, true, JSON.stringify(gate.checks.filter(c => !c.ok)));
  assert.equal(gate.notes.filter(n => n.name === 'chart-proportions').length, 0); // the "carries no data-value" NOTE does not fire
  assert.equal(row(gate, 'chart-proportions'), undefined);
  const withBar = '<div style="display:flex;"><div>작업</div><div style="flex:1; height:8px;"><div style="width:35%; height:100%;"></div></div><span>35%</span></div>';
  assert.deepEqual(chartProportions(chart('status-board', withBar)).unmarked, ['status-board']); // a bar the gate cannot read is still said out loud
  assert.deepEqual(chartProportions(chart('status-board', plain, srow(35, 35))).violations, []); // a board with progress marks every row that has a bar
});

test('chart-proportions: a marked element with no height/width to compare fails (a misplaced marker); markup in HTML comments and scripts is not read', () => {
  assert.match(viol(chart('bar-chart', '<div data-value="70"><span>70</span></div>'))[0], /data-value 70 but no height:N% on the bar/);
  assert.match(viol(chart('hbar-chart', '<div data-value="70"><span>70%</span></div>'))[0], /no width:N% inside the row/);
  const hidden = chart('bar-chart', bar(100, 100), `<!-- ${bar(10, 90)} -->`, `<script>const t = '${bar(10, 90)}';</script>`);
  assert.deepEqual(viol(hidden), []);
  assert.equal(chartProportions(hidden).values, 1);
});

test('chart-proportions: data-value outside a chart component is nobody\'s business', () => {
  assert.deepEqual(chartProportions('<div data-component="kpi-row"><div data-value="5" style="height:1%;">9</div></div><p data-value="3">x</p>'), { charts: 0, values: 0, unmarked: [], partial: [], violations: [] });
});

// ---------- zone-colors ----------

const ACCENT = INDIGO.accent;
const zone = (kind, inner) => `<div data-zone="${kind}" style="display:flex;">${inner}</div>`;
const cell = (bg, extra = '') => `<div style="background:${bg}; ${extra}">x</div>`;
const asIs = (inner) => `<div data-component="before-after">${zone('as-is', inner)}</div>`;
const toBe = (inner) => `<div data-component="before-after">${zone('to-be', inner)}</div>`;
const zc = (html, roles = indigoRoles, accent = ACCENT) => zoneColors(html, { accent, roles });

test('zone-colors: the accent inside an AS-IS zone fails, wherever it is set (text, border, fill) and however it is spelled', () => {
  assert.deepEqual(zc(asIs(cell(INDIGO.white) + cell(INDIGO['warn-bg']) + cell(INDIGO.slate))).violations, []);
  for (const inside of [`<b style="color:${ACCENT};">z</b>`, `<i style="border:1px solid ${ACCENT.toLowerCase()};"></i>`, cell(ACCENT), `<svg><rect fill="${ACCENT}"/></svg>`]) {
    const v = zc(asIs(`<p>근거 수집</p>${inside}`)).violations;
    assert.equal(v.length, 1, inside);
    assert.match(v[0], /^before-after#1 as-is zone uses the accent #4338CA ×1 .*the accent and its tints mean target/);
  }
  const shorthand = zoneColors(asIs('<b style="color:#ABC;">z</b>'), { accent: '#aabbcc', roles: indigoRoles });
  assert.equal(shorthand.violations.length, 1); // #abc = #AABBCC
});

test('zone-colors: an AS-IS zone fails on any accent-family token (accent-050, accent-soft …), not only the accent itself — in every style, with the token named', () => {
  for (const [colors, roles] of [[INDIGO, indigoRoles], [LIGHT, lightRoles]])
    for (const token of Object.keys(colors).filter(k => k === 'accent' || k.startsWith('accent-'))) {
      const v = zoneColors(asIs(cell(colors[token])), { accent: colors.accent, roles }).violations;
      assert.equal(v.length, 1, `${colors.accent} ${token}`);
      assert.match(v[0], token === 'accent' ? /uses the accent #[0-9A-F]{6} ×1/ : new RegExp(`uses the accent-family color #[0-9A-F]{6} \\(${token}\\) ×1`));
    }
  assert.match(zc(asIs(cell('#EEF0FF'))).violations[0], /^before-after#1 as-is zone uses the accent-family color #EEF0FF \(accent-050\) ×1/);
  assert.deepEqual(zc(asIs(cell(INDIGO.white) + cell(INDIGO['warn-bg']) + cell(INDIGO['mono-tint']) + cell(INDIGO['slate-bar']))).violations, []); // the problem family is what an AS-IS zone is made of
  assert.deepEqual(zoneColors(asIs(cell(INDIGO['accent-050'])), { accent: ACCENT }).violations, []); // without the style's roles only the accent itself is known
});

test('zone-colors probe: a near-miss color, the accent in a comment or a script, and the accent outside the zone do not fail the AS-IS zone', () => {
  const html = `<div data-component="before-after">${zone('as-is', `<b style="color:#4338CB;">a</b><!-- ${ACCENT} --><script>x = "${ACCENT}"</script>`)}<i style="color:${ACCENT};">→</i>${zone('to-be', cell(ACCENT))}</div>`;
  assert.deepEqual(zc(html).violations, []);
});

test('zone-colors: a TO-BE zone passes with one slate/warn chip among accent fills and fails when warn/slate fills outnumber the accent family', () => {
  assert.deepEqual(zc(toBe(cell(ACCENT) + cell(INDIGO['accent-050']) + cell(INDIGO['accent-050']) + cell(INDIGO.slate))).violations, []);
  assert.deepEqual(zc(toBe(cell(ACCENT) + cell(INDIGO.white))).violations, []);
  assert.deepEqual(zc(toBe(cell(INDIGO.white))).violations, []); // nothing colored is not a problem
  const v = zc(toBe(cell(ACCENT) + cell(INDIGO.slate) + cell(INDIGO['warn-bg']) + cell(INDIGO['slate-bar']))).violations;
  assert.equal(v.length, 1);
  assert.match(v[0], /^before-after#1 to-be zone has 3 warn\/slate fill\(s\) against 1 accent-family fill\(s\)/);
  assert.equal(zc(toBe(cell(INDIGO['warn-bg']))).violations.length, 1); // a lone warn fill outnumbers zero
});

test('zone-colors: only fills count in a TO-BE zone — borders and text in a problem color are fine (feedbackops-light reuses slate-bar as border-node)', () => {
  assert.equal(LIGHT['slate-bar'], LIGHT['border-node']); // the collision this rule exists for
  const bordered = Array.from({ length: 6 }, () => `<div style="border:1px solid ${LIGHT['border-node']}; color:${LIGHT.warn}; background:${LIGHT.white};">x</div>`).join('');
  assert.deepEqual(zoneColors(toBe(cell(LIGHT.accent) + bordered), { accent: LIGHT.accent, roles: lightRoles }).violations, []);
  const filled = zoneColors(toBe(cell(LIGHT.accent) + cell(LIGHT['slate-bar']) + cell(LIGHT['slate-bar'])), { accent: LIGHT.accent, roles: lightRoles }).violations;
  assert.equal(filled.length, 1);
});

test('zone-colors: an element drawn at 2px or less is a rule, not a fill — hairline dividers in a TO-BE zone are not problem fills, a 3px one is', () => {
  for (const colors of [INDIGO, LIGHT]) {
    const roles = zoneRoles(colors), hair = colors.hairline;
    assert.ok(roles.problem.has(hair.toUpperCase()), 'the hairline literal is a problem-family literal in this style (slate-bar)');
    const rules = [`height:1px; background:${hair};`, `width:1px; background:${hair};`, `height:2px; background:${hair};`, `width:1.5px; height:40px; background:${hair};`].map(css => `<div style="${css}"></div>`).join('');
    assert.deepEqual(zoneColors(toBe(cell(colors.accent) + rules), { accent: colors.accent, roles }).violations, [], colors.accent);
    assert.equal(zoneColors(toBe(cell(colors.accent) + `<div style="height:3px; background:${hair};"></div>`.repeat(2)), { accent: colors.accent, roles }).violations.length, 1, colors.accent); // 3px is a bar
    assert.equal(zoneColors(toBe(cell(colors.accent) + `<div style="height:8px; background:${hair};"></div>`.repeat(2)), { accent: colors.accent, roles }).violations.length, 1, colors.accent);
  }
});

test('zoneRoles: accent family = every accent* token; problem family = warn and slate tokens minus anything the accent family shares', () => {
  assert.ok(indigoRoles.accentFamily.has('#4338CA') && indigoRoles.accentFamily.has('#EEF0FF') && indigoRoles.accentFamily.has('#312E81'));
  assert.ok(indigoRoles.problem.has('#B4543F') && indigoRoles.problem.has('#94A0B4') && indigoRoles.problem.has('#F1F3F7'));
  assert.equal(indigoRoles.accent, '#4338CA');
  const shared = zoneRoles({ accent: '#111111', 'accent-050': '#222222', warn: '#222222', slate: '#333333' });
  assert.deepEqual([...shared.problem], ['#333333']);
});

test('zone-colors: an unknown data-zone value is reported; without the style\'s roles only the to-be half is skipped; unmarked figures are counted', () => {
  assert.match(zc(`<div data-component="gantt">${zone('as_is', '')}</div>`).violations[0], /^gantt#1: data-zone="as_is" is neither "as-is" nor "to-be"/);
  const noRoles = zoneColors(asIs(cell(ACCENT)) + toBe(cell(INDIGO.slate)), { accent: ACCENT });
  assert.equal(noRoles.violations.length, 1);
  assert.equal(noRoles.toBeSkipped, 1);
  // a before-after without markers is always unmarked; a gantt or layer-map only when it paints a legacy (problem-family) fill
  const plainGantt = `<div data-component="gantt">${cell(ACCENT)}</div>`;
  const legacyGantt = `<div data-component="gantt">${cell(INDIGO['slate-bar'])}</div>`;
  const legacyLayer = `<div data-component="layer-map">${cell(INDIGO['mono-tint'])}</div>`;
  assert.deepEqual(zc('<div data-component="before-after"></div>' + plainGantt).unmarked, ['before-after']);
  assert.deepEqual(zc(legacyGantt + legacyLayer).unmarked, ['gantt', 'layer-map']);
  assert.deepEqual(zoneColors(plainGantt, { accent: ACCENT }).unmarked, ['gantt']); // no roles → cannot tell, say so
  assert.deepEqual(zc(`<div data-component="gantt">${zone('as-is', cell(INDIGO['slate-bar']))}</div>`).unmarked, []);
});

// ---------- lead-count ----------

test('countWords: native numerals and digits count only with a counting unit; 1, 10+ and the subset of "N개 중 M개" never count', () => {
  const n = (t) => countWords(t).map(w => w.n);
  assert.deepEqual(n('후속 경로를 다섯 갈래 중 하나로 결정한다.'), [5]);
  assert.deepEqual(n('절차는 7단계다. 이를 다섯 구간으로 묶는다.'), [7, 5]);
  assert.deepEqual(n('세 가지 상태와 네 곳, 두 개, 여섯 층, 8축, 3종'), [3, 4, 2, 6, 8, 3]);
  assert.deepEqual(n('한 곳에서 하나로 모으고 1단계에서 1개를 쓴다.'), []); // the number 1 is an idiom, not a count
  assert.deepEqual(n('두 시스템은 2주 안에 6개월 뒤 개선하고 개발한다.'), []); // no unit / 개월 / 개선 / 개발
  assert.deepEqual(n('위반 16종과 10단계 판정, 열 가지'), []); // no marked figure holds ten
  assert.deepEqual(n('카드 6개 중 3개는 이미 있고, 그중 2개는 새것이다.'), [6]);
  assert.deepEqual(n('그룹당 하나씩 모두 7개다. 7개를 쓰고 7개의 모듈'), [7, 7, 7]); // 개 + a particle is a counter
  assert.deepEqual(n('상세 단계, 자세 곳'), []); // 세 inside a longer word
});

const item = '<div style="x" data-item>c</div>';
const sec = (id, lead, figure) => `<section id="${id}"><h2>제목</h2><p>${lead}</p>${figure}</section>`;
const cards = (k) => wrap('card-grid', item.repeat(k));
const lc = (html) => leadCounts(html);

test('lead-count: a lead whose count equals the figure\'s data-item count is silent; a disagreeing lead warns once, naming both', () => {
  const lead = '핵심 원칙은 세 가지이고 모두 지킨다. 하나라도 어기면 안 된다.';
  assert.deepEqual(lc(sec('s1', lead, cards(3))).warnings, []);
  const bad = lc(sec('s1', lead, cards(4)));
  assert.equal(bad.warnings.length, 1);
  assert.match(bad.warnings[0], /^s1 lead counts "세 가지" but its card-grid marks 4 item\(s\)/);
  assert.deepEqual(bad.checked, [{ id: 's1', component: 'card-grid', items: 4, words: [{ text: '세 가지', n: 3 }] }]);
});

test('lead-count probe: any count in the lead may match (7단계 … 다섯 구간 against 5 steps); a lead that states no count, 1, 개월 or a ratio is not judged', () => {
  const steps = wrap('process-row', item.repeat(5));
  assert.deepEqual(lc(sec('s6', '정해진 절차는 7단계다. 아래 그림은 이를 다섯 구간으로 묶어 보여 준다.', steps)).warnings, []);
  for (const lead of ['한 곳에서 모두 보이고 하나로 이어진다. 6개월 뒤에 다시 본다.', '이 문서는 설명만 하고 숫자를 세지 않는다 아무 것도.', '카드 5개 중 2개는 이미 구현되어 있다.'])
    assert.deepEqual(lc(sec('s2', lead, cards(5))).warnings, [], lead);
  assert.equal(lc(sec('s2', '이 문서는 설명만 하고 숫자를 세지 않는다 아무 것도.', cards(5))).checked[0].words.length, 0);
});

test('lead-count: the lead is the first <p> of 25+ characters of an sN section; the figure is the first one carrying data-item; unmarked or unnumbered figures are skipped', () => {
  const callout = wrap('callout', '<p>짧은 글</p>');
  const html = [
    `<section id="s1"><p>짧다.</p><p>원칙은 두 가지다 그리고 다른 말이 길게 이어진다.</p>${callout}${cards(3)}</section>`, // lead = the second <p>; the marker-less callout is not the figure
    sec('sref', '표기는 네 가지다 라고 쓰여 있으나 부록이다.', cards(2)),
    sec('g1', '갤러리는 다섯 가지를 보여 주지만 번호 없는 영역이다.', cards(2)),
    `<section id="s9"><p>원칙은 여섯 가지다 그러나 그림이 표지를 갖지 않는다.</p>${wrap('card-grid', '<div>x</div>')}</section>`,
  ].join('');
  const r = lc(html);
  assert.deepEqual(r.checked.map(c => [c.id, c.items]), [['s1', 3]]);
  assert.match(r.warnings[0], /^s1 lead counts "두 가지" but its card-grid marks 3 item/);
  assert.deepEqual(r.unmarked, ['card-grid']);
});

// ---------- the gate rows ----------

const page = (body) => `<!DOCTYPE html><html><head><style>body { word-break: keep-all; }</style></head><body><i style="color:${ACCENT}"></i>${body}</body></html>`;
const opts = { accentHex: ACCENT, sidecarPresent: true, zoneRoles: indigoRoles };
const row = (r, name) => r.checks.find(c => c.name === name);

test('gate: a document without markers gets no chart-proportions / zone-colors row, only NOTEs, and passes unchanged', () => {
  const html = page(chart('bar-chart', '<div style="height:50%;"><span>70</span></div>') + '<div data-component="before-after">x</div>' + sec('s1', '원칙은 세 가지다 그리고 그림이 있다.', wrap('card-grid', '<div>x</div>')));
  const r = runGate(html, opts);
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter(c => !c.ok)));
  assert.equal(row(r, 'chart-proportions'), undefined);
  assert.equal(row(r, 'zone-colors'), undefined);
  const noted = r.notes.map(n => n.name);
  assert.deepEqual(noted, ['chart-proportions', 'zone-colors', 'figures:lead-count']);
  assert.match(r.notes[0].detail, /^not checked — 1 chart\(s\) carry no data-value \(bar-chart\)/);
  assert.match(r.notes[2].detail, /1 figure\(s\) carry no data-item \(card-grid\)/);
  assert.equal(runGate(page('<p>plain</p>'), opts).notes.length, 0); // nothing that could carry a marker → nothing to say
});

test('gate: chart-proportions and zone-colors are hard checks — a wrong bar or the accent in an AS-IS zone makes ok false; the passing rows say what was checked', () => {
  const good = page(chart('bar-chart', bar(100, 100), bar(70, 70)) + asIs(cell(INDIGO.white)) + toBe(cell(ACCENT)));
  const ok = runGate(good, opts);
  assert.equal(ok.ok, true, JSON.stringify(ok.checks.filter(c => !c.ok)));
  assert.equal(row(ok, 'chart-proportions').detail, '1 chart(s), 2 value(s) drawn at the size they show');
  assert.equal(row(ok, 'zone-colors').detail, '2 zone(s) checked');
  const bad = runGate(page(chart('bar-chart', bar(100, 100), bar(40, 70)) + asIs(cell(ACCENT))), opts);
  assert.equal(bad.ok, false);
  assert.equal(row(bad, 'chart-proportions').ok, false);
  assert.equal(row(bad, 'zone-colors').ok, false);
  assert.match(row(bad, 'chart-proportions').detail, /height 40% but 70 of max 100 \(drawn at 100%\) is 70%/);
});

test('gate: with only --accent (no style roles) the AS-IS half still runs and a NOTE says the TO-BE half did not; lead-count is a warning row, never a failure', () => {
  const r = runGate(page(asIs(cell(INDIGO.white)) + toBe(cell(INDIGO.slate)) + sec('s1', '핵심 원칙은 세 가지이고 모두 지킨다. 하나라도 어기면 안 된다.', cards(4))), { accentHex: ACCENT, sidecarPresent: true });
  assert.equal(r.ok, true);
  assert.equal(row(r, 'zone-colors').detail, '1 zone(s) checked');
  assert.match(r.notes.find(n => n.name === 'zone-colors').detail, /^1 to-be zone\(s\) not checked — .*--style/);
  const warn = r.warnings.find(w => w.name === 'figures:lead-count' && !w.level);
  assert.match(warn.detail, /s1 lead counts "세 가지" but its card-grid marks 4 item/);
  assert.ok(r.warnings.some(w => w.name === 'figures:lead-count' && w.level === 'INFO'));
});

test('figureChecks: runs on its own (blocks computed or injected) and returns empty parts for a plain document', () => {
  assert.deepEqual(figureChecks('<p>x</p>'), { checks: [], warnings: [], notes: [] });
  assert.deepEqual(figureChecks('<p>the data-item attribute</p><!-- <i data-item data-zone="as-is" data-value="3"> -->'), { checks: [], warnings: [], notes: [] }); // prose and comments are not markers
  const html = sec('s1', '원칙은 세 가지이고 모두 지킨다. 어긋남이 없다.', cards(3));
  assert.equal(figureChecks(html).warnings.filter(w => !w.level).length, 0);
  assert.equal(figureChecks(html, { blocks: () => [{ id: 's1', tag: 'p', text: '원칙은 네 가지이고 모두 지킨다. 어긋남이 없다.' }] }).warnings.filter(w => !w.level).length, 1);
});

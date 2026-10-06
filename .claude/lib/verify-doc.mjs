import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { readFileSync, existsSync, mkdtempSync, rmSync, realpathSync, statSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { runGate } from './gate.mjs';
import { zoneRoles } from './figures.mjs';
import { listTemplates, listStyles, loadTokens, shapeMap, STYLES_DIR } from './components.mjs';
import { parsePlan } from './plan-schema.mjs';

export function hasHeadlessChrome() {
  if (findHeadlessChrome()) return true;
  return false;
}

// $CHROME_PATH wins; then PATH names; then the macOS app bundle.
export function findHeadlessChrome() {
  const env = process.env.CHROME_PATH;
  if (env && existsSync(env)) return env;
  for (const c of ['google-chrome', 'chromium', 'chromium-browser', 'chrome-headless-shell']) {
    try { return execSync(`command -v ${c}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  }
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(macChrome)) return macChrome;
  return null;
}

export function sidecarByteIdentical(docDir, canonicalPath) {
  const sidecar = join(docDir, 'support.js');
  if (!existsSync(sidecar) || !existsSync(canonicalPath)) return false;
  return readFileSync(sidecar).equals(readFileSync(canonicalPath));
}

function contentType(file) {
  switch (extname(file)) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.woff2': return 'font/woff2';
    case '.woff': return 'font/woff';
    default: return 'application/octet-stream';
  }
}

// ---- local assets (offline rendering) ----
// A `.dc.html` page loads React/Babel from unpkg and Pretendard from jsdelivr, and Google Fonts from
// googleapis/gstatic. Where those hosts are unreachable the page never renders and the visual tier is
// UNVERIFIED. `--local-assets <dir>` answers those requests from `<dir>/node_modules` instead (CDP Fetch
// interception: no change to the document, no browser flag, no Playwright).
const CDN_HOSTS = new Set(['unpkg.com', 'cdn.jsdelivr.net']);
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const INTERCEPT_PATTERNS = [...CDN_HOSTS, ...FONT_HOSTS].map(host => ({ urlPattern: `*://${host}/*` }));

// `<pkg>[@<ver>]/…`, `@<scope>/<pkg>[@<ver>]/…` → { pkg, ver, rest }
function splitPackage(segs) {
  const scoped = segs[0]?.startsWith('@');
  const nameSeg = scoped ? segs[1] : segs[0];
  if (!nameSeg) return null;
  const at = nameSeg.lastIndexOf('@');
  const name = at > 0 ? nameSeg.slice(0, at) : nameSeg;
  return { pkg: scoped ? `${segs[0]}/${name}` : name, ver: at > 0 ? nameSeg.slice(at + 1) : '', rest: segs.slice(scoped ? 2 : 1) };
}

// Where a CDN URL lives under `<dir>/node_modules` — pure routing, the only I/O is the existence check.
//   unpkg.com/<pkg>@<ver>/<path>              → <dir>/node_modules/<pkg>/<path>   (scoped names too)
//   cdn.jsdelivr.net/npm/<pkg>@<ver>/<path>   → same
//   cdn.jsdelivr.net/gh/<user>/<repo>@<ver>/<path> → <dir>/node_modules/<repo>/<path>  (the npm package of the same name has the repo's layout: pretendard)
// `x.min.css` falls back to `x.css` (the pretendard package ships no .min.css). Font files need no rewrite:
// the stylesheet's relative `url(./woff2/…)` resolves against the CDN host and comes back through here.
// → { file, pkg, ver } | { status: 404 } (known host, nothing to serve, or a path that escapes the package) | null (not a CDN host).
export function localAssetFor(url, dir) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (!CDN_HOSTS.has(u.hostname)) return null;
  let segs;
  try { segs = u.pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch { return { status: 404 }; }
  if (segs.some(seg => seg === '.' || seg === '..' || /[\\/\0]/.test(seg))) return { status: 404 };
  if (u.hostname === 'cdn.jsdelivr.net') {
    if (segs[0] === 'gh' && segs.length > 2) segs = segs.slice(2); // drop gh/<user>
    else if (segs[0] === 'npm') segs = segs.slice(1);
    else return { status: 404 };
  }
  const parts = splitPackage(segs);
  if (!parts || !parts.rest.length) return { status: 404 };
  const modules = join(resolve(dir), 'node_modules');
  const root = join(modules, parts.pkg);
  const file = join(root, ...parts.rest);
  if (!root.startsWith(modules + sep) || !file.startsWith(root + sep)) return { status: 404 };
  const isFile = (f) => { try { return statSync(f).isFile(); } catch { return false; } };
  if (isFile(file)) return { file, pkg: parts.pkg, ver: parts.ver };
  if (file.endsWith('.min.css') && isFile(file.replace(/\.min\.css$/, '.css'))) return { file: file.replace(/\.min\.css$/, '.css'), pkg: parts.pkg, ver: parts.ver };
  return { status: 404 };
}

// `--local-assets <dir>` wins over env DC_LOCAL_ASSETS; empty = unset. → absolute dir | undefined; throws on a bad value.
// The env var is read only when the visual tier will run (`visual`, false under --no-visual): a stale variable in the shell must
// not stop a gate that never renders. An explicit flag is always checked.
export function resolveLocalAssets(args, env = process.env, { visual = true } = {}) {
  const i = args.indexOf('--local-assets');
  let dir;
  if (i >= 0) {
    dir = args[i + 1];
    if (!dir || dir.startsWith('--')) throw new Error('--local-assets needs a directory');
  } else dir = visual ? env.DC_LOCAL_ASSETS || undefined : undefined;
  if (dir === undefined) return undefined;
  const abs = resolve(dir);
  let isDir = false;
  try { isDir = statSync(abs).isDirectory(); } catch {}
  if (!isDir) throw new Error(`${i >= 0 ? '--local-assets' : 'DC_LOCAL_ASSETS'} directory does not exist: ${abs}`);
  return abs;
}

// What one render asked the local-assets router for; merged across viewports into rows by collectCompositionWarnings.
const newAssetLog = () => ({ missed: new Set(), blocked: new Set(), versions: new Map() });

function localVersion(dir, pkg) {
  try { return JSON.parse(readFileSync(join(dir, 'node_modules', pkg, 'package.json'), 'utf8')).version; } catch { return undefined; }
}

// Answers the paused CDN/font requests of one page session; the caller must have attached `sessionId`.
// Everything the router cannot serve fails fast (a hanging CDN would stall the page's load event).
async function routeLocalAssets(cdp, sessionId, dir, log) {
  cdp.on('Fetch.requestPaused', (p, sid) => {
    if (sid !== sessionId) return;
    const answer = (method, params) => cdp.send(method, { requestId: p.requestId, ...params }, sessionId).catch(() => {});
    const url = p.request.url;
    let host = '';
    try { host = new URL(url).hostname; } catch {}
    if (FONT_HOSTS.has(host)) { log.blocked.add(host); return void answer('Fetch.failRequest', { errorReason: 'Failed' }); }
    const hit = localAssetFor(url, dir);
    if (!hit) return void answer('Fetch.continueRequest', {});
    if (!hit.file) { log.missed.add(url); return void answer('Fetch.failRequest', { errorReason: 'Failed' }); }
    let body;
    try { body = readFileSync(hit.file).toString('base64'); } catch { log.missed.add(url); return void answer('Fetch.failRequest', { errorReason: 'Failed' }); }
    // A different local version than the one the URL asks for: SRI would refuse a UMD build, a mismatched font silently differs.
    if (/^v?\d+\.\d+\.\d+/.test(hit.ver)) {
      const local = localVersion(dir, hit.pkg);
      if (local && local !== hit.ver.replace(/^v/, '')) log.versions.set(hit.pkg, `${hit.pkg}@${hit.ver.replace(/^v/, '')} is requested but ${join(dir, 'node_modules', hit.pkg)} is ${local}`);
    }
    answer('Fetch.fulfillRequest', {
      responseCode: 200,
      responseHeaders: [
        { name: 'content-type', value: contentType(hit.file) },
        { name: 'access-control-allow-origin', value: '*' }, // crossorigin scripts (SRI) and fonts are CORS requests
        { name: 'cache-control', value: 'no-store' },
      ],
      body,
    });
  });
  await cdp.send('Fetch.enable', { patterns: INTERCEPT_PATTERNS }, sessionId);
}

// panel = the active style's figure-panel colors (fig-tint / border-fig tokens), lowercased.
const DEFAULT_PANEL = { bg: '#fafbfe', border: '#eef0f6' };

// mode: 'desktop' = the section-composition rows; 'narrow' = only the horizontal-overflow probe (the other rows measure heights and grid counts that only make sense on a desktop).
function createAnalyzerPage(docName, panel = DEFAULT_PANEL, mode = 'desktop') {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;}</style></head>
<body>
<iframe id="target" src="/${docName}"></iframe>
<script>
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const analyze = () => {
  const PANEL = ${JSON.stringify(panel)}; // inside: analyze() is stringified and eval'd in the iframe
  const MODE = ${JSON.stringify(mode)};
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const textOf = (el) => (el ? el.innerText || el.textContent || '' : '');
  const isReference = (section) => /reference|appendix|glossary|용어|참고/i.test(textOf(section.querySelector('h2')) + ' ' + section.id);
  const hasMeaningfulFigure = (section) => {
    if (section.querySelector('[data-component]:not([data-component="card-grid"]):not([data-component="callout"]):not([data-component="table"])')) return true;
    const text = textOf(section).toLowerCase();
    const styled = [...section.querySelectorAll('[style]')].filter(visible);
    const hasTable = !!section.querySelector('table') || styled.some(el => /grid-template-columns\\s*:\\s*[^;]*(2fr|3fr|4fr|150px|130px|70px|repeat\\()/i.test(el.getAttribute('style') || '') && text.includes('→'));
    const hasConnector = /→|↓|↕|merge|uml|as-is|to-be|phase|matrix|gantt|lane|state|activity|sequence|fork|join|흐름|상태|단계/.test(text);
    const hasFigurePanel = styled.some(el => {
      const flat = (el.getAttribute('style') || '').replace(/\\s+/g, '').toLowerCase();
      const r = el.getBoundingClientRect();
      return r.height >= 100 && (flat.includes('background:' + PANEL.bg) || flat.includes('border:1pxsolid' + PANEL.border));
    });
    return hasTable || hasConnector || hasFigurePanel;
  };
  const topLevelBlocks = (section) => [...section.children].filter(el => visible(el) && !/^SCRIPT|STYLE$/i.test(el.tagName));
  // Narrow probe: does the page scroll sideways at this width, and which figures / elements cause it?
  const narrowProbe = () => {
    const vw = window.innerWidth;
    const root = document.documentElement;
    const sectionCount = [...document.querySelectorAll('section[id]')].filter(visible).length;
    if (!sectionCount) return []; // nothing rendered: say nothing, so the caller reports the viewport as unverified
    const rows = [{ level: 'INFO', name: 'composition:narrow-metrics', detail: sectionCount + ' section(s) measured at ' + vw + 'x' + window.innerHeight + ', document scrollWidth ' + root.scrollWidth }];
    const els = [...document.body.querySelectorAll('*')].filter(el => !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/i.test(el.tagName));
    // an overflow-x auto|scroll|hidden|clip ancestor (below <body>) clips or scrolls what is inside it: that is not page overflow
    const clipCache = new Map();
    const clippedByAncestor = (el) => {
      const p = el.parentElement;
      if (!p || p === document.body || p === root) return false;
      if (!clipCache.has(p)) clipCache.set(p, getComputedStyle(p).overflowX !== 'visible' || clippedByAncestor(p));
      return clipCache.get(p);
    };
    // right edge of the box, or of its own text when that spills out of the box (nowrap, a long unbreakable token)
    const rightEdge = (el) => {
      let right = el.getBoundingClientRect().right;
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        right = Math.max(right, range.getBoundingClientRect().right);
      }
      return right;
    };
    if (root.scrollWidth > vw + 2) {
      const over = new Set(els.filter(el => visible(el) && rightEdge(el) > vw + 2 && !clippedByAncestor(el)));
      const figures = new Map(); // data-component id → { roots: figure roots with an offender, max px past the viewport }
      const others = new Map(); // "<section> <tag>" → { n, max, sample } for outermost offenders outside every figure
      for (const el of over) {
        const px = Math.round(rightEdge(el) - vw);
        const fig = el.closest('[data-component]');
        if (fig) {
          const id = fig.getAttribute('data-component');
          const f = figures.get(id) || { roots: new Set(), max: 0 };
          f.roots.add(fig);
          f.max = Math.max(f.max, px);
          figures.set(id, f);
        } else if (!over.has(el.parentElement)) {
          const key = (el.closest('section[id]') ? el.closest('section[id]').id : 'outside-sections') + ' <' + el.tagName.toLowerCase() + '>';
          const o = others.get(key) || { n: 0, max: 0, sample: textOf(el).replace(/\\s+/g, ' ').trim().slice(0, 24) };
          o.n++;
          o.max = Math.max(o.max, px);
          others.set(key, o);
        }
      }
      const cap = (list) => list.length > 10 ? list.slice(0, 10).join(', ') + ', +' + (list.length - 10) + ' more' : list.join(', ');
      const parts = [];
      if (figures.size) parts.push('figures: ' + cap([...figures].sort((a, b) => b[1].roots.size - a[1].roots.size || b[1].max - a[1].max).map(([id, f]) => id + '×' + f.roots.size + ' (+' + f.max + 'px)')));
      if (others.size) parts.push('other: ' + cap([...others].sort((a, b) => b[1].n - a[1].n || b[1].max - a[1].max).map(([k, o]) => k + '×' + o.n + (o.sample ? ' "' + o.sample + '"' : '') + ' (+' + o.max + 'px)')));
      rows.push({ name: 'composition:mobile-overflow', detail: 'document scrollWidth ' + root.scrollWidth + ' exceeds viewport ' + vw + ' (+' + (root.scrollWidth - vw) + 'px); ' + (parts.join('; ') || 'offender not located') });
    }
    // Figure level: what the page-level check cannot see — a figure wider than its own frame that still ends inside the sheet's side
    // padding, and content cut off by overflow:hidden|clip (nothing scrolls, nothing overflows the page, the text is just gone).
    // A figure whose parent scrolls, or that scrolls itself, is the intended fallback (mobile-scroll-figure below), not a finding.
    const px = (v) => parseFloat(v) || 0;
    const past = new Map(); // data-component id → { n, max } for roots that extend past their parent's content box
    const clipped = new Map(); // data-component id → { n, max } for roots with content cut off silently
    const tally = (map, id, amount) => {
      const t = map.get(id) || { n: 0, max: 0 };
      t.n++;
      t.max = Math.max(t.max, amount);
      map.set(id, t);
    };
    for (const fig of document.querySelectorAll('[data-component]')) {
      if (!visible(fig)) continue;
      const id = fig.getAttribute('data-component');
      const parent = fig.parentElement;
      let over = 0;
      if (parent) {
        const ps = getComputedStyle(parent);
        if (!/^(auto|scroll)$/.test(ps.overflowX)) {
          const pr = parent.getBoundingClientRect();
          const r = fig.getBoundingClientRect();
          over = Math.max(r.right - (pr.right - px(ps.borderRightWidth) - px(ps.paddingRight)), (pr.left + px(ps.borderLeftWidth) + px(ps.paddingLeft)) - r.left);
        }
      }
      // the figure's own contents spilling out of its box (overflow visible) is the same finding one level down
      if (getComputedStyle(fig).overflowX === 'visible' && fig.scrollWidth > fig.clientWidth + 2) over = Math.max(over, fig.scrollWidth - fig.clientWidth);
      if (over > 1) tally(past, id, Math.round(over));
      let cut = 0;
      for (const n of [fig, ...fig.querySelectorAll('*')]) {
        const s = getComputedStyle(n);
        if (!/^(hidden|clip)$/.test(s.overflowX) || s.textOverflow === 'ellipsis') continue; // an ellipsis is a visible, intended truncation
        if (n.scrollWidth > n.clientWidth + 2) cut = Math.max(cut, n.scrollWidth - n.clientWidth);
      }
      if (cut) tally(clipped, id, Math.round(cut));
    }
    if (past.size || clipped.size) {
      const list = (map) => [...map].sort((a, b) => b[1].n - a[1].n || b[1].max - a[1].max).map(([id, t]) => id + '×' + t.n + ' (+' + t.max + 'px)').join(', ');
      const parts = [];
      if (past.size) parts.push('wider than their frame: ' + list(past));
      if (clipped.size) parts.push('content clipped by overflow:hidden: ' + list(clipped));
      rows.push({ name: 'composition:figure-overflow', detail: parts.join('; ') + ' at ' + vw + 'px' });
    }
    const scrolling = new Map();
    for (const fig of document.querySelectorAll('[data-component]')) {
      if (!visible(fig)) continue;
      const inner = [fig, ...fig.querySelectorAll('*')].some(n => /^(auto|scroll)$/.test(getComputedStyle(n).overflowX) && n.scrollWidth > n.clientWidth + 2);
      if (inner) scrolling.set(fig.getAttribute('data-component'), (scrolling.get(fig.getAttribute('data-component')) || 0) + 1);
    }
    if (scrolling.size) rows.push({ level: 'INFO', name: 'composition:mobile-scroll-figure', detail: [...scrolling].map(([id, n]) => id + '×' + n).join(', ') + ' scroll sideways inside their own box at ' + vw + 'px (the narrow-width fallback, not page overflow)' });
    return rows;
  };
  if (MODE === 'narrow') return narrowProbe();
  const warnings = [];
  const viewportHeight = window.innerHeight;
  const sections = [...document.querySelectorAll('section[id]')].filter(visible);
  if (document.documentElement.scrollWidth > window.innerWidth + 2) {
    warnings.push({ name: 'composition:desktop-overflow', detail: 'document scrollWidth ' + document.documentElement.scrollWidth + ' exceeds viewport ' + window.innerWidth });
  }
  for (const section of sections) {
    const id = section.id || '(no-id)';
    const rect = section.getBoundingClientRect();
    const text = textOf(section);
    const ref = isReference(section);
    const gridEls = [...section.querySelectorAll('[style*="display:grid"], [style*="display: grid"]')]
      .filter(el => visible(el) && el.getBoundingClientRect().height >= 120);
    const repeat4 = [...section.querySelectorAll('[style*="repeat(4,1fr)"], [style*="repeat(4, 1fr)"], [style*="repeat(4,minmax("], [style*="repeat(4, minmax("]')].filter(visible);
    const statContext = /(지표|수치|metric|stat|kpi|%|건|명|개|count|number)/i.test(text);
    const figureIntent = /(workflow|flow|map|matrix|state|surface|lane|architecture|ownership|흐름|상태|매트릭스|맵|구조|소유|역할|ui|화면|의사결정|결정)/i.test(text);
    const blockCount = topLevelBlocks(section).length;
    warnings.push({
      level: 'INFO',
      name: 'composition:section-metrics',
      detail: id + ' height=' + Math.round(rect.height) + 'px (' + (rect.height / viewportHeight).toFixed(2) + 'vh) blocks=' + blockCount + ' viewport=' + window.innerWidth + 'x' + window.innerHeight
    });

    if (rect.height > viewportHeight * 1.6) {
      warnings.push({ name: 'composition:section-height', detail: id + ' is ' + (rect.height / viewportHeight).toFixed(2) + ' viewport heights at ' + window.innerWidth + 'x' + window.innerHeight });
    } else if (rect.height > viewportHeight * 1.25) {
      warnings.push({ name: 'composition:section-height', detail: id + ' is ' + (rect.height / viewportHeight).toFixed(2) + ' viewport heights at ' + window.innerWidth + 'x' + window.innerHeight });
    }
    if (gridEls.length >= 3 && !ref) {
      warnings.push({ name: 'composition:stacked-grids', detail: id + ' has ' + gridEls.length + ' grid containers; review for additive card stacking' });
    }
    if (repeat4.length > 0 && !statContext) {
      warnings.push({ name: 'composition:card-grid-overuse', detail: id + ' uses repeat(4,1fr) without nearby stat/metric context' });
    }
    if (!ref && figureIntent && !hasMeaningfulFigure(section) && gridEls.length > 0) {
      warnings.push({ name: 'composition:missing-primary-figure', detail: id + ' contains figure-intent language but appears to rely on peer grids/cards' });
    }
    if (!ref && blockCount > 5) {
      warnings.push({ name: 'composition:meaning-block-count', detail: id + ' has ' + blockCount + ' top-level visible children' });
    }
    if (/(결정|승인|검토|보류|선택|decision|approve|ask)/i.test(text)) {
      const candidates = [...section.querySelectorAll('*')].filter(el => visible(el) && /(결정|승인|검토|보류|선택|decision|approve|ask)/i.test(textOf(el)));
      const small = candidates.some(el => {
        const r = el.getBoundingClientRect();
        const parent = el.parentElement;
        const parentStyle = parent ? parent.getAttribute('style') || '' : '';
        return r.width * r.height < rect.width * rect.height * 0.2 || /display\\s*:\\s*grid/i.test(parentStyle);
      });
      const topLevelDecision = topLevelBlocks(section).some(el => /(결정|승인|검토|보류|선택|decision|approve|ask)/i.test(textOf(el)) && el.getBoundingClientRect().width * el.getBoundingClientRect().height >= rect.width * rect.height * 0.2);
      if (small && !topLevelDecision) {
        warnings.push({ name: 'composition:decision-low-emphasis', detail: id + ' decision/approval copy appears only in a low-emphasis block' });
      }
    }
  }
  return warnings;
};
(async () => {
  const iframe = document.getElementById('target');
  await new Promise(resolve => iframe.addEventListener('load', resolve, { once: true }));
  await sleep(1400);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  const warnings = win.eval('(' + analyze.toString() + ')()');
  document.body.innerHTML = '<pre id="result"></pre>';
  document.getElementById('result').textContent = JSON.stringify(warnings);
})();
</script>
</body>
</html>`;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getFreePort() {
  const server = createNetServer();
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const { port } = server.address();
  await new Promise(resolveClose => server.close(resolveClose));
  return port;
}

async function waitForJson(url, timeoutMs = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await delay(150);
  }
  throw new Error(`timed out waiting for ${url}`);
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    const listeners = new Map(); // CDP event method → Set<(params, sessionId) => void>
    let nextId = 1;
    const timer = setTimeout(() => reject(new Error('timed out opening websocket')), 5000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve({
        send(method, params = {}, sessionId) {
          const id = nextId++;
          ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
          return new Promise((res, rej) => {
            const timeout = setTimeout(() => {
              pending.delete(id);
              rej(new Error(`CDP timeout: ${method}`));
            }, 8000);
            pending.set(id, { res, rej, timeout });
          });
        },
        // Subscribe to a CDP event (a message without `id`); a flattened session's events carry its sessionId. → unsubscribe.
        on(method, fn) {
          if (!listeners.has(method)) listeners.set(method, new Set());
          listeners.get(method).add(fn);
          return () => listeners.get(method).delete(fn);
        },
        close() { ws.close(); },
      });
    });
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.id) {
        for (const fn of listeners.get(msg.method) || []) { try { fn(msg.params || {}, msg.sessionId); } catch {} }
        return;
      }
      if (!pending.has(msg.id)) return;
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      clearTimeout(p.timeout);
      if (msg.error) p.rej(new Error(msg.error.message || 'CDP error'));
      else p.res(msg.result);
    });
    ws.addEventListener('error', () => reject(new Error('websocket error')));
  });
}

async function runChromeAnalyzer(chrome, url, vp, { localAssets, assetLog } = {}) {
  const remotePort = await getFreePort();
  const userDataDir = mkdtempSync(join(tmpdir(), 'dc-verify-chrome-'));
  const child = spawn(chrome, [
    '--headless=new',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), // chromium refuses to start as root otherwise
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${remotePort}`,
    `--window-size=${vp.width},${vp.height}`,
    'about:blank',
  ], { stdio: 'ignore' });

  // a browser that dies at startup (bad CHROME_PATH, no sandbox) should fail now, not after the 8s poll
  const exited = new Promise((_, reject) => {
    child.once('error', (err) => reject(new Error(`cannot start browser: ${err.message}`)));
    child.once('exit', (code) => reject(new Error(`browser exited at startup (code ${code})`)));
  });
  exited.catch(() => {});
  let cdp;
  try {
    const version = await Promise.race([waitForJson(`http://127.0.0.1:${remotePort}/json/version`), exited]);
    cdp = await connectCdp(version.webSocketDebuggerUrl);
    const target = await cdp.send('Target.createTarget', { url: 'about:blank' }); // navigate only once metrics and interception are in place
    const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: false,
    }, sessionId);
    // A phone has overlay scrollbars; a classic 15px one would make the 390px probe measure a 375px page.
    if (vp.mode === 'narrow') await cdp.send('Emulation.setScrollbarsHidden', { hidden: true }, sessionId).catch(() => {});
    if (localAssets) await routeLocalAssets(cdp, sessionId, localAssets, assetLog);
    const nav = await cdp.send('Page.navigate', { url }, sessionId);
    if (nav.errorText) throw new Error(`navigation failed: ${nav.errorText}`);

    const started = Date.now();
    while (Date.now() - started < 9000) {
      const result = await cdp.send('Runtime.evaluate', {
        expression: "document.getElementById('result')?.textContent || ''",
        returnByValue: true,
      }, sessionId);
      const value = result.result?.value;
      if (value) {
        await cdp.send('Target.closeTarget', { targetId: target.targetId });
        return value;
      }
      await delay(200);
    }
    throw new Error('analyzer did not produce output');
  } finally {
    if (cdp) cdp.close();
    child.kill('SIGKILL');
    await Promise.race([
      new Promise(resolve => child.once('exit', resolve)),
      delay(500),
    ]);
    try {
      rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {}
  }
}

async function withStaticServer(docDir, docName, panel, fn) {
  const sockets = new Set();
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/__composition') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(createAnalyzerPage(docName, panel, url.searchParams.get('mode') === 'narrow' ? 'narrow' : 'desktop'));
      return;
    }
    const requested = decodeURIComponent(url.pathname === '/' ? `/${docName}` : url.pathname);
    const root = resolve(docDir);
    const full = resolve(docDir, `.${requested}`);
    if ((full !== root && !full.startsWith(root + sep)) || !existsSync(full)) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': contentType(full) });
    res.end(readFileSync(full));
  });
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolveClose => server.close(resolveClose));
  }
}

// → null without a browser, else { warnings, unverified, assetNotes }: `unverified` is the reason string when no
// viewport produced analyzer output (the caller must then say UNVERIFIED, not "non-blocking"). `localAssets` = a
// directory whose node_modules answers the document's CDN requests (see localAssetFor); `assetNotes` = rows about
// what that routing blocked, could not find or served at another version.
export async function collectCompositionWarnings(doc, panel, { localAssets } = {}) {
  const chrome = findHeadlessChrome();
  if (!chrome) return null;
  const docDir = dirname(doc);
  const docName = basename(doc);
  const viewports = [
    { width: 1366, height: 768, mode: 'desktop' },
    { width: 1440, height: 900, mode: 'desktop' },
    { width: 390, height: 844, mode: 'narrow' }, // phone width: the horizontal-overflow probe
  ];
  const all = [];
  const reasons = [];
  const assetLog = newAssetLog();
  let verified = 0;
  await withStaticServer(docDir, docName, panel, async (baseUrl) => {
    for (const vp of viewports) {
      let json;
      try {
        json = await runChromeAnalyzer(chrome, `${baseUrl}/__composition?mode=${vp.mode}`, vp, { localAssets, assetLog });
      } catch (err) {
        reasons.push(`${vp.width}x${vp.height}: ${err.message}`);
        all.push({ name: 'composition:unverified', detail: `headless browser did not return analyzer output at ${vp.width}x${vp.height}: ${err.message}` });
        continue;
      }
      try {
        const found = JSON.parse(json);
        // no section measured = the document never rendered (the runtime needs React/Babel/fonts: outbound network, or --local-assets)
        if (!found.some(w => w.name === 'composition:section-metrics' || w.name === 'composition:narrow-metrics')) {
          reasons.push(`${vp.width}x${vp.height}: analyzer measured 0 sections — the document did not render (runtime and fonts need outbound network${localAssets ? ' or the files under --local-assets' : ''})`);
          all.push({ name: 'composition:unverified', detail: `no <section id> rendered at ${vp.width}x${vp.height}` });
          continue;
        }
        for (const warning of found) all.push(warning);
        verified++;
      } catch (err) {
        reasons.push(`${vp.width}x${vp.height}: unreadable analyzer output`);
        all.push({ name: 'composition:unreadable', detail: `unable to parse analyzer output at ${vp.width}x${vp.height}` });
      }
    }
  });
  const seen = new Set();
  const warnings = all.filter((warning) => {
    const key = `${warning.name} ${warning.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const assetNotes = [];
  if (localAssets) {
    assetNotes.push({ level: 'INFO', name: 'local-assets', detail: `CDN requests answered from ${join(localAssets, 'node_modules')}${assetLog.blocked.size ? `; ${[...assetLog.blocked].join(', ')} blocked (fallback fonts)` : ''}` });
    for (const detail of assetLog.versions.values()) assetNotes.push({ name: 'local-assets:version', detail });
    for (const url of assetLog.missed) assetNotes.push({ name: 'local-assets:miss', detail: `${url} not found under ${join(localAssets, 'node_modules')}` });
  }
  const missed = assetLog.missed.size ? ` ; not found under --local-assets: ${[...assetLog.missed].join(', ')}` : '';
  return { warnings, assetNotes, unverified: verified === 0 ? reasons.join(' ; ') + missed : null };
}

function argValue(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

// The active style's gate inputs: accent, palette (every hex in design.md), figure-panel colors, zone roles (accent family vs warn/slate).
export function styleInputs(style) {
  const dir = join(STYLES_DIR, style);
  if (!existsSync(join(dir, 'design.md'))) throw new Error(`unknown style "${style}" (have: ${listStyles().join(', ')})`);
  const colors = loadTokens(style).colors;
  const paletteHexes = [...readFileSync(join(dir, 'design.md'), 'utf8').matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map(m => m[0]);
  return { accent: colors.accent, paletteHexes, zoneRoles: zoneRoles(colors), panel: { bg: (colors['fig-tint'] || DEFAULT_PANEL.bg).toLowerCase(), border: (colors['border-fig'] || DEFAULT_PANEL.border).toLowerCase() } };
}

// accent: explicit hex (wins) or the style's; paletteHexes: set → `palette` check; planPath → plan checks.
export function gateOptions({ accent, sidecarPresent, planPath, style, paletteHexes }) {
  const templates = listTemplates();
  const st = style ? styleInputs(style) : null;
  const opts = {
    accentHex: accent || (st && st.accent),
    sidecarPresent,
    knownComponents: templates.map(t => t.meta.component),
    figureComponents: templates.filter(t => t.meta.kind !== 'content').map(t => t.meta.component),
  };
  if (paletteHexes || st) opts.paletteHexes = paletteHexes || st.paletteHexes;
  if (st) opts.zoneRoles = st.zoneRoles;
  if (st) opts.panel = st.panel; // not a gate input — carried for the visual tier
  if (planPath) {
    opts.planText = readFileSync(planPath, 'utf8');
    const plan = parsePlan(opts.planText);
    opts.plan = plan;
    opts.shapeMap = shapeMap(templates);
    if (plan.header.facts) {
      const facts = resolve(dirname(resolve(planPath)), plan.header.facts);
      try { opts.factsText = readFileSync(facts, 'utf8'); }
      catch { opts.factsError = `facts file named by the plan header cannot be read: ${facts}`; }
    }
  }
  return opts;
}

const USAGE = `usage: node verify-doc.mjs <doc.dc.html> --canonical-support <support.js> (--style <id> | --accent <hex>) [--plan <content-plan.md>] [--no-visual] [--local-assets <dir>]
  --style <id>     enables the palette check (every hex must be in styles/<id>/design.md) and supplies --accent
  --accent <hex>   accent color the document must use (optional when --style is given)
  --plan <file>    enables plan-alignment, plan-shapes and numbers-traced — and terms-consistent when the plan's facts file has a "## T — 용어" table
  --no-visual      skip the headless-browser tier (env CHROME_PATH picks the browser)
  --local-assets <dir>  render offline: answer the document's unpkg/jsdelivr requests from <dir>/node_modules and fail Google Fonts fast (env DC_LOCAL_ASSETS, read only when the visual tier runs; the flag wins)`;

async function main() {
  const args = process.argv.slice(2);
  const doc = args[0] && !args[0].startsWith('--') ? args[0] : undefined;
  const accent = argValue(args, '--accent');
  const style = argValue(args, '--style');
  const canonical = argValue(args, '--canonical-support');
  const planPath = argValue(args, '--plan');
  if (!doc || !canonical || (!accent && !style)) {
    console.error(USAGE);
    process.exit(2);
  }
  let opts;
  let localAssets;
  try {
    localAssets = resolveLocalAssets(args, process.env, { visual: !args.includes('--no-visual') });
    opts = gateOptions({ accent, sidecarPresent: sidecarByteIdentical(dirname(doc), canonical), planPath, style });
  } catch (e) {
    console.error(`${e.message}\n${USAGE}`);
    process.exit(2);
  }
  const r = runGate(readFileSync(doc, 'utf8'), opts);
  for (const c of r.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
  for (const w of r.warnings) console.log(`${w.level || 'WARN'}  ${w.name}  ${w.detail}`);
  for (const n of r.notes) console.log(`NOTE  ${n.name}  ${n.detail}`);
  if (!planPath) console.log('NOTE  plan-shapes, numbers-traced, terms-consistent  not checked (pass --plan <content-plan.md> to verify every section carries its shape\'s component, every number is traced and the facts file\'s term sheet is kept)');
  if (!style) console.log('NOTE  palette  not checked (pass --style <id> to verify every color is in the style\'s design.md)');
  if (r.ok && !args.includes('--no-visual')) await visualTier(doc, opts.panel, { localAssets });
  else if (r.ok) console.log('VISUAL: skipped (--no-visual)');
  const passed = r.checks.filter(c => c.ok).length;
  console.log(`GATE ${r.ok ? 'PASSED' : 'FAILED'} (${passed}/${r.checks.length} checks)`);
  process.exit(r.ok ? 0 : 1);
}

async function visualTier(doc, panel, options) {
  const res = await collectCompositionWarnings(doc, panel, options);
  if (!res) return void console.log('VISUAL: UNVERIFIED (no headless browser — install chromium or set CHROME_PATH)');
  if (res.unverified) return void console.log(`VISUAL: UNVERIFIED (${res.unverified})`);
  const { warnings, assetNotes } = res;
  for (const note of assetNotes) console.log(`${note.level || 'WARN'}  ${note.name}  ${note.detail}`);
  for (const warning of warnings) console.log(`${warning.level || 'WARN'}  ${warning.name}  ${warning.detail}`);
  if (warnings.some(w => w.name === 'composition:unverified' || w.name === 'composition:unreadable'))
    console.log('VISUAL: partially verified — one viewport returned no analyzer output (see above)');
  else if (warnings.every(w => w.level === 'INFO')) console.log('VISUAL: composition warnings 0 at 1366x768, 1440x900 and 390x844');
  else console.log('VISUAL: composition warnings are non-blocking until calibrated against accepted artifacts');
}

// Symlink- and encoding-safe entry guard (raw `file://${argv[1]}` breaks under paths with spaces/Korean).
const isMain = () => {
  try { return !!process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (isMain()) main();

import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { readFileSync, existsSync, mkdtempSync, rmSync, realpathSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { runGate } from './gate.mjs';
import { listTemplates, listStyles, loadTokens, shapeMap, STYLES_DIR } from './components.mjs';
import { parsePlan } from './plan-schema.mjs';

export function hasHeadlessChrome() {
  if (findHeadlessChrome()) return true;
  return false;
}

// $CHROME_PATH wins; then PATH names; then the macOS app bundle.
function findHeadlessChrome() {
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
    default: return 'application/octet-stream';
  }
}

// panel = the active style's figure-panel colors (fig-tint / border-fig tokens), lowercased.
const DEFAULT_PANEL = { bg: '#fafbfe', border: '#eef0f6' };

function createAnalyzerPage(docName, panel = DEFAULT_PANEL) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;}</style></head>
<body>
<iframe id="target" src="/${docName}"></iframe>
<script>
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const analyze = () => {
  const PANEL = ${JSON.stringify(panel)}; // inside: analyze() is stringified and eval'd in the iframe
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
    const repeat4 = [...section.querySelectorAll('[style*="repeat(4,1fr)"], [style*="repeat(4, 1fr)"]')].filter(visible);
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
        close() { ws.close(); },
      });
    });
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.id || !pending.has(msg.id)) return;
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      clearTimeout(p.timeout);
      if (msg.error) p.rej(new Error(msg.error.message || 'CDP error'));
      else p.res(msg.result);
    });
    ws.addEventListener('error', () => reject(new Error('websocket error')));
  });
}

async function runChromeAnalyzer(chrome, url, vp) {
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
    const target = await cdp.send('Target.createTarget', { url });
    const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: false,
    }, sessionId);

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
      res.end(createAnalyzerPage(docName, panel));
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

// → null without a browser, else { warnings, unverified }: `unverified` is the reason string when no
// viewport produced analyzer output (the caller must then say UNVERIFIED, not "non-blocking").
export async function collectCompositionWarnings(doc, panel) {
  const chrome = findHeadlessChrome();
  if (!chrome) return null;
  const docDir = dirname(doc);
  const docName = basename(doc);
  const viewports = [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ];
  const all = [];
  const reasons = [];
  let verified = 0;
  await withStaticServer(docDir, docName, panel, async (baseUrl) => {
    for (const vp of viewports) {
      let json;
      try {
        json = await runChromeAnalyzer(chrome, `${baseUrl}/__composition`, vp);
      } catch (err) {
        reasons.push(`${vp.width}x${vp.height}: ${err.message}`);
        all.push({ name: 'composition:unverified', detail: `headless browser did not return analyzer output at ${vp.width}x${vp.height}: ${err.message}` });
        continue;
      }
      try {
        const found = JSON.parse(json);
        // no section measured = the document never rendered (the runtime needs outbound network for React/Babel/fonts)
        if (!found.some(w => w.name === 'composition:section-metrics')) {
          reasons.push(`${vp.width}x${vp.height}: analyzer measured 0 sections — the document did not render (runtime and fonts need outbound network)`);
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
  return { warnings, unverified: verified === 0 ? reasons.join(' ; ') : null };
}

function argValue(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

// The active style's gate inputs: accent, palette (every hex in design.md), figure-panel colors.
export function styleInputs(style) {
  const dir = join(STYLES_DIR, style);
  if (!existsSync(join(dir, 'design.md'))) throw new Error(`unknown style "${style}" (have: ${listStyles().join(', ')})`);
  const colors = loadTokens(style).colors;
  const paletteHexes = [...readFileSync(join(dir, 'design.md'), 'utf8').matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map(m => m[0]);
  return { accent: colors.accent, paletteHexes, panel: { bg: (colors['fig-tint'] || DEFAULT_PANEL.bg).toLowerCase(), border: (colors['border-fig'] || DEFAULT_PANEL.border).toLowerCase() } };
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

const USAGE = `usage: node verify-doc.mjs <doc.dc.html> --canonical-support <support.js> (--style <id> | --accent <hex>) [--plan <content-plan.md>] [--no-visual]
  --style <id>     enables the palette check (every hex must be in styles/<id>/design.md) and supplies --accent
  --accent <hex>   accent color the document must use (optional when --style is given)
  --plan <file>    enables plan-alignment, plan-shapes and numbers-traced
  --no-visual      skip the headless-browser tier (env CHROME_PATH picks the browser)`;

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
  try {
    opts = gateOptions({ accent, sidecarPresent: sidecarByteIdentical(dirname(doc), canonical), planPath, style });
  } catch (e) {
    console.error(`${e.message}\n${USAGE}`);
    process.exit(2);
  }
  const r = runGate(readFileSync(doc, 'utf8'), opts);
  for (const c of r.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
  for (const w of r.warnings) console.log(`${w.level || 'WARN'}  ${w.name}  ${w.detail}`);
  if (!planPath) console.log('NOTE  plan-shapes, numbers-traced  not checked (pass --plan <content-plan.md> to verify every section carries its shape\'s component and every number is traced)');
  if (!style) console.log('NOTE  palette  not checked (pass --style <id> to verify every color is in the style\'s design.md)');
  if (r.ok && !args.includes('--no-visual')) await visualTier(doc, opts.panel);
  else if (r.ok) console.log('VISUAL: skipped (--no-visual)');
  const passed = r.checks.filter(c => c.ok).length;
  console.log(`GATE ${r.ok ? 'PASSED' : 'FAILED'} (${passed}/${r.checks.length} checks)`);
  process.exit(r.ok ? 0 : 1);
}

async function visualTier(doc, panel) {
  const res = await collectCompositionWarnings(doc, panel);
  if (!res) return void console.log('VISUAL: UNVERIFIED (no headless browser — install chromium or set CHROME_PATH)');
  if (res.unverified) return void console.log(`VISUAL: UNVERIFIED (${res.unverified})`);
  const { warnings } = res;
  for (const warning of warnings) console.log(`${warning.level || 'WARN'}  ${warning.name}  ${warning.detail}`);
  if (warnings.some(w => w.name === 'composition:unverified' || w.name === 'composition:unreadable'))
    console.log('VISUAL: partially verified — one viewport returned no analyzer output (see above)');
  else if (warnings.every(w => w.level === 'INFO')) console.log('VISUAL: composition warnings 0 at 1366x768 and 1440x900');
  else console.log('VISUAL: composition warnings are non-blocking until calibrated against accepted artifacts');
}

// Symlink- and encoding-safe entry guard (raw `file://${argv[1]}` breaks under paths with spaces/Korean).
const isMain = () => {
  try { return !!process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (isMain()) main();

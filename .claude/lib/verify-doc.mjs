import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { runGate } from './gate.mjs';

export function hasHeadlessChrome() {
  if (findHeadlessChrome()) return true;
  return false;
}

function findHeadlessChrome() {
  for (const c of ['google-chrome', 'chromium', 'chromium-browser']) {
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

function createAnalyzerPage(docName) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;}</style></head>
<body>
<iframe id="target" src="/${docName}"></iframe>
<script>
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const analyze = () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const textOf = (el) => (el ? el.innerText || el.textContent || '' : '');
  const isReference = (section) => /reference|appendix|glossary|용어|참고/i.test(textOf(section.querySelector('h2')) + ' ' + section.id);
  const hasMeaningfulFigure = (section) => {
    const text = textOf(section).toLowerCase();
    const styled = [...section.querySelectorAll('[style]')].filter(visible);
    const hasTable = !!section.querySelector('table') || styled.some(el => /grid-template-columns\\s*:\\s*[^;]*(2fr|3fr|4fr|150px|130px|70px|repeat\\()/i.test(el.getAttribute('style') || '') && text.includes('→'));
    const hasConnector = /→|↓|↕|merge|uml|as-is|to-be|phase|matrix|gantt|lane|state|activity|sequence|fork|join|흐름|상태|단계/.test(text);
    const hasFigurePanel = styled.some(el => {
      const style = el.getAttribute('style') || '';
      const r = el.getBoundingClientRect();
      return r.height >= 100 && (/background\\s*:\\s*#FAFBFE/i.test(style) || /border\\s*:\\s*1px\\s+solid\\s+#EEF0F6/i.test(style));
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

  let cdp;
  try {
    const version = await waitForJson(`http://127.0.0.1:${remotePort}/json/version`);
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

async function withStaticServer(docDir, docName, fn) {
  const sockets = new Set();
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/__composition') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(createAnalyzerPage(docName));
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

export async function collectCompositionWarnings(doc) {
  const chrome = findHeadlessChrome();
  if (!chrome) return null;
  const docDir = dirname(doc);
  const docName = basename(doc);
  const viewports = [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ];
  const all = [];
  await withStaticServer(docDir, docName, async (baseUrl) => {
    for (const vp of viewports) {
      let json;
      try {
        json = await runChromeAnalyzer(chrome, `${baseUrl}/__composition`, vp);
      } catch (err) {
        all.push({ name: 'composition:unverified', detail: `headless browser did not return analyzer output at ${vp.width}x${vp.height}: ${err.message}` });
        continue;
      }
      try {
        for (const warning of JSON.parse(json)) all.push(warning);
      } catch (err) {
        all.push({ name: 'composition:unreadable', detail: `unable to parse analyzer output at ${vp.width}x${vp.height}` });
      }
    }
  });
  const seen = new Set();
  return all.filter((warning) => {
    const key = `${warning.name} ${warning.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const [doc, , accent, , canonical] = process.argv.slice(2);
  const html = readFileSync(doc, 'utf8');
  const sidecarPresent = sidecarByteIdentical(dirname(doc), canonical);
  const r = runGate(html, { accentHex: accent, sidecarPresent });
  for (const c of r.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
  if (!r.ok) { console.error('GATE FAILED'); process.exit(1); }
  const warnings = await collectCompositionWarnings(doc);
  if (!warnings) { console.log('VISUAL: UNVERIFIED (no headless browser)'); return; }
  const warnCount = warnings.filter(warning => warning.level !== 'INFO').length;
  if (warnings.length === 0) {
    console.log('VISUAL: composition warnings 0 at 1366x768 and 1440x900');
    return;
  }
  for (const warning of warnings) console.log(`${warning.level || 'WARN'}  ${warning.name}  ${warning.detail}`);
  if (warnCount === 0) console.log('VISUAL: composition warnings 0 at 1366x768 and 1440x900');
  else console.log('VISUAL: composition warnings are non-blocking until calibrated against accepted artifacts');
}

if (import.meta.url === `file://${process.argv[1]}`) main();

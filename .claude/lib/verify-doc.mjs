import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { runGate } from './gate.mjs';

export function hasHeadlessChrome() {
  for (const c of ['google-chrome', 'chromium', 'chromium-browser']) {
    try { execSync(`command -v ${c}`, { stdio: 'ignore' }); return true; } catch {}
  }
  return false;
}

export function sidecarByteIdentical(docDir, canonicalPath) {
  const sidecar = join(docDir, 'support.js');
  if (!existsSync(sidecar) || !existsSync(canonicalPath)) return false;
  return readFileSync(sidecar).equals(readFileSync(canonicalPath));
}

function main() {
  const [doc, , accent, , canonical] = process.argv.slice(2);
  const html = readFileSync(doc, 'utf8');
  const sidecarPresent = sidecarByteIdentical(dirname(doc), canonical);
  const r = runGate(html, { accentHex: accent, sidecarPresent });
  for (const c of r.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
  if (!r.ok) { console.error('GATE FAILED'); process.exit(1); }
  if (!hasHeadlessChrome()) { console.log('VISUAL: UNVERIFIED (no headless browser)'); return; }
  console.log('VISUAL: render available — see /build step for serve+screenshot');
}

if (import.meta.url === `file://${process.argv[1]}`) main();

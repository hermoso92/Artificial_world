/**
 * Guardrail: detecta URLs hardcodeadas (localhost, 127.0.0.1, http(s):// con host)
 * en frontend/src y backend/src. Excluye config/api.js, VITE_*, import.meta.env.
 * Uso: node scripts/guardrails/scan-hardcoded-urls.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

const DIRS = ['frontend/src', 'backend/src'];
const EXCLUDE = /(?:node_modules|dist|\.test\.(js|jsx|ts|tsx)$)/;

function isAllowed(filePath, line) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (/config\/api\.(js|ts)/.test(rel)) return true;
  if (line && (
    line.includes('VITE_') ||
    line.includes('import.meta.env') ||
    line.includes('process.env') ||
    line.includes("'/api'") ||
    line.includes('"/api"') ||
    line.includes('${PORT}') ||
    line.includes('${process.env')
  )) return true;
  return false;
}

function* walkFiles(dir, base = ROOT) {
  const full = path.join(base, dir);
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) return;
  const entries = fs.readdirSync(full, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE.test(rel)) continue;
      yield* walkFiles(rel, base);
    } else if (e.isFile() && /\.(js|jsx|ts|tsx|mjs)$/.test(e.name) && !EXCLUDE.test(rel)) {
      yield path.join(base, rel);
    }
  }
}

function scan() {
  const violations = [];
  const localhostPattern = /(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/gi;

  for (const dir of DIRS) {
    for (const file of walkFiles(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isAllowed(file, line)) continue;
        const m = line.match(localhostPattern);
        if (m) {
          violations.push({ file: rel, line: i + 1, match: m[0] });
        }
      }
    }
  }
  return violations;
}

const violations = scan();
if (violations.length > 0) {
  console.error('[guardrails] URLs hardcodeadas (localhost/127.0.0.1) detectadas:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.match}`);
  }
  process.exit(1);
}
console.log('[guardrails] scan-hardcoded-urls: OK (0 violaciones)');

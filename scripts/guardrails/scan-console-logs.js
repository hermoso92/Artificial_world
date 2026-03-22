/**
 * Guardrail: detecta console.log, console.debug, console.info, console.warn
 * en frontend/src y backend/src. Excluye tests y node_modules.
 * Uso: node scripts/guardrails/scan-console-logs.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

const DIRS = ['frontend/src', 'backend/src'];
const EXCLUDE = /(?:node_modules|dist|\.test\.(js|jsx|ts|tsx)$|(?:^|[\/\\])logger\.js$)/;
const CONSOLE_PATTERN = /console\.(log|debug|info|warn)\s*\(/g;

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
  for (const dir of DIRS) {
    for (const file of walkFiles(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      let m;
      CONSOLE_PATTERN.lastIndex = 0;
      while ((m = CONSOLE_PATTERN.exec(content)) !== null) {
        const line = content.slice(0, m.index).split('\n').length;
        violations.push({ file: rel, line, method: m[1] });
      }
    }
  }
  return violations;
}

const violations = scan();
if (violations.length > 0) {
  console.error('[guardrails] console.log/debug/info/warn detectados:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  console.${v.method}(`);
  }
  process.exit(1);
}
console.log('[guardrails] scan-console-logs: OK (0 violaciones)');

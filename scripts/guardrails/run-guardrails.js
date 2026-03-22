/**
 * Ejecuta todos los guardrails y devuelve exit code 1 si hay violaciones.
 * Uso: node scripts/guardrails/run-guardrails.js
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scripts = [
  'scan-console-logs.js',
  'scan-hardcoded-urls.js',
];

let failed = false;
for (const script of scripts) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..'),
  });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);

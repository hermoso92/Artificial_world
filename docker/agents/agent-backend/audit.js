/**
 * Agent Backend — Auditoría de API, seguridad, logging
 */
import fs from 'fs';
import path from 'path';

const REPO_PATH = process.env.REPO_PATH || '/repo';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';
const BACKEND = path.join(REPO_PATH, 'backend', 'src');
const findings = [];

function scanJs(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...scanJs(full));
    else if (e.name.endsWith('.js') || e.name.endsWith('.mjs') || e.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

function checkFile(filePath) {
  const rel = path.relative(REPO_PATH, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    if (line.includes('console.log') && !line.includes('logger')) {
      findings.push({
        id: `BE-${findings.length + 1}`,
        severity: 'medium',
        file: rel,
        line: i + 1,
        message: 'console.log detectado; usar logger según AGENTS.md',
        recommendation: 'Sustituir por logger.info/error/warn',
      });
    }
    // URL hardcodeada: solo penalizar si está en una asignación real (fetch, axios, variable)
    // Excluir: logs de arranque (logger.info), comentarios, config.js con fallback explícito
    const isComment = line.trimStart().startsWith('//') || line.trimStart().startsWith('*');
    const isLogLine = line.includes('logger.') || line.includes('console.');
    const isConfigFallback = line.includes('process.env') && line.includes('??');
    if (!isComment && !isLogLine && !isConfigFallback && line.match(/http:\/\/localhost:\d+/)) {
      findings.push({
        id: `BE-${findings.length + 1}`,
        severity: 'high',
        file: rel,
        line: i + 1,
        message: 'URL hardcodeada en lógica de negocio; usar config/api o variable de entorno',
        recommendation: 'Usar backend/src/config.js o process.env para URLs de servicios externos',
      });
    }
  });
}

if (fs.existsSync(BACKEND)) {
  scanJs(BACKEND).forEach(checkFile);
}

const report = {
  agent: 'agent-backend',
  timestamp: new Date().toISOString(),
  repo: REPO_PATH,
  findings,
  summary: { high: findings.filter((f) => f.severity === 'high').length, medium: findings.filter((f) => f.severity === 'medium').length, low: findings.filter((f) => f.severity === 'low').length },
};

fs.mkdirSync(OUTPUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-backend.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));

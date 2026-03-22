/**
 * Agent Frontend — Auditoría de React, componentes (300 líneas), console.log
 * Umbral de líneas: 300 para .jsx (componentes), 500 para .js (hooks/utils con lógica compleja)
 */
import fs from 'fs';
import path from 'path';

const REPO_PATH = process.env.REPO_PATH || '/repo';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';
const FRONTEND = path.join(REPO_PATH, 'frontend', 'src');
const findings = [];
const MAX_LINES_COMPONENT = 300;   // .jsx — componentes React
const MAX_LINES_HOOK = 500;        // .js/.ts — hooks y utilidades con lógica compleja

function scanJs(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...scanJs(full));
    else if (e.name.endsWith('.jsx') || e.name.endsWith('.js') || e.name.endsWith('.tsx') || e.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

function checkFile(filePath) {
  const rel = path.relative(REPO_PATH, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const isComponent = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
  const maxLines = isComponent ? MAX_LINES_COMPONENT : MAX_LINES_HOOK;

  if (lines.length > maxLines) {
    findings.push({
      id: `FE-${findings.length + 1}`,
      severity: 'medium',
      file: rel,
      line: 0,
      message: `${isComponent ? 'Componente' : 'Módulo'} supera ${maxLines} líneas (${lines.length})`,
      recommendation: isComponent
        ? 'Refactorizar o extraer subcomponentes según AGENTS.md'
        : 'Considerar extraer lógica en módulos separados si supera 500 líneas',
    });
  }

  lines.forEach((line, i) => {
    if (line.includes('console.log')) {
      findings.push({
        id: `FE-${findings.length + 1}`,
        severity: 'medium',
        file: rel,
        line: i + 1,
        message: 'console.log detectado; usar logger',
        recommendation: 'Sustituir por logger de utils/logger',
      });
    }
    // Imágenes sin alt
    if (line.includes('<img') && !line.includes('alt=')) {
      findings.push({
        id: `FE-${findings.length + 1}`,
        severity: 'low',
        file: rel,
        line: i + 1,
        message: 'Imagen sin atributo alt (accesibilidad)',
        recommendation: 'Añadir alt descriptivo',
      });
    }
  });
}

if (fs.existsSync(FRONTEND)) {
  scanJs(FRONTEND).forEach(checkFile);
}

const report = {
  agent: 'agent-frontend',
  timestamp: new Date().toISOString(),
  repo: REPO_PATH,
  findings,
  summary: { high: findings.filter((f) => f.severity === 'high').length, medium: findings.filter((f) => f.severity === 'medium').length, low: findings.filter((f) => f.severity === 'low').length },
};

fs.mkdirSync(OUTPUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-frontend.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));

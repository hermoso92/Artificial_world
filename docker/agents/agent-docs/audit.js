/**
 * Agent Docs — Auditoría de documentación
 * Busca: README, docs/, claims sin evidencia, violaciones de principios editoriales
 */
import fs from 'fs';
import path from 'path';

const REPO_PATH = process.env.REPO_PATH || '/repo';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';

const findings = [];

function scanDir(dir, ext = '.md') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'chess-output') {
      results.push(...scanDir(full, ext));
    } else if (e.isFile() && e.name.endsWith(ext) && !e.name.startsWith('REPORTE_')) {
      results.push(full);
    }
  }
  return results;
}

function checkFile(filePath) {
  const rel = path.relative(REPO_PATH, filePath);
  if (rel.includes('REALIDAD_VS_VISION')) return; // Define claims prohibidos
  if (rel.includes('chess-output') || rel.includes('REPORTE_CHESS')) return; // Reportes generados
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Claims prohibidos (REALIDAD_VS_VISION)
  const forbidden = [
    'comprende cualquier repo perfectamente',
    'reemplaza arquitectos',
    'detecta todos los problemas automáticamente',
    'coordina inteligencias en tiempo real a escala probada',
    'ya es el estándar del mercado',
  ];

  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const f of forbidden) {
      if (lower.includes(f)) {
        findings.push({
          id: `DOC-${findings.length + 1}`,
          severity: 'high',
          file: rel,
          line: i + 1,
          message: `Claim prohibido detectado: "${f}"`,
          recommendation: 'Eliminar o reclasificar según docs/REALIDAD_VS_VISION.md',
        });
      }
    }
    // Enlaces rotos: [texto](ruta) con ruta que no existe
    const linkMatch = line.match(/\]\(([^)]+)\)/g);
    if (linkMatch) {
      linkMatch.forEach((m) => {
        const href = m.slice(2, -1).split('#')[0].trim();
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;
        if (/^[a-f0-9-]{36}$/i.test(href)) return; // UUID, no es archivo
        const target = path.resolve(path.dirname(filePath), href);
        if (!fs.existsSync(target)) {
          findings.push({
            id: `DOC-${findings.length + 1}`,
            severity: 'low',
            file: rel,
            line: i + 1,
            message: `Enlace posiblemente roto: ${href}`,
            recommendation: 'Verificar que el archivo existe',
          });
        }
      });
    }
  });
}

// Ejecutar
const mdFiles = scanDir(REPO_PATH);
mdFiles.forEach(checkFile);

// README específico
const readme = path.join(REPO_PATH, 'README.md');
if (fs.existsSync(readme)) checkFile(readme);

const report = {
  agent: 'agent-docs',
  timestamp: new Date().toISOString(),
  repo: REPO_PATH,
  findings,
  summary: {
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  },
};

fs.mkdirSync(OUTPUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-docs.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));

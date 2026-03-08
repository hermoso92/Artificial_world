/**
 * Agent Marketing — Auditoría de landing, claims, HTML y docs de narrativa/pitch
 */
import fs from 'fs';
import path from 'path';

const REPO_PATH = process.env.REPO_PATH || '/repo';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';
const findings = [];

function findByExt(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'chess-output') results.push(...findByExt(full, ext));
    else if (e.name.endsWith(ext) && !e.name.startsWith('REPORTE_')) results.push(full);
  }
  return results;
}

// Claims que suenan a overselling sin evidencia
const overpromiseClaims = [
  'revolucionario',
  'único en el mundo',
  'la primera IA que',
  'completamente autónomo',
  'sin ningún límite',
  'perfectamente escalable',
  'entiende cualquier',
  '100% preciso',
  'mejor que cualquier',
  'supera a todos',
];

function checkHtml(filePath) {
  const rel = path.relative(REPO_PATH, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('<title>') && !content.includes('<meta')) {
    findings.push({
      id: `MKT-${findings.length + 1}`,
      severity: 'low',
      file: rel,
      line: 0,
      message: 'Falta title o meta para SEO',
      recommendation: 'Añadir <title> y meta description',
    });
  }
  // OG tags para redes sociales
  if (!content.includes('og:title') && !content.includes('og:description')) {
    findings.push({
      id: `MKT-${findings.length + 1}`,
      severity: 'low',
      file: rel,
      line: 0,
      message: 'Faltan Open Graph tags (og:title, og:description)',
      recommendation: 'Añadir meta og: para compartibilidad en redes',
    });
  }
}

function checkMarketing(filePath) {
  const rel = path.relative(REPO_PATH, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const claim of overpromiseClaims) {
      if (lower.includes(claim)) {
        findings.push({
          id: `MKT-${findings.length + 1}`,
          severity: 'medium',
          file: rel,
          line: i + 1,
          message: `Claim de overselling detectado: "${claim}"`,
          recommendation: 'Verificar con evidencia o reformular con matiz (p.ej. "aspira a", "en roadmap")',
        });
      }
    }
  });
}

// Auditar HTML
findByExt(REPO_PATH, '.html').forEach(checkHtml);

// Auditar docs de pitch, narrativa y marketing
const marketingDocs = [
  'NARRATIVA_MAESTRA.md',
  'PITCH_1_PORCIENTO.md',
  'DEMO_2_MINUTOS.md',
  'MANIFIESTO.md',
  'DOCUMENTO_FINAL.md',
];

marketingDocs.forEach((doc) => {
  const filePath = path.join(REPO_PATH, 'docs', doc);
  if (fs.existsSync(filePath)) checkMarketing(filePath);
});

const report = {
  agent: 'agent-marketing',
  timestamp: new Date().toISOString(),
  repo: REPO_PATH,
  findings,
  summary: { high: findings.filter((f) => f.severity === 'high').length, medium: findings.filter((f) => f.severity === 'medium').length, low: findings.filter((f) => f.severity === 'low').length },
};

fs.mkdirSync(OUTPUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-marketing.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));

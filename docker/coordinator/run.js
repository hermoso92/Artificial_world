/**
 * Coordinator — Agrega reportes de agentes y genera REPORTE_CHESS_1.md
 * En producción, los agentes se ejecutan antes; este script lee /output
 */
import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';
const REPO_PATH = process.env.REPO_PATH || '/repo';

const agents = ['docs', 'backend', 'frontend', 'bd', 'tests', 'marketing'];
const allFindings = [];
const reports = [];

for (const agent of agents) {
  const file = path.join(OUTPUT_PATH, `reporte-${agent}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    reports.push(data);
    (data.findings || []).forEach((f) => {
      allFindings.push({ ...f, agent: data.agent });
    });
  }
}

const reporteCompleto = {
  timestamp: new Date().toISOString(),
  agents: reports.map((r) => ({ agent: r.agent, summary: r.summary })),
  findings: allFindings.sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
  }),
  summary: {
    total: allFindings.length,
    high: allFindings.filter((f) => f.severity === 'high').length,
    medium: allFindings.filter((f) => f.severity === 'medium').length,
    low: allFindings.filter((f) => f.severity === 'low').length,
  },
};

fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-completo.json'), JSON.stringify(reporteCompleto, null, 2));

// Generar REPORTE_CHESS_1.md legible
let md = `# Reporte Chess 1 — Auditoría completa\n\n`;
md += `**Fecha:** ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `## Resumen\n\n`;
md += `| Severidad | Cantidad |\n|-----------|----------|\n`;
md += `| Alta | ${reporteCompleto.summary.high} |\n`;
md += `| Media | ${reporteCompleto.summary.medium} |\n`;
md += `| Baja | ${reporteCompleto.summary.low} |\n\n`;
md += `## Hallazgos\n\n`;

reporteCompleto.findings.forEach((f) => {
  md += `### ${f.id} [${f.severity}] — ${f.file}\n\n`;
  md += `- **Mensaje:** ${f.message}\n`;
  md += `- **Recomendación:** ${f.recommendation}\n`;
  if (f.line) md += `- **Línea:** ${f.line}\n`;
  md += `\n`;
});

fs.writeFileSync(path.join(OUTPUT_PATH, 'REPORTE_CHESS_1.md'), md);
console.log(JSON.stringify(reporteCompleto.summary));

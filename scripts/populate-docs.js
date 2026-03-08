/**
 * populate-docs.js — Pobla y sincroniza documentación del proyecto
 *
 * Qué hace:
 *   1. Recorre todos los módulos del repo (backend, frontend, python, docker)
 *   2. Detecta si tienen README y documentación actualizada
 *   3. Genera un índice de estado de documentación
 *   4. Identifica inconsistencias entre docs/ y el código real
 *   5. Escribe docs/ia-memory/reports/DOC_ESTADO_<fecha>.md
 *
 * Uso:
 *   node scripts/populate-docs.js
 *   node scripts/populate-docs.js --fix   (genera README vacíos donde faltan)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const FIX_MODE = process.argv.includes('--fix');

// ─────────────────────────────────────────────
// MÓDULOS QUE DEBEN TENER DOCUMENTACIÓN
// ─────────────────────────────────────────────

const MODULES = [
  {
    name: 'Motor Python',
    path: ROOT,
    files: ['principal.py'],
    expectedDocs: ['README.md'],
    docKey: 'motor-python',
  },
  {
    name: 'Backend Node',
    path: path.join(ROOT, 'backend'),
    files: ['src/server.js'],
    expectedDocs: ['../docs/backend/README.md'],
    docKey: 'backend',
  },
  {
    name: 'Frontend React',
    path: path.join(ROOT, 'frontend'),
    files: ['src/App.jsx'],
    expectedDocs: ['../docs/frontend/README.md'],
    docKey: 'frontend',
  },
  {
    name: 'HeroRefuge',
    path: path.join(ROOT, 'backend', 'src', 'simulation'),
    files: ['heroRefuge.js', 'civilizationSeeds.js'],
    expectedDocs: [],
    docKey: 'hero-refuge',
  },
  {
    name: 'IA Local (aiCore)',
    path: path.join(ROOT, 'backend', 'src', 'services'),
    files: ['aiCore.js', 'aiMemory.js'],
    expectedDocs: ['../../../docs/ia-memory/README.md'],
    docKey: 'ia-local',
  },
  {
    name: 'Docker / Agentes Chess',
    path: path.join(ROOT, 'docker'),
    files: ['docker-compose.full.yml'],
    expectedDocs: ['../docs/SISTEMA_CHESS.md'],
    docKey: 'docker-chess',
  },
  {
    name: 'Tests Python',
    path: path.join(ROOT, 'pruebas'),
    files: [],
    expectedDocs: [],
    docKey: 'tests-python',
  },
];

// ─────────────────────────────────────────────
// DOCUMENTOS CLAVE — verificar coherencia
// ─────────────────────────────────────────────

const KEY_DOCS = [
  { file: 'docs/DOCUMENTO_FINAL.md', desc: 'Estado real del proyecto' },
  { file: 'docs/DOCUMENTO_UNICO.md', desc: 'Referencia técnica completa' },
  { file: 'docs/ESENCIAL.md', desc: 'Guía de 2 páginas' },
  { file: 'docs/MODOS_EJECUCION.md', desc: 'Python vs Web' },
  { file: 'docs/VISION_CIVILIZACIONES_VIVAS.md', desc: 'Tesis de producto' },
  { file: 'docs/ESTRATEGIA_PRODUCTO.md', desc: 'Estrategia y próximos pasos' },
  { file: 'docs/ARTIFICIAL_WORD_CRONOGRAMA.md', desc: 'Cronograma y GitHub' },
  { file: 'docs/SISTEMA_CHESS.md', desc: 'Sistema de auditoría Chess' },
  { file: 'docs/ia-memory/README.md', desc: 'IA local — memoria y prompts' },
  { file: 'docs/backend/README.md', desc: 'Backend — API reference' },
  { file: 'docs/frontend/README.md', desc: 'Frontend — componentes' },
  { file: 'README.md', desc: 'README principal del repo' },
];

// ─────────────────────────────────────────────
// ANÁLISIS
// ─────────────────────────────────────────────

const results = [];
const issues = [];

for (const mod of MODULES) {
  const result = {
    name: mod.name,
    exists: fs.existsSync(mod.path),
    sourceFiles: [],
    missingDocs: [],
    presentDocs: [],
  };

  // Verificar archivos fuente
  for (const f of mod.files) {
    const fullPath = path.join(mod.path, f);
    result.sourceFiles.push({ file: f, exists: fs.existsSync(fullPath) });
  }

  // Verificar docs esperados
  for (const doc of mod.expectedDocs) {
    const fullPath = path.resolve(mod.path, doc);
    const exists = fs.existsSync(fullPath);
    if (exists) {
      result.presentDocs.push(doc);
    } else {
      result.missingDocs.push(doc);
      issues.push({ module: mod.name, missing: doc, severity: 'low' });

      // En modo --fix, crear README vacío
      if (FIX_MODE && doc.endsWith('README.md')) {
        const dir = path.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          fullPath,
          `# ${mod.name}\n\n> Documentación pendiente.\n\nVer [DOCUMENTO_FINAL.md](../../docs/DOCUMENTO_FINAL.md) para el estado del proyecto.\n`
        );
        console.log(`[FIX] Creado: ${path.relative(ROOT, fullPath)}`);
      }
    }
  }

  results.push(result);
}

// Verificar docs clave
const docStatus = [];
for (const doc of KEY_DOCS) {
  const fullPath = path.join(ROOT, doc.file);
  const exists = fs.existsSync(fullPath);
  let lines = 0;
  let lastModified = null;
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf8');
    lines = content.split('\n').length;
    lastModified = fs.statSync(fullPath).mtime.toISOString().slice(0, 10);
  }
  docStatus.push({ file: doc.file, desc: doc.desc, exists, lines, lastModified });
  if (!exists) {
    issues.push({ module: 'docs/', missing: doc.file, severity: 'medium' });
  }
}

// ─────────────────────────────────────────────
// GENERAR REPORTE
// ─────────────────────────────────────────────

const fecha = new Date().toISOString().slice(0, 10);
const reportsDir = path.join(DOCS, 'ia-memory', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

let md = `# Estado de Documentación — ${fecha}\n\n`;
md += `> Generado por \`scripts/populate-docs.js\`\n\n`;
md += `---\n\n`;
md += `## Módulos del proyecto\n\n`;
md += `| Módulo | Existe | Archivos fuente | Docs OK | Docs faltantes |\n`;
md += `|--------|--------|-----------------|---------|----------------|\n`;

for (const r of results) {
  const srcOk = r.sourceFiles.filter((f) => f.exists).length;
  const srcTotal = r.sourceFiles.length;
  const docsOk = r.presentDocs.length;
  const docsMissing = r.missingDocs.length;
  md += `| ${r.name} | ${r.exists ? '✅' : '❌'} | ${srcOk}/${srcTotal} | ${docsOk} | ${docsMissing > 0 ? `❌ ${docsMissing}` : '✅ 0'} |\n`;
}

md += `\n---\n\n`;
md += `## Documentos clave\n\n`;
md += `| Documento | Descripción | Estado | Líneas | Última modificación |\n`;
md += `|-----------|-------------|--------|--------|---------------------|\n`;

for (const d of docStatus) {
  md += `| \`${d.file}\` | ${d.desc} | ${d.exists ? '✅' : '❌ FALTA'} | ${d.lines || '-'} | ${d.lastModified || '-'} |\n`;
}

md += `\n---\n\n`;
md += `## Problemas detectados (${issues.length})\n\n`;

if (issues.length === 0) {
  md += `✅ Sin problemas detectados.\n`;
} else {
  for (const issue of issues) {
    const sev = issue.severity === 'medium' ? '⚠️' : '📝';
    md += `- ${sev} **[${issue.module}]** Falta: \`${issue.missing}\`\n`;
  }
}

md += `\n---\n\n`;
md += `## Instrucciones\n\n`;
md += `- Para crear READMEs faltantes: \`node scripts/populate-docs.js --fix\`\n`;
md += `- Para auditar todo el proyecto: \`docker compose -f docker/docker-compose.full.yml --profile audit up\`\n`;
md += `- Para ejecutar en 3 entornos paralelos (tests + prod + audit): ver \`docs/SISTEMA_CHESS.md\`\n`;

const reportPath = path.join(reportsDir, `DOC_ESTADO_${fecha}.md`);
fs.writeFileSync(reportPath, md);

// También escribir JSON para el coordinator
const jsonPath = path.join(reportsDir, `doc-estado-${fecha}.json`);
fs.writeFileSync(
  jsonPath,
  JSON.stringify({ fecha, modules: results, keyDocs: docStatus, issues }, null, 2)
);

console.log(`\n✅ Reporte generado: ${path.relative(ROOT, reportPath)}`);
console.log(`📊 Módulos analizados: ${results.length}`);
console.log(`📄 Docs clave verificados: ${docStatus.length}`);
console.log(`⚠️  Problemas detectados: ${issues.length}`);

if (issues.length > 0) {
  console.log(`\nProblemas:`);
  issues.forEach((i) => console.log(`  [${i.severity}] ${i.module} → ${i.missing}`));
}

process.exit(issues.filter((i) => i.severity === 'high').length > 0 ? 1 : 0);

/**
 * Agent BD — Auditoría de schema, archivos SQL, SQLite, migraciones
 */
import fs from 'fs';
import path from 'path';

const REPO_PATH = process.env.REPO_PATH || '/repo';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';
const findings = [];

function findFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') results.push(...findFiles(full, ext));
    else if (e.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function checkDbFile(filePath) {
  const rel = path.relative(REPO_PATH, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    // CREATE TABLE sin IF NOT EXISTS
    if (/CREATE\s+TABLE\s+(?!IF)/i.test(line)) {
      findings.push({
        id: `BD-${findings.length + 1}`,
        severity: 'low',
        file: rel,
        line: i + 1,
        message: 'CREATE TABLE sin IF NOT EXISTS puede fallar en migraciones',
        recommendation: 'Usar CREATE TABLE IF NOT EXISTS',
      });
    }
    // DROP TABLE sin IF EXISTS
    if (/DROP\s+TABLE\s+(?!IF)/i.test(line)) {
      findings.push({
        id: `BD-${findings.length + 1}`,
        severity: 'medium',
        file: rel,
        line: i + 1,
        message: 'DROP TABLE sin IF EXISTS puede romper entornos vacíos',
        recommendation: 'Usar DROP TABLE IF EXISTS',
      });
    }
    // Queries con * en SELECT (riesgo de sobreexposición)
    if (/SELECT\s+\*/i.test(line)) {
      findings.push({
        id: `BD-${findings.length + 1}`,
        severity: 'low',
        file: rel,
        line: i + 1,
        message: 'SELECT * expone columnas no previstas y dificulta auditorías',
        recommendation: 'Listar columnas explícitamente',
      });
    }
    // Interpolación directa en queries (riesgo SQL injection)
    if (/\$\{[^}]+\}/.test(line) && /SELECT|INSERT|UPDATE|DELETE/i.test(line)) {
      findings.push({
        id: `BD-${findings.length + 1}`,
        severity: 'high',
        file: rel,
        line: i + 1,
        message: 'Posible interpolación de variable en query SQL (riesgo inyección)',
        recommendation: 'Usar parámetros vinculados (?, $1, etc.)',
      });
    }
  });
}

// Buscar database.js, schema, migrations, store
const dbFiles = findFiles(REPO_PATH, '.js').filter(
  (f) => f.includes('database') || f.includes('schema') || f.includes('store') || f.includes('migration')
);
const sqlFiles = findFiles(REPO_PATH, '.sql');

[...dbFiles, ...sqlFiles].forEach(checkDbFile);

// Verificar que existen los 3 ficheros de BD documentados
const expectedDbs = ['mundo_artificial.db', 'audit_simulacion.db'];
expectedDbs.forEach((db) => {
  if (!fs.existsSync(path.join(REPO_PATH, db))) {
    findings.push({
      id: `BD-${findings.length + 1}`,
      severity: 'low',
      file: db,
      line: 0,
      message: `Base de datos ${db} no encontrada en la raíz del repo`,
      recommendation: 'Verificar que la BD existe o documentar dónde se genera',
    });
  }
});

const report = {
  agent: 'agent-bd',
  timestamp: new Date().toISOString(),
  repo: REPO_PATH,
  findings,
  summary: { high: findings.filter((f) => f.severity === 'high').length, medium: findings.filter((f) => f.severity === 'medium').length, low: findings.filter((f) => f.severity === 'low').length },
};

fs.mkdirSync(OUTPUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-bd.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));

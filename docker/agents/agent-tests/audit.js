/**
 * Agent Tests — Auditoría de cobertura, calidad y presencia de tests
 */
import fs from 'fs';
import path from 'path';

const REPO_PATH = process.env.REPO_PATH || '/repo';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/output';
const findings = [];

function findTests(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    // Excluir __pycache__ y directorios ocultos/node_modules
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__pycache__') {
      results.push(...findTests(full));
    } else if (
      (e.name.startsWith('test_') || e.name.endsWith('.test.js') || e.name.endsWith('.test.jsx') || e.name.endsWith('.test.ts')) &&
      !e.name.endsWith('.pyc') && !e.name.endsWith('.pyo')
    ) {
      results.push(full);
    }
  }
  return results;
}

function findSourceFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__pycache__') {
      results.push(...findSourceFiles(full, exts));
    } else if (exts.some((ext) => e.name.endsWith(ext)) && !e.name.includes('.test.') && !e.name.startsWith('test_')) {
      results.push(full);
    }
  }
  return results;
}

function checkTestQuality(filePath) {
  // Ignorar binarios compilados
  if (filePath.endsWith('.pyc') || filePath.endsWith('.pyo')) return;

  const rel = path.relative(REPO_PATH, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Test sin assertions — reconoce assert, expect(), assertEqual, assertTrue, if+fallos (watchdog style)
  const hasAssert = (
    content.includes('assert ') ||
    content.includes('assert(') ||
    content.includes('expect(') ||
    content.includes('assertEqual') ||
    content.includes('assertTrue') ||
    content.includes('assertFalse') ||
    content.includes('assertIn') ||
    /fallos\s*\.append/.test(content) ||       // patrón watchdog: fallos.append(...)
    /errores\s*\.append/.test(content) ||      // patrón arranque: errores.append(...)
    /if\s+errores[^:]*:/.test(content) ||      // patrón arranque: if errores:
    /if\s+\w+\s+in\s+\w+/.test(content) ||    // patrón watchdog: if "X" in codigos
    content.includes('sys.exit(1)')            // script de verificación con exit code
  );
  if (!hasAssert) {
    findings.push({
      id: `T-${findings.length + 1}`,
      severity: 'medium',
      file: rel,
      line: 0,
      message: 'Test sin assertions detectado — no verifica nada',
      recommendation: 'Añadir assert/expect para validar comportamiento real',
    });
  }

  // Test con TODO pendiente
  lines.forEach((line, i) => {
    if (/TODO|FIXME|pass\s*#\s*(todo|fix)/i.test(line)) {
      findings.push({
        id: `T-${findings.length + 1}`,
        severity: 'low',
        file: rel,
        line: i + 1,
        message: 'Test incompleto (TODO/FIXME detectado)',
        recommendation: 'Completar o eliminar el test placeholder',
      });
    }
  });
}

const pyTests = findTests(path.join(REPO_PATH, 'pruebas'));
const beTests = findTests(path.join(REPO_PATH, 'backend'));
const feTests = findTests(path.join(REPO_PATH, 'frontend'));
const allTests = [...pyTests, ...beTests, ...feTests];

// Verificar carpeta de tests Python
if (!fs.existsSync(path.join(REPO_PATH, 'pruebas'))) {
  findings.push({ id: 'T-1', severity: 'low', file: 'pruebas/', line: 0, message: 'No se encontró carpeta pruebas/', recommendation: 'Crear tests Python' });
}

// Verificar calidad de cada test
allTests.forEach(checkTestQuality);

// Calcular ratio de cobertura aproximada
const pySources = findSourceFiles(path.join(REPO_PATH), ['.py']).filter(
  (f) => !f.includes('pruebas') && !f.includes('__pycache__') && !f.includes('.pyc')
);
const jsSources = findSourceFiles(path.join(REPO_PATH, 'backend', 'src'), ['.js', '.mjs']);

const pyCoverageRatio = pySources.length > 0 ? (pyTests.length / pySources.length).toFixed(2) : 0;
const jsCoverageRatio = jsSources.length > 0 ? (beTests.length / jsSources.length).toFixed(2) : 0;

if (parseFloat(pyCoverageRatio) < 0.10 && pySources.length > 5) {
  findings.push({
    id: `T-${findings.length + 1}`,
    severity: 'medium',
    file: 'pruebas/',
    line: 0,
    message: `Ratio de cobertura Python baja: ${pyCoverageRatio} (${pyTests.length} tests / ${pySources.length} fuentes)`,
    recommendation: 'Aumentar cobertura de tests Python',
  });
}

const report = {
  agent: 'agent-tests',
  timestamp: new Date().toISOString(),
  repo: REPO_PATH,
  findings,
  summary: {
    pythonTests: pyTests.length,
    backendTests: beTests.length,
    frontendTests: feTests.length,
    pyCoverageRatio,
    jsCoverageRatio,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  },
};

fs.mkdirSync(OUTPUT_PATH, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_PATH, 'reporte-tests.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));

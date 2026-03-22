/**
 * analizar-repo.js
 * Analiza un repositorio local o clonado y extrae metadatos para generar un portfolio PDF.
 * Entrada: ruta absoluta al repo (string)
 * Salida: objeto RepoAnalysis (ver tipo al final del archivo)
 *
 * Uso:
 *   import { analizarRepo } from './analizar-repo.js'
 *   const data = await analizarRepo('/ruta/al/repo')
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Detección de stack ───────────────────────────────────────────────────────

function detectarStack(dir) {
  const stack = { backend: [], frontend: [], ia: [], infra: [], bd: [] };

  const check = (file) => fs.existsSync(path.join(dir, file));
  const readJSON = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
    catch { return null; }
  };

  // Python
  if (check('requirements.txt') || check('setup.py') || check('pyproject.toml')) {
    const req = check('requirements.txt') ? fs.readFileSync(path.join(dir, 'requirements.txt'), 'utf8') : '';
    stack.backend.push('Python 3');
    if (req.includes('pygame'))    stack.backend.push('pygame');
    if (req.includes('fastapi'))   stack.backend.push('FastAPI');
    if (req.includes('flask'))     stack.backend.push('Flask');
    if (req.includes('django'))    stack.backend.push('Django');
    if (req.includes('torch'))     stack.ia.push('PyTorch');
    if (req.includes('sklearn'))   stack.ia.push('scikit-learn');
    if (req.includes('openai'))    stack.ia.push('OpenAI SDK');
    if (req.includes('langchain')) stack.ia.push('LangChain');
  }

  // Node / JS
  const pkg = readJSON('package.json');
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    stack.backend.push('Node.js');
    if (allDeps['express'])    stack.backend.push('Express');
    if (allDeps['fastify'])    stack.backend.push('Fastify');
    if (allDeps['react'])      stack.frontend.push('React');
    if (allDeps['next'])       stack.frontend.push('Next.js');
    if (allDeps['vue'])        stack.frontend.push('Vue');
    if (allDeps['svelte'])     stack.frontend.push('Svelte');
    if (allDeps['tailwindcss'])stack.frontend.push('Tailwind CSS');
    if (allDeps['vite'])       stack.frontend.push('Vite');
    if (allDeps['typescript']) stack.frontend.push('TypeScript');
    if (allDeps['prisma'])     stack.bd.push('Prisma');
    if (allDeps['mongoose'])   stack.bd.push('MongoDB / Mongoose');
    if (allDeps['pg'])         stack.bd.push('PostgreSQL');
    if (allDeps['better-sqlite3'] || allDeps['sqlite3']) stack.bd.push('SQLite');
    if (allDeps['openai'])     stack.ia.push('OpenAI SDK');
    if (allDeps['langchain'])  stack.ia.push('LangChain');
    if (allDeps['playwright']) stack.infra.push('Playwright');
    if (allDeps['vitest'] || allDeps['jest']) stack.infra.push('Tests JS');
  }

  // Go
  if (check('go.mod')) {
    const gomod = fs.readFileSync(path.join(dir, 'go.mod'), 'utf8');
    stack.backend.push('Go');
    if (gomod.includes('gin'))   stack.backend.push('Gin');
    if (gomod.includes('fiber')) stack.backend.push('Fiber');
  }

  // Rust
  if (check('Cargo.toml')) stack.backend.push('Rust');

  // Docker / CI
  if (check('Dockerfile') || check('docker-compose.yml') || check('docker-compose.yaml'))
    stack.infra.push('Docker');
  if (check('.github/workflows')) stack.infra.push('GitHub CI/CD');
  if (check('.env') || check('.env.example')) stack.infra.push('Variables de entorno');

  // DB files
  const dbFiles = listarArchivos(dir, ['.db', '.sqlite', '.sqlite3'], 3);
  if (dbFiles.length > 0) stack.bd.push(`SQLite (${dbFiles.length} BD)`);

  // LaTeX
  const texFiles = listarArchivos(dir, ['.tex'], 2);
  if (texFiles.length > 0) stack.infra.push('LaTeX / PDF generation');

  return stack;
}

// ─── Conteo de tests ─────────────────────────────────────────────────────────

function contarTests(dir) {
  const resultado = { total: 0, archivos: 0, frameworks: [] };
  const testsDir = path.join(dir, 'tests');
  const pruebasDir = path.join(dir, 'pruebas');
  const testDir = path.join(dir, 'test');

  const buscarTests = (d, ext = ['.py', '.js', '.ts', '.go', '.rs']) => {
    if (!fs.existsSync(d)) return 0;
    let count = 0;
    const items = fs.readdirSync(d);
    for (const item of items) {
      const full = path.join(d, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) count += buscarTests(full, ext);
      else if (ext.some(e => item.endsWith(e)) && (item.includes('test') || item.includes('spec') || item.includes('prueba'))) {
        count++;
        resultado.archivos++;
      }
    }
    return count;
  };

  resultado.total += buscarTests(testsDir);
  resultado.total += buscarTests(pruebasDir);
  resultado.total += buscarTests(testDir);
  resultado.total += buscarTests(path.join(dir, 'src'), ['.test.js', '.test.ts', '.spec.js', '.spec.ts']);

  // Detectar frameworks
  const pkg = leerJSON(path.join(dir, 'package.json'));
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.vitest) resultado.frameworks.push('Vitest');
    if (deps.jest)   resultado.frameworks.push('Jest');
    if (deps.mocha)  resultado.frameworks.push('Mocha');
  }
  if (fs.existsSync(path.join(dir, 'pruebas', 'run_tests_produccion.py'))) {
    resultado.frameworks.push('pytest / runner Python');
  }
  if (fs.existsSync(path.join(dir, 'pytest.ini')) || fs.existsSync(path.join(dir, 'setup.cfg'))) {
    resultado.frameworks.push('pytest');
  }

  return resultado;
}

// ─── Extracción de documentación ─────────────────────────────────────────────

function extraerDocumentacion(dir) {
  const docs = { readme: '', descripcion: '', tagline: '', tiene_docs: false, archivos: [] };

  // README
  for (const nombre of ['README.md', 'readme.md', 'README.txt', 'readme.txt']) {
    const ruta = path.join(dir, nombre);
    if (fs.existsSync(ruta)) {
      const contenido = fs.readFileSync(ruta, 'utf8');
      docs.readme = contenido.slice(0, 2000);
      // Extraer primera línea de descripción
      const lineas = contenido.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      docs.descripcion = lineas[0]?.replace(/[*_`>]/g, '').trim() ?? '';
      // Extraer tagline (buscar patrones comunes)
      const taglineMatch = contenido.match(/[*_]([^*_\n]{10,80})[*_]/);
      docs.tagline = taglineMatch ? taglineMatch[1].trim() : docs.descripcion.slice(0, 80);
      break;
    }
  }

  // Docs folder
  const docsDir = path.join(dir, 'docs');
  if (fs.existsSync(docsDir)) {
    docs.tiene_docs = true;
    docs.archivos = fs.readdirSync(docsDir)
      .filter(f => f.endsWith('.md') || f.endsWith('.pdf'))
      .slice(0, 10);
  }

  return docs;
}

// ─── Estadísticas del repo ───────────────────────────────────────────────────

function estadisticasRepo(dir) {
  const stats = {
    nombre: path.basename(dir),
    total_archivos: 0,
    lineas_codigo: 0,
    lenguajes: {},
    ultimo_commit: '',
    autor: '',
    commits_total: 0,
    es_git: false,
  };

  // Git
  if (fs.existsSync(path.join(dir, '.git'))) {
    stats.es_git = true;
    try {
      stats.ultimo_commit = execSync('git log -1 --format="%ai %s"', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString().trim().slice(0, 60);
      stats.autor = execSync('git log -1 --format="%an"', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString().trim();
      const countStr = execSync('git rev-list --count HEAD', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString().trim();
      stats.commits_total = parseInt(countStr) || 0;
    } catch { /* no git o sin commits */ }
  }

  // Contar archivos por lenguaje (superficial, 2 niveles)
  const ext_map = {
    '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
    '.jsx': 'React/JSX', '.tsx': 'React/TSX', '.go': 'Go',
    '.rs': 'Rust', '.java': 'Java', '.cs': 'C#', '.cpp': 'C++',
    '.c': 'C', '.rb': 'Ruby', '.php': 'PHP', '.tex': 'LaTeX',
    '.sql': 'SQL', '.sh': 'Shell', '.ps1': 'PowerShell',
  };

  const contarArchivos = (d, nivel = 0) => {
    if (nivel > 3) return;
    if (!fs.existsSync(d)) return;
    const ignorar = ['node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 'venv', '.venv'];
    for (const item of fs.readdirSync(d)) {
      if (ignorar.includes(item)) continue;
      const full = path.join(d, item);
      try {
        const s = fs.statSync(full);
        if (s.isDirectory()) contarArchivos(full, nivel + 1);
        else {
          stats.total_archivos++;
          const ext = path.extname(item);
          if (ext_map[ext]) stats.lenguajes[ext_map[ext]] = (stats.lenguajes[ext_map[ext]] ?? 0) + 1;
        }
      } catch { /* permisos */ }
    }
  };

  contarArchivos(dir);
  return stats;
}

// ─── Acciones / features detectadas ─────────────────────────────────────────

function detectarFeatures(dir) {
  const features = [];

  const check = (file) => fs.existsSync(path.join(dir, file));
  const checkDir = (d) => fs.existsSync(path.join(dir, d)) && fs.statSync(path.join(dir, d)).isDirectory();

  if (check('Dockerfile') || checkDir('docker'))  features.push({ icono: '🐳', nombre: 'Docker containerizado' });
  if (check('.github/workflows'))                  features.push({ icono: '🔄', nombre: 'CI/CD automatizado (GitHub Actions)' });
  if (checkDir('migrations') || check('prisma/schema.prisma')) features.push({ icono: '🗄️', nombre: 'Migraciones de base de datos' });
  if (check('openapi.yaml') || check('swagger.json') || check('docs/API_INDEX.md')) features.push({ icono: '📡', nombre: 'API documentada (OpenAPI / Swagger)' });
  if (checkDir('pruebas') || checkDir('tests') || checkDir('test')) features.push({ icono: '✅', nombre: 'Suite de tests automatizados' });
  if (check('scripts/iniciar_fullstack.ps1') || check('iniciar.ps1')) features.push({ icono: '▶️', nombre: 'Script de inicio único (1 comando)' });
  if (check('.env') || check('.env.example'))      features.push({ icono: '🔐', nombre: 'Configuración por variables de entorno' });
  if (checkDir('frontend/src') || checkDir('src/components')) features.push({ icono: '🖥️', nombre: 'Frontend React modular' });
  if (checkDir('backend/src') || check('server.js') || check('main.py')) features.push({ icono: '⚙️', nombre: 'Backend API REST' });
  if (checkDir('docs'))                            features.push({ icono: '📚', nombre: 'Documentación técnica incluida' });
  if (check('README.md'))                          features.push({ icono: '📄', nombre: 'README verificable' });

  return features;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function listarArchivos(dir, extensiones, niveles = 2) {
  const resultado = [];
  const recorrer = (d, nivel) => {
    if (nivel > niveles || !fs.existsSync(d)) return;
    for (const item of fs.readdirSync(d)) {
      const full = path.join(d, item);
      try {
        const s = fs.statSync(full);
        if (s.isDirectory()) recorrer(full, nivel + 1);
        else if (extensiones.some(e => item.endsWith(e))) resultado.push(full);
      } catch { /* skip */ }
    }
  };
  recorrer(dir, 0);
  return resultado;
}

function leerJSON(ruta) {
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); }
  catch { return null; }
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * @param {string} dirRepo - Ruta absoluta al directorio del repositorio
 * @returns {Promise<RepoAnalysis>}
 */
export async function analizarRepo(dirRepo) {
  const dir = path.resolve(dirRepo);
  if (!fs.existsSync(dir)) throw new Error(`El directorio no existe: ${dir}`);

  const estadisticas = estadisticasRepo(dir);
  const stack = detectarStack(dir);
  const tests = contarTests(dir);
  const docs = extraerDocumentacion(dir);
  const features = detectarFeatures(dir);

  // Nombre limpio del proyecto
  const pkg = leerJSON(path.join(dir, 'package.json'));
  const nombreProyecto = pkg?.name ?? estadisticas.nombre ?? 'Proyecto';
  const descripcionProyecto = pkg?.description ?? docs.descripcion ?? '';

  return {
    // Identidad
    nombre: normalizarNombre(nombreProyecto),
    descripcion: descripcionProyecto,
    tagline: docs.tagline || descripcionProyecto.slice(0, 80),
    directorio: dir,
    fecha: new Date().toISOString().slice(0, 10),

    // Código y lenguajes
    estadisticas,
    lenguaje_principal: Object.entries(estadisticas.lenguajes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Desconocido',

    // Stack
    stack,
    stack_resumen: [
      ...stack.backend,
      ...stack.frontend,
      ...stack.bd,
    ].filter(Boolean).slice(0, 8).join(', '),

    // Tests
    tests,
    tiene_tests: tests.total > 0 || tests.archivos > 0,

    // Documentación
    docs,
    tiene_readme: !!docs.readme,

    // Features
    features,

    // Git
    git: {
      ultimo_commit: estadisticas.ultimo_commit,
      autor: estadisticas.autor,
      commits: estadisticas.commits_total,
    },
  };
}

function normalizarNombre(nombre) {
  return nombre
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * @typedef {Object} RepoAnalysis
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string} tagline
 * @property {string} directorio
 * @property {string} fecha
 * @property {Object} estadisticas
 * @property {string} lenguaje_principal
 * @property {Object} stack
 * @property {string} stack_resumen
 * @property {Object} tests
 * @property {boolean} tiene_tests
 * @property {Object} docs
 * @property {boolean} tiene_readme
 * @property {Array} features
 * @property {Object} git
 */

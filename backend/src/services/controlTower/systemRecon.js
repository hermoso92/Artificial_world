import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export function detectStack(inventory) {
  const { files } = inventory;
  const extCounts = {};
  const fileNames = new Set(files.map((f) => f.name));
  const filePaths = files.map((f) => f.path);

  for (const f of files) {
    extCounts[f.ext] = (extCounts[f.ext] || 0) + 1;
  }

  const stack = [];

  // Language detection
  if (fileNames.has('requirements.txt') || fileNames.has('pyproject.toml') || fileNames.has('setup.py') || (extCounts['.py'] ?? 0) > 5) {
    stack.push('Python');
  }
  if (fileNames.has('package.json')) {
    const jsCount = (extCounts['.js'] ?? 0) + (extCounts['.mjs'] ?? 0) + (extCounts['.cjs'] ?? 0);
    const tsCount = (extCounts['.ts'] ?? 0) + (extCounts['.tsx'] ?? 0);
    if (tsCount > 5) stack.push('TypeScript');
    else if (jsCount > 5) stack.push('JavaScript / Node.js');
  }
  if (fileNames.has('go.mod')) stack.push('Go');
  if (fileNames.has('Cargo.toml')) stack.push('Rust');
  if (fileNames.has('pom.xml') || fileNames.has('build.gradle')) stack.push('Java');
  if ((extCounts['.rb'] ?? 0) > 3) stack.push('Ruby');
  if ((extCounts['.php'] ?? 0) > 3) stack.push('PHP');

  // Framework detection
  const packageJsonFile = files.find((f) => f.name === 'package.json' && !f.path.includes('/'));
  if (packageJsonFile) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonFile.fullPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react || deps['react-dom']) stack.push('React');
      if (deps.next) stack.push('Next.js');
      if (deps.vue) stack.push('Vue.js');
      if (deps.svelte) stack.push('Svelte');
      if (deps.express) stack.push('Express');
      if (deps.fastify) stack.push('Fastify');
      if (deps.nestjs || deps['@nestjs/core']) stack.push('NestJS');
    } catch { /* ignore */ }
  }

  const hasManagePy = fileNames.has('manage.py');
  const hasSettings = filePaths.some((p) => p.endsWith('settings.py'));
  if (hasManagePy && hasSettings) stack.push('Django');

  if (filePaths.some((p) => p.includes('fastapi') || p.endsWith('main.py'))) {
    // Check requirements for FastAPI
    const reqFile = files.find((f) => f.name === 'requirements.txt');
    if (reqFile) {
      try {
        const content = readFileSync(reqFile.fullPath, 'utf8');
        if (content.toLowerCase().includes('fastapi')) stack.push('FastAPI');
      } catch { /* ignore */ }
    }
  }

  // Infrastructure
  if (fileNames.has('Dockerfile') || filePaths.some((p) => p.startsWith('Dockerfile'))) stack.push('Docker');
  if (fileNames.has('docker-compose.yml') || fileNames.has('docker-compose.yaml')) stack.push('Docker Compose');
  if (filePaths.some((p) => p.endsWith('.tf'))) stack.push('Terraform');

  // DB
  if (filePaths.some((p) => p.includes('prisma') || p.endsWith('schema.prisma'))) stack.push('Prisma');
  if (filePaths.some((p) => p.includes('migration') || p.endsWith('.sql'))) stack.push('SQL');
  if (filePaths.some((p) => p.includes('mongo') || p.includes('mongoose'))) stack.push('MongoDB');

  return [...new Set(stack)]; // deduplicate
}

export function detectEntryPoints(inventory) {
  const candidates = [
    'main.py', 'app.py', 'server.py', 'run.py', 'wsgi.py', 'asgi.py', 'manage.py',
    'index.js', 'server.js', 'app.js', 'main.js', 'index.mjs',
    'index.ts', 'server.ts', 'main.ts', 'app.ts',
    'main.go', 'cmd/main.go',
    'src/main.rs', 'main.rs',
    'App.jsx', 'App.tsx', 'src/App.jsx', 'src/App.tsx',
  ];

  const found = [];
  for (const candidate of candidates) {
    const file = inventory.files.find((f) => f.path === candidate || f.path.endsWith('/' + candidate));
    if (file) found.push(file.path);
  }
  return found;
}

export function detectStructure(inventory) {
  const { files } = inventory;
  const topLevelDirs = new Set();
  const extCounts = {};
  let totalLines = 0;

  for (const f of files) {
    const parts = f.path.split('/');
    if (parts.length > 1) topLevelDirs.add(parts[0]);
    extCounts[f.ext] = (extCounts[f.ext] || 0) + 1;
  }

  return {
    total_files: files.length,
    top_level_dirs: [...topLevelDirs].sort(),
    extension_counts: extCounts,
  };
}

export function detectDependencies(repoPath) {
  const deps = {};

  // Node.js
  const pkgPath = join(repoPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      deps.nodejs = {
        name: pkg.name,
        version: pkg.version,
        dependencies: pkg.dependencies ?? {},
        devDependencies: pkg.devDependencies ?? {},
        scripts: pkg.scripts ?? {},
      };
    } catch { /* ignore */ }
  }

  // Python
  const reqPath = join(repoPath, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      const lines = readFileSync(reqPath, 'utf8').split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      deps.python_requirements = lines;
    } catch { /* ignore */ }
  }

  const pyprojectPath = join(repoPath, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      deps.pyproject_toml = readFileSync(pyprojectPath, 'utf8').slice(0, 3000);
    } catch { /* ignore */ }
  }

  // Go
  const goModPath = join(repoPath, 'go.mod');
  if (existsSync(goModPath)) {
    try {
      deps.go_mod = readFileSync(goModPath, 'utf8').slice(0, 3000);
    } catch { /* ignore */ }
  }

  return deps;
}

export function buildReconReport(repoPath, inventory) {
  const stack = detectStack(inventory);
  const entry_points = detectEntryPoints(inventory);
  const structure = detectStructure(inventory);
  const dependencies = detectDependencies(repoPath);

  return {
    stack,
    entry_points,
    structure,
    dependencies,
    analyzed_at: new Date().toISOString(),
  };
}

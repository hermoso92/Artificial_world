import { execSync } from 'child_process';
import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join, extname, relative } from 'path';
import { rmSync } from 'fs';

const MAX_FILES = 5000;
const MAX_CHARS_PER_FILE = 8000;
const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '__pycache__', '.cache',
  'coverage', '.next', '.nuxt', 'vendor', '.venv', 'venv', 'env',
  'target', 'bin', 'obj', '.idea', '.vscode', 'out',
]);
const CODE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.py', '.rb', '.go', '.java', '.cs', '.cpp', '.c', '.h',
  '.rs', '.php', '.swift', '.kt', '.scala', '.sh', '.bash',
  '.yml', '.yaml', '.json', '.toml', '.ini', '.cfg', '.env.example',
  '.md', '.txt', '.html', '.css', '.scss', '.sql',
  '.dockerfile', '.tf', '.hcl',
]);
const IMPORTANT_FILES = new Set([
  'package.json', 'requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg',
  'Pipfile', 'go.mod', 'go.sum', 'Cargo.toml', 'pom.xml', 'build.gradle',
  'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  '.env.example', 'Makefile', 'README.md', 'README.rst',
  'manage.py', 'main.py', 'app.py', 'server.js', 'index.js', 'main.go',
  'tsconfig.json', 'vite.config.js', 'vite.config.ts', 'webpack.config.js',
]);

export function cloneRepo(repoUrl, destDir) {
  // Clean existing dir if present
  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true, force: true });
  }

  // Support local paths for testing
  if (existsSync(repoUrl) && statSync(repoUrl).isDirectory()) {
    execSync(`cp -r "${repoUrl}" "${destDir}"`, { timeout: 30000 });
    return { method: 'copy', source: repoUrl };
  }

  execSync(`git clone --depth 1 --single-branch "${repoUrl}" "${destDir}"`, {
    timeout: 60000,
    stdio: 'pipe',
  });
  return { method: 'clone', source: repoUrl };
}

export function buildFileInventory(repoPath) {
  const files = [];
  let skipped = 0;

  function walk(dir, depth = 0) {
    if (files.length >= MAX_FILES) return;
    if (depth > 10) return;

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) { skipped++; continue; }

      const fullPath = join(dir, entry.name);
      const relPath = relative(repoPath, fullPath);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        let size = 0;
        try { size = statSync(fullPath).size; } catch { continue; }
        if (size > 1024 * 1024) continue; // skip files > 1MB

        files.push({
          path: relPath,
          fullPath,
          name: entry.name,
          ext: extname(entry.name).toLowerCase(),
          size,
          isImportant: IMPORTANT_FILES.has(entry.name),
        });
      }
    }
  }

  walk(repoPath);
  return { files, truncated: skipped > 0, skipped };
}

export function readRelevantFiles(inventory, maxCharsPerFile = MAX_CHARS_PER_FILE) {
  const contents = {};

  // Always read important files first
  const prioritized = [
    ...inventory.files.filter((f) => f.isImportant),
    ...inventory.files.filter((f) => !f.isImportant && CODE_EXTENSIONS.has(f.ext)),
  ].slice(0, 200); // limit to 200 files max for analysis

  for (const file of prioritized) {
    try {
      const raw = readFileSync(file.fullPath, 'utf8');
      contents[file.path] = raw.length > maxCharsPerFile
        ? raw.slice(0, maxCharsPerFile) + '\n... [truncado]'
        : raw;
    } catch {
      // skip unreadable files
    }
  }

  return contents;
}

export function readDocsPath(docsPath) {
  if (!docsPath || !existsSync(docsPath)) return {};

  const contents = {};
  const DOC_EXTS = new Set(['.md', '.txt', '.rst', '.adoc']);

  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && DOC_EXTS.has(extname(entry.name).toLowerCase())) {
        try {
          const raw = readFileSync(fullPath, 'utf8');
          contents[fullPath] = raw.slice(0, MAX_CHARS_PER_FILE);
        } catch {
          // skip
        }
      }
    }
  }

  walk(docsPath);
  return contents;
}

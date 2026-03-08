import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_ROOT = path.join(__dirname, '../../../docs/ia-memory');

const MEMORY_CATALOG = {
  technicalDecisions: {
    type: 'markdown',
    path: path.join(MEMORY_ROOT, 'technical-decisions.md'),
    description: 'Decisiones técnicas y límites del sistema',
  },
  prompts: {
    type: 'json',
    path: path.join(MEMORY_ROOT, 'prompts.json'),
    description: 'Prompts versionados del ai-core',
  },
  frequentFailures: {
    type: 'json',
    path: path.join(MEMORY_ROOT, 'frequent-failures.json'),
    description: 'Errores frecuentes y pasos de diagnóstico',
  },
  glossary: {
    type: 'markdown',
    path: path.join(MEMORY_ROOT, 'glossary.md'),
    description: 'Glosario de dominio',
  },
  reports: {
    type: 'markdown',
    path: path.join(MEMORY_ROOT, 'reports', 'README.md'),
    description: 'Convenciones para reportes generados',
  },
  sessionExample: {
    type: 'json',
    path: path.join(MEMORY_ROOT, 'session-examples', 'demo-session-route.json'),
    description: 'Ejemplo versionado de sesión y ruta',
  },
};

function safeReadFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function safeReadJson(filePath) {
  const raw = safeReadFile(filePath);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAiMemoryCatalog() {
  return Object.entries(MEMORY_CATALOG).map(([key, value]) => ({
    key,
    type: value.type,
    path: path.relative(process.cwd(), value.path).replace(/\\/g, '/'),
    exists: fs.existsSync(value.path),
    description: value.description,
  }));
}

export function loadPromptTemplate(name) {
  const prompts = safeReadJson(MEMORY_CATALOG.prompts.path) ?? {};
  return prompts[name] ?? null;
}

export function loadMemoryEntry(key) {
  const entry = MEMORY_CATALOG[key];
  if (!entry) return null;

  if (entry.type === 'json') {
    return {
      key,
      type: entry.type,
      description: entry.description,
      content: safeReadJson(entry.path),
    };
  }

  return {
    key,
    type: entry.type,
    description: entry.description,
    content: safeReadFile(entry.path),
  };
}

export function loadMemoryEntries(keys = []) {
  const uniqueKeys = [...new Set(keys)].filter(Boolean);
  return uniqueKeys
    .map((key) => loadMemoryEntry(key))
    .filter((entry) => entry && entry.content);
}

export function buildMemoryContext(keys = []) {
  const entries = loadMemoryEntries(keys);
  if (entries.length === 0) return '';

  return entries.map((entry) => {
    if (entry.type === 'json') {
      return `## ${entry.key}\n${JSON.stringify(entry.content)}`;
    }
    return `## ${entry.key}\n${String(entry.content).trim()}`;
  }).join('\n\n');
}

export { MEMORY_ROOT };

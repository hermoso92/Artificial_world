import { callSpecialistLLM, parseSpecialistResponse, formatFilesForPrompt, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un arquitecto de software senior. Tu rol es analizar la arquitectura de un repositorio real y producir un diagnóstico técnico honesto y accionable.

Analiza:
- Estructura de directorios y organización del código
- Separación de responsabilidades (capas, módulos, servicios)
- Patrones arquitectónicos detectados (MVC, hexagonal, monolito, microservicios, etc.)
- Deuda técnica estructural visible
- Coherencia entre la arquitectura declarada y la implementada
- Puntos de acoplamiento excesivo

${getContractInstruction()}`;

const LAYER_DIRS = {
  frontend: ['frontend', 'client', 'web', 'ui', 'public', 'static'],
  backend: ['backend', 'server', 'api', 'src', 'app'],
  data: ['db', 'database', 'migrations', 'data', 'models', 'schemas'],
  testing: ['test', 'tests', '__tests__', 'spec', 'specs', 'e2e'],
  infra: ['docker', 'k8s', 'terraform', 'infra', 'deploy', '.github'],
  docs: ['docs', 'doc', 'documentation', 'wiki'],
  tooling: ['scripts', 'bin', 'tools', 'utils', 'helpers', 'lib'],
};

const MONOREPO_SIGNALS = ['packages', 'apps', 'services', 'modules', 'libs', 'workspace'];
const MICROSERVICE_SIGNALS = ['services', 'gateway', 'broker', 'queue', 'worker'];

function detectArchPattern(topDirs, entryPoints) {
  const dirs = new Set(topDirs.map((d) => d.toLowerCase()));
  if (MONOREPO_SIGNALS.some((s) => dirs.has(s))) return 'monorepo';
  if (MICROSERVICE_SIGNALS.filter((s) => dirs.has(s)).length >= 2) return 'microservicios';
  const hasFrontend = LAYER_DIRS.frontend.some((d) => dirs.has(d));
  const hasBackend = LAYER_DIRS.backend.some((d) => dirs.has(d));
  if (hasFrontend && hasBackend) return 'fullstack-monolito';
  if (entryPoints.length > 3) return 'multi-entrypoint';
  return 'monolito';
}

function detectLayers(topDirs) {
  const dirs = new Set(topDirs.map((d) => d.toLowerCase()));
  return Object.entries(LAYER_DIRS)
    .filter(([, candidates]) => candidates.some((c) => dirs.has(c)))
    .map(([layer]) => layer);
}

function analyzeArchitectureStatic(recon) {
  const { stack = [], entry_points = [], structure = {} } = recon;
  const topDirs = structure.top_level_dirs ?? [];
  const extCounts = structure.extension_counts ?? {};
  const totalFiles = structure.total_files ?? 0;

  const archType = detectArchPattern(topDirs, entry_points);
  const layers = detectLayers(topDirs);
  const findings = [];
  const risks = [];
  const actions = [];

  findings.push(`Patrón arquitectónico detectado: ${archType}. Stack: ${stack.join(', ') || 'no determinado'}.`);
  if (topDirs.length > 0) findings.push(`Estructura top-level: ${topDirs.join(', ')} (${totalFiles} archivos totales).`);
  if (layers.length > 0) {
    findings.push(`Capas identificadas: ${layers.join(', ')}.`);
  } else {
    findings.push('No se detectaron capas arquitectónicas claras en la estructura de directorios.');
    risks.push({ level: 'medium', description: 'Ausencia de separación en capas puede indicar mezcla de responsabilidades.' });
  }
  if (entry_points.length > 0) {
    findings.push(`Puntos de entrada detectados: ${entry_points.join(', ')}.`);
  } else {
    findings.push('No se detectaron puntos de entrada convencionales.');
    risks.push({ level: 'low', description: 'Sin puntos de entrada claros — puede dificultar el onboarding.' });
  }
  if (!layers.includes('testing')) {
    findings.push('No se detectó directorio de tests.');
    risks.push({ level: 'medium', description: 'Sin estructura de tests visible — calidad del código no verificable automáticamente.' });
    actions.push('Crear directorio de tests y añadir cobertura básica.');
  }
  if (!layers.includes('docs')) {
    findings.push('Sin directorio de documentación (docs/).');
    actions.push('Crear docs/ con arquitectura y guía de desarrollo.');
  }
  const langsPresent = ['.js', '.ts', '.py', '.go', '.rb', '.java', '.rs'].filter((e) => (extCounts[e] ?? 0) > 0);
  if (langsPresent.length > 2) {
    findings.push(`Múltiples lenguajes (${langsPresent.join(', ')}) — verificar si es intencional.`);
  }

  const hasMedium = risks.some((r) => r.level === 'medium');
  const hasHigh = risks.some((r) => r.level === 'high');
  const status = hasHigh ? 'critical' : hasMedium ? 'warning' : 'healthy';

  return {
    summary: `Arquitectura tipo ${archType} con ${totalFiles} archivos. ${layers.length > 0 ? `Capas: ${layers.join(', ')}.` : 'Sin separación en capas clara.'}`,
    status_assessment: status,
    findings,
    risks,
    evidence: entry_points.map((ep) => ({ file: ep, line: null, snippet: null })),
    uncertainties: [
      'Análisis estático — los patrones se infieren de nombres de directorios.',
      'No se evaluó la calidad del código dentro de los archivos.',
    ],
    recommended_actions: actions.length > 0 ? actions : ['Documentar la arquitectura en README o docs/ARCHITECTURE.md.'],
    confidence_level: topDirs.length > 2 ? 0.65 : 0.45,
  };
}

export async function run(missionContext) {
  const { recon, fileContents } = missionContext;

  const staticResult = analyzeArchitectureStatic(recon);

  const relevantFiles = {};
  const archPatterns = ['server.js', 'index.js', 'app.js', 'main.py', 'app.py', 'manage.py', 'package.json', 'requirements.txt', 'docker-compose.yml', 'Dockerfile'];

  for (const [path, content] of Object.entries(fileContents)) {
    const name = path.split('/').pop();
    if (archPatterns.includes(name) || path.split('/').length <= 2) relevantFiles[path] = content;
  }

  const topDirs = new Set(Object.keys(fileContents).map((p) => p.split('/')[0]));
  for (const dir of topDirs) {
    const samples = Object.entries(fileContents).filter(([p]) => p.startsWith(dir + '/')).slice(0, 2);
    for (const [p, c] of samples) relevantFiles[p] = c;
  }

  const userPrompt = `# Repositorio a analizar\n\n## Stack\n${recon.stack.join(', ') || 'No determinado'}\n\n## Puntos de entrada\n${recon.entry_points.join('\n') || 'No detectados'}\n\n## Estructura\nDirectorios: ${recon.structure.top_level_dirs?.join(', ')}\nTotal archivos: ${recon.structure.total_files}\nExtensiones: ${JSON.stringify(recon.structure.extension_counts)}\n\n## Hallazgos estáticos\n${staticResult.findings.join('\n')}\n\n## Archivos de referencia\n${formatFilesForPrompt(relevantFiles, 10000)}\n\nEnriquece y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  if (!text) return staticResult;

  const llm = parseSpecialistResponse(text);
  return {
    ...llm,
    findings: [...new Set([...staticResult.findings, ...llm.findings])],
    risks: [...staticResult.risks, ...llm.risks],
    evidence: [...staticResult.evidence, ...llm.evidence],
    recommended_actions: [...new Set([...staticResult.recommended_actions, ...llm.recommended_actions])],
    confidence_level: Math.max(staticResult.confidence_level, llm.confidence_level),
  };
}

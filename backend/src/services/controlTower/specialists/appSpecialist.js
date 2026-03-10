import { callSpecialistLLM, parseSpecialistResponse, formatFilesForPrompt, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un senior developer con experiencia en múltiples lenguajes y frameworks. Tu rol es analizar la calidad del código de una aplicación real.

Analiza:
- Patrones de código dominantes (buenas prácticas vs antipatrones)
- Mantenibilidad: complejidad visible, funciones largas, duplicación
- Manejo de errores: presencia y calidad
- Configuración y gestión de secretos (¿está bien separada?)
- Consistencia de estilo y convenciones
- Testing: ¿hay tests? ¿qué cobertura aparente tienen?
- Code smells visibles (código comentado, TODOs acumulados, nombres confusos)
- Escalabilidad aparente: ¿el código resistiría 10x la carga actual?

${getContractInstruction()}`;

const TODO_RE = /\b(?:TODO|FIXME|HACK|XXX|BUG|NOSONAR)\b/g;
const CONSOLE_LOG_RE = /console\.(log|warn|debug)\s*\(/g;
const TRY_CATCH_RE = /\btry\s*\{/g;
const ASYNC_RE = /\basync\s+function|\basync\s+\(|=>.*await/g;
const CALLBACK_HELL_RE = /function\s*\([^)]*\)\s*\{[\s\S]{0,200}function\s*\([^)]*\)\s*\{[\s\S]{0,200}function\s*\([^)]*\)\s*\{/g;
const LONG_FUNCTION_RE = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)\s*\{([^{}]*\{[^{}]*\}[^{}]*){10,}/g;
const ENV_VAR_RE = /process\.env\.|os\.environ|getenv\s*\(/g;

function analyzeAppStatic(fileContents, recon) {
  const findings = [];
  const risks = [];
  const actions = [];
  const evidence = [];

  const codeExts = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.py', '.go', '.rb', '.java', '.rs', '.php']);
  const testPathRe = /(?:^|\/)(?:tests?|__tests__|spec|specs|e2e)\//i;

  let todoCount = 0;
  let consoleLogCount = 0;
  let tryCatchCount = 0;
  let asyncCount = 0;
  let envVarCount = 0;
  let totalCodeFiles = 0;
  let callbackHellFound = false;

  const todoLocations = [];
  const consoleLogLocations = [];

  for (const [path, content] of Object.entries(fileContents)) {
    const ext = '.' + path.split('.').pop().toLowerCase();
    if (!codeExts.has(ext)) continue;
    const isTest = testPathRe.test(path) || /\.(test|spec)\.[jt]sx?$/.test(path);
    totalCodeFiles++;

    // TODOs — count in all files
    TODO_RE.lastIndex = 0;
    const todos = content.match(TODO_RE);
    if (todos) {
      todoCount += todos.length;
      if (todoLocations.length < 3) todoLocations.push(path);
    }

    // console.log — flag in non-test files
    if (!isTest) {
      CONSOLE_LOG_RE.lastIndex = 0;
      const logs = content.match(CONSOLE_LOG_RE);
      if (logs) {
        consoleLogCount += logs.length;
        if (consoleLogLocations.length < 3) consoleLogLocations.push(path);
      }
    }

    // try/catch usage
    TRY_CATCH_RE.lastIndex = 0;
    const tryCatches = content.match(TRY_CATCH_RE);
    if (tryCatches) tryCatchCount += tryCatches.length;

    // async/await usage
    ASYNC_RE.lastIndex = 0;
    const asyncMatches = content.match(ASYNC_RE);
    if (asyncMatches) asyncCount += asyncMatches.length;

    // Callback hell (JS only)
    if (['.js', '.ts', '.jsx', '.tsx', '.mjs'].includes(ext) && !isTest) {
      CALLBACK_HELL_RE.lastIndex = 0;
      if (CALLBACK_HELL_RE.test(content)) callbackHellFound = true;
    }

    // Env var usage
    ENV_VAR_RE.lastIndex = 0;
    const envVars = content.match(ENV_VAR_RE);
    if (envVars) envVarCount += envVars.length;
  }

  // Assess findings
  if (totalCodeFiles > 0) {
    findings.push(`${totalCodeFiles} archivos de código analizados. Stack: ${recon.stack.join(', ') || 'no determinado'}.`);
  }

  if (todoCount > 0) {
    findings.push(`${todoCount} marcadores TODO/FIXME/HACK encontrados (en: ${todoLocations.join(', ')}${todoLocations.length < 3 ? '' : '...'}).`);
    if (todoCount > 20) {
      risks.push({ level: 'medium', description: `Acumulación de deuda técnica documentada: ${todoCount} TODOs/FIXMEs pendientes.` });
      actions.push('Revisar y resolver TODOs/FIXMEs acumulados o trasladarlos a tickets.');
    }
  } else {
    findings.push('Sin marcadores TODO/FIXME detectados.');
  }

  if (consoleLogCount > 0) {
    findings.push(`${consoleLogCount} console.log/warn/debug en código no-test (${consoleLogLocations.join(', ')}${consoleLogLocations.length === 3 ? '...' : ''}).`);
    if (consoleLogCount > 10) {
      risks.push({ level: 'low', description: 'Uso excesivo de console.log en código de producción — usar librería de logging estructurado.' });
      actions.push('Reemplazar console.log por un logger estructurado (winston, pino, etc.).');
    }
  }

  if (tryCatchCount > 0) {
    findings.push(`${tryCatchCount} bloques try/catch detectados — manejo de errores presente.`);
  } else if (totalCodeFiles > 5) {
    findings.push('Sin bloques try/catch detectados — posible ausencia de manejo de errores.');
    risks.push({ level: 'medium', description: 'Sin manejo de errores visible — excepciones no capturadas pueden causar crashes.' });
    actions.push('Añadir manejo de errores explícito en operaciones I/O y llamadas externas.');
  }

  if (asyncCount > 0) {
    findings.push(`Patrones async/await detectados (${asyncCount} ocurrencias) — código asíncrono moderno.`);
  }

  if (callbackHellFound) {
    findings.push('Posible "callback hell" detectado — anidamiento excesivo de callbacks.');
    risks.push({ level: 'medium', description: 'Callback hell: dificulta el mantenimiento y el manejo de errores.' });
    actions.push('Refactorizar callbacks anidados a async/await o Promises.');
  }

  if (envVarCount > 0) {
    findings.push(`${envVarCount} referencias a variables de entorno — configuración externalizada.`);
  }

  const hasMedium = risks.some((r) => r.level === 'medium');
  const hasHigh = risks.some((r) => r.level === 'high');
  const status = hasHigh ? 'critical' : hasMedium ? 'warning' : 'healthy';

  const summary = `Análisis de ${totalCodeFiles} archivos de código. ${findings.slice(0, 2).join(' ')}`;

  return {
    summary,
    status_assessment: status,
    findings,
    risks,
    evidence,
    uncertainties: [
      'El análisis estático no puede evaluar lógica de negocio, correctitud o cobertura real de tests.',
      'Las métricas de complejidad son aproximadas (basadas en patrones de texto).',
    ],
    recommended_actions: actions.length > 0 ? actions : ['Revisar manualmente los módulos más complejos.'],
    confidence_level: totalCodeFiles > 5 ? 0.62 : 0.4,
  };
}

export async function run(missionContext) {
  const { recon, fileContents } = missionContext;

  const staticResult = analyzeAppStatic(fileContents, recon);

  const codeFiles = {};
  const skipExts = new Set(['.json', '.md', '.txt', '.yml', '.yaml', '.toml', '.lock', '.env']);
  const skipNames = new Set(['package.json', 'package-lock.json', 'yarn.lock', 'requirements.txt']);
  let budget = 12000;

  for (const [path, content] of Object.entries(fileContents)) {
    if (budget <= 0) break;
    const name = path.split('/').pop();
    const ext = '.' + name.split('.').pop();
    if (skipExts.has(ext) || skipNames.has(name)) continue;
    const isCore = /^(src|lib|core|services|controllers|routes|models|handlers)\//.test(path);
    if (isCore || Object.keys(codeFiles).length < 15) {
      const slice = content.slice(0, Math.min(content.length, 600));
      codeFiles[path] = slice;
      budget -= slice.length;
    }
  }

  const userPrompt = `# Análisis de calidad de aplicación\n\n## Stack\n${recon.stack.join(', ') || 'No determinado'}\n\n## Estructura\nDirectorios: ${recon.structure.top_level_dirs.join(', ')}\nTotal archivos: ${recon.structure.total_files}\n\n## Hallazgos estáticos\n${staticResult.findings.join('\n')}\n\n## Muestra de código fuente\n${formatFilesForPrompt(codeFiles, 12000)}\n\nEnriquece el análisis de calidad y produce el JSON de diagnóstico.`;

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

import { callSpecialistLLM, parseSpecialistResponse, formatFilesForPrompt, getContractInstruction } from './base.js';

export const SECURITY_TIMEOUT_MS = 30000;

const SYSTEM_PROMPT = `Eres un especialista en seguridad de aplicaciones. Tu rol es identificar riesgos de seguridad concretos y evidenciados en el código.

Analiza ÚNICAMENTE lo que puedas verificar con el código proporcionado:
- Secretos hardcodeados (API keys, passwords, tokens en código o config files)
- Variables de entorno mal gestionadas (.env con secretos reales, sin .env.example)
- Configuración CORS insegura (allow all origins en producción)
- Inyección SQL o NoSQL visible (queries con interpolación de strings)
- Validación de inputs ausente en endpoints críticos
- Autenticación y autorización: ausencia o debilidad visible
- Dependencias con CVEs conocidas (según tu conocimiento a agosto 2025)
- Exposición de rutas administrativas sin protección
- Información sensible en logs

No inventes vulnerabilidades. Si no hay evidencia, ponlo en uncertainties.

${getContractInstruction()}`;

// Patterns that indicate potential security issues
const SECURITY_PATTERNS = [
  {
    re: /(['"`])(?:password|passwd|pwd|secret|api[_-]?key|private[_-]?key|auth[_-]?token|access[_-]?token)\1\s*[:=]\s*(['"`])[^'"`]{4,}\2/gi,
    level: 'high',
    label: 'Posible credencial hardcodeada',
  },
  {
    re: /eval\s*\(/g,
    level: 'high',
    label: 'Uso de eval() — ejecución dinámica de código',
  },
  {
    re: /exec\s*\(\s*`[^`]*\$\{/g,
    level: 'high',
    label: 'Shell exec con interpolación de variable — posible command injection',
  },
  {
    re: /query\s*\([^)]*\+\s*(?:req\.|params\.|body\.|query\.)/g,
    level: 'high',
    label: 'Query SQL con concatenación de input — posible SQL injection',
  },
  {
    re: /cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/g,
    level: 'medium',
    label: 'CORS configurado con origin: "*" — permite cualquier origen',
  },
  {
    re: /console\.log\s*\([^)]*(?:password|token|secret|key)/gi,
    level: 'medium',
    label: 'Posible log de información sensible',
  },
  {
    re: /http:\/\/(?!localhost|127\.0\.0\.1)/g,
    level: 'low',
    label: 'URL HTTP (no HTTPS) en código — posible comunicación sin cifrar',
  },
  {
    re: /Math\.random\(\)/g,
    level: 'low',
    label: 'Math.random() usado — no es criptográficamente seguro para tokens/IDs de seguridad',
  },
];

const TEST_PATH_RE = /(?:^|\/)(?:tests?|__tests__|spec|specs|e2e)\//i;

function isTestFile(filePath) {
  return TEST_PATH_RE.test(filePath) || /\.(test|spec)\.[jt]sx?$/.test(filePath);
}

function scanFilesForPatterns(fileContents) {
  const findings = [];
  const risks = [];
  const evidence = [];

  for (const [filePath, content] of Object.entries(fileContents)) {
    const inTest = isTestFile(filePath);
    for (const { re, level, label } of SECURITY_PATTERNS) {
      re.lastIndex = 0;
      const matches = content.match(re);
      if (!matches) continue;

      // Downgrade severity for findings in test files
      const effectiveLevel = inTest
        ? (level === 'high' ? 'low' : level === 'medium' ? 'low' : 'low')
        : level;

      // Skip low-value patterns in test files entirely (HTTP URLs, Math.random)
      if (inTest && (label.includes('HTTP') || label.includes('Math.random'))) continue;

      // Find approximate line number
      let lineNum = null;
      const lines = content.split('\n');
      re.lastIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        re.lastIndex = 0;
        if (re.test(lines[i])) { lineNum = i + 1; break; }
      }
      re.lastIndex = 0;

      const snippet = matches[0].slice(0, 120);
      const testNote = inTest ? ' (en archivo de test)' : '';
      findings.push(`[${label}] en ${filePath}${lineNum ? `:${lineNum}` : ''}${testNote}.`);
      risks.push({ level: effectiveLevel, description: `${label} detectado en ${filePath}${testNote}.` });
      evidence.push({ file: filePath, line: lineNum, snippet });
    }
  }

  return { findings, risks, evidence };
}

function checkEnvFiles(fileContents) {
  const findings = [];
  const risks = [];

  const hasEnvExample = Object.keys(fileContents).some((p) => p.includes('.env.example') || p.includes('.env.sample'));
  const hasRealEnv = Object.keys(fileContents).some((p) => /^\.env$|\/\.env$/.test(p));

  if (hasRealEnv) {
    const envContent = Object.entries(fileContents).find(([p]) => /^\.env$|\/\.env$/.test(p))?.[1] ?? '';
    const hasRealValues = envContent.split('\n').some((line) => {
      const [, val] = line.split('=');
      return val && val.trim().length > 3 && !val.trim().startsWith('your_') && !val.trim().startsWith('example');
    });
    if (hasRealValues) {
      findings.push('Archivo .env con posibles valores reales commiteado al repositorio.');
      risks.push({ level: 'high', description: 'Secretos reales en .env commiteado — expone credenciales al acceso al repositorio.' });
    }
  }

  if (!hasEnvExample && Object.keys(fileContents).some((p) => p.includes('.env'))) {
    findings.push('Sin .env.example — no hay documentación de las variables de entorno requeridas.');
    risks.push({ level: 'low', description: 'La ausencia de .env.example dificulta la configuración segura del proyecto.' });
  }

  return { findings, risks };
}

function analyzeSecurityStatic(fileContents, recon) {
  const { findings: patternFindings, risks: patternRisks, evidence } = scanFilesForPatterns(fileContents);
  const { findings: envFindings, risks: envRisks } = checkEnvFiles(fileContents);

  const allFindings = [...patternFindings, ...envFindings];
  const allRisks = [...patternRisks, ...envRisks];

  const hasHigh = allRisks.some((r) => r.level === 'high');
  const hasMedium = allRisks.some((r) => r.level === 'medium');

  let status = 'healthy';
  if (hasHigh) status = 'critical';
  else if (hasMedium) status = 'warning';

  const actions = [];
  if (hasHigh) actions.push('Revisar y eliminar credenciales hardcodeadas o expuestas urgentemente.');
  if (allFindings.some((f) => f.includes('eval'))) actions.push('Eliminar uso de eval() y reemplazar con alternativas seguras.');
  if (allFindings.some((f) => f.includes('SQL'))) actions.push('Usar consultas parametrizadas o un ORM para prevenir SQL injection.');
  if (allFindings.some((f) => f.includes('CORS'))) actions.push('Restringir CORS a los orígenes de confianza específicos.');
  if (actions.length === 0) actions.push('Realizar revisión manual de autenticación y autorización.');

  const summary = allFindings.length > 0
    ? `Se detectaron ${allFindings.length} señales de riesgo de seguridad: ${allFindings.slice(0, 2).join('; ')}.`
    : `Análisis estático de seguridad completado sin patrones de riesgo evidentes en ${Object.keys(fileContents).length} archivos.`;

  return {
    summary,
    status_assessment: status,
    findings: allFindings.length > 0 ? allFindings : ['No se detectaron patrones de riesgo evidentes en los archivos analizados.'],
    risks: allRisks,
    evidence,
    uncertainties: [
      'El análisis estático no cubre vulnerabilidades en dependencias (requiere npm audit).',
      'No se analizaron flujos de autenticación completos ni lógica de negocio.',
      `Se analizaron ${Object.keys(fileContents).length} archivos — el repositorio puede contener más código no incluido.`,
    ],
    recommended_actions: actions,
    confidence_level: allFindings.length > 0 ? 0.7 : 0.5,
  };
}

export async function run(missionContext) {
  const { recon, fileContents } = missionContext;

  // Filter to security-relevant files for both static analysis and LLM
  const secFiles = {};
  const secPatterns = ['.env', '.env.example', '.env.local', '.env.production', 'config.js', 'config.ts', 'settings.py', 'config.py', 'server.js', 'app.js', 'index.js', 'main.py', 'app.py'];
  const authPatterns = ['auth', 'middleware', 'security', 'cors', 'jwt', 'token', 'session'];

  for (const [path, content] of Object.entries(fileContents)) {
    const name = path.split('/').pop().toLowerCase();
    const isSecFile = secPatterns.some((p) => name === p || name.startsWith(p));
    const isAuthPath = authPatterns.some((p) => path.toLowerCase().includes(p));
    if (isSecFile || isAuthPath) secFiles[path] = content;
  }

  if (Object.keys(secFiles).length < 5) {
    for (const [path, content] of Object.entries(fileContents)) {
      if (path.includes('/routes/') || path.includes('/controllers/')) {
        secFiles[path] = content.slice(0, 800);
      }
    }
  }

  // Static analysis runs on ALL file contents (not just sec-filtered)
  const staticResult = analyzeSecurityStatic(fileContents, recon);

  const userPrompt = `# Auditoría de seguridad\n\n## Stack\n${recon.stack.join(', ') || 'No determinado'}\n\n## Hallazgos del análisis estático\n${staticResult.findings.join('\n')}\n\n## Archivos de referencia\n${formatFilesForPrompt(secFiles, 8000)}\n\nEnriquece el análisis de seguridad y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt, SECURITY_TIMEOUT_MS);
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

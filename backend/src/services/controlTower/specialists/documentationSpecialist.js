import { callSpecialistLLM, parseSpecialistResponse, formatFilesForPrompt, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un especialista en calidad de documentación técnica. Tu rol es evaluar la documentación de un repositorio de software de forma objetiva.

Analiza:
- Existencia y calidad del README (setup, uso, arquitectura, contribución)
- Documentación de API (endpoints, contratos, ejemplos)
- Comentarios en código (presencia, calidad, actualidad)
- Documentación de instalación y despliegue
- Guías de contribución y onboarding
- Coherencia entre documentación y código real
- Documentación de decisiones técnicas (ADRs, changelogs)
- Gaps críticos de documentación que bloquean la adopción

${getContractInstruction()}`;

const CRITICAL_DOCS = [
  { file: 'README.md', label: 'README principal', weight: 3 },
  { file: 'readme.md', label: 'README principal', weight: 3 },
  { file: 'CONTRIBUTING.md', label: 'Guía de contribución', weight: 2 },
  { file: 'contributing.md', label: 'Guía de contribución', weight: 2 },
  { file: 'CHANGELOG.md', label: 'Changelog', weight: 1 },
  { file: 'changelog.md', label: 'Changelog', weight: 1 },
  { file: 'LICENSE', label: 'Licencia', weight: 1 },
  { file: 'license', label: 'Licencia', weight: 1 },
  { file: '.env.example', label: 'Ejemplo de variables de entorno', weight: 2 },
  { file: '.env.sample', label: 'Ejemplo de variables de entorno', weight: 2 },
];

function analyzeDocumentationStatic(fileContents, recon) {
  const allPaths = new Set(Object.keys(fileContents).map((p) => p.toLowerCase()));
  const findings = [];
  const risks = [];
  const evidence = [];
  const actions = [];

  // Check critical docs
  let docScore = 0;
  let maxScore = 0;
  const missing = [];

  for (const { file, label, weight } of CRITICAL_DOCS) {
    maxScore += weight;
    const found = allPaths.has(file) ||
      [...allPaths].some((p) => p.endsWith('/' + file));
    if (found) {
      docScore += weight;
      // Check README length
      if (file.toLowerCase().startsWith('readme')) {
        const readmePath = Object.keys(fileContents).find((p) => p.toLowerCase() === file || p.toLowerCase().endsWith('/' + file));
        if (readmePath) {
          const len = fileContents[readmePath].length;
          if (len < 500) {
            findings.push(`README presente pero muy corto (${len} chars) — insuficiente para onboarding.`);
            risks.push({ level: 'medium', description: 'README demasiado corto para ser útil en onboarding o due diligence.' });
            actions.push('Ampliar README con instrucciones de instalación, uso y arquitectura básica.');
            evidence.push({ file: readmePath, line: null, snippet: null });
          } else {
            findings.push(`README presente (${len} chars).`);
            evidence.push({ file: readmePath, line: null, snippet: null });
          }
        }
      }
    } else {
      missing.push(label);
    }
  }

  if (missing.length > 0) {
    // Deduplicate (README.md / readme.md counted once)
    const uniqueMissing = [...new Set(missing)];
    findings.push(`Documentación ausente: ${uniqueMissing.join(', ')}.`);
    if (uniqueMissing.includes('README principal')) {
      risks.push({ level: 'high', description: 'README ausente — el proyecto no puede ser evaluado ni adoptado sin documentación básica.' });
      actions.push('Crear README.md con descripción, instalación, uso y arquitectura.');
    } else if (uniqueMissing.some((m) => ['Guía de contribución', 'Ejemplo de variables de entorno'].includes(m))) {
      risks.push({ level: 'medium', description: `Faltan documentos clave: ${uniqueMissing.join(', ')}.` });
      actions.push(`Crear los documentos faltantes: ${uniqueMissing.join(', ')}.`);
    }
  }

  // Count .md files
  const mdFiles = Object.keys(fileContents).filter((p) => p.endsWith('.md'));
  if (mdFiles.length === 0) {
    findings.push('Sin archivos Markdown en el repositorio.');
    risks.push({ level: 'medium', description: 'Sin documentación en formato Markdown — dificulta la comprensión del proyecto.' });
  } else {
    findings.push(`${mdFiles.length} archivo(s) Markdown encontrado(s): ${mdFiles.slice(0, 5).join(', ')}${mdFiles.length > 5 ? '...' : ''}.`);
  }

  // Check for API docs
  const hasApiDocs = [...allPaths].some((p) =>
    p.includes('openapi') || p.includes('swagger') || p.includes('api-docs') || p.endsWith('.yaml') && (p.includes('api') || p.includes('spec'))
  );
  if (hasApiDocs) {
    findings.push('Documentación de API detectada (OpenAPI/Swagger).');
  } else if (recon.stack?.some((s) => s.toLowerCase().includes('express') || s.toLowerCase().includes('fastapi') || s.toLowerCase().includes('django'))) {
    findings.push('Framework web detectado sin documentación de API (OpenAPI/Swagger).');
    actions.push('Añadir documentación de API con OpenAPI/Swagger.');
  }

  // Comment density in source files
  let totalLines = 0;
  let commentLines = 0;
  const codeExts = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.rs']);
  for (const [path, content] of Object.entries(fileContents)) {
    const ext = '.' + path.split('.').pop();
    if (!codeExts.has(ext)) continue;
    const lines = content.split('\n');
    totalLines += lines.length;
    commentLines += lines.filter((l) => {
      const t = l.trim();
      return t.startsWith('//') || t.startsWith('#') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('"""') || t.startsWith("'''");
    }).length;
  }

  if (totalLines > 100) {
    const ratio = commentLines / totalLines;
    if (ratio < 0.05) {
      findings.push(`Densidad de comentarios muy baja (${(ratio * 100).toFixed(1)}% de líneas comentadas en ${totalLines} líneas analizadas).`);
      risks.push({ level: 'low', description: 'Código escasamente comentado — dificulta el mantenimiento.' });
      actions.push('Añadir comentarios JSDoc/docstrings en funciones públicas y módulos.');
    } else {
      findings.push(`Densidad de comentarios: ${(ratio * 100).toFixed(1)}% (${commentLines}/${totalLines} líneas).`);
    }
  }

  const hasHigh = risks.some((r) => r.level === 'high');
  const hasMedium = risks.some((r) => r.level === 'medium');
  const status = hasHigh ? 'critical' : hasMedium ? 'warning' : 'healthy';

  const pct = maxScore > 0 ? Math.round((docScore / maxScore) * 100) : 0;
  const summary = `Cobertura documental: ${pct}% de los archivos críticos presentes. ${findings[0] || ''}`;

  return {
    summary,
    status_assessment: status,
    findings,
    risks,
    evidence,
    uncertainties: [
      'La calidad del contenido de los documentos no fue evaluada (solo presencia y longitud).',
      'Los comentarios se detectan por patrón de línea — pueden incluir código comentado.',
    ],
    recommended_actions: actions.length > 0 ? actions : ['Mantener documentación actualizada con cada release.'],
    confidence_level: mdFiles?.length > 0 ? 0.68 : 0.5,
  };
}

export async function run(missionContext) {
  const { recon, fileContents, docFiles } = missionContext;

  const staticResult = analyzeDocumentationStatic(fileContents, recon);

  const docContent = {};
  if (docFiles) Object.assign(docContent, docFiles);
  for (const [path, content] of Object.entries(fileContents)) {
    if (path.endsWith('.md') || path.endsWith('.txt') || path.endsWith('.rst')) docContent[path] = content;
  }
  for (const [path, content] of Object.entries(fileContents)) {
    const name = path.split('/').pop();
    if (['package.json', 'requirements.txt', 'pyproject.toml'].includes(name)) docContent[path] = content;
  }

  const userPrompt = `# Repositorio a analizar\n\n## Stack\n${recon.stack.join(', ') || 'No determinado'}\n\n## Total archivos\n${recon.structure.total_files}\n\n## Hallazgos estáticos\n${staticResult.findings.join('\n')}\n\n## Archivos de documentación\n${Object.keys(docContent).join('\n') || 'Ninguno'}\n\n## Contenido\n${formatFilesForPrompt(docContent, 12000)}\n\nEnriquece la evaluación documental y produce el JSON de diagnóstico.`;

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

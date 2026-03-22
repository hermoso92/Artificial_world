import { callSpecialistLLM, parseSpecialistResponse, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un especialista en gestión de dependencias y supply chain de software. Tu rol es auditar las dependencias de un proyecto de forma técnica y rigurosa.

Analiza:
- Dependencias directas: versiones, estado de mantenimiento, licencias problemáticas
- Señales de dependencias obsoletas (versiones muy antiguas, falta de actualizaciones)
- Dependencias con vulnerabilidades conocidas en versiones antiguas (según tu conocimiento)
- Lock files presentes o ausentes
- Dependencias de desarrollo en producción
- Dependencias duplicadas o con propósito superpuesto
- Salud general del grafo de dependencias

${getContractInstruction()}`;

const UNPINNED_RE = /^\*$|^latest$|^x$/;
const SUSPICIOUS_PKGS = ['node-serialize', 'vm2', 'node-eval', 'serialize-javascript'];

function analyzeDependenciesStatic(depsInfo, recon) {
  const findings = [];
  const risks = [];
  const evidence = [];
  const actions = [];
  let status = 'healthy';

  if (depsInfo.nodejs) {
    const { name, version, dependencies = {}, devDependencies = {}, scripts = {} } = depsInfo.nodejs;
    const prodEntries = Object.entries(dependencies);
    const devEntries = Object.entries(devDependencies);
    const total = prodEntries.length + devEntries.length;

    findings.push(
      `Proyecto Node.js "${name}" v${version}: ${prodEntries.length} deps producción, ${devEntries.length} dev (total ${total}).`
    );

    const unpinned = prodEntries.filter(([, v]) => UNPINNED_RE.test(String(v)));
    if (unpinned.length > 0) {
      findings.push(`${unpinned.length} dependencias de producción sin versión fija (*, latest): ${unpinned.slice(0, 4).map(([n]) => n).join(', ')}.`);
      risks.push({ level: 'low', description: `Versiones no fijadas en producción: ${unpinned.map(([n]) => n).join(', ')}.` });
      if (status === 'healthy') status = 'warning';
      actions.push('Fijar versiones exactas en dependencias de producción.');
    }

    const suspicious = [...prodEntries, ...devEntries].filter(([n]) =>
      SUSPICIOUS_PKGS.some((p) => n.toLowerCase().includes(p))
    );
    if (suspicious.length > 0) {
      findings.push(`Paquetes de alto riesgo detectados: ${suspicious.map(([n]) => n).join(', ')}.`);
      risks.push({ level: 'high', description: `${suspicious.map(([n]) => n).join(', ')} tienen historial de vulnerabilidades graves.` });
      suspicious.forEach(([n, v]) => evidence.push({ file: 'package.json', line: null, snippet: `"${n}": "${v}"` }));
      status = 'critical';
      actions.push(`Evaluar alternativas seguras para: ${suspicious.map(([n]) => n).join(', ')}.`);
    }

    if (!scripts.test || scripts.test.includes('no test')) {
      findings.push('Sin script de test configurado en package.json.');
      actions.push('Configurar suite de tests (vitest, jest) y script "test".');
    }

    if (total > 100) {
      findings.push(`Grafo de dependencias amplio (${total} paquetes). Auditar dependencias no utilizadas.`);
      if (status === 'healthy') status = 'warning';
    }
  }

  if (depsInfo.python_requirements) {
    const reqs = depsInfo.python_requirements.filter((r) => r.trim() && !r.startsWith('#'));
    findings.push(`${reqs.length} dependencias Python en requirements.txt.`);
    const unpinned = reqs.filter((r) => !r.includes('=='));
    if (unpinned.length > 2) {
      findings.push(`${unpinned.length} dependencias Python sin versión exacta (==).`);
      risks.push({ level: 'low', description: 'Dependencias Python sin versión fija pueden producir builds no reproducibles.' });
      if (status === 'healthy') status = 'warning';
      actions.push('Fijar versiones exactas con pip freeze o poetry.');
    }
  }

  if (depsInfo.go_mod) {
    findings.push('Módulos Go detectados (go.mod).');
  }

  if (findings.length === 0) {
    findings.push('No se encontraron archivos de dependencias reconocibles en el repositorio.');
    status = 'warning';
  }

  return {
    summary: findings[0],
    status_assessment: status,
    findings,
    risks,
    evidence,
    uncertainties: [
      'Análisis estático — no se ejecutó npm audit ni safety check.',
      'No se verificaron CVEs actuales para las versiones detectadas.',
    ],
    recommended_actions: actions.length > 0 ? actions : ['Ejecutar npm audit para detectar vulnerabilidades conocidas.'],
    confidence_level: findings.length > 1 ? 0.72 : 0.4,
  };
}

export async function run(missionContext) {
  const { recon } = missionContext;
  const depsInfo = recon.dependencies ?? {};

  const staticResult = analyzeDependenciesStatic(depsInfo, recon);

  const sections = [];
  if (depsInfo.nodejs) {
    const { name, version, dependencies, devDependencies, scripts } = depsInfo.nodejs;
    sections.push(`## Node.js (${name} v${version})\nScripts: ${JSON.stringify(scripts)}\nProd (${Object.keys(dependencies).length}): ${JSON.stringify(dependencies)}\nDev (${Object.keys(devDependencies).length}): ${JSON.stringify(devDependencies)}`);
  }
  if (depsInfo.python_requirements) sections.push(`## Python requirements\n${depsInfo.python_requirements.join('\n')}`);
  if (depsInfo.go_mod) sections.push(`## go.mod\n${depsInfo.go_mod}`);

  if (sections.length === 0) return staticResult;

  const userPrompt = `# Auditoría de dependencias\nStack: ${recon.stack.join(', ') || 'desconocido'}\nHallazgos estáticos: ${staticResult.findings.join(' | ')}\n\n${sections.join('\n\n')}\n\nEnriquece y produce el JSON de diagnóstico.`;

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

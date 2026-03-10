import { callSpecialistLLM, parseSpecialistResponse, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un CTO con experiencia en due diligence técnico. Tu rol es producir una síntesis ejecutiva clara y accionable basada en los resultados de múltiples especialistas técnicos.

Tu síntesis debe:
- Consolidar los hallazgos más críticos en un diagnóstico integrado
- Identificar patrones transversales (problemas que aparecen en múltiples dominios)
- Priorizar riesgos por impacto real en el negocio
- Proponer acciones concretas ordenadas por ROI
- Señalar fortalezas reales del sistema (no solo problemas)
- Ser honesta: no suavizar problemas graves ni dramatizar problemas menores
- El resumen debe poder leerse en 2 minutos por un CTO o inversor técnico

${getContractInstruction()}`;

const STATUS_ORDER = { critical: 0, warning: 1, healthy: 2 };

function buildExecutiveSummaryStatic(recon, previousResults) {
  const results = Object.values(previousResults ?? {})
    .filter((r) => r?.result?.confidence_level > 0)
    .map((r) => r.result);

  if (results.length === 0) {
    return null; // No hay datos suficientes para síntesis
  }

  // Aggregate all risks sorted by severity
  const allRisks = results.flatMap((r) => r.risks ?? []);
  const highRisks = allRisks.filter((r) => r.level === 'high');
  const mediumRisks = allRisks.filter((r) => r.level === 'medium');

  // All findings
  const allFindings = results.flatMap((r) => r.findings ?? []);

  // All actions
  const allActions = [...new Set(results.flatMap((r) => r.recommended_actions ?? []))];

  // Overall status = worst status across specialists
  const statuses = results.map((r) => r.status_assessment).filter(Boolean);
  const worstStatus = statuses.sort((a, b) => (STATUS_ORDER[a] ?? 3) - (STATUS_ORDER[b] ?? 3))[0] ?? 'warning';

  // Average confidence
  const avgConfidence = results.reduce((sum, r) => sum + (r.confidence_level ?? 0), 0) / results.length;

  // Build summary text
  const stack = recon.stack?.join(', ') || 'stack no determinado';
  const totalFiles = recon.structure?.total_files ?? 0;
  const specialistCount = results.length;

  let summaryParts = [`Sistema en ${stack} con ${totalFiles} archivos.`];

  if (highRisks.length > 0) {
    summaryParts.push(`${highRisks.length} riesgo(s) alto(s) identificado(s): ${highRisks[0].description.slice(0, 80)}.`);
  }
  if (mediumRisks.length > 0) {
    summaryParts.push(`${mediumRisks.length} riesgo(s) medio(s).`);
  }
  if (highRisks.length === 0 && mediumRisks.length === 0) {
    summaryParts.push('Sin riesgos altos o medios detectados por análisis estático.');
  }
  summaryParts.push(`Análisis basado en ${specialistCount} especialistas con confianza promedio ${(avgConfidence * 100).toFixed(0)}%.`);

  const findings = [
    `Síntesis de ${specialistCount} especialistas (confianza promedio: ${(avgConfidence * 100).toFixed(0)}%).`,
    ...allFindings.filter((f, i, arr) => arr.indexOf(f) === i).slice(0, 5),
  ];

  return {
    summary: summaryParts.join(' '),
    status_assessment: worstStatus,
    findings,
    risks: [...highRisks, ...mediumRisks].slice(0, 8),
    evidence: [],
    uncertainties: [
      'Esta síntesis se basa en análisis estático — no reemplaza una auditoría técnica manual.',
      `${6 - specialistCount} especialista(s) no aportaron datos (Ollama no disponible).`,
    ],
    recommended_actions: allActions.slice(0, 6),
    confidence_level: Math.min(avgConfidence * 0.9, 0.7), // Slightly lower than specialists avg
  };
}

export async function run(missionContext) {
  const { recon, previousResults } = missionContext;

  const staticResult = buildExecutiveSummaryStatic(recon, previousResults);

  const specialistSummaries = Object.entries(previousResults ?? {})
    .map(([specialist, result]) => {
      if (!result || result.status === 'skipped') return `### ${specialist}\nEspecialista omitido.`;
      if (result.status === 'failed') return `### ${specialist}\nEspecialista falló.`;
      const r = result.result || {};
      return `### ${specialist}\n**Estado**: ${r.status_assessment ?? 'desconocido'}\n**Resumen**: ${r.summary ?? 'Sin resumen'}\n**Hallazgos**: ${(r.findings ?? []).slice(0, 3).join(' | ')}\n**Riesgos altos**: ${(r.risks ?? []).filter((x) => x.level === 'high').map((x) => x.description).join(' | ') || 'ninguno'}\n**Confianza**: ${r.confidence_level ?? 0}`;
    }).join('\n\n');

  const userPrompt = `# Síntesis ejecutiva de análisis técnico\n\n## Repositorio\n${recon.stack.join(', ') || 'Stack no determinado'}\nArchivos: ${recon.structure?.total_files ?? 'N/A'}\n\n## Resultados por especialista\n${specialistSummaries || 'Sin resultados.'}\n\nProduce una síntesis ejecutiva integrada y el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  if (!text) return staticResult ?? {
    summary: `Análisis técnico de ${recon.stack?.join(', ') || 'repositorio'} completado con datos parciales.`,
    status_assessment: 'warning',
    findings: ['Síntesis ejecutiva no disponible — Ollama no accesible y datos insuficientes.'],
    risks: [],
    evidence: [],
    uncertainties: ['Ollama no disponible para síntesis narrativa.'],
    recommended_actions: ['Instalar Ollama con llama3.2:3b para obtener síntesis ejecutiva completa.'],
    confidence_level: 0,
  };

  const llm = parseSpecialistResponse(text);
  if (!staticResult) return llm;

  return {
    ...llm,
    findings: [...new Set([...staticResult.findings, ...llm.findings])],
    risks: [...staticResult.risks, ...llm.risks],
    recommended_actions: [...new Set([...staticResult.recommended_actions, ...llm.recommended_actions])],
    confidence_level: Math.max(staticResult.confidence_level, llm.confidence_level),
  };
}

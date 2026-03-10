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

export async function run(missionContext) {
  const { recon, previousResults } = missionContext;

  const specialistSummaries = Object.entries(previousResults ?? {})
    .map(([specialist, result]) => {
      if (!result || result.status === 'skipped') return `### ${specialist}\nEspecialista omitido.`;
      if (result.status === 'failed') return `### ${specialist}\nEspecialista falló: ${result.error || 'error desconocido'}.`;

      const r = result.result || {};
      return `### ${specialist}
**Estado**: ${r.status_assessment ?? 'desconocido'}
**Resumen**: ${r.summary ?? 'Sin resumen'}
**Hallazgos clave**: ${(r.findings ?? []).slice(0, 3).join(' | ')}
**Riesgos altos**: ${(r.risks ?? []).filter((x) => x.level === 'high').map((x) => x.description).join(' | ') || 'ninguno'}
**Confianza**: ${r.confidence_level ?? 0}`;
    }).join('\n\n');

  const userPrompt = `# Síntesis ejecutiva de análisis técnico

## Repositorio analizado
${recon.stack.join(', ') || 'Stack no determinado'}
Archivos: ${recon.structure?.total_files ?? 'N/A'}
Directorios: ${(recon.structure?.top_level_dirs ?? []).join(', ')}

## Resultados por especialista
${specialistSummaries || 'No hay resultados de especialistas disponibles.'}

Produce una síntesis ejecutiva integrada y el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  return parseSpecialistResponse(text);
}

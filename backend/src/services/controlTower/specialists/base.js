import { OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS } from '../../../config.js';
import logger from '../../../utils/logger.js';

export function defaultContract() {
  return {
    summary: 'Análisis no disponible.',
    status_assessment: 'warning',
    findings: [],
    risks: [],
    evidence: [],
    uncertainties: ['El especialista no pudo completar el análisis.'],
    recommended_actions: [],
    confidence_level: 0,
  };
}

function sanitizeContract(obj) {
  const base = defaultContract();
  return {
    summary: typeof obj.summary === 'string' ? obj.summary : base.summary,
    status_assessment: ['healthy', 'warning', 'critical'].includes(obj.status_assessment)
      ? obj.status_assessment
      : 'warning',
    findings: Array.isArray(obj.findings) ? obj.findings.filter((f) => typeof f === 'string') : [],
    risks: Array.isArray(obj.risks) ? obj.risks.filter((r) => r && typeof r.description === 'string') : [],
    evidence: Array.isArray(obj.evidence) ? obj.evidence.filter((e) => e && typeof e.file === 'string') : [],
    uncertainties: Array.isArray(obj.uncertainties) ? obj.uncertainties.filter((u) => typeof u === 'string') : [],
    recommended_actions: Array.isArray(obj.recommended_actions)
      ? obj.recommended_actions.filter((a) => typeof a === 'string')
      : [],
    confidence_level: typeof obj.confidence_level === 'number'
      ? Math.max(0, Math.min(1, obj.confidence_level))
      : 0,
  };
}

export function parseSpecialistResponse(text) {
  if (!text) return defaultContract();

  // Try to extract JSON block from response (LLM may add prose around it)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
                    text.match(/```\s*([\s\S]*?)```/) ||
                    text.match(/(\{[\s\S]*\})/);

  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    return sanitizeContract(parsed);
  } catch {
    // Second attempt: find first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1));
        return sanitizeContract(parsed);
      } catch { /* fall through */ }
    }
    logger.warn('[specialist-base] No se pudo parsear respuesta JSON del especialista');
    return defaultContract();
  }
}

export async function callSpecialistLLM(systemPrompt, userPrompt, timeoutMs = null) {
  const effectiveTimeout = timeoutMs ?? OLLAMA_TIMEOUT_MS;
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    const res = await fetch(`${OLLAMA_HOST.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timerId);

    if (!res.ok) {
      logger.warn(`[specialist-base] Ollama HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data?.response?.trim();
    return text || null;
  } catch (err) {
    clearTimeout(timerId);
    if (err.name === 'AbortError') {
      logger.warn(`[specialist-base] Timeout tras ${effectiveTimeout}ms`);
    } else {
      logger.warn(`[specialist-base] Error: ${err.message}`);
    }
    return null;
  }
}

export function truncateFileContents(fileContents, maxTotalChars = 12000) {
  let total = 0;
  const result = {};
  for (const [path, content] of Object.entries(fileContents)) {
    if (total >= maxTotalChars) break;
    const allowed = Math.min(content.length, maxTotalChars - total);
    result[path] = content.slice(0, allowed);
    total += allowed;
  }
  return result;
}

export function formatFilesForPrompt(fileContents, maxTotalChars = 12000) {
  const truncated = truncateFileContents(fileContents, maxTotalChars);
  return Object.entries(truncated)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join('\n\n');
}

const CONTRACT_SCHEMA = `{
  "summary": "Una frase que resume el estado del dominio analizado.",
  "status_assessment": "healthy | warning | critical",
  "findings": ["hallazgo concreto 1", "hallazgo concreto 2"],
  "risks": [{"level": "high | medium | low", "description": "descripción del riesgo"}],
  "evidence": [{"file": "ruta/archivo.ext", "line": null, "snippet": "fragmento relevante"}],
  "uncertainties": ["aspecto no confirmado por falta de evidencia"],
  "recommended_actions": ["acción concreta y priorizada"],
  "confidence_level": 0.0
}`;

export function getContractInstruction() {
  return `Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
${CONTRACT_SCHEMA}

Reglas:
- No incluyas texto fuera del JSON
- confidence_level entre 0.0 y 1.0
- Basa TODOS los hallazgos en evidencia de los archivos proporcionados
- Si no tienes evidencia suficiente, ponlo en uncertainties
- Responde en español`;
}

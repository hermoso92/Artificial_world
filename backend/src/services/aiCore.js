import logger from '../utils/logger.js';
import { OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS } from '../config.js';
import { buildMemoryContext, getAiMemoryCatalog, loadPromptTemplate } from './aiMemory.js';

const AI_PROVIDER = 'ollama';

const DEFAULT_PROMPTS = {
  chat: 'Responde en español, de forma concisa, útil y trazable. Si algo no está verificado, dilo claramente.',
  summarize: 'Resume el contenido en español. Destaca hechos, riesgos y próximos pasos. No inventes información.',
  analyzeTestFailure: 'Analiza el fallo de test en español. Señala causa probable, evidencia visible y siguiente paso prudente.',
  analyzeSession: 'Analiza la sesión en español. Resume estructura, eventos relevantes, anomalías visibles y límites de la evidencia.',
};

function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

function finalizeTrace(operation, startedAt, extra = {}) {
  return {
    operation,
    provider: AI_PROVIDER,
    model: OLLAMA_MODEL,
    durationMs: Date.now() - startedAt,
    ...extra,
  };
}

function traceAiOperation(trace) {
  const level = trace.success ? 'info' : 'warn';
  logger[level]('[ai-core]', trace);
}

async function callOllama({ prompt, systemPrompt }) {
  const { controller, timeoutId } = createTimeoutController(OLLAMA_TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_HOST.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system: systemPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }

    const data = await res.json();
    const text = data?.response?.trim();
    return text ? { ok: true, text } : { ok: false, error: 'Respuesta vacía del modelo' };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { ok: false, error: `Timeout tras ${OLLAMA_TIMEOUT_MS}ms` };
    }
    return { ok: false, error: err.message ?? 'Error desconocido de inferencia' };
  }
}

async function pingOllama() {
  const { controller, timeoutId } = createTimeoutController(Math.min(OLLAMA_TIMEOUT_MS, 5000));
  try {
    const res = await fetch(`${OLLAMA_HOST.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return { available: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = Array.isArray(data?.models) ? data.models.map((model) => model.name) : [];
    return { available: true, models };
  } catch (err) {
    clearTimeout(timeoutId);
    return { available: false, error: err.message ?? 'No disponible' };
  }
}

function buildSystemPrompt(operation, systemPrompt = '', context = {}, memoryKeys = []) {
  const basePrompt = loadPromptTemplate(operation) ?? DEFAULT_PROMPTS[operation] ?? DEFAULT_PROMPTS.chat;
  const memoryBlock = buildMemoryContext(memoryKeys);
  const contextBlock = Object.keys(context).length > 0
    ? `## context\n${JSON.stringify(context)}`
    : '';

  return [basePrompt, systemPrompt, memoryBlock, contextBlock]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function createFallbackText(operation, payload = {}) {
  if (operation === 'summarize') {
    const raw = String(payload.input ?? '');
    const preview = raw.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3).join(' ');
    return `Resumen local no disponible por modelo. Vista previa del contenido: ${preview || 'sin contenido útil'}.`;
  }

  if (operation === 'analyzeTestFailure') {
    const suite = payload.suite ?? 'suite_desconocida';
    const output = String(payload.output ?? '').split('\n').slice(-8).join(' ').trim();
    return `No se pudo consultar el modelo local. Suite: ${suite}. Últimas líneas observadas: ${output || 'sin salida'}. Revisa el stacktrace y repite con más contexto si hace falta.`;
  }

  if (operation === 'analyzeSession') {
    const routePoints = Array.isArray(payload.route) ? payload.route.length : 0;
    const events = Array.isArray(payload.events) ? payload.events.length : 0;
    const sessionId = payload.session?.id ?? 'sin_id';
    return `Análisis local no disponible. Sesión: ${sessionId}. Puntos de ruta: ${routePoints}. Eventos: ${events}. Usa este artefacto como base para revisión manual o reintenta cuando Ollama esté disponible.`;
  }

  return `Ollama no disponible. Operación "${operation}" completada en modo fallback con contexto local limitado.`;
}

async function runAiOperation(operation, payload = {}) {
  const startedAt = Date.now();
  const {
    prompt = '',
    input = '',
    systemPrompt = '',
    context = {},
    memoryKeys = [],
  } = payload;

  const promptText = String(prompt || input || '').trim();
  const finalSystemPrompt = buildSystemPrompt(operation, systemPrompt, context, memoryKeys);
  const result = await callOllama({ prompt: promptText, systemPrompt: finalSystemPrompt });

  if (result.ok) {
    const trace = finalizeTrace(operation, startedAt, {
      success: true,
      fallback: false,
    });
    traceAiOperation(trace);
    return {
      success: true,
      data: {
        text: result.text,
        operation,
      },
      meta: trace,
    };
  }

  const trace = finalizeTrace(operation, startedAt, {
    success: false,
    fallback: true,
    error: result.error,
  });
  traceAiOperation(trace);

  return {
    success: true,
    data: {
      text: createFallbackText(operation, payload),
      operation,
    },
    meta: trace,
  };
}

export async function getAiHealth() {
  const startedAt = Date.now();
  const runtime = await pingOllama();
  const trace = finalizeTrace('health', startedAt, {
    success: runtime.available,
    fallback: !runtime.available,
    error: runtime.error ?? null,
  });
  traceAiOperation(trace);

  return {
    success: true,
    data: {
      provider: AI_PROVIDER,
      host: OLLAMA_HOST,
      model: OLLAMA_MODEL,
      available: runtime.available,
      installedModels: runtime.models ?? [],
      memoryCatalog: getAiMemoryCatalog(),
    },
    meta: trace,
  };
}

export async function aiChat(payload = {}) {
  return runAiOperation('chat', payload);
}

export async function summarize(payload = {}) {
  return runAiOperation('summarize', payload);
}

export async function analyzeTestFailure(payload = {}) {
  const { suite = 'suite_desconocida', output = '', context = {}, memoryKeys = ['frequentFailures', 'technicalDecisions'] } = payload;
  return runAiOperation('analyzeTestFailure', {
    prompt: `Suite: ${suite}\n\nSalida:\n${String(output).slice(0, 12000)}`,
    context,
    memoryKeys,
    suite,
    output,
  });
}

export async function analyzeSession(payload = {}) {
  const {
    session = {},
    route = [],
    events = [],
    context = {},
    memoryKeys = ['glossary', 'sessionExample'],
  } = payload;

  return runAiOperation('analyzeSession', {
    prompt: JSON.stringify({
      session,
      routePoints: route.slice(0, 25),
      routeCount: route.length,
      events: events.slice(0, 25),
      eventCount: events.length,
    }),
    context,
    memoryKeys,
    session,
    route,
    events,
  });
}

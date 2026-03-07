/**
 * LLM service — Ollama wrapper for Hero Refuge agent.
 * Falls back to mock response when Ollama is unavailable.
 * Uses OLLAMA_HOST env (default localhost:11434), OLLAMA_MODEL (default llama3.2).
 * Supports tool-calling: createWorld, destroyWorld, switchMode, listWorlds.
 */

import logger from '../utils/logger.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 30000);

const TOOL_DESCRIPTIONS = `
HERRAMIENTAS DISPONIBLES (responde SOLO con JSON cuando el usuario pida ejecutar una acción):
- createWorld: Crear mundo. Params: { "name": string, "biomes": string[] (ej. ["forest","plains"]), "type": "standard" }
- destroyWorld: Destruir mundo. Params: { "worldId": string } (usa el id del mundo)
- switchMode: Cambiar modo. Params: { "modeId": string } (personal, empresa, comunidad, hogar, cuarto, refugio, ecosistema, planeta, mundo, galaxia, persistencia, ia, nexo)
- listWorlds: Listar mundos (no params). Responde con texto natural si solo quiere ver/contar mundos.

Si el usuario pide crear un mundo, destruir uno, cambiar modo o listar mundos, responde ÚNICAMENTE con una línea JSON válida:
{"tool":"createWorld","params":{"name":"Eden","biomes":["forest","plains"]}}
{"tool":"destroyWorld","params":{"worldId":"world-xxx"}}
{"tool":"switchMode","params":{"modeId":"galaxia"}}
{"tool":"listWorlds","params":{}}

Si NO es una petición de acción, responde con texto natural en español.`;

/**
 * Build system prompt for the Hero Refuge companion agent.
 */
function buildSystemPrompt(opts) {
  const {
    heroName,
    modeLabel,
    modeDescription,
    worldCount = 0,
    recentMemory = [],
    aliveWorlds = [],
    includeTools = true,
  } = opts;

  const memoryBlock =
    recentMemory.length > 0
      ? `\nMemoria reciente:\n${recentMemory.map((m) => `- ${m.event}`).join('\n')}`
      : '';

  const worldsBlock =
    aliveWorlds.length > 0
      ? `\nMundos actuales (id, nombre):\n${aliveWorlds.map((w) => `- ${w.id}: ${w.name}`).join('\n')}`
      : '';

  const toolsBlock = includeTools ? TOOL_DESCRIPTIONS : '';

  return `Eres el Companion (asistente IA) de ${heroName} en el Hero Refuge.
Modo activo: ${modeLabel} — ${modeDescription}
Mundos artificiales vivos: ${worldCount}
${memoryBlock}
${worldsBlock}
${toolsBlock}

Responde en español, de forma concisa y natural.`;
}

async function callOllama(prompt, systemPrompt) {
  const url = `${OLLAMA_HOST.replace(/\/$/, '')}/api/generate`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
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
      logger.warn('llmService: Ollama returned', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const text = data?.response?.trim();
    return text || null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      logger.warn('llmService: Ollama request timed out');
    } else {
      logger.warn('llmService: Ollama unavailable', err.message);
    }
    return null;
  }
}

function parseToolCall(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed?.tool && typeof parsed.tool === 'string') {
      return { tool: parsed.tool, params: parsed.params ?? {} };
    }
  } catch {
    // ignore
  }
  return null;
}

export async function generateAnswer(opts) {
  const {
    query,
    heroName,
    mode,
    context = {},
    recentMemory = [],
    aliveWorlds = [],
    includeTools = true,
  } = opts;
  const modeLabel = mode?.label ?? 'Desconocido';
  const modeDescription = mode?.description ?? '';
  const worldCount = context.worldCount ?? aliveWorlds.length ?? 0;

  const systemPrompt = buildSystemPrompt({
    heroName,
    modeLabel,
    modeDescription,
    worldCount,
    recentMemory,
    aliveWorlds: aliveWorlds.map((w) => ({ id: w.id, name: w.name })),
    includeTools,
  });

  const answer = await callOllama(query, systemPrompt);
  if (answer) {
    const toolCall = parseToolCall(answer);
    if (toolCall) {
      return { type: 'toolCall', tool: toolCall.tool, params: toolCall.params };
    }
    return { type: 'answer', text: answer };
  }

  const modeContext = mode
    ? `[${mode.icon} ${mode.label}] ${mode.description}`
    : 'Modo desconocido';
  return {
    type: 'answer',
    text: `En modo ${modeContext} — procesando: "${query}". Contexto activo: ${JSON.stringify(context).slice(0, 120)}. (Ollama no disponible; respuesta mock.)`,
  };
}

export async function generateToolResultAnswer(opts) {
  const { query, tool, toolResult, heroName, mode } = opts;
  const modeLabel = mode?.label ?? 'Desconocido';
  const prompt = `El usuario preguntó: "${query}". Ejecutaste la herramienta ${tool}. Resultado: ${JSON.stringify(toolResult)}. Responde en una o dos frases amigables en español confirmando lo que hiciste.`;
  const systemPrompt = buildSystemPrompt({
    heroName,
    modeLabel,
    modeDescription: mode?.description ?? '',
    worldCount: 0,
    recentMemory: [],
    includeTools: false,
  });

  const answer = await callOllama(prompt, systemPrompt);
  return answer ?? `He ejecutado ${tool}. ${JSON.stringify(toolResult)}`;
}

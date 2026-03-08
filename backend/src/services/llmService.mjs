/**
 * Hero Refuge adapter over the shared ai-core service.
 * HeroRefuge stays as a client with its own prompt/tool contract,
 * while health/chat/summarize/analyze operations live in aiCore.js.
 */
import { aiChat } from './aiCore.js';

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

  const response = await aiChat({
    prompt: query,
    systemPrompt,
    context: {
      heroName,
      activeMode: modeLabel,
      worldCount,
      heroRefuge: true,
    },
  });
  const answerText = response?.data?.text;

  if (answerText) {
    const toolCall = parseToolCall(answerText);
    if (toolCall) {
      return { type: 'toolCall', tool: toolCall.tool, params: toolCall.params };
    }
    return { type: 'answer', text: answerText };
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

  const response = await aiChat({
    prompt,
    systemPrompt,
    context: {
      heroName,
      activeMode: modeLabel,
      tool,
      heroRefuge: true,
    },
  });
  return response?.data?.text ?? `He ejecutado ${tool}. ${JSON.stringify(toolResult)}`;
}

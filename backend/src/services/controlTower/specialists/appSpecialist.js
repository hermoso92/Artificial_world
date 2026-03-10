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

export async function run(missionContext) {
  const { recon, fileContents } = missionContext;

  // Seleccionar archivos de código principal (no config, no docs)
  const codeFiles = {};
  const skipExts = new Set(['.json', '.md', '.txt', '.yml', '.yaml', '.toml', '.lock', '.env']);
  const skipNames = new Set(['package.json', 'package-lock.json', 'yarn.lock', 'requirements.txt']);

  let budget = 12000;
  for (const [path, content] of Object.entries(fileContents)) {
    if (budget <= 0) break;
    const name = path.split('/').pop();
    const ext = '.' + name.split('.').pop();
    if (skipExts.has(ext) || skipNames.has(name)) continue;

    // Prefer files in src/, lib/, core/, services/
    const isCore = /^(src|lib|core|services|controllers|routes|models|handlers)\//.test(path);
    if (isCore || Object.keys(codeFiles).length < 15) {
      const slice = content.slice(0, Math.min(content.length, 600));
      codeFiles[path] = slice;
      budget -= slice.length;
    }
  }

  const userPrompt = `# Análisis de calidad de aplicación

## Stack
${recon.stack.join(', ') || 'No determinado'}

## Estructura
Directorios: ${recon.structure.top_level_dirs.join(', ')}
Total archivos: ${recon.structure.total_files}

## Muestra de código fuente
${formatFilesForPrompt(codeFiles, 12000)}

Analiza la calidad del código y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  return parseSpecialistResponse(text);
}

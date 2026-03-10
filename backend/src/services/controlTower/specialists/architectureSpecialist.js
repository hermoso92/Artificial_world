import { callSpecialistLLM, parseSpecialistResponse, defaultContract, formatFilesForPrompt, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un arquitecto de software senior. Tu rol es analizar la arquitectura de un repositorio real y producir un diagnóstico técnico honesto y accionable.

Analiza:
- Estructura de directorios y organización del código
- Separación de responsabilidades (capas, módulos, servicios)
- Patrones arquitectónicos detectados (MVC, hexagonal, monolito, microservicios, etc.)
- Deuda técnica estructural visible
- Coherencia entre la arquitectura declarada y la implementada
- Puntos de acoplamiento excesivo
- Claridad de los límites de módulos

${getContractInstruction()}`;

export async function run(missionContext) {
  const { recon, fileContents } = missionContext;

  // Seleccionar archivos más relevantes para arquitectura
  const relevantFiles = {};
  const archPatterns = [
    'server.js', 'index.js', 'app.js', 'main.py', 'app.py', 'manage.py',
    'package.json', 'requirements.txt', 'docker-compose.yml', 'Dockerfile',
  ];

  for (const [path, content] of Object.entries(fileContents)) {
    const name = path.split('/').pop();
    if (archPatterns.includes(name) || path.split('/').length <= 2) {
      relevantFiles[path] = content;
    }
  }

  // Añadir sample de cada directorio top-level
  const topDirs = new Set(Object.keys(fileContents).map((p) => p.split('/')[0]));
  for (const dir of topDirs) {
    const samples = Object.entries(fileContents)
      .filter(([p]) => p.startsWith(dir + '/'))
      .slice(0, 2);
    for (const [p, c] of samples) relevantFiles[p] = c;
  }

  const userPrompt = `# Repositorio a analizar

## Stack detectado
${recon.stack.join(', ') || 'No determinado'}

## Puntos de entrada
${recon.entry_points.join('\n') || 'No detectados'}

## Estructura top-level
Directorios: ${recon.structure.top_level_dirs.join(', ')}
Total archivos: ${recon.structure.total_files}
Extensiones: ${JSON.stringify(recon.structure.extension_counts)}

## Archivos de referencia
${formatFilesForPrompt(relevantFiles, 10000)}

Analiza la arquitectura de este sistema y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  return parseSpecialistResponse(text);
}

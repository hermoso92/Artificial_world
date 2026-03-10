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

export async function run(missionContext) {
  const { recon, fileContents, docFiles } = missionContext;

  const docContent = {};

  // Incluir archivos de docs proporcionados
  if (docFiles) {
    for (const [path, content] of Object.entries(docFiles)) {
      const name = path.split('/').pop().toLowerCase();
      docContent[path] = content;
    }
  }

  // Incluir archivos .md del repo
  for (const [path, content] of Object.entries(fileContents)) {
    if (path.endsWith('.md') || path.endsWith('.txt') || path.endsWith('.rst')) {
      docContent[path] = content;
    }
  }

  // Incluir package.json / requirements para detectar dependencias documentadas
  for (const [path, content] of Object.entries(fileContents)) {
    const name = path.split('/').pop();
    if (['package.json', 'requirements.txt', 'pyproject.toml'].includes(name)) {
      docContent[path] = content;
    }
  }

  const userPrompt = `# Repositorio a analizar

## Stack
${recon.stack.join(', ') || 'No determinado'}

## Total archivos en repo
${recon.structure.total_files}

## Archivos de documentación encontrados
${Object.keys(docContent).join('\n') || 'Ninguno detectado'}

## Contenido de documentación
${formatFilesForPrompt(docContent, 12000)}

Evalúa la calidad y cobertura de la documentación y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  return parseSpecialistResponse(text);
}

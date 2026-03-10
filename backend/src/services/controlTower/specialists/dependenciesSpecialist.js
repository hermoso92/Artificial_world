import { callSpecialistLLM, parseSpecialistResponse, getContractInstruction } from './base.js';

const SYSTEM_PROMPT = `Eres un especialista en gestión de dependencias y supply chain de software. Tu rol es auditar las dependencias de un proyecto de forma técnica y rigurosa.

Analiza:
- Dependencias directas: versiones, estado de mantenimiento, licencias problemáticas
- Señales de dependencias obsoletas (versiones muy antiguas, falta de actualizaciones)
- Dependencias con vulnerabilidades conocidas en versiones antiguas (según tu conocimiento)
- Lock files presentes o ausentes
- Dependencias de desarrollo en producción
- Dependencias duplicadas o con propósito superpuesto
- Dependencias no utilizadas visibles
- Salud general del grafo de dependencias

${getContractInstruction()}`;

export async function run(missionContext) {
  const { recon } = missionContext;

  const depsInfo = recon.dependencies ?? {};

  const sections = [];

  if (depsInfo.nodejs) {
    const { name, version, dependencies, devDependencies, scripts } = depsInfo.nodejs;
    sections.push(`## Node.js Package (${name} v${version})

### Scripts disponibles
${JSON.stringify(scripts, null, 2)}

### Dependencias de producción (${Object.keys(dependencies).length})
${JSON.stringify(dependencies, null, 2)}

### Dependencias de desarrollo (${Object.keys(devDependencies).length})
${JSON.stringify(devDependencies, null, 2)}`);
  }

  if (depsInfo.python_requirements) {
    sections.push(`## Python requirements.txt (${depsInfo.python_requirements.length} dependencias)
${depsInfo.python_requirements.join('\n')}`);
  }

  if (depsInfo.pyproject_toml) {
    sections.push(`## pyproject.toml
${depsInfo.pyproject_toml}`);
  }

  if (depsInfo.go_mod) {
    sections.push(`## go.mod
${depsInfo.go_mod}`);
  }

  if (sections.length === 0) {
    sections.push('No se detectaron archivos de dependencias reconocibles.');
  }

  const userPrompt = `# Auditoría de dependencias

## Stack detectado
${recon.stack.join(', ') || 'No determinado'}

${sections.join('\n\n')}

Analiza estas dependencias y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt);
  return parseSpecialistResponse(text);
}

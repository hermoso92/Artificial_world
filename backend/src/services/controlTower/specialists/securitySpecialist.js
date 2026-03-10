import { callSpecialistLLM, parseSpecialistResponse, formatFilesForPrompt, getContractInstruction } from './base.js';

// Security specialist has a hard 30s timeout — skipped if it exceeds
export const SECURITY_TIMEOUT_MS = 30000;

const SYSTEM_PROMPT = `Eres un especialista en seguridad de aplicaciones. Tu rol es identificar riesgos de seguridad concretos y evidenciados en el código.

Analiza ÚNICAMENTE lo que puedas verificar con el código proporcionado:
- Secretos hardcodeados (API keys, passwords, tokens en código o config files)
- Variables de entorno mal gestionadas (.env con secretos reales, sin .env.example)
- Configuración CORS insegura (allow all origins en producción)
- Inyección SQL o NoSQL visible (queries con interpolación de strings)
- Validación de inputs ausente en endpoints críticos
- Autenticación y autorización: ausencia o debilidad visible
- Dependencias con CVEs conocidas (según tu conocimiento a agosto 2025)
- Exposición de rutas administrativas sin protección
- Información sensible en logs

No inventes vulnerabilidades. Si no hay evidencia, ponlo en uncertainties.

${getContractInstruction()}`;

export async function run(missionContext) {
  const { recon, fileContents } = missionContext;

  // Security-relevant files
  const secFiles = {};
  const secPatterns = [
    '.env', '.env.example', '.env.local', '.env.production',
    'config.js', 'config.ts', 'settings.py', 'config.py',
    'server.js', 'app.js', 'index.js', 'main.py', 'app.py',
  ];
  const authPatterns = ['auth', 'middleware', 'security', 'cors', 'jwt', 'token', 'session'];

  for (const [path, content] of Object.entries(fileContents)) {
    const name = path.split('/').pop().toLowerCase();
    const isSecFile = secPatterns.some((p) => name === p || name.startsWith(p));
    const isAuthPath = authPatterns.some((p) => path.toLowerCase().includes(p));

    if (isSecFile || isAuthPath) {
      secFiles[path] = content;
    }
  }

  // If not enough, add routes/endpoints
  if (Object.keys(secFiles).length < 5) {
    for (const [path, content] of Object.entries(fileContents)) {
      if (path.includes('/routes/') || path.includes('/controllers/')) {
        secFiles[path] = content.slice(0, 600);
      }
    }
  }

  const userPrompt = `# Auditoría de seguridad

## Stack
${recon.stack.join(', ') || 'No determinado'}

## Archivos de referencia
${formatFilesForPrompt(secFiles, 10000)}

Identifica riesgos de seguridad concretos y produce el JSON de diagnóstico.`;

  const text = await callSpecialistLLM(SYSTEM_PROMPT, userPrompt, SECURITY_TIMEOUT_MS);
  return parseSpecialistResponse(text);
}

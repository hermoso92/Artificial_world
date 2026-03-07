#!/usr/bin/env node
/**
 * AI-assisted test runner for Artificial Worlds.
 * Runs tests, collects results, and generates AI analysis of failures.
 * Set OPENAI_API_KEY or use local analysis when no key.
 */
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function runTests() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vitest', 'run', '--reporter=verbose'], {
      cwd: ROOT,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => { stdout += d.toString(); process.stdout.write(d); });
    proc.stderr?.on('data', (d) => { stderr += d.toString(); process.stderr.write(d); });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    proc.on('error', reject);
  });
}

function generateAIAnalysisPrompt(stdout, stderr) {
  const output = stdout + stderr;
  if (!output.includes('FAIL') && !output.includes('AssertionError')) return null;

  return `Eres un experto en testing. Analiza estos fallos de tests de Artificial Worlds (simulación de vida artificial):

\`\`\`
${output.slice(-4000)}
\`\`\`

Proporciona:
1. Causa raíz probable de cada fallo
2. Sugerencias de corrección concretas (archivo, función, cambio)
3. Tests adicionales recomendados para evitar regresiones

Responde en español, de forma concisa.`;
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error('OpenAI API error:', e.message);
    return null;
  }
}

function printLocalAnalysisFromOutput(stdout, stderr) {
  const output = stdout + stderr;
  if (!output.includes('FAIL')) return;

  console.log('\n--- Fallos detectados ---');
  console.log('Tip: Configura OPENAI_API_KEY para análisis con IA:');
  console.log('  $env:OPENAI_API_KEY="sk-..."; npm run test:ai');
}

async function main() {
  console.log('🧪 Ejecutando tests...\n');
  const { code, stdout, stderr } = await runTests();

  const prompt = generateAIAnalysisPrompt(stdout, stderr);

  if (prompt && process.env.OPENAI_API_KEY) {
    console.log('\n🤖 Analizando fallos con IA...\n');
    const analysis = await callOpenAI(prompt);
    if (analysis) {
      console.log('--- Análisis IA ---\n');
      console.log(analysis);
    }
  } else if (code !== 0) {
    printLocalAnalysisFromOutput(stdout, stderr);
  }

  process.exit(code ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

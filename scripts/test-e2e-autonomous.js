#!/usr/bin/env node
/**
 * Prueba E2E autónoma: backend desde 0, flujo completo, Event Store.
 * Inicia backend, ejecuta Reset → Release → Start, consulta eventos e integridad.
 * Uso: node scripts/test-e2e-autonomous.js
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const AUDIT_DB = path.join(BACKEND, 'audit_simulacion.db');
const PORT = process.env.TEST_PORT || 3010;
const BASE = `http://localhost:${PORT}`;
const WAIT_MS = 5000;

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data;
}

async function waitForBackend(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function run() {
  console.log('=== Prueba E2E autónoma - Artificial World ===\n');

  const backend = spawn('node', ['src/server.js'], {
    cwd: BACKEND,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT) },
  });

  backend.stdout?.on('data', (d) => process.stdout.write(d));
  backend.stderr?.on('data', (d) => process.stderr.write(d));

  const killBackend = () => {
    try {
      backend.kill('SIGTERM');
    } catch {}
  };

  process.on('SIGINT', killBackend);
  process.on('SIGTERM', killBackend);

  try {
    if (fs.existsSync(AUDIT_DB)) {
      fs.unlinkSync(AUDIT_DB);
      console.log('   DB anterior eliminada (audit_simulacion.db)\n');
    }
    console.log(`1. Esperando backend en http://localhost:${PORT} ...`);
    if (!(await waitForBackend())) {
      console.error('   FAIL: Backend no respondió a tiempo');
      killBackend();
      process.exit(1);
    }
    console.log('   OK: Backend listo\n');

    console.log('2. POST /api/simulation/reset');
    await fetchJson(`${BASE}/api/simulation/reset`, { method: 'POST' });
    console.log('   OK\n');

    console.log('3. GET /api/world (obtener blueprint)');
    const worldRes = await fetchJson(`${BASE}/api/world`);
    const world = worldRes?.data ?? worldRes;
    const blueprintId = world?.blueprints?.[0]?.id;
    if (!blueprintId) {
      throw new Error('No hay blueprint (TestSpecies)');
    }
    console.log(`   Blueprint ID: ${blueprintId}\n`);

    console.log('4. POST /api/release');
    const release = await fetchJson(`${BASE}/api/release`, {
      method: 'POST',
      body: JSON.stringify({ refugeIndex: 0, blueprintId, count: 5 }),
    });
    const added = release?.data?.added ?? 0;
    if (added === 0) throw new Error('Release no añadió agentes');
    console.log(`   OK: ${added} agentes liberados\n`);

    console.log('5. POST /api/simulation/start');
    await fetchJson(`${BASE}/api/simulation/start`, { method: 'POST' });
    console.log('   OK\n');

    console.log(`6. Esperando ${WAIT_MS / 1000}s para ticks...`);
    await new Promise((r) => setTimeout(r, WAIT_MS));
    console.log('   OK\n');

    console.log('7. GET /api/audit/events?limit=20');
    const eventsRes = await fetchJson(`${BASE}/api/audit/events?limit=20`);
    const events = eventsRes?.data ?? [];
    if (events.length === 0) throw new Error('No hay eventos en Event Store');
    const types = [...new Set(events.map((e) => e.type))];
    console.log(`   OK: ${events.length} eventos (tipos: ${types.join(', ')})\n`);

    console.log('8. GET /api/audit/integrity');
    const integrityRes = await fetchJson(`${BASE}/api/audit/integrity`);
    const { ok, corruptos } = integrityRes?.data ?? {};
    if (!ok || (corruptos && corruptos.length > 0)) {
      throw new Error(`Integridad rota: ${corruptos?.join(', ') || 'unknown'}`);
    }
    console.log('   OK: Cadena de hashes íntegra\n');

    console.log('=== Prueba E2E completada con éxito ===');
    killBackend();
    process.exit(0);
  } catch (err) {
    console.error('\n   FAIL:', err.message);
    killBackend();
    process.exit(1);
  }
}

run();

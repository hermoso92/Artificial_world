#!/usr/bin/env node
/**
 * Debug interactivo para Artificial World.
 * Conecta a la API y permite inspeccionar el estado de la simulación.
 *
 * Uso: node scripts/debug_interactivo.js
 * Requiere: backend corriendo en http://localhost:3001
 */
import readline from 'readline';

const API = 'http://localhost:3001/api';

async function fetchApi(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function cmdWorld() {
  const w = await fetchApi('/world');
  console.log('\n--- MUNDO ---');
  console.log(`Tick: ${w.tick} | Running: ${w.running}`);
  console.log(`Agentes: ${w.agentCount} | Recursos: ${w.resourceCount} | Refugios: ${w.shelterCount}`);
  console.log(`Energía media: ${w.avgEnergy}`);
  console.log('');
}

async function cmdAgents() {
  const agents = await fetchApi('/agents');
  console.log('\n--- AGENTES ---');
  for (const a of agents) {
    console.log(`[${a.id}] ${a.name} @ (${a.x.toFixed(0)}, ${a.y.toFixed(0)})`);
    console.log(`    Energía: ${(a.energy * 100).toFixed(0)}% | Estado: ${a.state}`);
    console.log(`    Acción: ${a.action} | Inventario: ${a.inventory?.food ?? 0} comida, ${a.inventory?.material ?? 0} material`);
    if (a.memoryCount && (a.memoryCount.food + a.memoryCount.material + a.memoryCount.shelter) > 0) {
      console.log(`    Recuerdos: ${a.memoryCount.food} comida, ${a.memoryCount.material} material, ${a.memoryCount.shelter} refugios`);
    }
    console.log('');
  }
}

async function cmdAgent(id) {
  const agents = await fetchApi('/agents');
  const a = agents.find((x) => x.id === parseInt(id, 10));
  if (!a) {
    console.log('Agente no encontrado');
    return;
  }
  console.log('\n--- AGENTE', a.name, '---');
  console.log(JSON.stringify(a, null, 2));
  console.log('');
}

async function cmdResources() {
  const resources = await fetchApi('/resources');
  const available = resources.filter((r) => !r.consumed);
  console.log('\n--- RECURSOS ---');
  console.log(`Disponibles: ${available.length} / ${resources.length}`);
  for (const r of available.slice(0, 10)) {
    console.log(`  [${r.id}] ${r.type} @ (${r.x.toFixed(0)}, ${r.y.toFixed(0)})`);
  }
  if (available.length > 10) console.log(`  ... y ${available.length - 10} más`);
  console.log('');
}

async function cmdLogs() {
  const logs = await fetchApi('/logs');
  console.log('\n--- LOGS (últimos 15) ---');
  for (const log of logs.slice(0, 15)) {
    console.log(`  [${log.tick}] [${log.type}] ${log.message}`);
  }
  console.log('');
}

async function cmdStart() {
  await fetchApi('/simulation/start', { method: 'POST' });
  console.log('Simulación iniciada');
}

async function cmdPause() {
  await fetchApi('/simulation/pause', { method: 'POST' });
  console.log('Simulación pausada');
}

async function cmdReset() {
  await fetchApi('/simulation/reset', { method: 'POST' });
  console.log('Mundo reiniciado');
}

function showHelp() {
  console.log(`
--- COMANDOS ---
  world, w     Estado del mundo
  agents, a    Lista de agentes
  agent <id>   Detalle de un agente
  resources,r  Recursos disponibles
  logs, l      Últimos eventos
  start        Iniciar simulación
  pause        Pausar simulación
  reset        Reiniciar mundo
  help, h      Esta ayuda
  quit, q      Salir
`);
}

async function run(cmd) {
  const parts = cmd.trim().toLowerCase().split(/\s+/);
  const c = parts[0];
  try {
    if (c === 'world' || c === 'w') await cmdWorld();
    else if (c === 'agents' || c === 'a') await cmdAgents();
    else if (c === 'agent' && parts[1]) await cmdAgent(parts[1]);
    else if (c === 'resources' || c === 'r') await cmdResources();
    else if (c === 'logs' || c === 'l') await cmdLogs();
    else if (c === 'start') await cmdStart();
    else if (c === 'pause') await cmdPause();
    else if (c === 'reset') await cmdReset();
    else if (c === 'help' || c === 'h') showHelp();
    else if (c === 'quit' || c === 'q') process.exit(0);
    else if (c) console.log('Comando desconocido. Escribe "help" para ver comandos.');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.message.includes('fetch')) {
      console.error('¿Está el backend corriendo en http://localhost:3001?');
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('  Artificial World - Debug Interactivo');
  console.log('========================================');
  console.log('Conectando a http://localhost:3001...');

  try {
    await fetchApi('/world');
    console.log('Conectado. Escribe "help" para ver comandos.\n');
  } catch (err) {
    console.error('No se pudo conectar al backend. Inicia el backend primero:');
    console.error('  cd backend && npm run dev');
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => rl.question('> ', (line) => {
    run(line).then(prompt);
  });
  prompt();
}

main();

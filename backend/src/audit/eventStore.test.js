import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registrar, obtener, verificarIntegridad, contar, setEnabled } from './eventStore.js';

describe('eventStore', () => {
  beforeEach(() => setEnabled(true));
  afterEach(() => setEnabled(false));

  it('registra evento y mantiene integridad', () => {
    const ev = registrar(1, 'sim_start', {});
    expect(ev).toBeTruthy();
    expect(ev.type).toBe('sim_start');
    expect(ev.tick).toBe(1);
    expect(ev.integrity_hash).toBeTruthy();

    const ev2 = registrar(2, 'tick', { agentCount: 5 });
    expect(ev2).toBeTruthy();
    expect(ev2.integrity_hash).toBeTruthy();

    const corruptos = verificarIntegridad();
    expect(corruptos).toEqual([]);
  });

  it('obtener devuelve eventos por tipo', () => {
    registrar(10, 'agent_death', { agentId: 99, cause: 'starved' });

    const deaths = obtener({ type: 'agent_death', limit: 10 });
    expect(deaths.length).toBeGreaterThanOrEqual(1);
    const last = deaths[deaths.length - 1];
    expect(last.payload.agentId).toBe(99);
    expect(last.payload.cause).toBe('starved');
  });

  it('contar devuelve total', () => {
    registrar(1, 'sim_start', {});
    registrar(2, 'tick', {});
    expect(contar()).toBeGreaterThanOrEqual(2);
  });

  it('setEnabled(false) evita registrar', () => {
    setEnabled(false);
    const ev = registrar(1, 'sim_start', {});
    expect(ev).toBeNull();
  });
});

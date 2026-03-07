/**
 * SimulationView — full simulation screen.
 * Handles all data fetching for the simulation pillar.
 * Uses WebSocket via useRealtimeSimulation for real-time state,
 * plus one-shot HTTP calls after mutations.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useRealtimeSimulation } from '../hooks/useRealtimeSimulation';
import { SimulationCanvas } from './SimulationCanvas';
import { ControlPanel } from './ControlPanel';
import { WorldPanel } from './WorldPanel';
import { GlobalMapPanel } from './GlobalMapPanel';
import { RefugeManagementPanel } from './RefugeManagementPanel';
import { GeneticAssemblerPanel } from './GeneticAssemblerPanel';
import { LogPanel } from './LogPanel';
import { AgentDetailPanel } from './AgentDetailPanel';
import { HeroRefugePanel } from './HeroRefugePanel';
import { DetectionBanner } from './DetectionBanner';
import logger from '../utils/logger';

export function SimulationView({ onBack }) {
  const [world, setWorld] = useState(null);
  const [agents, setAgents] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeRefugeIndex, setActiveRefugeIndex] = useState(0);

  const { connected, refuge: wsRefuge, tick: wsTick, running: wsRunning } = useRealtimeSimulation();

  const effectiveRefuge = wsRefuge ?? world?.refuge;
  const effectiveAgents = effectiveRefuge?.agents ?? agents;

  const fetchData = useCallback(async () => {
    try {
      const [worldData, agentsData, blueprintsData, logsData] = await Promise.all([
        api.getWorld(),
        api.getAgents(),
        api.getBlueprints(),
        api.getLogs(),
      ]);
      setWorld(worldData ?? null);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setBlueprints(Array.isArray(blueprintsData) ? blueprintsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setActiveRefugeIndex(worldData?.activeRefugeIndex ?? 0);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch simulation data', err);
      setError(err.message || 'Error connecting to backend');
      setWorld(null);
      setAgents([]);
      setBlueprints([]);
      setLogs([]);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timeout = setTimeout(() => setInitialLoad(false), 5000);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  // Polling fallback when WebSocket disconnected — ensures agents/tick update
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [connected, fetchData]);

  const handleStart = async () => {
    setLoading(true);
    try { await api.startSimulation(); await fetchData(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handlePause = async () => {
    setLoading(true);
    try { await api.pauseSimulation(); await fetchData(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setLoading(true);
    setSelectedAgentId(null);
    try { await api.resetSimulation(); await fetchData(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreateBlueprint = async (name, traits) => {
    setLoading(true);
    try { await api.createBlueprint(name, traits); await fetchData(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRelease = async (blueprintId, count) => {
    setLoading(true);
    try { await api.releaseAgents(activeRefugeIndex, blueprintId, count); await fetchData(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleQuickStart = async () => {
    setLoading(true);
    try {
      await api.startSimulation();
      let bpId = blueprints?.[0]?.id;
      if (!bpId) {
        const bp = await api.createBlueprint('New Species', {
          movementSpeed: 1, metabolism: 0.5, attack: 0, defense: 0,
          gatheringRate: 1, reproductionThreshold: 0.8,
        });
        bpId = bp?.id ?? (Array.isArray(bp) ? bp[0]?.id : null);
      }
      if (bpId) {
        await api.releaseAgents(activeRefugeIndex, bpId, 5);
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRefuge = async (index) => {
    setLoading(true);
    try {
      await api.selectRefuge(index);
      setActiveRefugeIndex(index);
      await fetchData();
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const selectedAgent = effectiveAgents.find((a) => a.id === selectedAgentId) || null;
  const liveWorld = world ? { ...world, refuge: effectiveRefuge, tick: wsTick ?? world.tick, running: wsRunning ?? world.running } : null;

  if (initialLoad && !error) {
    return (
      <div className="app loading-screen">
        <div className="loading-text">Conectando con Artificial Worlds…</div>
      </div>
    );
  }

  return (
    <div className="simulation-view">
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>← Hub</button>
        </div>
        <div className="header-center">
          <h1>Artificial Worlds</h1>
          <p className="subtitle">Design life. Watch it survive.</p>
        </div>
        <div className="header-right">
          <span className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`}>
            {connected ? '● Live' : '○ Offline'}
          </span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <DetectionBanner wsConnected={connected} onRefresh={fetchData} />

      {effectiveAgents.length === 0 && !error && (
        <div className="quick-start-banner">
          <span>Sin agentes. </span>
          <button
            type="button"
            className="btn btn-primary btn-inline"
            onClick={handleQuickStart}
            disabled={loading}
          >
            Empezar rápido — crear especie y soltar 5 agentes
          </button>
        </div>
      )}

      <div className="main-layout">
        <aside className="sidebar left">
          <ControlPanel world={liveWorld} onStart={handleStart} onPause={handlePause} onReset={handleReset} loading={loading} />
          <GlobalMapPanel world={liveWorld} activeRefugeIndex={activeRefugeIndex} onSelectRefuge={handleSelectRefuge} />
          <WorldPanel world={liveWorld} />
          <GeneticAssemblerPanel blueprints={blueprints} onCreateBlueprint={handleCreateBlueprint} onRelease={handleRelease} onQuickStart={handleQuickStart} loading={loading} agentCount={effectiveAgents.length} />
          <RefugeManagementPanel world={liveWorld} />
        </aside>

        <main className="simulation-area">
          <SimulationCanvas
            refuge={effectiveRefuge}
            agents={effectiveAgents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={(a) => setSelectedAgentId(a?.id ?? null)}
          />
        </main>

        <aside className="sidebar right">
          <HeroRefugePanel />
          <AgentDetailPanel selectedAgent={selectedAgent} agents={effectiveAgents} onSelectAgent={(a) => setSelectedAgentId(a?.id ?? null)} />
          <LogPanel logs={logs} />
        </aside>
      </div>
    </div>
  );
}

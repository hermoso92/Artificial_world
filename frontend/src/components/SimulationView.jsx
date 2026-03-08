/**
 * SimulationView — full simulation screen.
 * Handles all data fetching for the simulation pillar.
 * Uses WebSocket via useRealtimeSimulation for real-time state,
 * plus one-shot HTTP calls after mutations.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getPlayerId } from '../services/api';
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

export function SimulationView({ onBack, onNavigate }) {
  const [world, setWorld] = useState(null);
  const [agents, setAgents] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeRefugeIndex, setActiveRefugeIndex] = useState(0);
  const [refuges, setRefuges] = useState([]);

  const { connected, refuge: wsRefuge, tick: wsTick, running: wsRunning } = useRealtimeSimulation();

  const effectiveRefuge = wsRefuge ?? world?.refuge;
  const effectiveAgents = effectiveRefuge?.agents ?? agents;

  const autoSelectedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [worldData, agentsData, blueprintsData, logsData, refugesData] = await Promise.all([
        api.getWorld(),
        api.getAgents(),
        api.getBlueprints(),
        api.getLogs(),
        api.getRefuges(),
      ]);
      setWorld(worldData ?? null);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setBlueprints(Array.isArray(blueprintsData) ? blueprintsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      const refList = Array.isArray(refugesData) ? refugesData : [];
      setRefuges(refList);

      // #region agent log
      const pid = getPlayerId();
      fetch('http://127.0.0.1:7420/ingest/10191b54-3116-4e1b-b9ad-2fd987d9aa38',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cc0b57'},body:JSON.stringify({sessionId:'cc0b57',location:'SimulationView.jsx:fetchData',message:'fetchData called',data:{pid,autoSelected:autoSelectedRef.current,refListLength:refList.length,refOwnerIds:refList.map(r=>r.ownerId).filter(Boolean),worldActiveIdx:worldData?.activeRefugeIndex},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
      // #endregion

      // Auto-seleccionar refugio propio, o crearlo si no existe
      if (!autoSelectedRef.current && pid) {
        let myIdx = refList.findIndex((r) => r.ownerId === pid);
        // #region agent log
        fetch('http://127.0.0.1:7420/ingest/10191b54-3116-4e1b-b9ad-2fd987d9aa38',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cc0b57'},body:JSON.stringify({sessionId:'cc0b57',location:'SimulationView.jsx:autoSelect',message:'findIndex result',data:{pid,myIdx,matchedOwnerId:myIdx>=0?refList[myIdx].ownerId:null,matchedName:myIdx>=0?refList[myIdx].name:null},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
        // #endregion
        if (myIdx < 0) {
          try {
            // #region agent log
            fetch('http://127.0.0.1:7420/ingest/10191b54-3116-4e1b-b9ad-2fd987d9aa38',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cc0b57'},body:JSON.stringify({sessionId:'cc0b57',location:'SimulationView.jsx:createRefuge',message:'creating personal refuge',data:{pid},timestamp:Date.now(),hypothesisId:'H-B'})}).catch(()=>{});
            // #endregion
            await api.createRefuge('Mi casa', pid);
            const freshRefuges = await api.getRefuges();
            const freshList = Array.isArray(freshRefuges) ? freshRefuges : [];
            setRefuges(freshList);
            myIdx = freshList.findIndex((r) => r.ownerId === pid);
            // #region agent log
            fetch('http://127.0.0.1:7420/ingest/10191b54-3116-4e1b-b9ad-2fd987d9aa38',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cc0b57'},body:JSON.stringify({sessionId:'cc0b57',location:'SimulationView.jsx:postCreate',message:'refuge created',data:{myIdx,freshListLength:freshList.length},timestamp:Date.now(),hypothesisId:'H-B'})}).catch(()=>{});
            // #endregion
          } catch (err) {
            logger.warn('Could not auto-create personal refuge', err);
          }
        }
        if (myIdx >= 0) {
          setActiveRefugeIndex(myIdx);
          autoSelectedRef.current = true;
          // #region agent log
          fetch('http://127.0.0.1:7420/ingest/10191b54-3116-4e1b-b9ad-2fd987d9aa38',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cc0b57'},body:JSON.stringify({sessionId:'cc0b57',location:'SimulationView.jsx:selectRefuge',message:'selecting own refuge',data:{myIdx,ownerId:refList[myIdx]?.ownerId,name:refList[myIdx]?.name},timestamp:Date.now(),hypothesisId:'H-B'})}).catch(()=>{});
          // #endregion
          try { await api.selectRefuge(myIdx); } catch (err) { logger.warn('SimulationView: select refuge failed', err); }
        } else {
          setActiveRefugeIndex(worldData?.activeRefugeIndex ?? 0);
        }
      } else if (!autoSelectedRef.current) {
        setActiveRefugeIndex(worldData?.activeRefugeIndex ?? 0);
      }

      setError(null);
    } catch (err) {
      logger.error('Failed to fetch simulation data', err);
      setError(err.message || 'Error al conectar con el backend');
      setWorld(null);
      setAgents([]);
      setBlueprints([]);
      setLogs([]);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const maxRetries = 3;
    const retryDelay = 1500;

    const attemptFetch = async () => {
      if (cancelled) return;
      try {
        await api.checkHealth();
        if (cancelled) return;
        await fetchData();
      } catch (err) {
        if (cancelled) return;
        if (retries < maxRetries) {
          retries++;
          setTimeout(attemptFetch, retryDelay);
        } else {
          setError(err.message || 'Error al conectar con el backend');
          setInitialLoad(false);
        }
      }
    };

    attemptFetch();
    const timeout = setTimeout(() => {
      if (!cancelled) setInitialLoad(false);
    }, 8000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
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

  const handleAddRefugeNode = async (refugeIdx, type, gridX, gridY) => {
    try {
      await api.addRefugeNode(refugeIdx, type, gridX, gridY);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlaceFurniture = async (refugeIdx, type, gridX, gridY) => {
    try {
      await api.placeFurniture(refugeIdx, type, gridX, gridY);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInteractFurniture = async (refugeIdx, furnitureId) => {
    try {
      const result = await api.interactFurniture(refugeIdx, furnitureId);
      await fetchData();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const handleAdoptPet = async () => {
    try {
      await api.adoptPet(activeRefugeIndex, 'cat');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedAgent = effectiveAgents.find((a) => a.id === selectedAgentId) || null;
  const isOwnedRefuge = effectiveRefuge?.ownerId === getPlayerId();
  const hasPets = (effectiveRefuge?.pets ?? []).length > 0;
  // #region agent log
  if (!window.__cc0b57_logged_render) { window.__cc0b57_logged_render = true; setTimeout(() => { window.__cc0b57_logged_render = false; }, 5000); fetch('http://127.0.0.1:7420/ingest/10191b54-3116-4e1b-b9ad-2fd987d9aa38',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cc0b57'},body:JSON.stringify({sessionId:'cc0b57',location:'SimulationView.jsx:render',message:'render state',data:{isOwnedRefuge,refugeOwnerId:effectiveRefuge?.ownerId,pid:getPlayerId(),refugeName:effectiveRefuge?.name,refugeId:effectiveRefuge?.id,agentCount:effectiveAgents.length,activeRefugeIndex,hasPets,connected},timestamp:Date.now(),hypothesisId:'H-ALL'})}).catch(()=>{});}
  // #endregion
  const liveWorld = world ? { ...world, refuge: effectiveRefuge, tick: wsTick ?? world.tick, running: wsRunning ?? world.running } : null;

  // Pet tick + stat decay — runs every 3s when viewing own refuge
  useEffect(() => {
    if (!isOwnedRefuge) return;
    const interval = setInterval(async () => {
      try {
        if (hasPets) {
          await api.tickPets(activeRefugeIndex, 16, 16);
        }
        await fetchData();
      } catch (err) {
        logger.warn('SimulationView: pet tick / fetch failed', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOwnedRefuge, hasPets, activeRefugeIndex, fetchData]);

  if (initialLoad && !error) {
    return (
      <div className="app loading-screen">
        <div className="loading-text">Entrando en tu mundo…</div>
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
          <h1>Tu Mundo</h1>
          <p className="subtitle">Constrúyelo. Habítalo. Haz que crezca.</p>
        </div>
        <div className="header-right">
          {onNavigate && (
            <button type="button" className="header-link" onClick={() => onNavigate('missioncontrol')}>
              Observatorio
            </button>
          )}
          <span className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`}>
            {connected ? '● Live' : '○ Offline'}
          </span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" className="btn btn-inline" onClick={() => { setError(null); setInitialLoad(true); fetchData(); }}>
            Actualizar
          </button>
        </div>
      )}

      <DetectionBanner wsConnected={connected} onRefresh={fetchData} />

      {effectiveAgents.length === 0 && !error && (
        <div className="quick-start-banner">
          <span>Tu mundo está vacío. </span>
          <button
            type="button"
            className="btn btn-primary btn-inline"
            onClick={handleQuickStart}
            disabled={loading}
          >
            Empezar rápido — crear especie y traer 5 habitantes
          </button>
        </div>
      )}

      <div className="main-layout">
        <aside className="sidebar left">
          <ControlPanel world={liveWorld} onStart={handleStart} onPause={handlePause} onReset={handleReset} loading={loading} />
          <GlobalMapPanel world={liveWorld} activeRefugeIndex={activeRefugeIndex} onSelectRefuge={handleSelectRefuge} />
          <WorldPanel world={liveWorld} />
          <GeneticAssemblerPanel blueprints={blueprints} onCreateBlueprint={handleCreateBlueprint} onRelease={handleRelease} onQuickStart={handleQuickStart} loading={loading} agentCount={effectiveAgents.length} />
          <RefugeManagementPanel
            world={liveWorld}
            refuges={refuges}
            playerId={getPlayerId()}
            onCreateRefuge={async (name) => {
              setLoading(true);
              try {
                await api.createRefuge(name);
                await fetchData();
              } catch (err) { setError(err.message); }
              finally { setLoading(false); }
            }}
            loading={loading}
          />
        </aside>

        <main className="simulation-area">
          <SimulationCanvas
            refuge={effectiveRefuge}
            agents={effectiveAgents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={(a) => setSelectedAgentId(a?.id ?? null)}
            isOwnedRefuge={isOwnedRefuge}
            onAddNode={handleAddRefugeNode}
            onPlaceFurniture={handlePlaceFurniture}
            onInteractFurniture={handleInteractFurniture}
            refugeIndex={activeRefugeIndex}
          />
          {isOwnedRefuge && !hasPets && (
            <button type="button" className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleAdoptPet}>
              Adoptar gato
            </button>
          )}
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

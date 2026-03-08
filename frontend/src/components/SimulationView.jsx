/**
 * SimulationView — full simulation screen.
 * Handles all data fetching for the simulation pillar.
 * Uses WebSocket via useRealtimeSimulation for real-time state,
 * plus one-shot HTTP calls after mutations.
 */
import { useState, useEffect, useCallback } from 'react';
import { api, getPlayerId } from '../services/api';
import { useRealtimeSimulation } from '../hooks/useRealtimeSimulation';
import { useSimulationData } from '../hooks/useSimulationData';
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
import { SimulationViewHeader } from './SimulationView/SimulationViewHeader';
import { SimulationViewBanners } from './SimulationView/SimulationViewBanners';
import logger from '../utils/logger';

export function SimulationView({ onBack, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const {
    world,
    agents,
    blueprints,
    logs,
    refuges,
    hero,
    setHero,
    activeRefugeIndex,
    setActiveRefugeIndex,
    initialLoad,
    error,
    setError,
    setInitialLoad,
    fetchData,
  } = useSimulationData();

  const { connected, refuge: wsRefuge, tick: wsTick, running: wsRunning } = useRealtimeSimulation();

  const effectiveRefuge = wsRefuge ?? world?.refuge;
  const effectiveAgents = effectiveRefuge?.agents ?? agents;
  const selectedAgent = effectiveAgents.find((a) => a.id === selectedAgentId) || null;
  const isOwnedRefuge = effectiveRefuge?.ownerId === getPlayerId();
  const hasPets = (effectiveRefuge?.pets ?? []).length > 0;
  const furniture = effectiveRefuge?.furniture ?? [];
  const liveWorld = world ? { ...world, refuge: effectiveRefuge, tick: wsTick ?? world.tick, running: wsRunning ?? world.running } : null;

  // Polling fallback when WebSocket disconnected
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [connected, fetchData]);

  // Pet tick + stat decay — runs every 3s when viewing own refuge
  useEffect(() => {
    if (!isOwnedRefuge) return;
    const interval = setInterval(async () => {
      try {
        if (hasPets) {
          await api.tickPets(activeRefugeIndex, 16, 16, effectiveRefuge?.id);
        }
        await fetchData();
      } catch (err) {
        logger.warn('SimulationView: pet tick / fetch failed', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOwnedRefuge, hasPets, activeRefugeIndex, effectiveRefuge?.id, fetchData]);

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

  const handlePlaceFurniture = async (refugeIdx, type, gridX, gridY, refugeId) => {
    try {
      await api.placeFurniture(refugeIdx, type, gridX, gridY, refugeId);
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
      await api.adoptPet(activeRefugeIndex, 'cat', effectiveRefuge?.id);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateRefuge = async (name) => {
    setLoading(true);
    try {
      await api.createRefuge(name);
      await fetchData();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleEnterWorld = async (worldData) => {
    if (worldData?.simulationRefugeIndex == null) return;
    setLoading(true);
    try {
      await api.selectRefuge(worldData.simulationRefugeIndex);
      setActiveRefugeIndex(worldData.simulationRefugeIndex);
      await fetchData();
    } catch (err) {
      logger.warn('SimulationView: enter world failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad && !error) {
    return (
      <div className="app loading-screen">
        <div className="loading-text">Entrando en tu mundo…</div>
      </div>
    );
  }

  return (
    <div className="simulation-view">
      <SimulationViewHeader hero={hero} connected={connected} onBack={onBack} onNavigate={onNavigate} />

      <DetectionBanner wsConnected={connected} onRefresh={fetchData} />

      <SimulationViewBanners
        error={error}
        setError={setError}
        setInitialLoad={setInitialLoad}
        fetchData={fetchData}
        isOwnedRefuge={isOwnedRefuge}
        effectiveRefuge={effectiveRefuge}
        effectiveAgents={effectiveAgents}
        furniture={furniture}
        onQuickStart={handleQuickStart}
        loading={loading}
      />

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
            onCreateRefuge={handleCreateRefuge}
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
          <HeroRefugePanel heroData={hero} onHeroUpdate={setHero} onEnterWorld={handleEnterWorld} />
          <AgentDetailPanel selectedAgent={selectedAgent} agents={effectiveAgents} onSelectAgent={(a) => setSelectedAgentId(a?.id ?? null)} />
          <LogPanel logs={logs} />
        </aside>
      </div>
    </div>
  );
}

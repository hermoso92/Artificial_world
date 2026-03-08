/**
 * Hook for fetching and polling simulation data.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { api, getPlayerId } from '../services/api';
import logger from '../utils/logger';

export function useSimulationData() {
  const [world, setWorld] = useState(null);
  const [agents, setAgents] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeRefugeIndex, setActiveRefugeIndex] = useState(0);
  const [refuges, setRefuges] = useState([]);
  const [hero, setHero] = useState(null);
  const [error, setError] = useState(null);
  const autoSelectedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [worldData, agentsData, blueprintsData, logsData, refugesData, heroData] = await Promise.all([
        api.getWorld(),
        api.getAgents(),
        api.getBlueprints(),
        api.getLogs(),
        api.getRefuges(),
        api.getHero().catch(() => null),
      ]);
      setWorld(worldData ?? null);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setBlueprints(Array.isArray(blueprintsData) ? blueprintsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      const refList = Array.isArray(refugesData) ? refugesData : [];
      setRefuges(refList);

      const pid = getPlayerId();
      if (!autoSelectedRef.current && pid) {
        let myIdx = refList.findIndex((r) => r.ownerId === pid);
        if (myIdx < 0) {
          try {
            await api.createRefuge('Mi casa');
            const freshRefuges = await api.getRefuges();
            const freshList = Array.isArray(freshRefuges) ? freshRefuges : [];
            setRefuges(freshList);
            myIdx = freshList.findIndex((r) => r.ownerId === pid);
          } catch (err) {
            logger.warn('Could not auto-create personal refuge', err);
          }
        }
        if (myIdx >= 0) {
          setActiveRefugeIndex(myIdx);
          autoSelectedRef.current = true;
          try {
            await api.selectRefuge(myIdx);
          } catch (err) {
            logger.warn('SimulationView: select refuge failed', err);
          }
        } else {
          setActiveRefugeIndex(worldData?.activeRefugeIndex ?? 0);
        }
      } else if (!autoSelectedRef.current) {
        setActiveRefugeIndex(worldData?.activeRefugeIndex ?? 0);
      }

      setError(null);
      if (heroData) setHero(heroData);
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

  return {
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
  };
}

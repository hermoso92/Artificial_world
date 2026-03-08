/**
 * useMCOverviewActions — todos los handlers de acción del Observatorio.
 * Extraído de MCOverview para mantener el componente bajo 300 líneas.
 */
import { useState, useCallback } from 'react';
import { api } from '../../services/api.js';
import logger from '../../utils/logger.js';

export function useMCOverviewActions({ selectedRefugeIndex, selectedBlueprintId, blueprints, refuges, releaseCount, refresh }) {
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [createRefugeLoading, setCreateRefugeLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const feedback = useCallback((type, msg) => {
    setActionFeedback({ type, msg });
    if (type !== 'limit') setTimeout(() => setActionFeedback(null), type === 'success' ? 2500 : 3500);
  }, []);

  const handleSelectRefuge = useCallback(async (index, onSelect) => {
    try {
      await api.selectRefuge(index);
      onSelect(index);
      feedback('success', `${refuges[index]?.name ?? `Refugio ${index + 1}`} seleccionado`);
    } catch (err) {
      logger.warn('MCOverview: select refuge failed', err);
      feedback('error', err.message);
    }
  }, [refuges, feedback]);

  const handleStartSimulation = useCallback(async () => {
    try {
      await api.startSimulation();
      await refresh();
      feedback('success', 'Tu mundo cobra vida');
    } catch (err) {
      logger.warn('MCOverview: start simulation failed', err);
      feedback('error', err.message);
    }
  }, [refresh, feedback]);

  const handlePauseSimulation = useCallback(async () => {
    try {
      await api.pauseSimulation();
      await refresh();
      feedback('success', 'Mundo en pausa');
    } catch (err) {
      logger.warn('MCOverview: pause failed', err);
      feedback('error', err.message);
    }
  }, [refresh, feedback]);

  const handleResetSimulation = useCallback(async () => {
    try {
      await api.resetSimulation();
      await refresh();
      feedback('success', 'Un nuevo comienzo');
    } catch (err) {
      logger.warn('MCOverview: reset failed', err);
      feedback('error', err.message);
    }
  }, [refresh, feedback]);

  const handleRelease = useCallback(async () => {
    const bpId = selectedBlueprintId ?? blueprints[0]?.id;
    if (!bpId) return;
    setReleaseLoading(true);
    setActionFeedback(null);
    try {
      const result = await api.releaseAgents(selectedRefugeIndex, bpId, releaseCount);
      const added = typeof result === 'object' ? result?.added ?? 0 : result;
      await refresh();
      feedback('success', `${added} habitantes llegan a tu mundo`);
    } catch (err) {
      logger.warn('MCOverview: release failed', err);
      if (err.message?.includes('plan') || err.message?.includes('Mejora') || err.message?.includes('habitantes')) {
        feedback('limit', err.message);
      } else {
        feedback('error', err.message);
      }
    } finally {
      setReleaseLoading(false);
    }
  }, [selectedBlueprintId, blueprints, selectedRefugeIndex, releaseCount, refresh, feedback]);

  const handleCreateBlueprint = useCallback(async () => {
    try {
      await api.createBlueprint('Nueva especie', { movementSpeed: 1, metabolism: 0.3, gatheringRate: 1.2, reproductionThreshold: 0.8 });
      await refresh();
      feedback('success', 'Especie creada');
    } catch (err) {
      logger.warn('MCOverview: create blueprint failed', err);
      feedback('error', err.message);
    }
  }, [refresh, feedback]);

  const handleCreateRefuge = useCallback(async (name, onCreated) => {
    setCreateRefugeLoading(true);
    setActionFeedback(null);
    try {
      const refuge = await api.createRefuge(name.trim() || 'Mi refugio');
      await refresh();
      onCreated();
      feedback('success', `¡${refuge?.name ?? 'Mi refugio'} está listo! Empieza a habitarlo.`);
    } catch (err) {
      logger.warn('MCOverview: create refuge failed', err);
      feedback('error', err.message);
    } finally {
      setCreateRefugeLoading(false);
    }
  }, [refresh, feedback]);

  return {
    releaseLoading,
    createRefugeLoading,
    actionFeedback,
    setActionFeedback,
    handleSelectRefuge,
    handleStartSimulation,
    handlePauseSimulation,
    handleResetSimulation,
    handleRelease,
    handleCreateBlueprint,
    handleCreateRefuge,
  };
}

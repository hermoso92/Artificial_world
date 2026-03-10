import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { missionControlClient } from '../services/missionControlClient.js';
import { useMissionControlRealtime } from '../hooks/useMissionControlRealtime.js';
import { useMissionControlStore } from '../store/useMissionControlStore.js';
import { MissionControlApprovalCenter } from '../components/MissionControlApprovalCenter.jsx';
import { MissionControlAgentRail } from '../components/MissionControlAgentRail.jsx';
import { MissionControlBoard } from '../components/MissionControlBoard.jsx';
import { MissionControlDashboard } from '../components/MissionControlDashboard.jsx';
import { MissionControlDetailPanel } from '../components/MissionControlDetailPanel.jsx';
import { MissionControlEventFeed } from '../components/MissionControlEventFeed.jsx';
import { MissionControlFilterBar } from '../components/MissionControlFilterBar.jsx';
import { MissionControlRunsPanel } from '../components/MissionControlRunsPanel.jsx';
import { Badge, Button } from '../components/ui.jsx';
import { formatDateTime } from '../utils/format.js';

function buildSelection(kind, item) {
  return item ? { kind, ...item } : null;
}

export function MissionControlShell({ onBack }) {
  useMissionControlRealtime();

  const {
    snapshot,
    filters,
    loading,
    error,
    wsConnected,
    wsState,
    reconnectAttempt,
    lastSnapshotAt,
    feedPaused,
    activeTaskId,
    activeRunId,
    activeApprovalId,
    activeEvent,
    setSnapshot,
    setLoading,
    setError,
    setFilters,
    setFeedPaused,
    setActiveTaskId,
    setActiveRunId,
    setActiveApprovalId,
    setActiveEvent,
    clearSelection,
  } = useMissionControlStore();

  const [taskDetail, setTaskDetail] = useState(null);
  const [runDetail, setRunDetail] = useState(null);
  const [approvalDetail, setApprovalDetail] = useState(null);

  const loadSnapshot = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await missionControlClient.getSnapshot({
        boardGroupId: filters.boardGroupId || undefined,
        gatewayId: filters.gatewayId || undefined,
        agentId: filters.agentId || undefined,
        priority: filters.priority || undefined,
        workType: filters.workType || undefined,
        search: filters.search || undefined,
        requiresApproval: filters.requiresApproval ? 'true' : undefined,
        blocked: filters.blocked ? 'true' : undefined,
      });
      setSnapshot(data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [filters.agentId, filters.blocked, filters.boardGroupId, filters.gatewayId, filters.priority, filters.requiresApproval, filters.search, filters.workType, setError, setLoading, setSnapshot]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (wsConnected) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadSnapshot(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadSnapshot, wsConnected]);

  useEffect(() => {
    if (!activeTaskId) {
      setTaskDetail(null);
      return;
    }

    missionControlClient.getTaskDetail(activeTaskId).then(setTaskDetail).catch(() => setTaskDetail(null));
  }, [activeTaskId]);

  useEffect(() => {
    if (!activeRunId) {
      setRunDetail(null);
      return;
    }

    missionControlClient.getRunDetail(activeRunId).then(setRunDetail).catch(() => setRunDetail(null));
  }, [activeRunId]);

  useEffect(() => {
    if (!activeApprovalId) {
      setApprovalDetail(null);
      return;
    }

    missionControlClient.getApproval(activeApprovalId).then(setApprovalDetail).catch(() => setApprovalDetail(null));
  }, [activeApprovalId]);

  const selection = useMemo(() => {
    if (activeTaskId && taskDetail?.task) return buildSelection('task', taskDetail.task);
    if (activeRunId && runDetail?.run) return buildSelection('run', runDetail.run);
    if (activeApprovalId && approvalDetail) return buildSelection('approval', approvalDetail);
    if (activeEvent) return buildSelection('event', activeEvent);
    return null;
  }, [activeTaskId, activeRunId, activeApprovalId, activeEvent, taskDetail, runDetail, approvalDetail]);

  const handleApprove = async (approvalId, note) => {
    await missionControlClient.approve(approvalId, note || 'Approved from Mission Control');
    await loadSnapshot();
  };

  const handleReject = async (approvalId, note) => {
    await missionControlClient.reject(approvalId, note || 'Rejected from Mission Control');
    await loadSnapshot();
  };

  const handlePauseTask = async (taskId) => {
    await missionControlClient.pauseTask(taskId);
    await loadSnapshot();
  };

  const handleResumeTask = async (taskId) => {
    await missionControlClient.resumeTask(taskId);
    await loadSnapshot();
  };

  const handleMoveTask = async (taskId, status, beforeTaskId = null) => {
    await missionControlClient.moveTask(taskId, status, beforeTaskId);
    await loadSnapshot();
  };

  return (
    <div className="mission-shell min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 p-4 lg:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-gradient-to-r from-slate-950 via-slate-950 to-cyan-950/30 p-5">
          <div className="flex items-center gap-3">
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.28em] text-cyan-300/80">Mission Control</div>
              <h1 className="text-2xl font-semibold tracking-tight">OpenClaw Air Traffic Control</h1>
              <p className="text-sm text-slate-400">Centro operativo local-first para agentes, runs, gates humanos y gateways multiples.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone={wsConnected ? 'success' : 'danger'}>
              {wsConnected ? <Wifi className="mr-1 size-3" /> : <WifiOff className="mr-1 size-3" />}
              {wsConnected ? 'stream online' : 'stream offline'}
            </Badge>
            <Badge tone={wsState === 'reconnecting' || wsState === 'degraded' ? 'warning' : 'info'}>
              {wsState}
              {reconnectAttempt > 0 ? ` #${reconnectAttempt}` : ''}
            </Badge>
            <Badge tone="info">
              <Activity className="mr-1 size-3" />
              hybrid adapter
            </Badge>
            <Button variant="secondary" onClick={loadSnapshot}>
              <RefreshCcw className="size-4" />
              Refrescar
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
          <span>
            {wsConnected
              ? 'Stream en tiempo real activo.'
              : 'Stream degradado. Activado fallback por polling cada 5s.'}
          </span>
          <span>Ultimo snapshot valido: <strong className="text-slate-200">{formatDateTime(lastSnapshotAt)}</strong></span>
        </div>

        <MissionControlFilterBar
          filters={filters}
          boardGroups={snapshot.boardGroups}
          gateways={snapshot.gateways}
          agents={snapshot.agents}
          onChange={setFilters}
          onReset={() => setFilters({ boardGroupId: '', gatewayId: '', agentId: '', priority: '', workType: '', search: '', requiresApproval: false, blocked: false })}
        />

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Error cargando Mission Control: {error}
          </div>
        )}

        {loading && (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
            ))}
          </div>
        )}

        {!loading && (
          <>
            <MissionControlDashboard overview={snapshot.overview} gateways={snapshot.gateways} />

            <div className="grid gap-4 xl:grid-cols-[320px,1fr]">
              <MissionControlAgentRail
                agents={snapshot.agents}
                onInspect={(agent) => {
                  if (agent.currentTaskId) setActiveTaskId(agent.currentTaskId);
                }}
              />
              <MissionControlBoard tasks={snapshot.tasks} onSelectTask={(task) => setActiveTaskId(task.id)} onMoveTask={handleMoveTask} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr,420px]">
              <div className="space-y-4">
                <MissionControlRunsPanel
                  runs={snapshot.runs}
                  onSelectRun={setActiveRunId}
                />
                <MissionControlEventFeed
                  events={snapshot.events}
                  paused={feedPaused}
                  onTogglePause={() => setFeedPaused(!feedPaused)}
                  onSelect={(event) => setActiveEvent(event)}
                />
                <MissionControlApprovalCenter
                  approvals={snapshot.approvals}
                  onSelect={(approval) => setActiveApprovalId(approval.id)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </div>

              <MissionControlDetailPanel
                selection={selection}
                taskDetail={taskDetail}
                runDetail={runDetail}
                approvalDetail={approvalDetail}
                onClose={clearSelection}
                onPauseTask={handlePauseTask}
                onResumeTask={handleResumeTask}
                onSelectRun={setActiveRunId}
                onSelectApproval={setActiveApprovalId}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

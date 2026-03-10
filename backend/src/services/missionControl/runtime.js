import logger from '../../utils/logger.js';
import { getMissionControlSnapshot } from './aggregator.js';
import { runQualityGate } from './qualityGateService.js';
import {
  countRows,
  getApproval,
  getTask,
  insertEvent,
  listAgents,
  listApprovals,
  listBoards,
  listGateways,
  listRuns,
  listTasks,
  upsertAgent,
  upsertApproval,
  upsertBoard,
  upsertBoardGroup,
  upsertGateway,
  upsertRun,
  upsertTask,
} from './repository.js';

const TICK_MS = Number(process.env.MISSION_CONTROL_TICK_MS ?? 4000);
const RUNTIME_MODE = process.env.MISSION_CONTROL_RUNTIME_MODE ?? 'seed';

let publishRealtime = () => {};
let runtimeStarted = false;
let simulationInterval = null;
let tickCounter = 0;

function nowIso() {
  return new Date().toISOString();
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function pickRandom(items) {
  if (!items.length) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function seedBoardGroups() {
  const groups = [
    { id: 'group_research', name: 'Research', kind: 'project', description: 'Exploracion, discovery y analisis' },
    { id: 'group_build', name: 'Build', kind: 'project', description: 'Entrega principal de producto y backend' },
    { id: 'group_review', name: 'Review', kind: 'team', description: 'Calidad, verificacion y aprobaciones' },
    { id: 'group_client_ops', name: 'Client Ops', kind: 'client', description: 'Operaciones con clientes y despliegues' },
    { id: 'group_internal', name: 'Internal Systems', kind: 'environment', description: 'Infraestructura y sistemas internos' },
  ];

  for (const group of groups) {
    upsertBoardGroup(group);
  }
}

function seedGateways() {
  const gateways = [
    {
      id: 'gateway_primary',
      name: 'OpenClaw Primary',
      kind: 'openclaw',
      status: 'connected',
      latencyMs: 42,
      retryCount: 0,
      healthScore: 0.98,
      lastHeartbeatAt: nowIso(),
      metadata: { region: 'local', adapterMode: 'hybrid', version: 'adapter-v1' },
    },
    {
      id: 'gateway_review',
      name: 'OpenClaw Review',
      kind: 'openclaw',
      status: 'connected',
      latencyMs: 71,
      retryCount: 0,
      healthScore: 0.96,
      lastHeartbeatAt: nowIso(),
      metadata: { region: 'local', adapterMode: 'hybrid', version: 'adapter-v1' },
    },
    {
      id: 'gateway_sandbox',
      name: 'Sandbox Local',
      kind: 'simulator',
      status: 'degraded',
      latencyMs: 121,
      retryCount: 1,
      healthScore: 0.78,
      lastHeartbeatAt: nowIso(),
      metadata: { region: 'local', adapterMode: 'seed-runtime', version: 'adapter-v1' },
    },
  ];

  for (const gateway of gateways) {
    upsertGateway(gateway);
  }
}

function seedBoards() {
  const boards = [
    { id: 'board_signal_lab', groupId: 'group_research', gatewayId: 'gateway_primary', name: 'Signal Lab', description: 'Exploracion y analisis de comportamiento multiagente' },
    { id: 'board_mission_core', groupId: 'group_build', gatewayId: 'gateway_primary', name: 'Mission Core', description: 'Construccion del producto operativo principal' },
    { id: 'board_release_gate', groupId: 'group_review', gatewayId: 'gateway_review', name: 'Release Gate', description: 'Revision, QA y aprobaciones sensibles' },
    { id: 'board_client_rollout', groupId: 'group_client_ops', gatewayId: 'gateway_review', name: 'Client Rollout', description: 'Operaciones con clientes y despliegues' },
    { id: 'board_internal_stack', groupId: 'group_internal', gatewayId: 'gateway_sandbox', name: 'Internal Stack', description: 'Infraestructura y automatizacion interna' },
  ];

  for (const board of boards) {
    upsertBoard(board);
  }
}

function seedAgents() {
  const agents = [
    {
      id: 'agent_orbit',
      gatewayId: 'gateway_primary',
      boardId: 'board_mission_core',
      name: 'Orbit',
      role: 'builder',
      status: 'running',
      currentTaskId: 'task_event_ingestion',
      lastHeartbeatAt: nowIso(),
      metadata: { specialty: 'backend', gatewayOrigin: 'OpenClaw Primary' },
    },
    {
      id: 'agent_vector',
      gatewayId: 'gateway_primary',
      boardId: 'board_signal_lab',
      name: 'Vector',
      role: 'researcher',
      status: 'active',
      currentTaskId: 'task_gateway_contract',
      lastHeartbeatAt: nowIso(),
      metadata: { specialty: 'analysis', gatewayOrigin: 'OpenClaw Primary' },
    },
    {
      id: 'agent_guard',
      gatewayId: 'gateway_review',
      boardId: 'board_release_gate',
      name: 'Guard',
      role: 'reviewer',
      status: 'waiting_approval',
      currentTaskId: 'task_risk_review',
      lastHeartbeatAt: nowIso(),
      metadata: { specialty: 'review', gatewayOrigin: 'OpenClaw Review' },
    },
    {
      id: 'agent_echo',
      gatewayId: 'gateway_review',
      boardId: 'board_client_rollout',
      name: 'Echo',
      role: 'operator',
      status: 'idle',
      currentTaskId: null,
      lastHeartbeatAt: nowIso(),
      metadata: { specialty: 'ops', gatewayOrigin: 'OpenClaw Review' },
    },
    {
      id: 'agent_scout',
      gatewayId: 'gateway_sandbox',
      boardId: 'board_internal_stack',
      name: 'Scout',
      role: 'observer',
      status: 'error',
      currentTaskId: 'task_gateway_retry',
      lastHeartbeatAt: minutesAgo(3),
      lastError: 'Timeout al reconectar con sandbox local',
      metadata: { specialty: 'infrastructure', gatewayOrigin: 'Sandbox Local' },
    },
  ];

  for (const agent of agents) {
    upsertAgent(agent);
  }
}

function seedTasks() {
  const tasks = [
    {
      id: 'task_event_ingestion',
      boardId: 'board_mission_core',
      gatewayId: 'gateway_primary',
      agentId: 'agent_orbit',
      title: 'Normalize event ingestion pipeline',
      status: 'in_progress',
      sortOrder: 1000,
      priority: 'critical',
      workType: 'backend',
      requiresApproval: false,
      blocked: false,
      tags: ['events', 'aggregator', 'backend'],
      summary: 'Mapea eventos heterogeneos del gateway a un modelo interno consistente.',
      lastActivityAt: minutesAgo(2),
      metadata: { lastAction: 'processing_stream_batch' },
    },
    {
      id: 'task_gateway_contract',
      boardId: 'board_signal_lab',
      gatewayId: 'gateway_primary',
      agentId: 'agent_vector',
      title: 'Draft OpenClaw adapter contract',
      status: 'review',
      sortOrder: 1000,
      priority: 'high',
      workType: 'analysis',
      requiresApproval: false,
      blocked: false,
      tags: ['gateway', 'contract'],
      summary: 'Versiona payloads de eventos y heartbeat para el adapter real.',
      lastActivityAt: minutesAgo(7),
      metadata: { lastAction: 'submitted_for_review' },
    },
    {
      id: 'task_risk_review',
      boardId: 'board_release_gate',
      gatewayId: 'gateway_review',
      agentId: 'agent_guard',
      title: 'Approve filesystem mutation batch',
      status: 'review',
      sortOrder: 2000,
      priority: 'critical',
      workType: 'approval',
      requiresApproval: true,
      blocked: true,
      tags: ['approval', 'filesystem', 'high-risk'],
      summary: 'Espera aprobacion humana antes de mutar archivos del proyecto.',
      lastActivityAt: minutesAgo(1),
      metadata: { lastAction: 'awaiting_human_gate' },
    },
    {
      id: 'task_client_rollout',
      boardId: 'board_client_rollout',
      gatewayId: 'gateway_review',
      agentId: null,
      title: 'Prepare client rollout checklist',
      status: 'backlog',
      sortOrder: 1000,
      priority: 'medium',
      workType: 'ops',
      requiresApproval: false,
      blocked: false,
      tags: ['client', 'ops'],
      summary: 'Checklist para despliegue controlado del panel a cliente piloto.',
      lastActivityAt: minutesAgo(11),
      metadata: { lastAction: 'queued' },
    },
    {
      id: 'task_gateway_retry',
      boardId: 'board_internal_stack',
      gatewayId: 'gateway_sandbox',
      agentId: 'agent_scout',
      title: 'Recover sandbox gateway reconnection',
      status: 'blocked',
      sortOrder: 1000,
      priority: 'high',
      workType: 'infra',
      requiresApproval: false,
      blocked: true,
      tags: ['gateway', 'retry', 'infra'],
      summary: 'Investiga degradacion del gateway sandbox sin afectar el resto del sistema.',
      lastActivityAt: minutesAgo(3),
      metadata: { lastAction: 'retry_scheduled' },
    },
    {
      id: 'task_agent_roster',
      boardId: 'board_mission_core',
      gatewayId: 'gateway_primary',
      agentId: null,
      title: 'Consolidate agent roster sidebar',
      status: 'backlog',
      sortOrder: 2000,
      priority: 'medium',
      workType: 'frontend',
      requiresApproval: false,
      blocked: false,
      tags: ['frontend', 'agents'],
      summary: 'Listar estados, heartbeat y tarea actual de cada agente.',
      lastActivityAt: minutesAgo(14),
      metadata: { lastAction: 'queued' },
    },
    {
      id: 'task_done_metrics',
      boardId: 'board_signal_lab',
      gatewayId: 'gateway_primary',
      agentId: 'agent_vector',
      title: 'Baseline throughput metrics',
      status: 'done',
      sortOrder: 1000,
      priority: 'low',
      workType: 'analysis',
      requiresApproval: false,
      blocked: false,
      tags: ['metrics'],
      summary: 'Linea base de throughput por minuto y tiempo medio por tarea.',
      lastActivityAt: minutesAgo(28),
      metadata: { lastAction: 'completed' },
    },
  ];

  for (const task of tasks) {
    upsertTask(task);
  }
}

function seedRuns() {
  const runs = [
    {
      id: 'run_event_ingestion_1',
      taskId: 'task_event_ingestion',
      agentId: 'agent_orbit',
      gatewayId: 'gateway_primary',
      status: 'running',
      startedAt: minutesAgo(23),
      summary: 'Procesando lotes de eventos entrantes',
      artifacts: [{ type: 'schema', name: 'normalized-event-v1.json' }],
      messages: [
        { ts: minutesAgo(22), role: 'agent', content: 'Iniciando pipeline de normalizacion.' },
        { ts: minutesAgo(5), role: 'agent', content: 'Se detectaron 2 variantes adicionales de evento.' },
      ],
      decisions: [{ ts: minutesAgo(5), decision: 'version payload as mission-control.v1' }],
      metadata: { stage: 'stream-processing' },
    },
    {
      id: 'run_gateway_contract_1',
      taskId: 'task_gateway_contract',
      agentId: 'agent_vector',
      gatewayId: 'gateway_primary',
      status: 'completed',
      startedAt: minutesAgo(52),
      completedAt: minutesAgo(7),
      summary: 'Contrato inicial del adapter preparado para review',
      artifacts: [{ type: 'doc', name: 'gateway-contract-draft.md' }],
      messages: [{ ts: minutesAgo(10), role: 'agent', content: 'Contrato publicado para revision.' }],
      decisions: [{ ts: minutesAgo(10), decision: 'use normalized event envelope' }],
      metadata: { stage: 'review-ready' },
    },
    {
      id: 'run_risk_review_1',
      taskId: 'task_risk_review',
      agentId: 'agent_guard',
      gatewayId: 'gateway_review',
      status: 'waiting_approval',
      startedAt: minutesAgo(16),
      summary: 'Bloqueado en gate humano antes de aplicar cambios sensibles',
      artifacts: [{ type: 'diff', name: 'filesystem-batch.diff' }],
      messages: [{ ts: minutesAgo(2), role: 'agent', content: 'Se solicita gate humano por mutacion sensible.' }],
      decisions: [{ ts: minutesAgo(2), decision: 'pause pending approval' }],
      metadata: { stage: 'approval-gate' },
    },
    {
      id: 'run_gateway_retry_1',
      taskId: 'task_gateway_retry',
      agentId: 'agent_scout',
      gatewayId: 'gateway_sandbox',
      status: 'failed',
      startedAt: minutesAgo(38),
      completedAt: minutesAgo(3),
      summary: 'La reconexion del sandbox no alcanzo umbral saludable',
      errorMessage: 'Gateway heartbeat timeout',
      artifacts: [{ type: 'log', name: 'sandbox-retry.log' }],
      messages: [{ ts: minutesAgo(3), role: 'agent', content: 'Timeout durante reconexion del sandbox.' }],
      decisions: [{ ts: minutesAgo(3), decision: 'mark gateway degraded and retry later' }],
      metadata: { stage: 'recovery' },
    },
  ];

  for (const run of runs) {
    upsertRun(run);
  }
}

function seedApprovals() {
  const approvals = [
    {
      id: 'approval_fs_batch',
      taskId: 'task_risk_review',
      runId: 'run_risk_review_1',
      agentId: 'agent_guard',
      gatewayId: 'gateway_review',
      actionType: 'modify_files',
      status: 'pending',
      riskLevel: 'high',
      reason: 'Cambios sobre archivos de configuracion y codigo fuente.',
      diffSummary: '3 archivos a modificar, 1 archivo nuevo, sin borrado irreversible.',
      requestedAt: minutesAgo(2),
      context: {
        targetFiles: ['frontend/src/components/MissionControl/index.jsx', 'backend/src/server.js', 'backend/src/realtime/websocket.js'],
        summary: 'Actualizar shell operativo y bridge websocket.',
      },
    },
  ];

  for (const approval of approvals) {
    upsertApproval(approval);
  }
}

function emitDomainEvent(eventName, entityType, entityId, severity, message, payload = {}) {
  const event = {
    id: createId('evt'),
    eventName,
    entityType,
    entityId,
    severity,
    message,
    payload,
    createdAt: nowIso(),
  };

  insertEvent(event);
  publishRealtime({
    type: 'mission-control:event',
    data: event,
  });
}

function seedInitialEvents() {
  const events = [
    ['gateway.status_changed', 'gateway', 'gateway_primary', 'info', 'OpenClaw Primary listo para recibir eventos', { gatewayId: 'gateway_primary' }],
    ['gateway.status_changed', 'gateway', 'gateway_sandbox', 'warn', 'Sandbox Local degradado, operando con latencia elevada', { gatewayId: 'gateway_sandbox' }],
    ['task.updated', 'task', 'task_event_ingestion', 'info', 'La tarea de ingestion continua en progreso', { taskId: 'task_event_ingestion', gatewayId: 'gateway_primary' }],
    ['approval.requested', 'approval', 'approval_fs_batch', 'warn', 'Aprobacion humana requerida para mutacion sensible', { approvalId: 'approval_fs_batch', gatewayId: 'gateway_review' }],
    ['run.completed', 'run', 'run_gateway_contract_1', 'info', 'Contrato inicial del adapter listo para review', { runId: 'run_gateway_contract_1', gatewayId: 'gateway_primary' }],
    ['error.raised', 'run', 'run_gateway_retry_1', 'error', 'Sandbox Local reporto timeout de heartbeat', { runId: 'run_gateway_retry_1', gatewayId: 'gateway_sandbox' }],
  ];

  for (const [eventName, entityType, entityId, severity, message, payload] of events) {
    emitDomainEvent(eventName, entityType, entityId, severity, message, payload);
  }
}

function ensureSeeded() {
  if (countRows('gateways') > 0) {
    return;
  }

  seedBoardGroups();
  seedGateways();
  seedBoards();
  seedAgents();
  seedTasks();
  seedRuns();
  seedApprovals();
  seedInitialEvents();
  logger.info('[mission-control] Seed runtime initialized');
}

function updateGatewayHeartbeats() {
  const gateways = listGateways();

  for (const gateway of gateways) {
    const nextLatency = Math.max(18, gateway.latencyMs + Math.round((Math.random() - 0.5) * 30));
    const failureSpike = gateway.id === 'gateway_sandbox' && tickCounter % 5 === 0;
    const nextStatus = failureSpike
      ? 'degraded'
      : gateway.status === 'disconnected' && Math.random() > 0.55
        ? 'connected'
        : gateway.status;

    const updatedGateway = {
      ...gateway,
      status: nextStatus,
      latencyMs: nextLatency,
      retryCount: failureSpike ? gateway.retryCount + 1 : Math.max(0, gateway.retryCount - 1),
      healthScore: Number(Math.max(0.35, Math.min(1, 1 - (nextLatency / 300))).toFixed(2)),
      lastHeartbeatAt: nowIso(),
      lastError: failureSpike ? 'heartbeat jitter detected' : null,
      updatedAt: nowIso(),
    };

    upsertGateway(updatedGateway);
    emitDomainEvent('gateway.status_changed', 'gateway', gateway.id, updatedGateway.status === 'connected' ? 'info' : 'warn', `${gateway.name} ${updatedGateway.status}`, {
      gatewayId: gateway.id,
      latencyMs: updatedGateway.latencyMs,
      status: updatedGateway.status,
    });
  }
}

function ensureApprovalForTask(task, run) {
  const existingPending = listApprovals().some((approval) => approval.taskId === task.id && approval.status === 'pending');
  if (!task.requiresApproval || existingPending) {
    return;
  }

  const approvalId = createId('approval');
  upsertApproval({
    id: approvalId,
    taskId: task.id,
    runId: run?.id ?? null,
    agentId: task.agentId,
    gatewayId: task.gatewayId,
    actionType: 'high_risk_operation',
    status: 'pending',
    riskLevel: task.priority === 'critical' ? 'high' : 'medium',
    reason: 'La tarea entro en una fase que requiere aprobacion humana.',
    diffSummary: 'Operacion sensible preparada para ejecutar tras aprobacion.',
    context: {
      taskTitle: task.title,
      lastAction: task.metadata?.lastAction ?? 'pending_review',
    },
    requestedAt: nowIso(),
  });

  emitDomainEvent('approval.requested', 'approval', approvalId, 'warn', `Aprobacion requerida para ${task.title}`, {
    approvalId,
    taskId: task.id,
    gatewayId: task.gatewayId,
  });
}

function progressTaskLifecycle() {
  const tasks = listTasks();
  const agents = listAgents();
  const runs = listRuns();
  const idleAgents = agents.filter((agent) => ['idle', 'active'].includes(agent.status));

  for (const task of tasks) {
    if (task.status === 'backlog' && idleAgents.length > 0 && Math.random() > 0.45) {
      const agent = idleAgents.shift();
      const startedRunId = createId('run');
      const updatedTask = {
        ...task,
        status: 'in_progress',
        sortOrder: task.sortOrder,
        agentId: agent.id,
        blocked: false,
        lastActivityAt: nowIso(),
        updatedAt: nowIso(),
        metadata: { ...(task.metadata ?? {}), lastAction: 'claimed_by_agent' },
      };

      upsertTask(updatedTask);
      upsertAgent({
        ...agent,
        status: 'running',
        currentTaskId: task.id,
        lastHeartbeatAt: nowIso(),
        updatedAt: nowIso(),
      });
      upsertRun({
        id: startedRunId,
        taskId: task.id,
        agentId: agent.id,
        gatewayId: task.gatewayId,
        status: 'running',
        startedAt: nowIso(),
        summary: `Run iniciado para ${task.title}`,
        messages: [{ ts: nowIso(), role: 'agent', content: 'Claimed task and started execution.' }],
        decisions: [{ ts: nowIso(), decision: 'move_to_in_progress' }],
        artifacts: [],
        metadata: { stage: 'execution' },
      });

      emitDomainEvent('run.started', 'run', startedRunId, 'info', `Run iniciado para ${task.title}`, {
        runId: startedRunId,
        taskId: task.id,
        agentId: agent.id,
        gatewayId: task.gatewayId,
      });
      emitDomainEvent('task.updated', 'task', task.id, 'info', `${task.title} paso a In Progress`, {
        taskId: task.id,
        status: 'in_progress',
        agentId: agent.id,
        gatewayId: task.gatewayId,
      });
    }
  }

  for (const task of listTasks()) {
    if (task.status !== 'in_progress' || Math.random() <= 0.5) {
      continue;
    }

    const activeRun = runs.find((run) => run.taskId === task.id && ['running', 'waiting_approval'].includes(run.status))
      ?? listRuns().find((run) => run.taskId === task.id && ['running', 'waiting_approval'].includes(run.status));

    let nextStatus = task.requiresApproval ? 'review' : (Math.random() > 0.2 ? 'review' : 'blocked');
    if (nextStatus === 'review') {
      const { passed } = runQualityGate(task.id, 'guardrails');
      if (!passed) {
        nextStatus = 'blocked';
      }
    }
    const isBlocked = nextStatus === 'blocked';
    const agent = task.agentId ? listAgents().find((item) => item.id === task.agentId) : null;

    upsertTask({
      ...task,
      status: nextStatus,
      sortOrder: task.sortOrder,
      blocked: isBlocked || task.requiresApproval,
      lastActivityAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { ...(task.metadata ?? {}), lastAction: nextStatus === 'review' ? 'awaiting_review' : 'blocked_on_dependency' },
    });

    if (activeRun) {
      upsertRun({
        ...activeRun,
        status: task.requiresApproval ? 'waiting_approval' : (isBlocked ? 'failed' : 'completed'),
        completedAt: task.requiresApproval ? null : nowIso(),
        errorMessage: isBlocked ? 'Dependency unavailable during execution' : null,
        summary: task.requiresApproval ? 'Run pausado esperando gate humano' : activeRun.summary,
        updatedAt: nowIso(),
      });

      emitDomainEvent(task.requiresApproval ? 'approval.requested' : isBlocked ? 'error.raised' : 'run.completed', 'run', activeRun.id, isBlocked ? 'error' : (task.requiresApproval ? 'warn' : 'info'), task.requiresApproval
        ? `Run de ${task.title} pausado esperando aprobacion`
        : isBlocked
          ? `Run de ${task.title} fallo por dependencia`
          : `Run de ${task.title} completado`, {
        runId: activeRun.id,
        taskId: task.id,
        agentId: task.agentId,
        gatewayId: task.gatewayId,
      });
    }

    if (agent) {
      upsertAgent({
        ...agent,
        status: task.requiresApproval ? 'waiting_approval' : (isBlocked ? 'error' : 'active'),
        currentTaskId: task.requiresApproval || isBlocked ? task.id : null,
        lastHeartbeatAt: nowIso(),
        lastError: isBlocked ? 'Dependency unavailable during execution' : null,
        updatedAt: nowIso(),
      });
    }

    ensureApprovalForTask(task, activeRun);
    emitDomainEvent('task.updated', 'task', task.id, isBlocked ? 'warn' : 'info', `${task.title} paso a ${nextStatus}`, {
      taskId: task.id,
      status: nextStatus,
      gatewayId: task.gatewayId,
    });
  }

  for (const task of listTasks()) {
    if (task.status !== 'review' || task.requiresApproval || Math.random() <= 0.55) {
      continue;
    }

    const agent = task.agentId ? listAgents().find((item) => item.id === task.agentId) : null;
    upsertTask({
      ...task,
      status: 'done',
      sortOrder: task.sortOrder,
      blocked: false,
      lastActivityAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { ...(task.metadata ?? {}), lastAction: 'completed' },
    });

    if (agent) {
      upsertAgent({
        ...agent,
        status: 'idle',
        currentTaskId: null,
        lastHeartbeatAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    emitDomainEvent('task.updated', 'task', task.id, 'info', `${task.title} paso a Done`, {
      taskId: task.id,
      status: 'done',
      gatewayId: task.gatewayId,
    });
  }
}

function refreshAgentHeartbeats() {
  for (const agent of listAgents()) {
    const task = agent.currentTaskId ? getTask(agent.currentTaskId) : null;
    const nextStatus = agent.status === 'error' && Math.random() > 0.6 ? 'active' : agent.status;

    upsertAgent({
      ...agent,
      status: nextStatus,
      currentTaskId: task?.status === 'done' ? null : agent.currentTaskId,
      lastHeartbeatAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {
        ...(agent.metadata ?? {}),
        lastSeenTick: tickCounter,
      },
    });

    emitDomainEvent('agent.heartbeat', 'agent', agent.id, nextStatus === 'error' ? 'warn' : 'info', `${agent.name} heartbeat ${nextStatus}`, {
      agentId: agent.id,
      gatewayId: agent.gatewayId,
      currentTaskId: task?.id ?? null,
      status: nextStatus,
    });
  }
}

function publishSnapshotDelta() {
  publishRealtime({
    type: 'mission-control:snapshot',
    data: getMissionControlSnapshot({ eventLimit: 80 }),
  });
}

function simulationTick() {
  tickCounter += 1;
  updateGatewayHeartbeats();
  progressTaskLifecycle();
  refreshAgentHeartbeats();
  publishSnapshotDelta();
}

export function initMissionControlRuntime({ publish } = {}) {
  if (runtimeStarted) {
    return;
  }

  if (RUNTIME_MODE === 'disabled') {
    logger.warn('[mission-control] Runtime disabled by env');
    return;
  }

  publishRealtime = typeof publish === 'function' ? publish : () => {};
  ensureSeeded();
  publishSnapshotDelta();
  simulationInterval = setInterval(simulationTick, TICK_MS);
  runtimeStarted = true;
  logger.info('[mission-control] Runtime started');
}

export function stopMissionControlRuntime() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  runtimeStarted = false;
}

export function isRuntimeStarted() {
  return runtimeStarted;
}

export function pauseTask(taskId) {
  const task = getTask(taskId);
  if (!task) {
    return null;
  }

  upsertTask({
    ...task,
    status: 'blocked',
    sortOrder: task.sortOrder,
    blocked: true,
    lastActivityAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { ...(task.metadata ?? {}), lastAction: 'paused_by_operator' },
  });

  emitDomainEvent('task.updated', 'task', task.id, 'warn', `${task.title} pausada por operador`, {
    taskId: task.id,
    status: 'blocked',
    gatewayId: task.gatewayId,
  });
  publishSnapshotDelta();
  return getTask(taskId);
}

export function resumeTask(taskId) {
  const task = getTask(taskId);
  if (!task) {
    return null;
  }

  const nextStatus = task.agentId ? 'in_progress' : 'backlog';
  upsertTask({
    ...task,
    status: nextStatus,
    sortOrder: task.sortOrder,
    blocked: false,
    lastActivityAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { ...(task.metadata ?? {}), lastAction: 'resumed_by_operator' },
  });

  emitDomainEvent('task.updated', 'task', task.id, 'info', `${task.title} reanudada por operador`, {
    taskId: task.id,
    status: nextStatus,
    gatewayId: task.gatewayId,
  });
  publishSnapshotDelta();
  return getTask(taskId);
}

export function resolveApproval(approvalId, resolution, resolvedBy, resolutionNote) {
  const approval = getApproval(approvalId);
  if (!approval) {
    return null;
  }

  const nextStatus = resolution === 'approve' ? 'approved' : 'rejected';
  upsertApproval({
    ...approval,
    status: nextStatus,
    resolvedAt: nowIso(),
    resolvedBy: resolvedBy ?? 'operator',
    resolutionNote: resolutionNote ?? null,
    updatedAt: nowIso(),
  });

  const task = getTask(approval.taskId);
  if (task) {
    const nextTaskStatus = nextStatus === 'approved' ? 'in_progress' : 'blocked';
    upsertTask({
      ...task,
      status: nextTaskStatus,
      sortOrder: task.sortOrder,
      blocked: nextStatus !== 'approved',
      lastActivityAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { ...(task.metadata ?? {}), lastAction: nextStatus === 'approved' ? 'approval_granted' : 'approval_rejected' },
    });
  }

  emitDomainEvent('approval.resolved', 'approval', approval.id, nextStatus === 'approved' ? 'info' : 'warn', `Aprobacion ${nextStatus} para ${approval.actionType}`, {
    approvalId: approval.id,
    taskId: approval.taskId,
    gatewayId: approval.gatewayId,
    resolution: nextStatus,
  });
  publishSnapshotDelta();
  return getApproval(approvalId);
}

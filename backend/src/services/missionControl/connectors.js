import { WebSocket } from 'ws';
import logger from '../../utils/logger.js';
import {
  getRun,
  getTask,
  insertEvent,
  listAgents,
  listBoards,
  listGateways,
  listTasks,
  upsertAgent,
  upsertApproval,
  upsertGateway,
  upsertRun,
  upsertTask,
} from './repository.js';

const connectorsRegistry = new Map();
let publishRealtime = () => {};

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function parseScopes() {
  return (process.env.OPENCLAW_GATEWAY_SCOPES ?? 'operator.read,operator.approvals')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function gatewayUrls() {
  return (process.env.OPENCLAW_GATEWAY_URLS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function toGatewayId(url, index) {
  try {
    const parsed = new URL(url);
    return `openclaw_${parsed.hostname.replace(/[^a-zA-Z0-9]/g, '_')}_${parsed.port || 'default'}_${index + 1}`;
  } catch {
    return `openclaw_gateway_${index + 1}`;
  }
}

function createGatewayRecord(id, url) {
  return {
    id,
    name: `OpenClaw Remote ${id.split('_').slice(-1)[0]}`,
    kind: 'openclaw',
    status: 'connecting',
    latencyMs: 0,
    retryCount: 0,
    healthScore: 0.85,
    lastHeartbeatAt: null,
    lastError: null,
    metadata: {
      gatewayOrigin: url,
      adapterMode: 'openclaw-live',
      version: 'adapter-v2',
      protocol: 'auto',
    },
  };
}

function persistGateway(gateway) {
  upsertGateway({
    ...gateway,
    updatedAt: nowIso(),
  });
}

function broadcastNormalizedEvent(event) {
  insertEvent({
    id: createId('evt'),
    eventName: event.eventName,
    entityType: event.entityType,
    entityId: event.entityId ?? null,
    severity: event.severity,
    message: event.message,
    payload: event.payload ?? {},
    createdAt: event.createdAt ?? nowIso(),
  });

  publishRealtime({
    type: 'mission-control:event',
    data: {
      id: createId('evt_rt'),
      ...event,
      createdAt: event.createdAt ?? nowIso(),
    },
  });
}

function preferredBoardIdForGateway(gatewayId) {
  return listBoards().find((board) => board.gatewayId === gatewayId)?.id ?? 'board_release_gate';
}

function nextSortOrderForStatus(status) {
  const statusTasks = listTasks().filter((task) => task.status === status);
  const maxSortOrder = statusTasks.reduce((max, task) => Math.max(max, task.sortOrder ?? 0), 0);
  return maxSortOrder + 1000;
}

function normalizeRemoteId(prefix, gatewayId, value) {
  if (!value) {
    return `${prefix}_${gatewayId}`;
  }

  return `${prefix}_${String(value).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function inferAgentId(gatewayId, frame) {
  const payload = frame.payload ?? {};
  return normalizeRemoteId(
    'remote_agent',
    gatewayId,
    payload.agentId ?? payload.agent?.id ?? payload.session?.agentId ?? payload.actor ?? payload.toolOwner,
  );
}

function inferTaskId(gatewayId, frame) {
  const payload = frame.payload ?? {};
  return normalizeRemoteId(
    'remote_task',
    gatewayId,
    payload.taskId ?? payload.sessionId ?? payload.conversationId ?? payload.threadId ?? frame.id ?? payload.toolCallId,
  );
}

function inferRunId(gatewayId, frame) {
  const payload = frame.payload ?? {};
  return normalizeRemoteId(
    'remote_run',
    gatewayId,
    payload.runId ?? payload.sessionId ?? payload.conversationId ?? frame.id ?? payload.toolCallId,
  );
}

function upsertRemoteAgentState(gatewayId, frame, patch = {}) {
  const payload = frame.payload ?? {};
  const agentId = inferAgentId(gatewayId, frame);
  const existing = listAgents().find((agent) => agent.id === agentId);

  upsertAgent({
    id: agentId,
    gatewayId,
    boardId: existing?.boardId ?? preferredBoardIdForGateway(gatewayId),
    name: payload.agentName ?? payload.agent?.name ?? existing?.name ?? `Remote Agent ${agentId.split('_').slice(-1)[0]}`,
    role: payload.agentRole ?? payload.agent?.role ?? existing?.role ?? 'operator',
    status: patch.status ?? existing?.status ?? 'active',
    currentTaskId: patch.currentTaskId ?? existing?.currentTaskId ?? null,
    lastHeartbeatAt: patch.lastHeartbeatAt ?? nowIso(),
    lastError: patch.lastError ?? existing?.lastError ?? null,
    metadata: {
      ...(existing?.metadata ?? {}),
      source: 'openclaw-gateway',
      gatewayOrigin: gatewayId,
      remoteAgentId: payload.agentId ?? payload.agent?.id ?? null,
      lastFrameType: frame.type ?? 'unknown',
    },
  });

  return agentId;
}

function upsertRemoteTaskState(gatewayId, frame, patch = {}) {
  const payload = frame.payload ?? {};
  const taskId = inferTaskId(gatewayId, frame);
  const existing = getTask(taskId);
  const agentId = patch.agentId ?? existing?.agentId ?? inferAgentId(gatewayId, frame);

  upsertTask({
    id: taskId,
    boardId: existing?.boardId ?? preferredBoardIdForGateway(gatewayId),
    gatewayId,
    agentId,
    title: patch.title ?? payload.title ?? payload.text ?? payload.tool ?? existing?.title ?? `Remote task ${taskId.split('_').slice(-1)[0]}`,
    status: patch.status ?? existing?.status ?? 'in_progress',
    sortOrder: patch.sortOrder ?? existing?.sortOrder ?? nextSortOrderForStatus(patch.status ?? existing?.status ?? 'in_progress'),
    priority: patch.priority ?? existing?.priority ?? 'high',
    workType: patch.workType ?? existing?.workType ?? (payload.tool ? 'ops' : 'analysis'),
    requiresApproval: patch.requiresApproval ?? existing?.requiresApproval ?? false,
    blocked: patch.blocked ?? existing?.blocked ?? false,
    tags: patch.tags ?? existing?.tags ?? ['openclaw', 'remote'],
    summary: patch.summary ?? existing?.summary ?? payload.text ?? payload.output ?? `Sincronizada desde gateway ${gatewayId}`,
    lastActivityAt: patch.lastActivityAt ?? nowIso(),
    metadata: {
      ...(existing?.metadata ?? {}),
      source: 'openclaw-gateway',
      remoteTaskId: payload.taskId ?? payload.sessionId ?? payload.conversationId ?? null,
      lastFrameType: frame.type ?? 'unknown',
      lastTool: payload.tool ?? null,
      rawPayload: payload,
    },
  });

  return taskId;
}

function upsertRemoteRunState(gatewayId, frame, patch = {}) {
  const payload = frame.payload ?? {};
  const runId = inferRunId(gatewayId, frame);
  const existing = getRun(runId);
  const taskId = patch.taskId ?? existing?.taskId ?? inferTaskId(gatewayId, frame);
  const agentId = patch.agentId ?? existing?.agentId ?? inferAgentId(gatewayId, frame);

  if (!getTask(taskId)) {
    upsertRemoteTaskState(gatewayId, frame, {
      agentId,
      status: patch.status === 'failed' ? 'blocked' : 'in_progress',
      workType: payload.tool ? 'ops' : 'analysis',
      summary: payload.text ?? payload.output ?? `Run remoto ${runId.split('_').slice(-1)[0]}`,
      lastActivityAt: nowIso(),
      blocked: patch.status === 'failed',
    });
  }

  upsertRun({
    id: runId,
    taskId,
    agentId,
    gatewayId,
    status: patch.status ?? existing?.status ?? 'running',
    startedAt: patch.startedAt ?? existing?.startedAt ?? nowIso(),
    completedAt: patch.completedAt ?? existing?.completedAt ?? null,
    summary: patch.summary ?? existing?.summary ?? payload.text ?? payload.tool ?? `Remote run ${runId.split('_').slice(-1)[0]}`,
    errorMessage: patch.errorMessage ?? existing?.errorMessage ?? null,
    artifacts: patch.artifacts ?? existing?.artifacts ?? [],
    messages: patch.messages ?? existing?.messages ?? [],
    decisions: patch.decisions ?? existing?.decisions ?? [],
    metadata: {
      ...(existing?.metadata ?? {}),
      source: 'openclaw-gateway',
      remoteRunId: payload.runId ?? payload.sessionId ?? frame.id ?? null,
      lastFrameType: frame.type ?? 'unknown',
    },
  });

  return runId;
}

function upsertApprovalFromGateway(gatewayId, frame) {
  const payload = frame.payload ?? {};
  const approvalId = payload.approvalId ? `gateway_${payload.approvalId}` : createId('approval_gateway');
  const taskId = payload.taskId ? normalizeRemoteId('remote_task', gatewayId, payload.taskId) : inferTaskId(gatewayId, frame);
  const agentId = upsertRemoteAgentState(gatewayId, frame, {
    status: 'waiting_approval',
    currentTaskId: taskId,
  });

  if (!getTask(taskId)) {
    upsertTask({
      id: taskId,
      boardId: preferredBoardIdForGateway(gatewayId),
      gatewayId,
      agentId,
      title: payload.title ?? `Gateway approval ${payload.approvalId ?? approvalId}`,
      status: 'review',
      sortOrder: nextSortOrderForStatus('review'),
      priority: payload.riskLevel === 'high' ? 'critical' : 'high',
      workType: 'approval',
      requiresApproval: true,
      blocked: true,
      tags: ['openclaw', 'approval'],
      summary: payload.reason ?? 'Approval remota recibida desde OpenClaw.',
      lastActivityAt: frame.timestamp ?? nowIso(),
      metadata: {
        source: 'openclaw-gateway',
        gatewayApprovalId: payload.approvalId ?? approvalId,
      },
    });
  }

  const runId = upsertRemoteRunState(gatewayId, frame, {
    taskId,
    agentId,
    status: 'waiting_approval',
    summary: payload.summary ?? 'Run remoto pausado esperando aprobacion.',
  });

  upsertApproval({
    id: approvalId,
    taskId,
    runId,
    agentId,
    gatewayId,
    actionType: payload.actionType ?? 'exec_approval',
    status: 'pending',
    riskLevel: payload.riskLevel ?? 'high',
    reason: payload.reason ?? 'OpenClaw solicito aprobacion de ejecucion.',
    diffSummary: payload.summary ?? payload.systemRunPlan?.rawCommand ?? 'Sin resumen adicional.',
    context: {
      gatewayApprovalId: payload.approvalId ?? approvalId,
      systemRunPlan: payload.systemRunPlan ?? null,
      rawPayload: payload,
    },
    requestedAt: frame.timestamp ?? nowIso(),
    updatedAt: nowIso(),
  });

  return approvalId;
}

function normalizeOpenClawFrame(gatewayId, frame) {
  const createdAt = frame.timestamp ?? nowIso();
  const payload = frame.payload ?? {};

  if (frame.type === 'event' && frame.event === 'connect.challenge') {
    return {
      eventName: 'gateway.challenge_received',
      entityType: 'gateway',
      entityId: gatewayId,
      severity: 'info',
      message: 'OpenClaw envio challenge de conexion',
      payload: { gatewayId, challenge: frame.payload ?? {} },
      createdAt,
    };
  }

  if (frame.type === 'event' && frame.event === 'exec.approval.requested') {
    const approvalId = upsertApprovalFromGateway(gatewayId, frame);
    return {
      eventName: 'approval.requested',
      entityType: 'approval',
      entityId: approvalId,
      severity: 'warn',
      message: 'OpenClaw solicito aprobacion de ejecucion',
      payload: { gatewayId, approvalId, ...frame.payload },
      createdAt,
    };
  }

  if (frame.type === 'res' && frame.ok && frame.payload?.type === 'hello-ok') {
    return {
      eventName: 'gateway.status_changed',
      entityType: 'gateway',
      entityId: gatewayId,
      severity: 'info',
      message: 'Handshake OpenClaw completado',
      payload: { gatewayId, protocol: frame.payload?.protocol, policy: frame.payload?.policy ?? {} },
      createdAt,
    };
  }

  if (frame.type === 'heartbeat_status') {
    const agentId = upsertRemoteAgentState(gatewayId, frame, {
      status: payload.result === 'HEARTBEAT_OK' ? 'active' : 'error',
      lastHeartbeatAt: createdAt,
      lastError: payload.result === 'HEARTBEAT_OK' ? null : payload.result ?? 'heartbeat_failed',
    });
    return {
      eventName: 'agent.heartbeat',
      entityType: 'agent',
      entityId: agentId,
      severity: payload.result === 'HEARTBEAT_OK' ? 'info' : 'warn',
      message: `Heartbeat OpenClaw: ${payload.result ?? 'unknown'}`,
      payload: { gatewayId, agentId, ...payload },
      createdAt,
    };
  }

  if (frame.type === 'tool_call') {
    const agentId = upsertRemoteAgentState(gatewayId, frame, {
      status: 'running',
      currentTaskId: inferTaskId(gatewayId, frame),
      lastHeartbeatAt: createdAt,
    });
    const taskId = upsertRemoteTaskState(gatewayId, frame, {
      agentId,
      status: 'in_progress',
      workType: payload.tool ? 'ops' : 'analysis',
      summary: `Tool ${payload.tool ?? 'unknown'} en ejecucion`,
      lastActivityAt: createdAt,
      blocked: false,
    });
    const runId = upsertRemoteRunState(gatewayId, frame, {
      taskId,
      agentId,
      status: 'running',
      summary: `OpenClaw ejecutando ${payload.tool ?? 'tool'}`,
      messages: [
        {
          ts: createdAt,
          role: 'gateway',
          content: `tool_call ${payload.tool ?? 'unknown'}`,
        },
      ],
    });
    return {
      eventName: 'run.tool_call',
      entityType: 'run',
      entityId: runId,
      severity: 'info',
      message: `OpenClaw ejecutando tool ${payload.tool ?? 'unknown'}`,
      payload: { gatewayId, taskId, runId, agentId, ...payload },
      createdAt,
    };
  }

  if (frame.type === 'tool_result') {
    const agentId = upsertRemoteAgentState(gatewayId, frame, {
      status: Number(payload.exit_code ?? 0) === 0 ? 'active' : 'error',
      currentTaskId: inferTaskId(gatewayId, frame),
      lastHeartbeatAt: createdAt,
      lastError: Number(payload.exit_code ?? 0) === 0 ? null : `exit_code_${payload.exit_code ?? 'unknown'}`,
    });
    const taskId = upsertRemoteTaskState(gatewayId, frame, {
      agentId,
      status: Number(payload.exit_code ?? 0) === 0 ? 'review' : 'blocked',
      workType: payload.tool ? 'ops' : 'analysis',
      summary: payload.output ?? `Resultado de ${payload.tool ?? 'tool'}`,
      lastActivityAt: createdAt,
      blocked: Number(payload.exit_code ?? 0) !== 0,
    });
    const runId = upsertRemoteRunState(gatewayId, frame, {
      taskId,
      agentId,
      status: Number(payload.exit_code ?? 0) === 0 ? 'completed' : 'failed',
      completedAt: createdAt,
      summary: `Resultado de ${payload.tool ?? 'tool'}`,
      errorMessage: Number(payload.exit_code ?? 0) === 0 ? null : payload.output ?? `Tool exited with ${payload.exit_code ?? 'unknown'}`,
      artifacts: [
        {
          type: 'tool_result',
          name: payload.tool ?? 'tool',
          exitCode: payload.exit_code ?? null,
        },
      ],
    });
    return {
      eventName: 'run.tool_result',
      entityType: 'run',
      entityId: runId,
      severity: Number(payload.exit_code ?? 0) === 0 ? 'info' : 'error',
      message: `Resultado de tool ${payload.tool ?? 'unknown'}`,
      payload: { gatewayId, taskId, runId, agentId, ...payload },
      createdAt,
    };
  }

  if (frame.type === 'response') {
    const agentId = upsertRemoteAgentState(gatewayId, frame, {
      status: 'active',
      currentTaskId: null,
      lastHeartbeatAt: createdAt,
    });
    const taskId = upsertRemoteTaskState(gatewayId, frame, {
      agentId,
      status: 'done',
      workType: 'analysis',
      summary: payload.text ?? 'Respuesta remota completada',
      lastActivityAt: createdAt,
      blocked: false,
    });
    const runId = upsertRemoteRunState(gatewayId, frame, {
      taskId,
      agentId,
      status: 'completed',
      completedAt: createdAt,
      summary: payload.text ?? 'Respuesta del agente remoto',
      messages: [
        {
          ts: createdAt,
          role: 'agent',
          content: payload.text ?? 'response',
        },
      ],
      artifacts: payload.tool_calls?.length
        ? payload.tool_calls.map((toolCall, index) => ({
          type: 'tool_call',
          name: toolCall.tool ?? `tool_${index + 1}`,
        }))
        : [],
    });
    return {
      eventName: 'run.completed',
      entityType: 'run',
      entityId: runId,
      severity: 'info',
      message: 'OpenClaw devolvio respuesta de agente',
      payload: { gatewayId, taskId, runId, agentId, ...payload },
      createdAt,
    };
  }

  if (frame.type === 'error' || (frame.type === 'res' && frame.ok === false)) {
    const agentId = upsertRemoteAgentState(gatewayId, frame, {
      status: 'error',
      currentTaskId: inferTaskId(gatewayId, frame),
      lastHeartbeatAt: createdAt,
      lastError: payload.message ?? frame.error?.message ?? 'remote_error',
    });
    const taskId = upsertRemoteTaskState(gatewayId, frame, {
      agentId,
      status: 'blocked',
      workType: 'ops',
      summary: payload.message ?? frame.error?.message ?? 'Error remoto',
      lastActivityAt: createdAt,
      blocked: true,
    });
    const runId = upsertRemoteRunState(gatewayId, frame, {
      taskId,
      agentId,
      status: 'failed',
      completedAt: createdAt,
      summary: payload.message ?? frame.error?.message ?? 'Run remoto con error',
      errorMessage: payload.message ?? frame.error?.message ?? 'OpenClaw gateway error',
    });
    return {
      eventName: 'error.raised',
      entityType: 'run',
      entityId: runId,
      severity: 'error',
      message: payload.message ?? frame.error?.message ?? 'Error en OpenClaw gateway',
      payload: { gatewayId, taskId, runId, agentId, payload: payload ?? null, error: frame.error ?? null },
      createdAt,
    };
  }

  return {
    eventName: `gateway.frame.${frame.type ?? 'unknown'}`,
    entityType: 'gateway',
    entityId: gatewayId,
    severity: 'info',
    message: `Frame OpenClaw recibido: ${frame.type ?? 'unknown'}`,
    payload: { gatewayId, frame },
    createdAt,
  };
}

function buildConnectFrame() {
  return {
    type: 'req',
    id: createId('connect'),
    method: 'connect',
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: process.env.OPENCLAW_GATEWAY_CLIENT_ID ?? 'mission-control',
        version: process.env.OPENCLAW_GATEWAY_CLIENT_VERSION ?? '0.1.0',
        platform: process.platform,
        mode: 'operator',
      },
      role: process.env.OPENCLAW_GATEWAY_ROLE ?? 'operator',
      scopes: parseScopes(),
      caps: [],
      commands: [],
      permissions: {},
      auth: process.env.OPENCLAW_GATEWAY_TOKEN ? { token: process.env.OPENCLAW_GATEWAY_TOKEN } : {},
      locale: 'es-ES',
      userAgent: 'artificial-world-mission-control/0.1.0',
      device: {
        id: process.env.OPENCLAW_DEVICE_ID ?? 'mission-control-local-device',
        publicKey: process.env.OPENCLAW_DEVICE_PUBLIC_KEY ?? 'local-dev-key',
        signature: process.env.OPENCLAW_DEVICE_SIGNATURE ?? 'local-dev-signature',
        signedAt: Date.now(),
        nonce: 'pending-challenge',
      },
    },
  };
}

function buildApprovalResolveFrame(approvalId, resolution, note, actor) {
  return {
    type: 'req',
    id: createId('approval_resolve'),
    method: 'exec.approval.resolve',
    params: {
      approvalId,
      resolution,
      note: note ?? '',
      actor: actor ?? 'mission-control-operator',
      idempotencyKey: createId('idem'),
    },
  };
}

function updateGatewayState(gatewayId, patch) {
  const connector = connectorsRegistry.get(gatewayId);
  if (!connector) {
    return;
  }

  connector.gateway = {
    ...connector.gateway,
    ...patch,
    updatedAt: nowIso(),
  };
  persistGateway(connector.gateway);
}

function scheduleReconnect(gatewayId) {
  const connector = connectorsRegistry.get(gatewayId);
  if (!connector || connector.closedByUser) {
    return;
  }

  connector.retryCount += 1;
  updateGatewayState(gatewayId, {
    status: 'degraded',
    retryCount: connector.retryCount,
    lastError: connector.lastError ?? 'reconnecting',
  });

  const delayMs = Math.min(1000 * (2 ** Math.min(connector.retryCount - 1, 4)), 15000);
  connector.reconnectTimer = setTimeout(() => {
    connectGateway(connector.url, connector.gateway.id);
  }, delayMs);
}

function connectGateway(url, gatewayId) {
  const connector = connectorsRegistry.get(gatewayId);
  if (!connector) {
    return;
  }

  if (connector.reconnectTimer) {
    clearTimeout(connector.reconnectTimer);
    connector.reconnectTimer = null;
  }

  updateGatewayState(gatewayId, {
    status: 'connecting',
    lastError: null,
  });

  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  const wsOptions = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;
  const socket = new WebSocket(url, wsOptions);
  connector.socket = socket;
  connector.challengeReceived = false;
  connector.connectSent = false;
  connector.lastStatusProbeAt = Date.now();

  socket.on('open', () => {
    logger.info(`[mission-control.openclaw] socket open ${gatewayId}`);
    setTimeout(() => {
      const liveConnector = connectorsRegistry.get(gatewayId);
      if (!liveConnector?.challengeReceived && liveConnector?.socket?.readyState === WebSocket.OPEN) {
        liveConnector.socket.send(JSON.stringify({ type: 'status', payload: {} }));
        liveConnector.socket.send(JSON.stringify({ type: 'heartbeat_trigger', payload: { dry_run: false } }));
      }
    }, 1200);
  });

  socket.on('message', (buffer) => {
    try {
      const frame = JSON.parse(String(buffer));
      connector.lastHeartbeatAt = nowIso();

      if (frame.type === 'event' && frame.event === 'connect.challenge' && !connector.connectSent) {
        connector.challengeReceived = true;
        const connectFrame = buildConnectFrame();
        connectFrame.params.device.nonce = frame.payload?.nonce ?? 'nonce-missing';
        connector.socket.send(JSON.stringify(connectFrame));
        connector.connectSent = true;
      }

      const normalized = normalizeOpenClawFrame(gatewayId, frame);
      broadcastNormalizedEvent(normalized);

      if (
        frame.type === 'res'
        || frame.type === 'heartbeat_status'
        || frame.type === 'response'
        || frame.type === 'tool_result'
      ) {
        const latencyMs = Math.max(1, Date.now() - connector.lastStatusProbeAt);
        updateGatewayState(gatewayId, {
          status: 'connected',
          latencyMs,
          retryCount: 0,
          healthScore: Number(Math.max(0.5, Math.min(1, 1 - (latencyMs / 1000))).toFixed(2)),
          lastHeartbeatAt: connector.lastHeartbeatAt,
          metadata: {
            ...(connector.gateway.metadata ?? {}),
            gatewayOrigin: url,
            adapterMode: 'openclaw-live',
            version: 'adapter-v2',
            protocol: frame.type === 'res' ? 'gateway-protocol-v3' : 'gateway-legacy',
          },
        });
      }

      if (frame.type === 'error' || (frame.type === 'res' && frame.ok === false)) {
        connector.lastError = frame.payload?.message ?? frame.error?.message ?? 'OpenClaw gateway error';
        updateGatewayState(gatewayId, {
          status: 'degraded',
          lastError: connector.lastError,
        });
      }
    } catch (error) {
      connector.lastError = error.message;
      updateGatewayState(gatewayId, {
        status: 'degraded',
        lastError: error.message,
      });
      logger.warn('[mission-control.openclaw] invalid gateway frame', { gatewayId, error: error.message });
    }
  });

  socket.on('error', (error) => {
    connector.lastError = error.message;
    updateGatewayState(gatewayId, {
      status: 'degraded',
      lastError: error.message,
    });
    logger.warn('[mission-control.openclaw] socket error', { gatewayId, error: error.message });
  });

  socket.on('close', () => {
    updateGatewayState(gatewayId, {
      status: 'disconnected',
      lastError: connector.lastError,
    });
    scheduleReconnect(gatewayId);
  });
}

export function listGatewayConnectors() {
  const gateways = listGateways();
  const boards = listBoards();
  const agents = listAgents();

  return gateways.map((gateway) => ({
    ...gateway,
    agents: agents.filter((agent) => agent.gatewayId === gateway.id),
    boards: boards.filter((board) => board.gatewayId === gateway.id),
    adapter: {
      version: gateway.metadata?.version ?? 'adapter-v1',
      mode: gateway.metadata?.adapterMode ?? 'hybrid',
      heartbeat: true,
      retries: true,
      normalization: true,
        protocol: gateway.metadata?.protocol ?? 'seed',
    },
  }));
}

export function getGatewayContractSummary() {
  return {
    version: 'mission-control.v1',
    openClaw: {
      transport: 'WebSocket',
      defaultPort: 18789,
      protocolModes: ['gateway-protocol-v3', 'gateway-legacy'],
      requests: ['connect', 'status', 'heartbeat_trigger', 'chat', 'skill_invoke'],
      frames: ['event', 'req', 'res', 'response', 'tool_call', 'tool_result', 'heartbeat_status', 'error'],
      approvals: {
        event: 'exec.approval.requested',
        resolveMethod: 'exec.approval.resolve',
      },
    },
    envelope: {
      eventName: 'string',
      entityType: 'gateway|agent|task|run|approval',
      entityId: 'string|null',
      severity: 'info|warn|error',
      payload: 'object',
      createdAt: 'iso-string',
    },
    expectedGatewayCapabilities: [
      'heartbeat',
      'status',
      'agent_state',
      'task_state',
      'run_state',
      'approval_request',
      'error_report',
    ],
  };
}

export function initOpenClawConnectors({ publish } = {}) {
  publishRealtime = typeof publish === 'function' ? publish : () => {};

  const urls = gatewayUrls();
  if (urls.length === 0) {
    return [];
  }

  return urls.map((url, index) => {
    const gatewayId = toGatewayId(url, index);
    if (!connectorsRegistry.has(gatewayId)) {
      connectorsRegistry.set(gatewayId, {
        gateway: createGatewayRecord(gatewayId, url),
        url,
        socket: null,
        reconnectTimer: null,
        retryCount: 0,
        lastError: null,
        lastHeartbeatAt: null,
        challengeReceived: false,
        connectSent: false,
        lastStatusProbeAt: Date.now(),
        closedByUser: false,
      });
      persistGateway(connectorsRegistry.get(gatewayId).gateway);
    }

    connectGateway(url, gatewayId);
    return gatewayId;
  });
}

export function cleanupOpenClawConnectors() {
  for (const [gatewayId, connector] of connectorsRegistry) {
    connector.closedByUser = true;
    if (connector.reconnectTimer) {
      clearTimeout(connector.reconnectTimer);
      connector.reconnectTimer = null;
    }
    if (connector.socket && connector.socket.readyState !== WebSocket.CLOSED) {
      connector.socket.close();
    }
  }
  connectorsRegistry.clear();
}

export function resolveOpenClawApproval(gatewayId, approvalId, resolution, note, actor) {
  const connector = connectorsRegistry.get(gatewayId);
  if (!connector?.socket || connector.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const frame = buildApprovalResolveFrame(approvalId, resolution, note, actor);
  connector.socket.send(JSON.stringify(frame));

  broadcastNormalizedEvent({
    eventName: 'approval.resolve_sent',
    entityType: 'approval',
    entityId: approvalId,
    severity: 'info',
    message: `Resolucion enviada a OpenClaw: ${resolution}`,
    payload: {
      gatewayId,
      approvalId,
      resolution,
    },
  });

  return true;
}

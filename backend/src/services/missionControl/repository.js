import { getMissionControlDb } from '../../db/missionControlDb.js';
import { sanitizeContent, sanitizeObject } from '../../utils/sanitizeSecrets.js';
import { buildDecisionEntry } from '../../utils/decisionUtils.js';

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapGateway(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    metadata: parseJson(row.metadata, {}),
    healthScore: row.health_score,
    latencyMs: row.latency_ms,
    retryCount: row.retry_count,
    lastHeartbeatAt: row.last_heartbeat_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBoardGroup(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBoard(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    description: row.description,
    gatewayId: row.gateway_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAgent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    gatewayId: row.gateway_id,
    boardId: row.board_id,
    name: row.name,
    role: row.role,
    status: row.status,
    currentTaskId: row.current_task_id,
    lastHeartbeatAt: row.last_heartbeat_at,
    lastError: row.last_error,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    boardId: row.board_id,
    gatewayId: row.gateway_id,
    agentId: row.agent_id,
    title: row.title,
    status: row.status,
    sortOrder: row.sort_order,
    priority: row.priority,
    workType: row.work_type,
    requiresApproval: Boolean(row.requires_approval),
    blocked: Boolean(row.blocked),
    tags: parseJson(row.tags, []),
    summary: row.summary,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata, {}),
  };
}

function mapRun(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    taskId: row.task_id,
    agentId: row.agent_id,
    gatewayId: row.gateway_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    summary: row.summary,
    errorMessage: row.error_message,
    artifacts: parseJson(row.artifacts, []),
    messages: parseJson(row.messages, []),
    decisions: parseJson(row.decisions, []),
    metadata: parseJson(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApproval(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    taskId: row.task_id,
    runId: row.run_id,
    agentId: row.agent_id,
    gatewayId: row.gateway_id,
    actionType: row.action_type,
    status: row.status,
    riskLevel: row.risk_level,
    reason: row.reason,
    diffSummary: row.diff_summary,
    context: parseJson(row.context, {}),
    requestedAt: row.requested_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    stream: row.stream,
    eventName: row.event_name,
    entityType: row.entity_type,
    entityId: row.entity_id,
    severity: row.severity,
    message: row.message,
    payload: parseJson(row.payload, {}),
    createdAt: row.created_at,
  };
}

function mapQualityGate(row) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    gateType: row.gate_type,
    status: row.status,
    resultSummary: parseJson(row.result_summary, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function countRows(tableName) {
  const db = getMissionControlDb();
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  return row?.count ?? 0;
}

export function upsertGateway(gateway) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO gateways (id, name, kind, status, latency_ms, retry_count, health_score, last_heartbeat_at, last_error, metadata, created_at, updated_at)
    VALUES (@id, @name, @kind, @status, @latencyMs, @retryCount, @healthScore, @lastHeartbeatAt, @lastError, @metadata, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      kind = excluded.kind,
      status = excluded.status,
      latency_ms = excluded.latency_ms,
      retry_count = excluded.retry_count,
      health_score = excluded.health_score,
      last_heartbeat_at = excluded.last_heartbeat_at,
      last_error = excluded.last_error,
      metadata = excluded.metadata,
      updated_at = excluded.updated_at
  `).run({
    id: gateway.id,
    name: gateway.name,
    kind: gateway.kind,
    status: gateway.status,
    latencyMs: gateway.latencyMs ?? 0,
    retryCount: gateway.retryCount ?? 0,
    healthScore: gateway.healthScore ?? 1,
    lastHeartbeatAt: gateway.lastHeartbeatAt ?? null,
    lastError: gateway.lastError ?? null,
    metadata: JSON.stringify(gateway.metadata ?? {}),
    createdAt: gateway.createdAt ?? new Date().toISOString(),
    updatedAt: gateway.updatedAt ?? new Date().toISOString(),
  });
}

export function upsertBoardGroup(group) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO board_groups (id, name, kind, description, created_at, updated_at)
    VALUES (@id, @name, @kind, @description, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      kind = excluded.kind,
      description = excluded.description,
      updated_at = excluded.updated_at
  `).run({
    id: group.id,
    name: group.name,
    kind: group.kind,
    description: group.description ?? null,
    createdAt: group.createdAt ?? new Date().toISOString(),
    updatedAt: group.updatedAt ?? new Date().toISOString(),
  });
}

export function upsertBoard(board) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO boards (id, group_id, name, description, gateway_id, created_at, updated_at)
    VALUES (@id, @groupId, @name, @description, @gatewayId, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      group_id = excluded.group_id,
      name = excluded.name,
      description = excluded.description,
      gateway_id = excluded.gateway_id,
      updated_at = excluded.updated_at
  `).run({
    id: board.id,
    groupId: board.groupId,
    name: board.name,
    description: board.description ?? null,
    gatewayId: board.gatewayId ?? null,
    createdAt: board.createdAt ?? new Date().toISOString(),
    updatedAt: board.updatedAt ?? new Date().toISOString(),
  });
}

export function upsertAgent(agent) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO agents (id, gateway_id, board_id, name, role, status, current_task_id, last_heartbeat_at, last_error, metadata, created_at, updated_at)
    VALUES (@id, @gatewayId, @boardId, @name, @role, @status, @currentTaskId, @lastHeartbeatAt, @lastError, @metadata, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      gateway_id = excluded.gateway_id,
      board_id = excluded.board_id,
      name = excluded.name,
      role = excluded.role,
      status = excluded.status,
      current_task_id = excluded.current_task_id,
      last_heartbeat_at = excluded.last_heartbeat_at,
      last_error = excluded.last_error,
      metadata = excluded.metadata,
      updated_at = excluded.updated_at
  `).run({
    id: agent.id,
    gatewayId: agent.gatewayId,
    boardId: agent.boardId ?? null,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    currentTaskId: agent.currentTaskId ?? null,
    lastHeartbeatAt: agent.lastHeartbeatAt ?? null,
    lastError: agent.lastError ?? null,
    metadata: JSON.stringify(agent.metadata ?? {}),
    createdAt: agent.createdAt ?? new Date().toISOString(),
    updatedAt: agent.updatedAt ?? new Date().toISOString(),
  });
}

export function upsertTask(task) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO tasks (id, board_id, gateway_id, agent_id, title, status, sort_order, priority, work_type, requires_approval, blocked, tags, summary, last_activity_at, created_at, updated_at, metadata)
    VALUES (@id, @boardId, @gatewayId, @agentId, @title, @status, @sortOrder, @priority, @workType, @requiresApproval, @blocked, @tags, @summary, @lastActivityAt, @createdAt, @updatedAt, @metadata)
    ON CONFLICT(id) DO UPDATE SET
      board_id = excluded.board_id,
      gateway_id = excluded.gateway_id,
      agent_id = excluded.agent_id,
      title = excluded.title,
      status = excluded.status,
      sort_order = excluded.sort_order,
      priority = excluded.priority,
      work_type = excluded.work_type,
      requires_approval = excluded.requires_approval,
      blocked = excluded.blocked,
      tags = excluded.tags,
      summary = excluded.summary,
      last_activity_at = excluded.last_activity_at,
      metadata = excluded.metadata,
      updated_at = excluded.updated_at
  `).run({
    id: task.id,
    boardId: task.boardId,
    gatewayId: task.gatewayId,
    agentId: task.agentId ?? null,
    title: task.title,
    status: task.status,
    sortOrder: task.sortOrder ?? 0,
    priority: task.priority,
    workType: task.workType,
    requiresApproval: task.requiresApproval ? 1 : 0,
    blocked: task.blocked ? 1 : 0,
    tags: JSON.stringify(task.tags ?? []),
    summary: task.summary ?? null,
    lastActivityAt: task.lastActivityAt ?? new Date().toISOString(),
    createdAt: task.createdAt ?? new Date().toISOString(),
    updatedAt: task.updatedAt ?? new Date().toISOString(),
    metadata: JSON.stringify(task.metadata ?? {}),
  });
}

export function upsertRun(run) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO runs (id, task_id, agent_id, gateway_id, status, started_at, completed_at, summary, error_message, artifacts, messages, decisions, metadata, created_at, updated_at)
    VALUES (@id, @taskId, @agentId, @gatewayId, @status, @startedAt, @completedAt, @summary, @errorMessage, @artifacts, @messages, @decisions, @metadata, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      task_id = excluded.task_id,
      agent_id = excluded.agent_id,
      gateway_id = excluded.gateway_id,
      status = excluded.status,
      completed_at = excluded.completed_at,
      summary = excluded.summary,
      error_message = excluded.error_message,
      artifacts = excluded.artifacts,
      messages = excluded.messages,
      decisions = excluded.decisions,
      metadata = excluded.metadata,
      updated_at = excluded.updated_at
  `).run({
    id: run.id,
    taskId: run.taskId,
    agentId: run.agentId ?? null,
    gatewayId: run.gatewayId,
    status: run.status,
    startedAt: run.startedAt ?? new Date().toISOString(),
    completedAt: run.completedAt ?? null,
    summary: run.summary ?? null,
    errorMessage: run.errorMessage ?? null,
    artifacts: JSON.stringify(run.artifacts ?? []),
    messages: JSON.stringify(run.messages ?? []),
    decisions: JSON.stringify(run.decisions ?? []),
    metadata: JSON.stringify(run.metadata ?? {}),
    createdAt: run.createdAt ?? new Date().toISOString(),
    updatedAt: run.updatedAt ?? new Date().toISOString(),
  });
}

export function upsertApproval(approval) {
  const db = getMissionControlDb();
  const sanitizedReason = sanitizeContent(approval.reason ?? '');
  const sanitizedDiffSummary = sanitizeContent(approval.diffSummary ?? '') || null;
  const sanitizedResolutionNote = sanitizeContent(approval.resolutionNote ?? '') || null;
  const sanitizedContext = JSON.stringify(sanitizeObject(approval.context ?? {}));

  db.prepare(`
    INSERT INTO approvals (id, task_id, run_id, agent_id, gateway_id, action_type, status, risk_level, reason, diff_summary, context, requested_at, resolved_at, resolved_by, resolution_note, created_at, updated_at)
    VALUES (@id, @taskId, @runId, @agentId, @gatewayId, @actionType, @status, @riskLevel, @reason, @diffSummary, @context, @requestedAt, @resolvedAt, @resolvedBy, @resolutionNote, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      task_id = excluded.task_id,
      run_id = excluded.run_id,
      agent_id = excluded.agent_id,
      gateway_id = excluded.gateway_id,
      action_type = excluded.action_type,
      status = excluded.status,
      risk_level = excluded.risk_level,
      reason = excluded.reason,
      diff_summary = excluded.diff_summary,
      context = excluded.context,
      resolved_at = excluded.resolved_at,
      resolved_by = excluded.resolved_by,
      resolution_note = excluded.resolution_note,
      updated_at = excluded.updated_at
  `).run({
    id: approval.id,
    taskId: approval.taskId,
    runId: approval.runId ?? null,
    agentId: approval.agentId ?? null,
    gatewayId: approval.gatewayId,
    actionType: approval.actionType,
    status: approval.status,
    riskLevel: approval.riskLevel,
    reason: sanitizedReason,
    diffSummary: sanitizedDiffSummary,
    context: sanitizedContext,
    requestedAt: approval.requestedAt ?? new Date().toISOString(),
    resolvedAt: approval.resolvedAt ?? null,
    resolvedBy: approval.resolvedBy ?? null,
    resolutionNote: sanitizedResolutionNote,
    createdAt: approval.createdAt ?? new Date().toISOString(),
    updatedAt: approval.updatedAt ?? new Date().toISOString(),
  });
}

export function insertEvent(event) {
  const db = getMissionControlDb();
  const sanitizedMessage = sanitizeContent(event.message ?? '');
  const sanitizedPayload = JSON.stringify(sanitizeObject(event.payload ?? {}));

  db.prepare(`
    INSERT INTO events (id, stream, event_name, entity_type, entity_id, severity, message, payload, created_at)
    VALUES (@id, @stream, @eventName, @entityType, @entityId, @severity, @message, @payload, @createdAt)
  `).run({
    id: event.id,
    stream: event.stream ?? 'mission-control',
    eventName: event.eventName,
    entityType: event.entityType,
    entityId: event.entityId ?? null,
    severity: event.severity ?? 'info',
    message: sanitizedMessage,
    payload: sanitizedPayload,
    createdAt: event.createdAt ?? new Date().toISOString(),
  });
}

export function listGateways() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM gateways ORDER BY name ASC').all().map(mapGateway);
}

export function listBoardGroups() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM board_groups ORDER BY name ASC').all().map(mapBoardGroup);
}

export function listBoards() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM boards ORDER BY name ASC').all().map(mapBoard);
}

export function listAgents() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM agents ORDER BY name ASC').all().map(mapAgent);
}

export function listTasks() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM tasks ORDER BY status ASC, sort_order ASC, datetime(last_activity_at) DESC, datetime(updated_at) DESC').all().map(mapTask);
}

export function listRuns() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM runs ORDER BY datetime(started_at) DESC').all().map(mapRun);
}

export function listApprovals() {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM approvals ORDER BY datetime(requested_at) DESC').all().map(mapApproval);
}

export function listEvents(limit = 200) {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM events ORDER BY datetime(created_at) DESC LIMIT ?').all(limit).map(mapEvent);
}

export function getTask(taskId) {
  const db = getMissionControlDb();
  return mapTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId));
}

export function getRun(runId) {
  const db = getMissionControlDb();
  return mapRun(db.prepare('SELECT * FROM runs WHERE id = ?').get(runId));
}

export function appendDecision(runId, decisionOpts) {
  const run = getRun(runId);
  if (!run) return null;
  const decisions = [...(run.decisions ?? []), buildDecisionEntry(decisionOpts)];
  upsertRun({ ...run, decisions });
  return getRun(runId);
}

export function upsertQualityGate(gate) {
  const db = getMissionControlDb();
  db.prepare(`
    INSERT INTO quality_gates (id, task_id, gate_type, status, result_summary, created_at, updated_at)
    VALUES (@id, @taskId, @gateType, @status, @resultSummary, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      result_summary = excluded.result_summary,
      updated_at = excluded.updated_at
  `).run({
    id: gate.id,
    taskId: gate.taskId,
    gateType: gate.gateType,
    status: gate.status,
    resultSummary: JSON.stringify(gate.resultSummary ?? {}),
    createdAt: gate.createdAt ?? new Date().toISOString(),
    updatedAt: gate.updatedAt ?? new Date().toISOString(),
  });
}

export function listGatesForTask(taskId) {
  const db = getMissionControlDb();
  return db.prepare('SELECT * FROM quality_gates WHERE task_id = ? ORDER BY created_at DESC')
    .all(taskId)
    .map(mapQualityGate);
}

export function getApproval(approvalId) {
  const db = getMissionControlDb();
  return mapApproval(db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId));
}

export function getEventsByEntity(entityType, entityId, limit = 100) {
  const db = getMissionControlDb();
  return db.prepare(`
    SELECT * FROM events
    WHERE entity_type = ? AND entity_id = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).all(entityType, entityId, limit).map(mapEvent);
}

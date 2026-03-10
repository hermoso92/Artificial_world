import {
  getApproval,
  getEventsByEntity,
  getRun,
  getTask,
  listAgents,
  listApprovals,
  listBoardGroups,
  listBoards,
  listEvents,
  listGateways,
  listRuns,
  listTasks,
} from './repository.js';

const DEFAULT_EVENT_LIMIT = 120;

function includesInsensitive(value, query) {
  if (!query) {
    return true;
  }

  return String(value ?? '').toLowerCase().includes(String(query).toLowerCase());
}

function buildLookup(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function withJoins(tasks, { agentsById, boardsById, groupsById, gatewaysById }) {
  return tasks.map((task) => {
    const agent = task.agentId ? agentsById.get(task.agentId) ?? null : null;
    const board = boardsById.get(task.boardId) ?? null;
    const boardGroup = board?.groupId ? groupsById.get(board.groupId) ?? null : null;
    const gateway = gatewaysById.get(task.gatewayId) ?? null;

    return {
      ...task,
      agent,
      board,
      boardGroup,
      gateway,
    };
  });
}

function withRunJoins(runs, { agentsById, tasksById, gatewaysById }) {
  return runs.map((run) => ({
    ...run,
    task: tasksById.get(run.taskId) ?? null,
    agent: run.agentId ? agentsById.get(run.agentId) ?? null : null,
    gateway: gatewaysById.get(run.gatewayId) ?? null,
  }));
}

function withApprovalJoins(approvals, { agentsById, tasksById, runsById, gatewaysById }) {
  return approvals.map((approval) => ({
    ...approval,
    task: tasksById.get(approval.taskId) ?? null,
    run: approval.runId ? runsById.get(approval.runId) ?? null : null,
    agent: approval.agentId ? agentsById.get(approval.agentId) ?? null : null,
    gateway: gatewaysById.get(approval.gatewayId) ?? null,
  }));
}

function filterTasks(tasks, filters = {}) {
  return tasks.filter((task) => {
    if (filters.boardGroupId && task.boardGroup?.id !== filters.boardGroupId) {
      return false;
    }
    if (filters.boardId && task.board?.id !== filters.boardId) {
      return false;
    }
    if (filters.gatewayId && task.gateway?.id !== filters.gatewayId) {
      return false;
    }
    if (filters.agentId && task.agent?.id !== filters.agentId) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    if (filters.workType && task.workType !== filters.workType) {
      return false;
    }
    if (filters.requiresApproval === 'true' && !task.requiresApproval) {
      return false;
    }
    if (filters.blocked === 'true' && !task.blocked) {
      return false;
    }
    if (filters.search) {
      const searchable = [
        task.title,
        task.summary,
        task.agent?.name,
        task.board?.name,
        task.boardGroup?.name,
        task.gateway?.name,
        ...(task.tags ?? []),
      ].join(' ');

      if (!includesInsensitive(searchable, filters.search)) {
        return false;
      }
    }

    return true;
  });
}

function filterEvents(events, filters = {}) {
  return events.filter((event) => {
    if (filters.gatewayId && event.payload?.gatewayId !== filters.gatewayId) {
      return false;
    }
    if (filters.severity && event.severity !== filters.severity) {
      return false;
    }
    if (filters.search && !includesInsensitive(`${event.eventName} ${event.message}`, filters.search)) {
      return false;
    }
    return true;
  });
}

function buildOverview({ gateways, agents, tasks, runs, approvals, events }) {
  const activeAgents = agents.filter((agent) => ['active', 'running', 'waiting_approval'].includes(agent.status)).length;
  const failedRuns = runs.filter((run) => run.status === 'failed').length;
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending').length;
  const throughputPerMinute = events.filter((event) => Date.now() - Date.parse(event.createdAt) < 60000).length;
  const completedRuns = runs.filter((run) => run.status === 'completed' && run.completedAt);
  const avgTaskTimeMs = completedRuns.length === 0
    ? 0
    : Math.round(
      completedRuns.reduce((total, run) => total + (Date.parse(run.completedAt) - Date.parse(run.startedAt)), 0) / completedRuns.length,
    );

  return {
    activeAgents,
    backlog: tasks.filter((task) => task.status === 'backlog').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    review: tasks.filter((task) => task.status === 'review').length,
    done: tasks.filter((task) => task.status === 'done').length,
    blocked: tasks.filter((task) => task.blocked || task.status === 'blocked').length,
    failedRuns,
    pendingApprovals,
    gatewayCount: gateways.length,
    degradedGateways: gateways.filter((gateway) => gateway.status !== 'connected').length,
    avgTaskTimeMs,
    throughputPerMinute,
    recentErrors: events.filter((event) => event.severity === 'error').slice(0, 5),
  };
}

export function getMissionControlSnapshot(filters = {}) {
  const gateways = listGateways();
  const boardGroups = listBoardGroups();
  const boards = listBoards();
  const agents = listAgents();
  const tasks = listTasks();
  const runs = listRuns();
  const approvals = listApprovals();
  const events = listEvents(Number(filters.eventLimit) || DEFAULT_EVENT_LIMIT);

  const groupsById = buildLookup(boardGroups);
  const boardsById = buildLookup(boards);
  const gatewaysById = buildLookup(gateways);
  const agentsById = buildLookup(agents);
  const tasksById = buildLookup(tasks);
  const runsById = buildLookup(runs);

  const hydratedTasks = withJoins(tasks, { agentsById, boardsById, groupsById, gatewaysById });
  const hydratedRuns = withRunJoins(runs, { agentsById, tasksById, gatewaysById });
  const hydratedApprovals = withApprovalJoins(approvals, { agentsById, tasksById, runsById, gatewaysById });

  const filteredTasks = filterTasks(hydratedTasks, filters);
  const filteredEvents = filterEvents(events, filters);
  const overview = buildOverview({
    gateways,
    agents,
    tasks: hydratedTasks,
    runs: hydratedRuns,
    approvals: hydratedApprovals,
    events,
  });

  return {
    overview,
    gateways,
    boardGroups,
    boards,
    agents,
    tasks: filteredTasks,
    runs: hydratedRuns,
    approvals: hydratedApprovals,
    events: filteredEvents,
    filtersApplied: {
      boardGroupId: filters.boardGroupId ?? null,
      boardId: filters.boardId ?? null,
      gatewayId: filters.gatewayId ?? null,
      agentId: filters.agentId ?? null,
      priority: filters.priority ?? null,
      workType: filters.workType ?? null,
      requiresApproval: filters.requiresApproval ?? null,
      blocked: filters.blocked ?? null,
      severity: filters.severity ?? null,
      search: filters.search ?? '',
    },
  };
}

export function getTaskDetail(taskId) {
  const task = getTask(taskId);
  if (!task) {
    return null;
  }

  const snapshot = getMissionControlSnapshot();
  const runs = snapshot.runs.filter((run) => run.taskId === taskId);
  const approvals = snapshot.approvals.filter((approval) => approval.taskId === taskId);
  const events = getEventsByEntity('task', taskId, 200);

  const hydratedTask = snapshot.tasks.find((item) => item.id === taskId) ?? task;

  return {
    task: hydratedTask,
    runs,
    approvals,
    events,
  };
}

export function getRunDetail(runId) {
  const run = getRun(runId);
  if (!run) {
    return null;
  }

  const snapshot = getMissionControlSnapshot();
  const events = getEventsByEntity('run', runId, 200);
  const approvals = snapshot.approvals.filter((approval) => approval.runId === runId);
  const hydratedRun = snapshot.runs.find((item) => item.id === runId) ?? run;

  return {
    run: hydratedRun,
    task: hydratedRun.task ?? null,
    agent: hydratedRun.agent ?? null,
    gateway: hydratedRun.gateway ?? null,
    approvals,
    events,
  };
}

export function getApprovalDetail(approvalId) {
  const approval = getApproval(approvalId);
  if (!approval) {
    return null;
  }

  const snapshot = getMissionControlSnapshot();
  return snapshot.approvals.find((item) => item.id === approvalId) ?? approval;
}

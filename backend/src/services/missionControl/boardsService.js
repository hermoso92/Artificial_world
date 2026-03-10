import { getMissionControlSnapshot } from './aggregator.js';
import { getTask, listTasks, upsertTask } from './repository.js';

function nowIso() {
  return new Date().toISOString();
}

export function listBoardsView(filters = {}) {
  const snapshot = getMissionControlSnapshot(filters);

  return snapshot.boards.map((board) => ({
    ...board,
    boardGroup: snapshot.boardGroups.find((group) => group.id === board.groupId) ?? null,
    tasks: snapshot.tasks.filter((task) => task.boardId === board.id),
  }));
}

export function moveTaskToStatus(taskId, nextStatus) {
  const task = getTask(taskId);
  if (!task) {
    return null;
  }

  upsertTask({
    ...task,
    status: nextStatus,
    blocked: nextStatus === 'blocked',
    lastActivityAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      ...(task.metadata ?? {}),
      lastAction: 'moved_on_board',
    },
  });

  return getTask(taskId);
}

export function reorderTask(taskId, nextStatus, beforeTaskId = null) {
  const task = getTask(taskId);
  if (!task) {
    return null;
  }

  const allTasks = listTasks();
  const sourceStatus = task.status;
  const targetStatus = nextStatus ?? task.status;

  const sourceTasks = allTasks
    .filter((item) => item.status === sourceStatus && item.id !== task.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const targetBase = targetStatus === sourceStatus ? sourceTasks : allTasks
    .filter((item) => item.status === targetStatus)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const movedTask = {
    ...task,
    status: targetStatus,
    blocked: targetStatus === 'blocked',
    lastActivityAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      ...(task.metadata ?? {}),
      lastAction: 'reordered_on_board',
    },
  };

  const insertIndex = beforeTaskId
    ? targetBase.findIndex((item) => item.id === beforeTaskId)
    : -1;

  const orderedTarget = [...targetBase];
  if (insertIndex >= 0) {
    orderedTarget.splice(insertIndex, 0, movedTask);
  } else {
    orderedTarget.push(movedTask);
  }

  orderedTarget.forEach((item, index) => {
    upsertTask({
      ...item,
      status: targetStatus,
      blocked: targetStatus === 'blocked' ? true : item.blocked,
      sortOrder: (index + 1) * 1000,
      lastActivityAt: item.id === movedTask.id ? movedTask.lastActivityAt : item.lastActivityAt,
      updatedAt: nowIso(),
    });
  });

  if (sourceStatus !== targetStatus) {
    sourceTasks.forEach((item, index) => {
      upsertTask({
        ...item,
        sortOrder: (index + 1) * 1000,
        updatedAt: nowIso(),
      });
    });
  }

  return getTask(taskId);
}

import { useState } from 'react';
import { GripVertical, LayoutGrid, PauseCircle, Rows3, ShieldAlert } from 'lucide-react';
import { Badge, Button, ShellCard } from './ui.jsx';
import { formatRelativeTime, statusTone } from '../utils/format.js';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
  { id: 'blocked', label: 'Blocked' },
];

function TaskCard({ task, onSelect, onMove, onDragStart, onDragEnd, isDragging }) {
  return (
    <button
      type="button"
      draggable
      className={`w-full rounded-xl border border-white/8 bg-slate-950/80 p-3 text-left transition hover:border-cyan-400/25 hover:bg-slate-900/90 ${isDragging ? 'opacity-40' : ''}`}
      onClick={() => onSelect(task)}
      onDragStart={(event) => onDragStart(event, task)}
      onDragEnd={onDragEnd}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-sm font-semibold text-slate-100">{task.title}</div>
          <div className="text-xs text-slate-500">{task.board?.name ?? task.boardId}</div>
        </div>
        <GripVertical className="size-4 text-slate-600" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone={statusTone(task.status)}>{task.status}</Badge>
        <Badge tone={task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warning' : 'neutral'}>
          {task.priority}
        </Badge>
        {task.requiresApproval && (
          <Badge tone="warning">
            <ShieldAlert className="mr-1 size-3" />
            gate
          </Badge>
        )}
        {task.blocked && (
          <Badge tone="danger">
            <PauseCircle className="mr-1 size-3" />
            blocked
          </Badge>
        )}
      </div>

      <div className="space-y-1 text-xs text-slate-400">
        <div className="flex items-center justify-between gap-3">
          <span>Agente</span>
          <span className="truncate text-slate-200">{task.agent?.name ?? 'sin asignar'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Gateway</span>
          <span className="truncate text-slate-200">{task.gateway?.name ?? task.gatewayId}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Actividad</span>
          <span className="text-slate-200">{formatRelativeTime(task.lastActivityAt)}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {task.status !== 'done' && (
          <Button
            variant="ghost"
            className="h-8 flex-1 text-xs"
            onClick={(event) => {
              event.stopPropagation();
                onMove(task.id, task.status === 'review' ? 'done' : 'review', null);
            }}
          >
            {task.status === 'review' ? 'Marcar done' : 'Mover review'}
          </Button>
        )}
      </div>
    </button>
  );
}

export function MissionControlBoard({ tasks, onSelectTask, onMoveTask }) {
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dropColumnId, setDropColumnId] = useState(null);
  const [dropBeforeTaskId, setDropBeforeTaskId] = useState(null);
  const [viewMode, setViewMode] = useState('flat');

  const handleDragStart = (event, task) => {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDropColumnId(null);
    setDropBeforeTaskId(null);
  };

  const handleDragOverColumn = (event, columnId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropColumnId(columnId);
  };

  const handleDropColumn = async (event, columnId) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const task = tasks.find((item) => item.id === taskId);

    setDropColumnId(null);
    setDropBeforeTaskId(null);
    setDraggingTaskId(null);

    if (!task || task.status === columnId) {
      return;
    }

    await onMoveTask(taskId, columnId, null);
  };

  const handleDragOverTask = (event, columnId, taskId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropColumnId(columnId);
    setDropBeforeTaskId(taskId);
  };

  const handleDropBeforeTask = async (event, columnId, beforeTaskId) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const task = tasks.find((item) => item.id === taskId);

    setDropColumnId(null);
    setDropBeforeTaskId(null);
    setDraggingTaskId(null);

    if (!task) {
      return;
    }

    const samePlacement = task.status === columnId && task.id === beforeTaskId;
    if (samePlacement) {
      return;
    }

    await onMoveTask(taskId, columnId, beforeTaskId);
  };

  const renderColumns = (itemsByScope) => (
    <div className="grid gap-4 xl:grid-cols-5">
      {COLUMNS.map((column) => {
        const items = itemsByScope.filter((task) => task.status === column.id);

        return (
          <div
            key={column.id}
            className={`flex min-h-[360px] flex-col rounded-xl border p-3 transition ${dropColumnId === column.id ? 'border-cyan-400/35 bg-cyan-400/8' : 'border-white/8 bg-black/20'}`}
            onDragOver={(event) => handleDragOverColumn(event, column.id)}
            onDragLeave={() => setDropColumnId((current) => (current === column.id ? null : current))}
            onDrop={(event) => handleDropColumn(event, column.id)}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-100">{column.label}</span>
              <Badge tone="neutral">{items.length}</Badge>
            </div>

            <div className="flex-1 space-y-3 overflow-auto mission-scroll">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-500">
                  Sin tareas en esta columna.
                </div>
              ) : (
                items.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-2xl ${dropBeforeTaskId === task.id ? 'ring-1 ring-cyan-400/40' : ''}`}
                    onDragOver={(event) => handleDragOverTask(event, column.id, task.id)}
                    onDrop={(event) => handleDropBeforeTask(event, column.id, task.id)}
                  >
                    <TaskCard
                      task={task}
                      onSelect={onSelectTask}
                      onMove={onMoveTask}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggingTaskId === task.id}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const swimlaneGroups = Object.values(
    tasks.reduce((accumulator, task) => {
      const groupId = task.boardGroup?.id ?? 'ungrouped';
      if (!accumulator[groupId]) {
        accumulator[groupId] = {
          id: groupId,
          name: task.boardGroup?.name ?? 'Sin grupo',
          tasks: [],
        };
      }
      accumulator[groupId].tasks.push(task);
      return accumulator;
    }, {}),
  );

  return (
    <ShellCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Mission board</div>
          <h3 className="text-lg font-semibold text-slate-50">Kanban operativo</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="info">{tasks.length} tareas</Badge>
          <Button variant={viewMode === 'flat' ? 'primary' : 'ghost'} className="h-8 px-2 text-xs" onClick={() => setViewMode('flat')}>
            <LayoutGrid className="size-4" />
            Flat
          </Button>
          <Button variant={viewMode === 'grouped' ? 'primary' : 'ghost'} className="h-8 px-2 text-xs" onClick={() => setViewMode('grouped')}>
            <Rows3 className="size-4" />
            Swimlanes
          </Button>
        </div>
      </div>

      {viewMode === 'flat' ? (
        renderColumns(tasks)
      ) : (
        <div className="space-y-6">
          {swimlaneGroups.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-100">{group.name}</h4>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Swimlane por board group</p>
                </div>
                <Badge tone="neutral">{group.tasks.length}</Badge>
              </div>
              {renderColumns(group.tasks)}
            </section>
          ))}
        </div>
      )}
    </ShellCard>
  );
}

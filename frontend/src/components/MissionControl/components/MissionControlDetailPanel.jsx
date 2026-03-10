import { Badge, Button, ShellCard } from './ui.jsx';
import { formatDateTime, formatRelativeTime, severityTone, statusTone } from '../utils/format.js';

function JsonBlock({ value }) {
  return (
    <pre className="overflow-auto rounded-lg border border-white/8 bg-black/30 p-3 text-xs text-slate-300 mission-scroll">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function MissionControlDetailPanel({
  selection,
  taskDetail,
  runDetail,
  approvalDetail,
  onClose,
  onPauseTask,
  onResumeTask,
  onSelectRun,
  onSelectApproval,
}) {
  const panelTitle = selection?.kind === 'task'
    ? taskDetail?.task?.title
    : selection?.kind === 'run'
      ? runDetail?.run?.summary ?? runDetail?.run?.id
      : selection?.kind === 'approval'
        ? approvalDetail?.actionType
        : selection?.kind === 'event'
          ? selection?.message
          : 'Selecciona una entidad';

  return (
    <ShellCard className="flex h-full min-h-[420px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Inspector</div>
          <h3 className="text-lg font-semibold text-slate-50">{panelTitle}</h3>
        </div>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>

      {!selection && (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-500">
          Selecciona una tarea, run, approval o evento para ver historial, errores, aprobaciones y artefactos.
        </div>
      )}

      {selection?.kind === 'task' && taskDetail?.task && (
        <div className="space-y-4 overflow-auto mission-scroll">
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(taskDetail.task.status)}>{taskDetail.task.status}</Badge>
            <Badge tone={taskDetail.task.priority === 'critical' ? 'danger' : 'warning'}>{taskDetail.task.priority}</Badge>
            {taskDetail.task.tags?.map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
          <p className="text-sm text-slate-300">{taskDetail.task.summary}</p>
          <div className="grid gap-3 text-sm text-slate-400">
            <div className="flex items-center justify-between"><span>Ultima actividad</span><span>{formatRelativeTime(taskDetail.task.lastActivityAt)}</span></div>
            <div className="flex items-center justify-between"><span>Agente</span><span>{taskDetail.task.agent?.name ?? 'sin asignar'}</span></div>
            <div className="flex items-center justify-between"><span>Gateway</span><span>{taskDetail.task.gateway?.name ?? taskDetail.task.gatewayId}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onPauseTask(taskDetail.task.id)}>Pausar</Button>
            <Button variant="primary" onClick={() => onResumeTask(taskDetail.task.id)}>Reanudar</Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Runs</div>
              <div className="space-y-2">
                {taskDetail.runs.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-white/8 bg-black/20 px-3 py-2 text-left text-sm text-slate-200"
                    onClick={() => onSelectRun(run.id)}
                  >
                    <span className="truncate">{run.summary ?? run.id}</span>
                    <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Approvals</div>
              <div className="space-y-2">
                {taskDetail.approvals.map((approval) => (
                  <button
                    key={approval.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-white/8 bg-black/20 px-3 py-2 text-left text-sm text-slate-200"
                    onClick={() => onSelectApproval(approval.id)}
                  >
                    <span className="truncate">{approval.actionType}</span>
                    <Badge tone={statusTone(approval.status)}>{approval.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <JsonBlock value={{ runs: taskDetail.runs, approvals: taskDetail.approvals, events: taskDetail.events }} />
        </div>
      )}

      {selection?.kind === 'run' && runDetail?.run && (
        <div className="space-y-4 overflow-auto mission-scroll">
          <div className="flex gap-2">
            <Badge tone={statusTone(runDetail.run.status)}>{runDetail.run.status}</Badge>
            <Badge tone={runDetail.run.errorMessage ? 'danger' : 'info'}>{runDetail.gateway?.name ?? runDetail.run.gatewayId}</Badge>
          </div>
          <p className="text-sm text-slate-300">{runDetail.run.summary}</p>
          <div className="space-y-2 text-sm text-slate-400">
            <div>Inicio: {formatDateTime(runDetail.run.startedAt)}</div>
            <div>Fin: {formatDateTime(runDetail.run.completedAt)}</div>
            <div>Agente: {runDetail.agent?.name ?? runDetail.run.agentId ?? 'sin asignar'}</div>
          </div>
          <JsonBlock value={{ messages: runDetail.run.messages, decisions: runDetail.run.decisions, artifacts: runDetail.run.artifacts, approvals: runDetail.approvals, events: runDetail.events }} />
        </div>
      )}

      {selection?.kind === 'approval' && approvalDetail && (
        <div className="space-y-4 overflow-auto mission-scroll">
          <div className="flex gap-2">
            <Badge tone={statusTone(approvalDetail.status)}>{approvalDetail.status}</Badge>
            <Badge tone={approvalDetail.riskLevel === 'high' ? 'danger' : 'warning'}>{approvalDetail.riskLevel}</Badge>
          </div>
          <p className="text-sm text-slate-300">{approvalDetail.reason}</p>
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-300">
            {approvalDetail.diffSummary}
          </div>
          <JsonBlock value={approvalDetail.context} />
        </div>
      )}

      {selection?.kind === 'event' && (
        <div className="space-y-4 overflow-auto mission-scroll">
          <div className="flex gap-2">
            <Badge tone={severityTone(selection.severity)}>{selection.severity}</Badge>
            <Badge>{selection.eventName}</Badge>
          </div>
          <p className="text-sm text-slate-300">{selection.message}</p>
          <JsonBlock value={selection.payload} />
        </div>
      )}
    </ShellCard>
  );
}

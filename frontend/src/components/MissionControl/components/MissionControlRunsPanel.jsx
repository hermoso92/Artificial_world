import { Badge, ShellCard } from './ui.jsx';
import { formatDateTime, formatRelativeTime, statusTone } from '../utils/format.js';

export function MissionControlRunsPanel({ runs, onSelectRun }) {
  return (
    <ShellCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Runs</div>
          <h3 className="text-lg font-semibold text-slate-50">Sessions en curso y recientes</h3>
        </div>
        <Badge tone="info">{runs.length}</Badge>
      </div>

      <div className="space-y-3">
        {runs.slice(0, 6).map((run) => (
          <button
            key={run.id}
            type="button"
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-cyan-400/25"
            onClick={() => onSelectRun(run.id)}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">{run.task?.title ?? run.summary ?? run.id}</div>
                <div className="text-xs text-slate-500">{run.agent?.name ?? run.agentId ?? 'sin agente'} · {run.gateway?.name ?? run.gatewayId}</div>
              </div>
              <Badge tone={statusTone(run.status)}>{run.status}</Badge>
            </div>
            <div className="grid gap-1 text-xs text-slate-400 sm:grid-cols-3">
              <div>Inicio: <span className="text-slate-200">{formatDateTime(run.startedAt)}</span></div>
              <div>Actividad: <span className="text-slate-200">{formatRelativeTime(run.updatedAt)}</span></div>
              <div>Artefactos: <span className="text-slate-200">{run.artifacts?.length ?? 0}</span></div>
            </div>
          </button>
        ))}
      </div>
    </ShellCard>
  );
}

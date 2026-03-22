import { Activity, AlertTriangle, CheckCircle2, Clock3, Network, RadioTower, XCircle } from 'lucide-react';
import { Badge, ShellCard } from './ui.jsx';
import { formatDuration } from '../utils/format.js';

const KPI_ITEMS = [
  { key: 'activeAgents', label: 'Agentes activos', icon: Activity },
  { key: 'backlog', label: 'Backlog', icon: Clock3 },
  { key: 'inProgress', label: 'En progreso', icon: RadioTower },
  { key: 'review', label: 'En review', icon: AlertTriangle },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
  { key: 'failedRuns', label: 'Runs fallidos', icon: XCircle },
  { key: 'pendingApprovals', label: 'Aprobaciones', icon: AlertTriangle },
  { key: 'gatewayCount', label: 'Gateways', icon: Network },
];

export function MissionControlDashboard({ overview, gateways }) {
  if (!overview) {
    return null;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.7fr,1fr]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_ITEMS.map(({ key, label, icon: Icon }) => (
          <ShellCard key={key} className="p-4">
            <div className="mb-3 flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-[0.22em]">{label}</span>
              <Icon className="size-4 text-cyan-300" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-slate-50">{overview[key] ?? 0}</div>
          </ShellCard>
        ))}
      </div>

      <ShellCard className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Observabilidad</div>
            <h3 className="text-lg font-semibold text-slate-50">Estado operativo</h3>
          </div>
          <Badge tone={overview.degradedGateways > 0 ? 'warning' : 'success'}>
            {overview.degradedGateways > 0 ? `${overview.degradedGateways} degradados` : 'Estable'}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm text-slate-300">
          <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2">
            <span>Tiempo medio por tarea</span>
            <strong>{formatDuration(overview.avgTaskTimeMs)}</strong>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2">
            <span>Throughput por minuto</span>
            <strong>{overview.throughputPerMinute}</strong>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/4 p-3">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Gateways</div>
            <div className="space-y-2">
              {gateways.map((gateway) => (
                <div key={gateway.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-slate-200">{gateway.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone={gateway.status === 'connected' ? 'success' : gateway.status === 'degraded' ? 'warning' : 'danger'}>
                      {gateway.status}
                    </Badge>
                    <span className="text-xs text-slate-400">{gateway.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ShellCard>
    </div>
  );
}

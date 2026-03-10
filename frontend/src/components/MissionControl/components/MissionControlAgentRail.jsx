import { AlertTriangle, Bot, Link2, PauseCircle, Radio } from 'lucide-react';
import { Badge, Button, ShellCard } from './ui.jsx';
import { formatRelativeTime, statusTone } from '../utils/format.js';

function StatusIcon({ status }) {
  if (status === 'waiting_approval') return <PauseCircle className="size-4" />;
  if (status === 'error') return <AlertTriangle className="size-4" />;
  if (status === 'running') return <Radio className="size-4" />;
  return <Bot className="size-4" />;
}

export function MissionControlAgentRail({ agents, onInspect }) {
  return (
    <ShellCard className="flex h-full min-h-[320px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Agent rail</div>
          <h3 className="text-lg font-semibold text-slate-50">Agentes</h3>
        </div>
        <Badge tone="info">{agents.length}</Badge>
      </div>

      <div className="flex-1 space-y-3 overflow-auto mission-scroll">
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            className="w-full rounded-xl border border-white/8 bg-white/4 p-3 text-left transition hover:border-cyan-400/25 hover:bg-white/6"
            onClick={() => onInspect(agent)}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusIcon status={agent.status} />
                <div>
                  <div className="font-medium text-slate-100">{agent.name}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{agent.role}</div>
                </div>
              </div>
              <Badge tone={statusTone(agent.status)}>{agent.status}</Badge>
            </div>

            <div className="space-y-1 text-sm text-slate-400">
              <div className="flex items-center justify-between gap-3">
                <span>Gateway</span>
                <span className="truncate text-slate-200">{agent.metadata?.gatewayOrigin ?? agent.gatewayId}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Heartbeat</span>
                <span className="text-slate-200">{formatRelativeTime(agent.lastHeartbeatAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Tarea actual</span>
                <span className="truncate text-slate-200">{agent.currentTaskId ?? 'sin asignar'}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-400">
        <span className="flex items-center gap-2"><Link2 className="size-4" /> Vista persistente</span>
        <Button variant="ghost" className="px-0 text-xs">Operador</Button>
      </div>
    </ShellCard>
  );
}

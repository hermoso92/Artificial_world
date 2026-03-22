import { Pause, Play, TriangleAlert } from 'lucide-react';
import { Badge, Button, ShellCard } from './ui.jsx';
import { formatDateTime, severityTone } from '../utils/format.js';

export function MissionControlEventFeed({ events, paused, onTogglePause, onSelect }) {
  return (
    <ShellCard className="flex h-full min-h-[380px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Live feed</div>
          <h3 className="text-lg font-semibold text-slate-50">Eventos en vivo</h3>
        </div>
        <Button variant={paused ? 'warning' : 'secondary'} onClick={onTogglePause}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? 'Reanudar' : 'Pausar'}
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-auto mission-scroll">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-cyan-400/25"
            onClick={() => onSelect(event)}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-100">{event.eventName}</span>
              </div>
              <Badge tone={severityTone(event.severity)}>{event.severity}</Badge>
            </div>
            <p className="mb-2 text-sm text-slate-300">{event.message}</p>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{event.entityType}:{event.entityId ?? 'n/a'}</span>
              <span>{formatDateTime(event.createdAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </ShellCard>
  );
}

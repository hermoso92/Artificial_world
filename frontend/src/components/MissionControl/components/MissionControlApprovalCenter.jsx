import { useMemo, useState } from 'react';
import { Badge, Button, ShellCard } from './ui.jsx';
import { formatDateTime, statusTone } from '../utils/format.js';

export function MissionControlApprovalCenter({ approvals, onSelect, onApprove, onReject }) {
  const [notesByApprovalId, setNotesByApprovalId] = useState({});
  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === 'pending'),
    [approvals],
  );

  const updateNote = (approvalId, value) => {
    setNotesByApprovalId((current) => ({
      ...current,
      [approvalId]: value,
    }));
  };

  return (
    <ShellCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Approval gates</div>
          <h3 className="text-lg font-semibold text-slate-50">Centro de aprobaciones</h3>
        </div>
        <Badge tone={pendingApprovals.length > 0 ? 'warning' : 'success'}>
          {pendingApprovals.length} pendientes
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {pendingApprovals.map((approval) => (
          <div key={approval.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">{approval.actionType}</div>
                <div className="text-xs text-slate-500">{approval.task?.title ?? approval.taskId}</div>
              </div>
              <Badge tone={statusTone(approval.status)}>{approval.status}</Badge>
            </div>
            <p className="mb-3 text-sm text-slate-300">{approval.reason}</p>
            <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">
              {approval.diffSummary || 'Sin diff, solo resumen de contexto.'}
            </div>
            <div className="mb-3 text-xs text-slate-500">
              Solicitado por {approval.agent?.name ?? approval.agentId ?? 'agente'} el {formatDateTime(approval.requestedAt)}
            </div>
            <textarea
              className="mb-3 min-h-[88px] w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/35"
              placeholder="Añade contexto para la resolución: motivo, alcance, observaciones..."
              value={notesByApprovalId[approval.id] ?? ''}
              onChange={(event) => updateNote(approval.id, event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onApprove(approval.id, notesByApprovalId[approval.id] ?? '')}>Aprobar</Button>
              <Button variant="danger" onClick={() => onReject(approval.id, notesByApprovalId[approval.id] ?? '')}>Rechazar</Button>
              <Button variant="ghost" onClick={() => onSelect(approval)}>Ver detalle</Button>
            </div>
          </div>
        ))}
      </div>
    </ShellCard>
  );
}

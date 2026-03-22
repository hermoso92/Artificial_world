import { Search, ShieldAlert } from 'lucide-react';
import { Button, ShellCard, cn } from './ui.jsx';

const FILTER_INPUT_CLASS = 'h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40';

export function MissionControlFilterBar({
  filters,
  boardGroups,
  gateways,
  agents,
  onChange,
  onReset,
}) {
  const toggleFlag = (key) => onChange({ [key]: !filters[key] });

  return (
    <ShellCard className="flex flex-wrap items-center gap-3 p-4">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          className={cn(FILTER_INPUT_CLASS, 'w-full pl-9')}
          placeholder="Buscar tarea, agente, board o tag"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>

      <select className={FILTER_INPUT_CLASS} value={filters.boardGroupId} onChange={(event) => onChange({ boardGroupId: event.target.value })}>
        <option value="">Todos los grupos</option>
        {boardGroups.map((group) => (
          <option key={group.id} value={group.id}>{group.name}</option>
        ))}
      </select>

      <select className={FILTER_INPUT_CLASS} value={filters.gatewayId} onChange={(event) => onChange({ gatewayId: event.target.value })}>
        <option value="">Todos los gateways</option>
        {gateways.map((gateway) => (
          <option key={gateway.id} value={gateway.id}>{gateway.name}</option>
        ))}
      </select>

      <select className={FILTER_INPUT_CLASS} value={filters.agentId} onChange={(event) => onChange({ agentId: event.target.value })}>
        <option value="">Todos los agentes</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>{agent.name}</option>
        ))}
      </select>

      <select className={FILTER_INPUT_CLASS} value={filters.priority} onChange={(event) => onChange({ priority: event.target.value })}>
        <option value="">Todas las prioridades</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select className={FILTER_INPUT_CLASS} value={filters.workType} onChange={(event) => onChange({ workType: event.target.value })}>
        <option value="">Todos los tipos</option>
        <option value="analysis">Analysis</option>
        <option value="backend">Backend</option>
        <option value="frontend">Frontend</option>
        <option value="approval">Approval</option>
        <option value="ops">Ops</option>
        <option value="infra">Infra</option>
      </select>

      <div className="flex items-center gap-2">
        <Button
          variant={filters.requiresApproval ? 'primary' : 'secondary'}
          onClick={() => toggleFlag('requiresApproval')}
        >
          <ShieldAlert className="size-4" />
          Approval
        </Button>
        <Button
          variant={filters.blocked ? 'danger' : 'secondary'}
          onClick={() => toggleFlag('blocked')}
        >
          Blocked
        </Button>
      </div>

      <Button variant="ghost" onClick={onReset}>Limpiar</Button>
    </ShellCard>
  );
}

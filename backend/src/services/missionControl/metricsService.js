import { getMissionControlSnapshot } from './aggregator.js';

export function getMissionControlMetrics() {
  const snapshot = getMissionControlSnapshot({ eventLimit: 200 });

  const gatewayLatency = snapshot.gateways.map((gateway) => ({
    gatewayId: gateway.id,
    gatewayName: gateway.name,
    latencyMs: gateway.latencyMs,
    status: gateway.status,
  }));

  const agentStatusBreakdown = snapshot.agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] ?? 0) + 1;
    return acc;
  }, {});

  const taskStatusBreakdown = snapshot.tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    overview: snapshot.overview,
    gatewayLatency,
    agentStatusBreakdown,
    taskStatusBreakdown,
    pendingApprovals: snapshot.approvals.filter((approval) => approval.status === 'pending').length,
    recentErrors: snapshot.events.filter((event) => event.severity === 'error').slice(0, 10),
  };
}

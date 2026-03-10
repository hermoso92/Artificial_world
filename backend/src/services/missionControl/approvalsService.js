import { getApprovalDetail } from './aggregator.js';
import { resolveOpenClawApproval } from './connectors.js';
import { resolveApproval } from './runtime.js';
import { getApproval, listApprovals } from './repository.js';

export function listApprovalRequests() {
  return listApprovals();
}

export function getApprovalRequest(approvalId) {
  return getApprovalDetail(approvalId);
}

export function approveRequest(approvalId, actor, note) {
  const approval = getApproval(approvalId);
  if (approval?.context?.gatewayApprovalId) {
    resolveOpenClawApproval(approval.gatewayId, approval.context.gatewayApprovalId, 'approved', note, actor);
  }
  return resolveApproval(approvalId, 'approve', actor, note);
}

export function rejectRequest(approvalId, actor, note) {
  const approval = getApproval(approvalId);
  if (approval?.context?.gatewayApprovalId) {
    resolveOpenClawApproval(approval.gatewayId, approval.context.gatewayApprovalId, 'rejected', note, actor);
  }
  return resolveApproval(approvalId, 'reject', actor, note);
}

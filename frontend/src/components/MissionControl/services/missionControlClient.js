import { api } from '../../../services/api.js';

export const missionControlClient = {
  getSnapshot: (filters = {}) => api.getMissionControlSnapshot(filters),
  getMetrics: () => api.getMissionControlMetrics(),
  getBoards: (filters = {}) => api.getMissionControlBoards(filters),
  getTaskDetail: (taskId) => api.getMissionControlTaskDetail(taskId),
  getRunDetail: (runId) => api.getMissionControlRunDetail(runId),
  getApprovals: () => api.getMissionControlApprovals(),
  getApproval: (approvalId) => api.getMissionControlApproval(approvalId),
  getGateways: () => api.getMissionControlGateways(),
  pauseTask: (taskId) => api.pauseMissionControlTask(taskId),
  resumeTask: (taskId) => api.resumeMissionControlTask(taskId),
  moveTask: (taskId, status, beforeTaskId = null) => api.moveMissionControlTask(taskId, status, beforeTaskId),
  approve: (approvalId, note) => api.approveMissionControlRequest(approvalId, note),
  reject: (approvalId, note) => api.rejectMissionControlRequest(approvalId, note),
};

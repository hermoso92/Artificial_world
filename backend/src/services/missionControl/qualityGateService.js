import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';
import { insertEvent, listGatesForTask, upsertQualityGate } from './repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../');

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

/**
 * Ejecuta el quality gate de tipo guardrails (run-guardrails.js).
 * @param {string} taskId - ID de la tarea
 * @param {string} gateType - 'guardrails' | 'test' | 'lint' (solo guardrails implementado)
 * @returns {{ gate: object, passed: boolean }}
 */
export function runQualityGate(taskId, gateType = 'guardrails') {
  const gateId = createId('gate');
  const now = new Date().toISOString();

  if (gateType !== 'guardrails') {
    upsertQualityGate({
      id: gateId,
      taskId,
      gateType,
      status: 'pending',
      resultSummary: { reason: 'gate_type_not_implemented', gateType },
    });
    insertEvent({
      id: createId('evt'),
      eventName: 'quality_gate.skipped',
      entityType: 'task',
      entityId: taskId,
      severity: 'info',
      message: `Quality gate ${gateType} no implementado`,
      payload: { taskId, gateType, gateId },
    });
    return {
      gate: { id: gateId, taskId, gateType, status: 'pending', resultSummary: {} },
      passed: true,
    };
  }

  const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'guardrails', 'run-guardrails.js');
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 60_000,
  });

  const passed = result.status === 0;
  const status = passed ? 'passed' : 'failed';
  const resultSummary = {
    exitCode: result.status,
    stdout: (result.stdout || '').slice(0, 2000),
    stderr: (result.stderr || '').slice(0, 2000),
  };

  upsertQualityGate({
    id: gateId,
    taskId,
    gateType,
    status,
    resultSummary,
    createdAt: now,
    updatedAt: now,
  });

  insertEvent({
    id: createId('evt'),
    eventName: passed ? 'quality_gate.passed' : 'quality_gate.failed',
    entityType: 'task',
    entityId: taskId,
    severity: passed ? 'info' : 'warn',
    message: `Quality gate ${gateType} ${status} para tarea ${taskId}`,
    payload: { taskId, gateType, gateId, passed },
  });

  logger.info(`[quality-gate] task=${taskId} gate=${gateType} passed=${passed}`);

  return {
    gate: { id: gateId, taskId, gateType, status, resultSummary },
    passed,
  };
}

export function getGatesForTask(taskId) {
  return listGatesForTask(taskId);
}

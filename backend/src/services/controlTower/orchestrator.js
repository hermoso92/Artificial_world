import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import logger from '../../utils/logger.js';
import {
  getMission,
  updateMissionStatus,
  saveSpecialistResult,
  markSpecialistSkipped,
  getSpecialistResults,
  saveDossier,
} from './missionRepository.js';
import { cloneRepo, buildFileInventory, readRelevantFiles, readDocsPath } from './ingestionEngine.js';
import { buildReconReport } from './systemRecon.js';
import { buildDossier, renderMarkdown } from './reportBuilder.js';
import { run as runArchitecture } from './specialists/architectureSpecialist.js';
import { run as runDocumentation } from './specialists/documentationSpecialist.js';
import { run as runDependencies } from './specialists/dependenciesSpecialist.js';
import { run as runApp } from './specialists/appSpecialist.js';
import { run as runSecurity, SECURITY_TIMEOUT_MS } from './specialists/securitySpecialist.js';
import { run as runExecutiveSynthesis } from './specialists/executiveSynthesisSpecialist.js';

const WORK_DIR_BASE = '/tmp/aw-ct';

async function runSpecialist(missionId, specialistName, runFn, context, timeoutMs = null) {
  const startedAt = Date.now();
  logger.info(`[control-tower] Specialist ${specialistName} starting for mission ${missionId}`);

  try {
    let result;

    if (timeoutMs) {
      // Wrap with a race timeout
      result = await Promise.race([
        runFn(context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${timeoutMs}ms exceeded`)), timeoutMs)
        ),
      ]);
    } else {
      result = await runFn(context);
    }

    const durationMs = Date.now() - startedAt;
    await saveSpecialistResult(missionId, specialistName, result, durationMs);
    logger.info(`[control-tower] Specialist ${specialistName} completed in ${durationMs}ms`);
    return { status: 'completed', result };
  } catch (err) {
    const durationMs = Date.now() - startedAt;

    if (err.message?.includes('Timeout')) {
      logger.warn(`[control-tower] Specialist ${specialistName} timed out — marking skipped`);
      await markSpecialistSkipped(missionId, specialistName);
      return { status: 'skipped', error: err.message };
    }

    logger.error(`[control-tower] Specialist ${specialistName} failed: ${err.message}`);
    await saveSpecialistResult(missionId, specialistName, {}, durationMs, err.message);
    return { status: 'failed', error: err.message };
  }
}

export async function runPipeline(missionId) {
  const mission = getMission(missionId);
  if (!mission) {
    logger.error(`[control-tower] Mission ${missionId} not found`);
    return;
  }

  const workDir = join(WORK_DIR_BASE, missionId);

  try {
    // === PHASE 1: INGESTING ===
    await updateMissionStatus(missionId, 'ingesting');
    logger.info(`[control-tower] Mission ${missionId}: ingesting ${mission.repo_url}`);

    let cloneResult;
    try {
      cloneResult = await cloneRepo(mission.repo_url, workDir);
    } catch (err) {
      logger.error(`[control-tower] Clone failed: ${err.message}`);
      await updateMissionStatus(missionId, 'failed', {
        error_message: `Fallo en ingesta del repositorio: ${err.message}`,
      });
      return;
    }

    const inventory = buildFileInventory(workDir);
    const fileContents = readRelevantFiles(inventory);
    const docFiles = mission.docs_path ? readDocsPath(mission.docs_path) : {};

    const ingestionData = {
      clone_method: cloneResult.method,
      total_files: inventory.files.length,
      truncated: inventory.truncated,
      skipped_files: inventory.skipped,
      file_list: inventory.files.map((f) => ({ path: f.path, ext: f.ext, size: f.size })).slice(0, 500),
    };

    // === PHASE 2: RECOGNIZED ===
    let reconData;
    try {
      reconData = buildReconReport(workDir, inventory);
    } catch (err) {
      logger.error(`[control-tower] Recon failed: ${err.message}`);
      await updateMissionStatus(missionId, 'failed', {
        error_message: `Fallo en reconocimiento del sistema: ${err.message}`,
        ingestion_data: ingestionData,
      });
      return;
    }

    await updateMissionStatus(missionId, 'recognized', {
      ingestion_data: ingestionData,
      recon_data: reconData,
    });
    logger.info(`[control-tower] Mission ${missionId}: recognized. Stack: ${reconData.stack.join(', ')}`);

    // === PHASE 3: ANALYZING ===
    await updateMissionStatus(missionId, 'analyzing');

    const missionContext = {
      recon: reconData,
      fileContents,
      docFiles,
      dependencies: reconData.dependencies,
    };

    const specialistOrder = [
      { name: 'architecture', fn: runArchitecture },
      { name: 'documentation', fn: runDocumentation },
      { name: 'dependencies', fn: runDependencies },
      { name: 'app', fn: runApp },
    ];

    for (const { name, fn } of specialistOrder) {
      await runSpecialist(missionId, name, fn, missionContext);
    }

    // Security: runs with hard timeout, auto-skipped if exceeded
    await runSpecialist(missionId, 'security', runSecurity, missionContext, SECURITY_TIMEOUT_MS);

    // === PHASE 4: CONSOLIDATING ===
    await updateMissionStatus(missionId, 'consolidating');

    const specialistResults = getSpecialistResults(missionId);
    const previousResults = {};
    for (const sr of specialistResults) {
      previousResults[sr.specialist] = sr;
    }

    const synthesisContext = { ...missionContext, previousResults };
    const synthesisResult = await runSpecialist(
      missionId, 'executive_synthesis', runExecutiveSynthesis, synthesisContext
    );

    // Build final dossier
    const updatedSpecialistResults = getSpecialistResults(missionId);
    const mission_updated = getMission(missionId);

    const dossierContent = buildDossier(mission_updated, reconData, updatedSpecialistResults);
    const dossierMarkdown = renderMarkdown(dossierContent);
    saveDossier(missionId, dossierContent, dossierMarkdown);

    // === COMPLETED ===
    await updateMissionStatus(missionId, 'completed');
    logger.info(`[control-tower] Mission ${missionId} completed successfully`);

  } catch (err) {
    logger.error(`[control-tower] Pipeline fatal error for mission ${missionId}: ${err.message}`);
    await updateMissionStatus(missionId, 'failed', {
      error_message: `Error inesperado en el pipeline: ${err.message}`,
    });
  } finally {
    // Cleanup cloned repo
    if (existsSync(workDir)) {
      try {
        rmSync(workDir, { recursive: true, force: true });
        logger.info(`[control-tower] Cleaned up workdir ${workDir}`);
      } catch (e) {
        logger.warn(`[control-tower] Could not clean workdir: ${e.message}`);
      }
    }
  }
}

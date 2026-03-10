export function prioritizeRisks(specialistResults) {
  const levelOrder = { high: 0, medium: 1, low: 2 };
  const allRisks = [];

  for (const sr of specialistResults) {
    if (!sr.result || sr.status === 'skipped') continue;
    const risks = sr.result.risks ?? [];
    for (const risk of risks) {
      if (!risk || !risk.description) continue;
      allRisks.push({
        level: risk.level ?? 'medium',
        description: risk.description,
        source_specialist: sr.specialist,
      });
    }
  }

  // Sort by level, deduplicate similar descriptions
  allRisks.sort((a, b) => (levelOrder[a.level] ?? 2) - (levelOrder[b.level] ?? 2));

  // Simple dedup by description similarity (exact match on first 80 chars)
  const seen = new Set();
  return allRisks.filter((r) => {
    const key = r.description.slice(0, 80).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractQuickWins(specialistResults) {
  const wins = [];
  for (const sr of specialistResults) {
    if (!sr.result || sr.status === 'skipped') continue;
    const actions = sr.result.recommended_actions ?? [];
    const findings = sr.result.findings ?? [];

    // Actions that mention "rápido", "simple", "fácil", "inmediato", "añadir", "actualizar", "agregar"
    const quickIndicators = /rápido|simple|fácil|inmediato|añad|agreg|actualiz|configurar|habilitar|corregir/i;
    for (const action of actions) {
      if (quickIndicators.test(action)) wins.push(action);
    }
  }
  return [...new Set(wins)].slice(0, 8);
}

export function buildArchitectureMap(recon) {
  const stack = recon.stack ?? [];
  const entryPoints = recon.entry_points ?? [];
  const structure = recon.structure ?? {};

  // Infer architecture type from stack
  let archType = 'monolith';
  if (stack.includes('Docker Compose') && structure.top_level_dirs?.includes('services')) {
    archType = 'multi-service';
  } else if (stack.some((s) => ['Next.js', 'React'].includes(s)) && stack.some((s) => ['Express', 'FastAPI', 'Django'].includes(s))) {
    archType = 'fullstack-monorepo';
  } else if (entryPoints.length > 2) {
    archType = 'multi-entry';
  }

  const layers = [];
  const dirs = structure.top_level_dirs ?? [];
  if (dirs.some((d) => ['frontend', 'client', 'web', 'ui'].includes(d))) layers.push('frontend');
  if (dirs.some((d) => ['backend', 'server', 'api', 'src'].includes(d))) layers.push('backend/api');
  if (dirs.some((d) => ['db', 'database', 'migrations', 'data'].includes(d))) layers.push('data');
  if (dirs.some((d) => ['tests', 'test', 'pruebas', '__tests__', 'spec'].includes(d))) layers.push('testing');
  if (dirs.some((d) => ['docs', 'doc', 'documentation'].includes(d))) layers.push('documentation');
  if (dirs.some((d) => ['scripts', 'bin', 'tools', 'utils'].includes(d))) layers.push('tooling');

  return {
    type: archType,
    layers,
    entry_points: entryPoints,
    modules: dirs.slice(0, 12),
  };
}

export function buildDossier(mission, reconData, specialistResults) {
  const resultsMap = {};
  let llmCalls = 0;
  const specialistsRun = [];
  const specialistsFailed = [];

  for (const sr of specialistResults) {
    resultsMap[sr.specialist] = sr;
    if (sr.status === 'completed') { specialistsRun.push(sr.specialist); llmCalls++; }
    if (sr.status === 'failed') specialistsFailed.push(sr.specialist);
  }

  const synthesis = resultsMap['executive_synthesis']?.result ?? {};
  const architecture = resultsMap['architecture']?.result ?? {};
  const documentation = resultsMap['documentation']?.result ?? {};
  const dependencies = resultsMap['dependencies']?.result ?? {};
  const app = resultsMap['app']?.result ?? {};
  const security = resultsMap['security']?.result ?? {};

  const prioritizedRisks = prioritizeRisks(specialistResults);
  const quickWins = extractQuickWins(specialistResults);
  const archMap = buildArchitectureMap(reconData);

  // Action plan from synthesis + top risks
  const actionPlan = [];
  let priority = 1;

  // From synthesis recommended_actions
  for (const action of (synthesis.recommended_actions ?? []).slice(0, 5)) {
    actionPlan.push({ priority: priority++, action, effort: 'medium', impact: 'high' });
  }

  // Fill from other specialists if synthesis is empty
  if (actionPlan.length < 3) {
    for (const sr of specialistResults) {
      if (sr.specialist === 'executive_synthesis') continue;
      for (const action of (sr.result?.recommended_actions ?? []).slice(0, 2)) {
        if (actionPlan.length >= 8) break;
        actionPlan.push({ priority: priority++, action, effort: 'medium', impact: 'medium' });
      }
    }
  }

  const limitations = [
    `Análisis estático basado en ${reconData.structure?.total_files ?? 0} archivos.`,
    'No se ejecutó el código ni se realizaron pruebas dinámicas.',
    'El análisis de seguridad es orientativo; requiere auditoría manual para confirmar.',
  ];

  if (reconData.ingestion_truncated) {
    limitations.push('El inventario de archivos fue truncado por superar el límite de 5000 archivos.');
  }
  if (specialistsFailed.length > 0) {
    limitations.push(`Especialistas con fallos: ${specialistsFailed.join(', ')}. Sus hallazgos pueden estar incompletos.`);
  }

  return {
    executive_summary: synthesis.summary ||
      `Análisis técnico del repositorio ${mission.repo_url}. Stack: ${reconData.stack?.join(', ') || 'no determinado'}.`,
    scope_and_context: {
      repo_url: mission.repo_url,
      mission_name: mission.name,
      analyzed_at: new Date().toISOString(),
      file_count: reconData.structure?.total_files ?? 0,
      stack: reconData.stack ?? [],
      entry_points: reconData.entry_points ?? [],
      docs_path: mission.docs_path ?? null,
    },
    system_reading: architecture.summary || synthesis.summary || 'Sin lectura disponible.',
    architecture_map: archMap,
    findings_by_domain: {
      architecture: {
        status: architecture.status_assessment ?? 'warning',
        findings: architecture.findings ?? [],
        confidence: architecture.confidence_level ?? 0,
      },
      documentation: {
        status: documentation.status_assessment ?? 'warning',
        findings: documentation.findings ?? [],
        confidence: documentation.confidence_level ?? 0,
      },
      dependencies: {
        status: dependencies.status_assessment ?? 'warning',
        findings: dependencies.findings ?? [],
        confidence: dependencies.confidence_level ?? 0,
      },
      app: {
        status: app.status_assessment ?? 'warning',
        findings: app.findings ?? [],
        confidence: app.confidence_level ?? 0,
      },
      security: {
        status: security.status_assessment ?? 'warning',
        findings: security.findings ?? [],
        confidence: security.confidence_level ?? 0,
        skipped: resultsMap['security']?.status === 'skipped',
      },
    },
    prioritized_risks: prioritizedRisks,
    quick_wins: quickWins,
    action_plan: actionPlan,
    limitations,
    traceability: {
      specialists_run: specialistsRun,
      specialists_failed: specialistsFailed,
      specialists_skipped: specialistResults.filter((s) => s.status === 'skipped').map((s) => s.specialist),
      files_analyzed: reconData.structure?.total_files ?? 0,
      llm_calls: llmCalls,
      analyzed_at: new Date().toISOString(),
    },
  };
}

function riskBadge(level) {
  const map = { high: '🔴 ALTO', medium: '🟡 MEDIO', low: '🟢 BAJO' };
  return map[level] ?? level?.toUpperCase() ?? 'DESCONOCIDO';
}

function statusBadge(status) {
  const map = { healthy: '✅ Saludable', warning: '⚠️ Advertencia', critical: '🔴 Crítico' };
  return map[status] ?? status ?? '—';
}

export function renderMarkdown(dossier) {
  const lines = [];

  lines.push(`# Dossier Técnico-Ejecutivo`);
  lines.push(`**Misión**: ${dossier.scope_and_context.mission_name}`);
  lines.push(`**Repositorio**: \`${dossier.scope_and_context.repo_url}\``);
  lines.push(`**Analizado**: ${new Date(dossier.scope_and_context.analyzed_at).toLocaleString('es-ES')}`);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## 1. Resumen Ejecutivo');
  lines.push('');
  lines.push(dossier.executive_summary);
  lines.push('');

  lines.push('## 2. Alcance y Contexto');
  lines.push('');
  lines.push(`- **Stack detectado**: ${dossier.scope_and_context.stack.join(', ') || 'No determinado'}`);
  lines.push(`- **Archivos analizados**: ${dossier.scope_and_context.file_count}`);
  lines.push(`- **Puntos de entrada**: ${dossier.scope_and_context.entry_points.join(', ') || 'No detectados'}`);
  lines.push('');

  lines.push('## 3. Lectura General del Sistema');
  lines.push('');
  lines.push(dossier.system_reading);
  lines.push('');

  lines.push('## 4. Mapa de Arquitectura Detectada');
  lines.push('');
  lines.push(`- **Tipo**: ${dossier.architecture_map.type}`);
  lines.push(`- **Capas**: ${dossier.architecture_map.layers.join(', ') || 'No determinadas'}`);
  lines.push(`- **Módulos principales**: ${dossier.architecture_map.modules.join(', ')}`);
  lines.push('');

  lines.push('## 5. Hallazgos por Dominio');
  lines.push('');

  const domains = [
    ['Arquitectura', dossier.findings_by_domain.architecture],
    ['Documentación', dossier.findings_by_domain.documentation],
    ['Dependencias', dossier.findings_by_domain.dependencies],
    ['Aplicación', dossier.findings_by_domain.app],
    ['Seguridad', dossier.findings_by_domain.security],
  ];

  for (const [name, domain] of domains) {
    const skippedNote = domain.skipped ? ' *(omitido por timeout)*' : '';
    lines.push(`### ${name} — ${statusBadge(domain.status)}${skippedNote}`);
    if (domain.findings?.length) {
      for (const f of domain.findings) lines.push(`- ${f}`);
    } else {
      lines.push('- Sin hallazgos registrados.');
    }
    lines.push('');
  }

  lines.push('## 6. Riesgos Priorizados');
  lines.push('');

  if (dossier.prioritized_risks.length === 0) {
    lines.push('No se identificaron riesgos con evidencia suficiente.');
  } else {
    for (const risk of dossier.prioritized_risks) {
      lines.push(`- **${riskBadge(risk.level)}** [${risk.source_specialist}] ${risk.description}`);
    }
  }
  lines.push('');

  lines.push('## 7. Quick Wins');
  lines.push('');
  if (dossier.quick_wins.length === 0) {
    lines.push('No se identificaron quick wins específicos.');
  } else {
    for (const win of dossier.quick_wins) lines.push(`- ${win}`);
  }
  lines.push('');

  lines.push('## 8. Plan de Acción');
  lines.push('');
  if (dossier.action_plan.length === 0) {
    lines.push('No se generó plan de acción.');
  } else {
    for (const item of dossier.action_plan) {
      lines.push(`${item.priority}. **[Esfuerzo: ${item.effort} / Impacto: ${item.impact}]** ${item.action}`);
    }
  }
  lines.push('');

  lines.push('## 9. Limitaciones');
  lines.push('');
  for (const l of dossier.limitations) lines.push(`- ${l}`);
  lines.push('');

  lines.push('## 10. Trazabilidad');
  lines.push('');
  lines.push(`- **Especialistas ejecutados**: ${dossier.traceability.specialists_run.join(', ') || 'ninguno'}`);
  if (dossier.traceability.specialists_failed.length > 0) {
    lines.push(`- **Especialistas fallidos**: ${dossier.traceability.specialists_failed.join(', ')}`);
  }
  if (dossier.traceability.specialists_skipped.length > 0) {
    lines.push(`- **Especialistas omitidos**: ${dossier.traceability.specialists_skipped.join(', ')}`);
  }
  lines.push(`- **Archivos analizados**: ${dossier.traceability.files_analyzed}`);
  lines.push(`- **Llamadas LLM**: ${dossier.traceability.llm_calls}`);
  lines.push('');

  return lines.join('\n');
}

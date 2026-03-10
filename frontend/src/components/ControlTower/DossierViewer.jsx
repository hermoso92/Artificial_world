import { useState } from 'react';

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const STATUS_COLORS = { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444' };
const DOMAIN_LABELS = {
  architecture: 'Arquitectura',
  documentation: 'Documentación',
  dependencies: 'Dependencias',
  app: 'Aplicación',
  security: 'Seguridad',
};

function Section({ title, number, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border: '1px solid #334155', borderRadius: 8, marginBottom: 12, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', background: '#1e293b',
          border: 'none', padding: '12px 16px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: '#e2e8f0',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          <span style={{ color: '#64748b', marginRight: 8 }}>{number}.</span>{title}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '16px', background: '#0f172a' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }) {
  const color = RISK_COLORS[level] ?? '#64748b';
  return (
    <span style={{
      padding: '1px 6px', borderRadius: 3, fontSize: '0.7rem',
      fontWeight: 700, background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {level?.toUpperCase()}
    </span>
  );
}

function StatusDot({ status }) {
  const color = STATUS_COLORS[status] ?? '#64748b';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem',
      fontWeight: 600, background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {status}
    </span>
  );
}

export function DossierViewer({ dossier }) {
  const { content } = dossier;
  if (!content) return <div style={{ color: '#64748b' }}>Dossier no disponible.</div>;

  const handleCopyMarkdown = () => {
    if (dossier.markdown) {
      navigator.clipboard?.writeText(dossier.markdown).catch(() => {});
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#1e3a5f', border: '1px solid #2563eb44',
        borderRadius: 10, padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
              Dossier Técnico-Ejecutivo
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {content.scope_and_context?.mission_name} · {content.scope_and_context?.stack?.join(', ') || 'Stack no determinado'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              {content.scope_and_context?.file_count} archivos · Analizado {new Date(content.scope_and_context?.analyzed_at).toLocaleString('es-ES')}
            </div>
          </div>
          {dossier.markdown && (
            <button
              type="button"
              onClick={handleCopyMarkdown}
              style={{
                padding: '5px 12px', borderRadius: 5,
                background: 'transparent', border: '1px solid #334155',
                color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem',
              }}
            >
              Copiar Markdown
            </button>
          )}
        </div>
      </div>

      <Section number="1" title="Resumen Ejecutivo" defaultOpen>
        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.9rem' }}>
          {content.executive_summary}
        </p>
      </Section>

      <Section number="2" title="Alcance y Contexto">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#64748b', marginBottom: 3 }}>Repositorio</div>
            <a href={content.scope_and_context?.repo_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
              {content.scope_and_context?.repo_url}
            </a>
          </div>
          <div>
            <div style={{ color: '#64748b', marginBottom: 3 }}>Stack detectado</div>
            <div style={{ color: '#e2e8f0' }}>{content.scope_and_context?.stack?.join(', ') || '—'}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', marginBottom: 3 }}>Archivos analizados</div>
            <div style={{ color: '#e2e8f0' }}>{content.scope_and_context?.file_count}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', marginBottom: 3 }}>Puntos de entrada</div>
            <div style={{ color: '#e2e8f0' }}>{content.scope_and_context?.entry_points?.join(', ') || '—'}</div>
          </div>
        </div>
      </Section>

      <Section number="3" title="Lectura General del Sistema">
        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.9rem' }}>
          {content.system_reading}
        </p>
      </Section>

      <Section number="4" title="Mapa de Arquitectura Detectada">
        {content.architecture_map && (
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Tipo: </span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{content.architecture_map.type}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Capas: </span>
              <span style={{ color: '#e2e8f0' }}>{content.architecture_map.layers?.join(', ') || '—'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Módulos: </span>
              <span style={{ color: '#e2e8f0' }}>{content.architecture_map.modules?.join(', ')}</span>
            </div>
          </div>
        )}
      </Section>

      <Section number="5" title="Hallazgos por Dominio">
        {content.findings_by_domain && Object.entries(content.findings_by_domain).map(([domain, data]) => (
          <div key={domain} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>
                {DOMAIN_LABELS[domain] ?? domain}
              </span>
              {data.status && <StatusDot status={data.status} />}
              {data.skipped && <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>omitido</span>}
            </div>
            {data.findings?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {data.findings.map((f, i) => (
                  <li key={i} style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 4, lineHeight: 1.5 }}>{f}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#475569', fontSize: '0.8rem' }}>Sin hallazgos registrados.</div>
            )}
          </div>
        ))}
      </Section>

      <Section number="6" title="Riesgos Priorizados">
        {content.prioritized_risks?.length > 0 ? (
          <div>
            {content.prioritized_risks.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0', borderBottom: '1px solid #1e293b',
              }}>
                <div style={{ paddingTop: 2 }}><RiskBadge level={r.level} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>{r.description}</div>
                  <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: 2 }}>{r.source_specialist}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#475569', fontSize: '0.85rem' }}>No se identificaron riesgos con evidencia suficiente.</div>
        )}
      </Section>

      <Section number="7" title="Quick Wins">
        {content.quick_wins?.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {content.quick_wins.map((w, i) => (
              <li key={i} style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6, lineHeight: 1.5 }}>{w}</li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#475569', fontSize: '0.85rem' }}>No se identificaron quick wins específicos.</div>
        )}
      </Section>

      <Section number="8" title="Plan de Acción">
        {content.action_plan?.length > 0 ? (
          <div>
            {content.action_plan.map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 0',
                borderBottom: '1px solid #1e293b', alignItems: 'flex-start',
              }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: '50%',
                  background: '#334155', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8',
                }}>
                  {item.priority}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>{item.action}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Esfuerzo: {item.effort}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Impacto: {item.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#475569', fontSize: '0.85rem' }}>No se generó plan de acción.</div>
        )}
      </Section>

      <Section number="9" title="Limitaciones">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {content.limitations?.map((l, i) => (
            <li key={i} style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 4, lineHeight: 1.5 }}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section number="10" title="Trazabilidad">
        {content.traceability && (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            <div>Especialistas ejecutados: <strong style={{ color: '#e2e8f0' }}>{content.traceability.specialists_run?.join(', ') || '—'}</strong></div>
            {content.traceability.specialists_failed?.length > 0 && (
              <div style={{ marginTop: 4 }}>Fallidos: <span style={{ color: '#ef4444' }}>{content.traceability.specialists_failed.join(', ')}</span></div>
            )}
            {content.traceability.specialists_skipped?.length > 0 && (
              <div style={{ marginTop: 4 }}>Omitidos: <span style={{ color: '#f59e0b' }}>{content.traceability.specialists_skipped.join(', ')}</span></div>
            )}
            <div style={{ marginTop: 4 }}>Archivos: {content.traceability.files_analyzed} · Llamadas LLM: {content.traceability.llm_calls}</div>
          </div>
        )}
      </Section>
    </div>
  );
}

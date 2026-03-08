/**
 * Docs — Índice de documentación del proyecto.
 * PDFs, HTML y MD organizados por categoría.
 */

const DOC_SECTIONS = [
  {
    id: 'esenciales',
    title: 'Esenciales',
    subtitle: 'Leer primero',
    items: [
      { name: 'Documento compacto único', pdf: 'ARTIFICIAL_WORLD_COMPACTO_UNICO.pdf', html: 'ARTIFICIAL_WORLD_COMPACTO_UNICO.html', desc: 'Versión compacta unificada — ideal para web y CV' },
      { name: 'Documento completo para web', pdf: 'ARTIFICIAL_WORLD_COMPLETO.pdf', html: 'ARTIFICIAL_WORLD_COMPLETO.html', desc: 'Integra todo: idea, ejecución, inversores, técnica, crónica' },
      { name: 'Documento final', md: 'DOCUMENTO_FINAL.md', desc: 'Documento definitivo — una sola lectura' },
      { name: 'Documento único', md: 'DOCUMENTO_UNICO.md', desc: 'Punto de entrada detallado' },
      { name: 'Guía esencial', md: 'ESENCIAL.md', desc: '2 páginas técnicas' },
      { name: 'Golden path', md: 'GOLDEN_PATH.md', desc: 'Cómo probar en 3 minutos' },
      { name: 'Demo 2 minutos', md: 'DEMO_2_MINUTOS.md', desc: 'Guía para demo/vídeo' },
    ],
  },
  {
    id: 'relato',
    title: 'Relato y presentación',
    subtitle: 'Para inversores y público',
    items: [
      { name: 'Infografía', pdf: 'INFOGRAFIA_ARTIFICIAL_WORLD.pdf', html: 'INFOGRAFIA_ARTIFICIAL_WORLD.html', desc: '6 páginas para informáticos, jefes, inversores' },
      { name: 'Conoce Artificial World', md: 'CONOCE_ARTIFICIAL_WORLD.md', desc: 'Narrativa de adopción' },
      { name: 'Plan de acción', pdf: 'PLAN_ACCION.pdf', html: 'PLAN_ACCION.html', md: 'PLAN_ACCION.md', desc: 'Plan maestro de implementación' },
      { name: 'Evidencias', pdf: 'EVIDENCIAS_ARTIFICIAL_WORLD.pdf', html: 'EVIDENCIAS_ARTIFICIAL_WORLD.html', desc: 'PDF con evidencias del proyecto' },
      { name: 'Dossier ejecutivo', md: 'PAQUETE_RELATO/DOCUMENTO_1_DOSSIER_EJECUTIVO.md', desc: 'Para dirección y familia' },
      { name: 'Brief inversión', md: 'PAQUETE_RELATO/DOCUMENTO_2_BRIEF_INVERSION.md', desc: 'Para socios e inversores' },
      { name: 'Manifiesto', md: 'PAQUETE_RELATO/DOCUMENTO_3_MANIFIESTO.md', desc: 'Filosofía del proyecto' },
    ],
  },
  {
    id: 'tesis',
    title: 'Tesis y estrategia',
    subtitle: 'Visión y foco',
    items: [
      { name: 'Visión civilizaciones vivas', md: 'VISION_CIVILIZACIONES_VIVAS.md', desc: 'Tesis de producto' },
      { name: 'Estrategia producto', md: 'ESTRATEGIA_PRODUCTO.md', desc: 'Estrategia y foco' },
      { name: 'Modos de ejecución', md: 'MODOS_EJECUCION.md', desc: 'Python vs web' },
      { name: 'Decisión puente Python/JS', md: 'DECISION_PUENTE_PYTHON_JS.md', desc: 'Arquitectura' },
    ],
  },
  {
    id: 'tecnicos',
    title: 'Técnicos',
    subtitle: 'Desarrollo y arquitectura',
    items: [
      { name: 'Documentación completa', md: 'DOCUMENTACION_COMPLETA.md', desc: 'Documentación ampliada' },
      { name: 'CI Pipeline', md: 'CI_PIPELINE.md', desc: 'GitHub Actions' },
      { name: 'IA local', md: 'IA_LOCAL_BASE.md', desc: 'Ollama, IA local' },
      { name: 'Backend README', md: 'backend/README.md', desc: 'Estructura backend' },
      { name: 'Frontend README', md: 'frontend/README.md', desc: 'Estructura frontend' },
      { name: 'Índice API', md: 'API_INDEX.md', desc: 'Endpoints API' },
    ],
  },
  {
    id: 'roadmaps',
    title: 'Roadmaps',
    subtitle: 'Referencia (visión futura)',
    items: [
      { name: 'Roadmap base', md: 'ROADMAP_BASE.md', desc: 'Fases 0–5' },
      { name: 'Roadmap técnico', md: 'ROADMAP_TECNICO.md', desc: 'Minijuegos, DobackSoft' },
      { name: 'Roadmap V2', md: 'ROADMAP_V2.md', desc: 'Versión ampliada' },
    ],
  },
];

function DocLink({ file, label }) {
  if (!file) return null;
  const href = `/docs/${file}`;
  const ext = file.split('.').pop()?.toLowerCase();
  const icon = ext === 'pdf' ? '📄' : ext === 'html' ? '🌐' : '📝';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="docs-link">
      {icon} {label || file}
    </a>
  );
}

export function Docs({ onBack }) {
  return (
    <div className="docs-page">
      <header className="docs-header">
        <button type="button" className="docs-back" onClick={onBack} aria-label="Volver">
          ← Volver
        </button>
        <h1 className="docs-title">📚 Documentación</h1>
        <p className="docs-subtitle">PDFs, guías y referencias del proyecto Artificial World</p>
      </header>

      <main className="docs-main">
        {DOC_SECTIONS.map((section) => (
          <section key={section.id} className="docs-section">
            <h2 className="docs-section-title">{section.title}</h2>
            <p className="docs-section-subtitle">{section.subtitle}</p>
            <ul className="docs-list">
              {section.items.map((item) => (
                <li key={item.name} className="docs-item">
                  <div className="docs-item-name">{item.name}</div>
                  {item.desc && <div className="docs-item-desc">{item.desc}</div>}
                  <div className="docs-item-links">
                    {item.pdf && <DocLink file={item.pdf} label="PDF" />}
                    {item.html && <DocLink file={item.html} label="HTML" />}
                    {item.md && <DocLink file={item.md} label="Markdown" />}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="docs-footer">
        <span>Artificial World — Constrúyelo. Habítalo. Haz que crezca.</span>
      </footer>
    </div>
  );
}

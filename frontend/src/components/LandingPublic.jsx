/**
 * LandingPublic — puerta de entrada pública de Artificial World.
 * Explica el sistema, muestra el mapa del ecosistema y conecta con el hub.
 */
import { useState } from 'react';

// Credenciales de demo — acceso rápido sin onboarding
const DEMO_USER = 'demo';
const DEMO_PASS = 'artificial2024';

/** Mapa del ecosistema: superficies con clasificación honesta REAL/DEMO/PARCIAL/ROADMAP */
const ECOSYSTEM_SURFACES = [
  { id: 'simulation', name: 'Simulación principal / Constructor', status: 'REAL', desc: 'Motor 2D determinista, agentes autónomos, 13 acciones, 9 semillas, persistencia.' },
  { id: 'herorefuge', name: 'Hero Refuge', status: 'PARCIAL', desc: 'Refugios jugables dentro del simulador. Mundos ligeros, companion IA opcional.' },
  { id: 'arena', name: 'Arena de minijuegos', status: 'DEMO', desc: '3 en Raya y Damas jugables. Ajedrez en roadmap.' },
  { id: 'dobacksoft', name: 'DobackSoft', status: 'DEMO', desc: 'Vertical demo integrada. Conectada con FireSimulator. No suite enterprise completa.' },
  { id: 'firesimulator', name: 'FireSimulator', status: 'DEMO', desc: 'Superficie temática de propagación y entrenamiento 2D.' },
  { id: 'missioncontrol', name: 'Mission Control', status: 'PARCIAL', desc: 'Centro operativo para agentes, tareas y gateways. Boards, approvals, feed en tiempo real.' },
  { id: 'mysticquest', name: 'Mystic Quest', status: 'PARCIAL', desc: 'Serie de visiones. Capa narrativa ligada a semilla espiritual.' },
  { id: 'runtime3d', name: 'Runtime 3D', status: 'ROADMAP', desc: 'Encarnación visual futura. La verdad sistémica vive en 2D.' },
];

const FEATURES = [
  {
    icon: '🏛️',
    title: 'Semillas de Civilización',
    desc: 'Elige el arquetipo de tu mundo: tribu fronteriza, colonia académica, orden monástica y más. Cada semilla define valores, tensiones y el héroe probable.',
  },
  {
    icon: '🛡️',
    title: 'Refugios con Memoria',
    desc: 'Tu refugio recuerda. Recursos, moral, seguridad y una memoria local que crece con cada evento. No es un mapa vacío — es un lugar vivo.',
  },
  {
    icon: '⚔️',
    title: 'Héroes Históricos',
    desc: 'Los héroes no son stats. Tienen nombre, rol, arquetipo y lealtades. Sus decisiones quedan registradas en la crónica fundacional.',
  },
  {
    icon: '🤖',
    title: 'Agentes Autónomos',
    desc: 'IA por utilidad sin LLMs. 13 acciones: explorar, atacar, compartir, huir, recoger, descansar… Cada entidad decide sola en cada tick.',
  },
  {
    icon: '📜',
    title: 'Crónica Viva',
    desc: 'Cada simulación genera una crónica real: eventos históricos, tensiones, momentos de liderazgo. Tu civilización tiene una historia propia.',
  },
  {
    icon: '🌐',
    title: 'Motor 2D + Web',
    desc: 'Python (pygame) para el motor completo. Web fullstack (React + Node) para la demo jugable. Dos modos, una misma tesis.',
  },
];

const QUOTES = [
  {
    text: 'Empieza con un refugio. Elige una semilla. Mira nacer tu civilización.',
    author: 'Artificial World',
    role: 'Manifiesto fundacional',
  },
  {
    text: 'No es una simulación de puntos moviéndose. Es un sistema donde cada entidad tiene razones para actuar.',
    author: 'Motor de Decisiones',
    role: 'Decisión por utilidad — 13 acciones',
  },
  {
    text: 'La verdad estratégica vive en 2D. La encarnación 3D es la capa futura.',
    author: 'Tesis de Producto',
    role: 'Civilizaciones Vivas',
  },
];

const STEPS = [
  { num: '01', title: 'Elige tu semilla', desc: 'Selecciona el arquetipo de civilización que quieres fundar.' },
  { num: '02', title: 'Nombra a tu héroe', desc: 'Será el primer agente histórico. Sus acciones quedarán en la crónica.' },
  { num: '03', title: 'Funda tu refugio', desc: 'El refugio es la unidad base. Recursos, moral y memoria local desde el tick 0.' },
  { num: '04', title: 'Observa crecer', desc: 'Los agentes actúan solos. Tú miras, analizas e intervenes cuando quieras.' },
];

function DemoAccessPanel({ onEnterDirect }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      if (user.trim().toLowerCase() === DEMO_USER && pass === DEMO_PASS) {
        onEnterDirect();
      } else {
        setError('Usuario o contraseña incorrectos. Usa las credenciales de demo.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="lp-demo-panel">
      <div className="lp-demo-panel-badge">
        <span className="lp-demo-dot" />
        Acceso demo disponible
      </div>
      <h3 className="lp-demo-panel-title">Entra sin esperas</h3>
      <p className="lp-demo-panel-desc">
        Usa las credenciales de demo para explorar la simulación al instante.
      </p>
      <div className="lp-demo-credentials">
        <span className="lp-demo-cred-label">Usuario</span>
        <code className="lp-demo-cred-value">demo</code>
        <span className="lp-demo-cred-sep">·</span>
        <span className="lp-demo-cred-label">Contraseña</span>
        <code className="lp-demo-cred-value">artificial2024</code>
      </div>
      <form className="lp-demo-form" onSubmit={handleSubmit}>
        <div className="lp-demo-field">
          <label className="lp-demo-label" htmlFor="demo-user">Usuario</label>
          <input
            id="demo-user"
            className="lp-demo-input"
            type="text"
            autoComplete="username"
            placeholder="demo"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="lp-demo-field">
          <label className="lp-demo-label" htmlFor="demo-pass">Contraseña</label>
          <div className="lp-demo-pass-wrap">
            <input
              id="demo-pass"
              className="lp-demo-input"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="lp-demo-toggle-pass"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        {error && <p className="lp-demo-error">{error}</p>}
        <button
          className="lp-demo-submit"
          type="submit"
          disabled={loading || !user.trim() || !pass}
        >
          {loading ? 'Entrando…' : 'Acceder a la demo →'}
        </button>
      </form>
    </div>
  );
}

export function LandingPublic({ onStartOnboarding, onEnterDirect }) {
  const [activeQuote, setActiveQuote] = useState(0);

  return (
    <div className="lp">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <span className="lp-nav-dot" />
          <span>Artificial World</span>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={onEnterDirect}>
            Ya tengo mundo
          </button>
          <button className="lp-btn-primary" onClick={onStartOnboarding}>
            Crear civilización
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-grid" aria-hidden="true">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="lp-hero-cell" />
          ))}
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">Simulación de vida artificial · 2D · Agentes autónomos</div>
          <h1 className="lp-hero-title">
            Constrúyelo.<br />
            Habítalo.<br />
            <span className="lp-hero-accent">Haz que crezca.</span>
          </h1>
          <p className="lp-hero-desc">
            Un ecosistema operativo único: entrada pública → Hub (núcleo) → sistemas conectados.
            Civilizaciones vivas con memoria, héroes, refugios y comunidades. Cada entidad decide sola. Cada evento queda en la crónica.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-cta" onClick={onStartOnboarding}>
              <span>Crear mi civilización</span>
              <span className="lp-btn-arrow">→</span>
            </button>
            <button className="lp-btn-secondary" onClick={onEnterDirect}>
              Ver demo directa
            </button>
          </div>

          {/* Panel de acceso demo */}
          <DemoAccessPanel onEnterDirect={onEnterDirect} />

          <div className="lp-hero-stats">
            <div className="lp-stat">
              <span className="lp-stat-value">13</span>
              <span className="lp-stat-label">acciones por agente</span>
            </div>
            <div className="lp-stat-sep" />
            <div className="lp-stat">
              <span className="lp-stat-value">9</span>
              <span className="lp-stat-label">semillas de civilización</span>
            </div>
            <div className="lp-stat-sep" />
            <div className="lp-stat">
              <span className="lp-stat-value">∞</span>
              <span className="lp-stat-label">crónicas posibles</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section">
        <div className="lp-section-header">
          <span className="lp-section-tag">Flujo fundador</span>
          <h2 className="lp-section-title">De semilla a civilización en 4 pasos</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div key={s.num} className="lp-step">
              <div className="lp-step-num">{s.num}</div>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-header">
          <span className="lp-section-tag">Mecánicas</span>
          <h2 className="lp-section-title">Sistemas que dan vida al mundo</h2>
          <p className="lp-section-subtitle">
            Sin LLMs, sin magia. IA por utilidad pura. Cada comportamiento emerge de reglas claras.
          </p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quotes / social proof */}
      <section className="lp-section">
        <div className="lp-section-header">
          <span className="lp-section-tag">Tesis</span>
          <h2 className="lp-section-title">El pensamiento detrás del motor</h2>
        </div>
        <div className="lp-quotes">
          {QUOTES.map((q, i) => (
            <div
              key={i}
              className={`lp-quote-card ${activeQuote === i ? 'lp-quote-active' : ''}`}
              onClick={() => setActiveQuote(i)}
            >
              <p className="lp-quote-text">"{q.text}"</p>
              <div className="lp-quote-author">
                <span className="lp-quote-name">{q.author}</span>
                <span className="lp-quote-role">{q.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mapa del ecosistema */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-header">
          <span className="lp-section-tag">Ecosistema</span>
          <h2 className="lp-section-title">Un solo universo. Una sola navegación.</h2>
          <p className="lp-section-subtitle">El Hub es el mapa. Desde ahí todo está conectado. Sin sobreprometer.</p>
        </div>
        <div className="lp-table-wrap">
          <table className="lp-table">
            <thead>
              <tr>
                <th>Superficie</th>
                <th>Estado</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {ECOSYSTEM_SURFACES.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    <span className={`lp-badge lp-badge-${s.status.toLowerCase()}`}>{s.status}</span>
                  </td>
                  <td>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA final */}
      <section className="lp-cta-section">
        <div className="lp-cta-glow" aria-hidden="true" />
        <div className="lp-cta-content">
          <h2 className="lp-cta-title">
            Entra al Hub.<br />
            <span className="lp-hero-accent">El corazón del ecosistema.</span>
          </h2>
          <p className="lp-cta-desc">
            Una puerta. Un Hub. Un universo operativo. Desde el Hub accedes a Tu Mundo, Arena, Mission Control, Lab y más. Todo bajo una sola identidad.
          </p>
          <button className="lp-btn-cta lp-btn-cta-lg" onClick={onEnterDirect}>
            <span>Entrar al Hub</span>
            <span className="lp-btn-arrow">→</span>
          </button>
          <button className="lp-btn-secondary lp-btn-cta-lg" onClick={onStartOnboarding} style={{ marginTop: '0.75rem' }}>
            Crear civilización (onboarding)
          </button>
        </div>
      </section>

      {/* Verificación: docs, paper, repo */}
      <section className="lp-section">
        <div className="lp-section-header">
          <span className="lp-section-tag">Verificación</span>
          <h2 className="lp-section-title">Recursos verificables</h2>
        </div>
        <div className="lp-verify-links">
          <button className="lp-verify-btn" onClick={() => window.location.hash = 'docs'}>
            Docs
          </button>
          <button className="lp-verify-btn" onClick={onEnterDirect}>
            Hub (núcleo)
          </button>
          <a className="lp-verify-btn lp-verify-btn-link" href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer">
            Repositorio
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-nav-dot" />
          <span>Artificial World</span>
        </div>
        <div className="lp-footer-links">
          <button className="lp-footer-link" onClick={onEnterDirect}>Entrar al Hub</button>
        </div>
        <p className="lp-footer-copy">
          Motor Python + React · Agentes autónomos por utilidad · Sin LLMs
        </p>
      </footer>
    </div>
  );
}


import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Briefcase, Flame, Gamepad2, BookOpen, ArrowLeft, FileText, Github, Smartphone, Home, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import EcosystemNav from '@/components/EcosystemNav';

const SURFACES = [
  { id: 'landing', title: 'Landing pública', path: '/', icon: Home, badge: 'REAL', desc: 'Entrada principal y puerta de acceso a esta build.', available: true },
  { id: 'hub', title: 'Hub', path: '/hub', icon: ShieldCheck, badge: 'REAL', desc: 'Núcleo de navegación y clasificación del ecosistema.', available: true },
  { id: 'simulation', title: 'Simulación principal', path: '/', hash: 'simulator', icon: Globe, badge: 'PARCIAL', desc: 'Visualización ilustrativa en esta build. El motor verificable vive fuera de esta web.', available: true },
  { id: 'fire', title: 'FireSimulator', path: '/fire', icon: Flame, badge: 'DEMO', desc: 'Demo de propagación 2D no conectada al backend del proyecto real.', available: true },
  { id: 'arena', title: 'Arena de minijuegos', path: '/games', icon: Gamepad2, badge: 'REAL', desc: 'Contenedor accesible con 3 en Raya y Damas jugables.', available: true },
  { id: 'tictactoe', title: '3 en Raya', path: '/games/tictactoe', icon: Gamepad2, badge: 'REAL', desc: 'Minijuego jugable y accesible desde esta build.', available: true },
  { id: 'checkers', title: 'Damas', path: '/games/checkers', icon: Gamepad2, badge: 'REAL', desc: 'Minijuego jugable y accesible desde esta build.', available: true },
  { id: 'chess', title: 'Ajedrez', path: '/games', icon: Gamepad2, badge: 'ROADMAP', desc: 'Visible como intención, pero sin implementación jugable completa.', available: true },
  { id: 'mystic', title: 'Mystic Quest', path: '/hub', icon: BookOpen, badge: 'PARCIAL', desc: 'Presencia narrativa y de naming, sin ruta propia ni experiencia dedicada.', available: true },
  { id: 'mission-control', title: 'Mission Control', icon: ShieldCheck, badge: 'ROADMAP', desc: 'No tiene ruta, componente montado ni interacción visible en este export.', available: false },
  { id: 'hero-refuge', title: 'Hero Refuge', icon: ShieldCheck, badge: 'ROADMAP', desc: 'No tiene ruta ni panel propios en esta build pública.', available: false },
  { id: 'dobacksoft', title: 'DobackSoft', path: '/fire', icon: Briefcase, badge: 'DEMO', desc: 'Vertical demo conectada narrativamente con FireSimulator. No es la suite enterprise completa.', available: true },
  { id: 'paper', title: 'Paper', path: '/paper', icon: FileText, badge: 'REAL', desc: 'Ruta accesible con versión web resumida y referencias al proyecto.', available: true },
  { id: 'repo', title: 'Repositorio', path: 'https://github.com/hermoso92/Artificial_world', icon: Github, badge: 'REAL', desc: 'Enlace verificable al repositorio principal del proyecto.', available: true, external: true },
  { id: 'pwa', title: 'PWA', icon: Smartphone, badge: 'PARCIAL', desc: 'Manifest, iconos y service worker añadidos en esta build. La instalación depende de soporte del navegador y validación final en despliegue.', available: false },
];

const HubPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Artificial World | Hub del ecosistema</title>
        <meta
          name="description"
          content="Mapa honesto de superficies, rutas y estados reales de la build pública de Artificial World."
        />
      </Helmet>
      <EcosystemNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter">Hub — Núcleo del ecosistema</h1>
            <p className="text-secondary mt-1">Mapa honesto de lo que esta build web sí expone y de lo que todavía queda fuera.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SURFACES.map((s) => {
            const Icon = s.icon;
            const href = s.hash ? `/#${s.hash}` : s.path;
            const Wrapper = !s.available ? 'div' : s.external ? 'a' : s.hash ? 'a' : Link;
            const linkProps = !s.available
              ? {}
              : s.external
                ? { href, target: '_blank', rel: 'noopener noreferrer' }
                : s.hash
                  ? { href }
                  : { to: href };
            return (
              <Wrapper
                key={s.id}
                {...linkProps}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-elevated text-secondary border border-border">
                    {s.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-secondary text-sm flex-grow">{s.desc}</p>
                <span className="mt-4 text-primary font-semibold text-sm group-hover:underline">
                  {s.available ? 'Abrir →' : 'Sin acceso directo en esta build'}
                </span>
              </Wrapper>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Ver página principal
          </Button>
          <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Repositorio GitHub</Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HubPage;

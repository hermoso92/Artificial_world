
import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Briefcase, Flame, Gamepad2, BookOpen, ShieldCheck, Home } from 'lucide-react';

const EcosistemaSection = () => {
  const surfaces = [
    {
      title: "Landing pública",
      description: "Entrada principal de esta build. Resume el ecosistema y conecta con las superficies realmente accesibles.",
      icon: Home,
      highlight: true,
      path: "/",
      badge: "REAL",
      available: true
    },
    {
      title: "Hub",
      description: "Núcleo de navegación del ecosistema en esta build. Centraliza superficies, estados y accesos.",
      icon: ShieldCheck,
      highlight: false,
      path: "/hub",
      badge: "REAL",
      available: true
    },
    {
      title: "Simulación visible",
      description: "Visualización ilustrativa con 13 acciones y 7 semillas expuestas en interfaz. No sustituye al motor principal verificable del proyecto.",
      icon: Globe,
      highlight: false,
      path: "/#simulator",
      badge: "PARCIAL",
      available: true
    },
    {
      title: "DobackSoft",
      description: "Vertical demo conectada al ecosistema. En esta build se presenta como capa demostrativa, no como suite enterprise completa.",
      icon: Briefcase,
      highlight: false,
      path: "/hub",
      badge: "DEMO",
      available: true
    },
    {
      title: "FireSimulator",
      description: "Demo interactiva de propagación 2D visible en esta build. No está conectada al backend del proyecto real.",
      icon: Flame,
      highlight: false,
      path: "/fire",
      badge: "DEMO",
      available: true
    },
    {
      title: "Arena de Minijuegos",
      description: "3 en Raya y Damas jugables en esta build. Ajedrez todavía no está terminado.",
      icon: Gamepad2,
      highlight: false,
      path: "/games",
      badge: "REAL",
      available: true
    },
    {
      title: "Mystic Quest",
      description: "Superficie narrativa mencionada en el ecosistema, pero sin ruta propia ni experiencia completa accesible aquí.",
      icon: BookOpen,
      highlight: false,
      path: "/hub",
      badge: "PARCIAL",
      available: true
    },
    {
      title: "Mission Control",
      description: "No existe como superficie accesible dentro de este export. Solo puede mostrarse como referencia futura del ecosistema.",
      icon: ShieldCheck,
      highlight: false,
      path: "/hub",
      badge: "ROADMAP",
      available: false
    },
    {
      title: "Hero Refuge",
      description: "No tiene ruta ni interfaz propia en esta build pública. Debe tratarse como superficie no accesible desde aquí.",
      icon: ShieldCheck,
      highlight: false,
      path: "/hub",
      badge: "ROADMAP",
      available: false
    }
  ];

  return (
    <section className="py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-6">
            Ecosistema de Superficies
          </h2>
          <p className="text-xl text-secondary leading-relaxed">
            Esta build pública no contiene toda la aplicación. Lo que ves aquí se clasifica por estado real de acceso: usable, demo, parcial o roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surfaces.map((surface, idx) => {
            const Icon = surface.icon;
            const isHash = surface.path.startsWith('/#');
            const canOpen = surface.available;
            const Wrapper = canOpen ? (isHash ? 'a' : Link) : 'div';
            const linkProps = canOpen
              ? (isHash ? { href: surface.path } : { to: surface.path })
              : {};
            return (
              <Wrapper
                key={idx}
                {...linkProps}
                className={`bg-card rounded-xl p-8 border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                  surface.highlight ? 'border-primary/50 md:col-span-2 lg:col-span-3' : 'border-border'
                }`}
                aria-label={`Tarjeta de ecosistema: ${surface.title}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      surface.highlight ? 'bg-primary/20' : 'bg-secondary/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${surface.highlight ? 'text-primary' : 'text-secondary'}`} aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{surface.title}</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-elevated text-secondary border border-border">
                    {surface.badge}
                  </span>
                </div>
                <p className="text-secondary leading-relaxed flex-grow">
                  {surface.description}
                </p>
                <span className="mt-4 text-primary font-semibold text-sm">
                  {canOpen ? 'Abrir →' : 'No accesible en esta build'}
                </span>
              </Wrapper>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default EcosistemaSection;

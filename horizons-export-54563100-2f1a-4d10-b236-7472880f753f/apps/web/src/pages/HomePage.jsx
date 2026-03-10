
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import StickyNavbar from '@/components/StickyNavbar.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import ConceptoSection from '@/components/ConceptoSection.jsx';
import SystemStatusSection from '@/components/SystemStatusSection.jsx';
import EcosistemaSection from '@/components/EcosistemaSection.jsx';
import ArtificialWorldSimulator from '@/components/ArtificialWorldSimulator.jsx';
import DocumentationSection from '@/components/DocumentationSection.jsx';
import RepositorioSection from '@/components/RepositorioSection.jsx';
import CTASection from '@/components/CTASection.jsx';

const HomePage = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark', 'scroll-smooth');
    return () => document.documentElement.classList.remove('dark', 'scroll-smooth');
  }, []);

  return (
    <div className="w-full min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary flex flex-col">
      <Helmet>
        <title>Artificial World | Entrada pública del ecosistema</title>
        <meta
          name="description"
          content="Landing pública de Artificial World con Hub, Arena, FireSimulator demo, paper y repositorio verificable."
        />
      </Helmet>

      <StickyNavbar />
      
      <main className="w-full flex-grow flex flex-col">
        {/* Hero Section Wrapper */}
        <div id="hero" className="w-full min-h-screen flex flex-col relative">
          <HeroSection />
        </div>

        {/* Concepto Section Wrapper */}
        <div id="concepto" className="w-full flex flex-col pt-24 bg-elevated/30 border-t border-border/50">
          <ConceptoSection />
        </div>

        <div className="w-full flex flex-col pt-24 bg-background/60 border-t border-border/50">
          <SystemStatusSection />
        </div>
        
        {/* Ecosistema Section Wrapper */}
        <div id="ecosistema" className="w-full flex flex-col pt-24 bg-background/50 border-t border-border/50">
          <EcosistemaSection />
        </div>

        {/* Simulator Section Wrapper */}
        <div id="simulator" className="w-full min-h-screen flex flex-col pt-24 bg-elevated/50 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
                Simulación visible en esta web
              </h2>
              <p className="text-xl text-secondary">
                Demo parcial e ilustrativa. El motor principal del proyecto se verifica fuera de esta build.
              </p>
            </div>
            <ArtificialWorldSimulator />
          </div>
        </div>

        {/* Documentation Section Wrapper */}
        <div id="docs" className="w-full flex flex-col pt-24 bg-background/50 border-t border-border/50">
          <DocumentationSection />
        </div>

        {/* Repositorio Section Wrapper */}
        <div id="repositorio" className="w-full flex flex-col pt-24 bg-elevated/50 border-t border-border/50">
          <RepositorioSection />
        </div>
        
        {/* CTA Section Wrapper */}
        <div className="w-full flex flex-col pt-12 bg-background/50 border-t border-border/50">
          <CTASection />
        </div>
      </main>

      <footer className="w-full bg-card border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,212,255,0.8)]" aria-hidden="true"></div>
            <span className="font-extrabold text-lg tracking-tighter">Artificial World</span>
          </div>
          <p className="text-secondary text-sm font-mono font-bold">
            Public build v1.0
          </p>
          <div className="flex gap-4 text-sm text-secondary font-bold">
            <a 
              href="https://github.com/hermoso92/Artificial_world" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
              aria-label="Visitar GitHub de Artificial World"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

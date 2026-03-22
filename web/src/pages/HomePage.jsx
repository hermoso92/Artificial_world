
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import StickyNavbar from '@/components/StickyNavbar.jsx';
import HeroSection from '@/components/HeroSection.jsx';
import ConceptoSection from '@/components/ConceptoSection.jsx';
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
    <div className="w-full min-h-screen bg-slate-950 text-slate-300 selection:bg-accent-amber/30 selection:text-accent-amber flex flex-col">
      <Helmet>
        <title>Artificial World | Deterministic Agent Simulation</title>
        <meta name="description" content="A deterministic 2D simulation of autonomous agents optimizing utility functions. Open source, reproducible, and fully auditable." />
      </Helmet>

      <StickyNavbar />
      
      <main id="main-content" className="w-full flex-grow flex flex-col" tabIndex={-1}>
        {/* Hero Section Wrapper */}
        <div id="hero" className="w-full min-h-screen flex flex-col relative">
          <HeroSection />
        </div>

        {/* Concepto Section Wrapper */}
        <div id="concepto" className="w-full flex flex-col pt-24 bg-slate-950 border-t border-slate-800">
          <ConceptoSection />
        </div>
        
        {/* Ecosistema Section Wrapper */}
        <div id="ecosistema" className="w-full flex flex-col pt-24 bg-slate-950 border-t border-slate-800">
          <EcosistemaSection />
        </div>

        {/* Simulator Section Wrapper */}
        <div id="simulator" className="w-full min-h-screen flex flex-col pt-24 bg-slate-950 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-4">
                Simulador en Vivo
              </h2>
              <p className="text-xl text-slate-300">
                Visualización interactiva del motor determinista.
              </p>
            </div>
            <ArtificialWorldSimulator />
          </div>
        </div>

        {/* Documentation Section Wrapper */}
        <div id="docs" className="w-full flex flex-col pt-24 bg-slate-950 border-t border-slate-800">
          <DocumentationSection />
        </div>

        {/* Repositorio Section Wrapper */}
        <div id="repositorio" className="w-full flex flex-col pt-24 bg-slate-950 border-t border-slate-800">
          <RepositorioSection />
        </div>
        
        {/* CTA Section Wrapper */}
        <div className="w-full flex flex-col pt-12 bg-slate-950 border-t border-slate-800">
          <CTASection />
        </div>
      </main>

      <footer className="w-full bg-slate-900 border-t border-slate-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-amber shadow-[0_0_10px_rgba(251,191,36,0.8)]" aria-hidden="true"></div>
            <span className="font-extrabold text-lg tracking-tighter text-white">Artificial World</span>
          </div>
          <p className="text-slate-400 text-sm font-mono font-bold">
            Deterministic Engine v1.0
          </p>
          <div className="flex gap-4 text-sm text-slate-400 font-bold">
            <a 
              href="https://github.com/hermoso92/Artificial_world" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-accent-amber transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded-sm px-1"
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

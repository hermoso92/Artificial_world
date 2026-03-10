
import React from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden w-full bg-background">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.05)_0%,transparent_70%)]"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-6 leading-tight">
          Explora el código.<br />
          <span className="text-primary glow-cyan-text">Verifica los resultados.</span>
        </h2>
        <p className="text-xl text-secondary mb-10 max-w-2xl mx-auto">
          El repositorio principal contiene la referencia técnica del proyecto. Esta web pública resume superficies visibles y remite allí para contrastar la implementación completa.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-transparent border-border hover:bg-white/5 h-14 px-8 text-lg font-bold" 
            onClick={() => window.open('https://github.com/hermoso92/Artificial_world', '_blank')}
            aria-label="Visitar Repositorio GitHub"
          >
            <Github className="w-5 h-5 mr-2" aria-hidden="true" /> Repositorio GitHub
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

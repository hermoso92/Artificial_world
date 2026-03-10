
import React from 'react';
import { Link } from 'react-router-dom';
import { Play, FileText, Github, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FinalCTASection = () => {
  return (
    <section className="pt-24 pb-12 bg-background w-full border-t border-border relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
          Empieza a crear hoy.
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Únete a la plataforma donde tus ideas toman forma a través de simulaciones observables y colaborativas.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-14 px-8 w-full sm:w-auto">
            <Link to="/">
              <Play className="w-5 h-5 mr-2" /> Crear mi primer mundo
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-border hover:bg-secondary font-bold h-14 px-8 w-full sm:w-auto">
            <Link to="/paper">
              <FileText className="w-5 h-5 mr-2" /> Leer el paper
            </Link>
          </Button>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-wrap justify-center items-center gap-6 mb-20 text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full border border-border">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Código abierto y auditable</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full border border-border">
            <FileText className="w-4 h-4 text-primary" />
            <span>Basado en investigación</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="font-bold text-foreground">Artificial World</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <Link to="/paper" className="hover:text-primary transition-colors">
              Paper
            </Link>
            <Link to="/" className="hover:text-primary transition-colors">
              Simulador
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default FinalCTASection;

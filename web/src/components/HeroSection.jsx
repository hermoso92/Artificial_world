
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="flex-grow flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-32 pb-20 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
          Simulación Determinista de <span className="text-accent-amber">Agentes Autónomos</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Explora el comportamiento emergente en un entorno 2D auditable, reproducible y de código abierto.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/hub')}
            className="w-full sm:w-auto text-lg h-14 px-8 bg-accent-amber text-slate-950 hover:bg-accent-amber/90 font-bold"
          >
            Entrar al Hub <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/simulation')}
            className="w-full sm:w-auto text-lg h-14 px-8 border-slate-700 text-white hover:bg-slate-800 font-bold"
          >
            Crear mi primer mundo <Globe className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

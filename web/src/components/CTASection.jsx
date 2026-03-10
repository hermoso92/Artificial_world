
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center w-full bg-slate-950">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-12 shadow-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">¿Listo para explorar?</h2>
        <p className="text-lg text-slate-300 mb-10">
          Únete a la simulación y descubre el ecosistema completo de Artificial World.
        </p>
        <Button size="lg" onClick={() => navigate('/hub')} className="h-14 px-10 text-lg bg-accent-amber text-slate-950 hover:bg-accent-amber/90 font-bold">
          <Rocket className="mr-2 w-6 h-6" /> Entrar al Hub
        </Button>
      </div>
    </section>
  );
};

export default CTASection;

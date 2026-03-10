
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

const ConceptoSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center bg-slate-950">
      <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">El Concepto</h2>
      <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
        Artificial World se basa en la premisa de que reglas simples y deterministas pueden generar comportamientos sociales complejos. Sin cajas negras, sin alucinaciones. Solo matemáticas y funciones de utilidad.
      </p>
      <Button size="lg" onClick={() => navigate('/paper')} className="h-12 px-8 text-base bg-accent-blue text-slate-950 hover:bg-accent-blue/90 font-bold">
        <BookOpen className="mr-2 w-5 h-5" /> Leer el Paper Científico
      </Button>
    </section>
  );
};

export default ConceptoSection;

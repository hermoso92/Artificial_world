
import React from 'react';
import { FileText, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PaperSection = () => {
  return (
    <section className="py-24 bg-background w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl border border-border p-8 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" /> Tesis Fundacional
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
                Fundamentos Matemáticos
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                El documento de investigación detalla la arquitectura central de Artificial World. Explora las funciones de utilidad <code className="bg-secondary px-1.5 py-0.5 rounded text-primary text-sm">U(a,i,t)</code>, la autonomía de los agentes y cómo la reproducibilidad estricta permite la creación de inteligencia verificable.
              </p>
              <ul className="space-y-3 mb-8">
                {['Espacio de 13 acciones discretas', 'Análisis de 7 semillas de civilización', 'Métricas de la sesión canónica (Seed 42)'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                <Link to="/paper">
                  Leer el paper completo <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="hidden md:flex justify-center">
              <div className="w-full max-w-sm aspect-[3/4] bg-secondary rounded-xl border border-border shadow-2xl p-6 flex flex-col relative transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-32 bg-card rounded-lg border border-border mb-4 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <div className="space-y-3 flex-grow">
                  <div className="h-4 bg-card rounded w-3/4"></div>
                  <div className="h-4 bg-card rounded w-full"></div>
                  <div className="h-4 bg-card rounded w-5/6"></div>
                  <div className="h-4 bg-card rounded w-full"></div>
                  <div className="h-4 bg-card rounded w-2/3"></div>
                </div>
                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  <div className="h-3 bg-card rounded w-16"></div>
                  <div className="h-3 bg-primary/50 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaperSection;

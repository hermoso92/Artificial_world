
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Terminal, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DocumentationSection = () => {
  return (
    <section className="py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
            Documentación y verificación
          </h2>
          <p className="text-xl text-secondary">
            Qué puedes comprobar desde esta build y qué queda remitido al repositorio principal.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Column: Code & Repo */}
          <div className="space-y-8">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Paper y contexto</h3>
                  <p className="text-sm text-secondary">Versión web y referencia externa</p>
                </div>
              </div>
              <p className="text-secondary mb-6">
                Esta web incluye una página interna de resumen y contexto. El documento completo y el motor principal deben contrastarse con el repositorio del proyecto.
              </p>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                <Link to="/paper">
                  Abrir resumen web del paper <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Terminal className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Comandos de referencia</h3>
              </div>
              <p className="text-secondary mb-4">
                Estos ejemplos describen el proyecto principal, no una ejecución embebida dentro de esta web pública.
              </p>
              <div className="bg-background rounded-lg p-4 border border-border font-mono text-sm overflow-x-auto">
                <div className="text-secondary mb-2"># Ejecutar una sesión del proyecto principal</div>
                <div className="text-primary">python main.py --seed 42 --ticks 200</div>
                <div className="text-secondary mt-4 mb-2"># Ejecutar una semilla específica con visualización</div>
                <div className="text-primary">python main.py --civ Seed_3 --visualize</div>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Specs */}
          <div className="space-y-8">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Qué puedes verificar aquí</h3>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-foreground font-medium italic">
                  "Esta build deja comprobar rutas, navegación, minijuegos, demo visual, paper web y enlace al repositorio."
                </p>
              </div>
              
              <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Elementos verificables</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-background rounded border border-border">
                  <span className="text-secondary">Rutas públicas activas</span>
                  <span className="font-mono font-bold text-foreground">/ /hub /games /paper /fire</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded border border-border">
                  <span className="text-secondary">Minijuegos jugables</span>
                  <span className="font-mono font-bold text-primary">3 en Raya, Damas</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded border border-border">
                  <span className="text-secondary">Demo conectada</span>
                  <span className="font-mono font-bold text-success">FireSimulator</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded border border-border">
                  <span className="text-secondary">Fuente principal de verificación</span>
                  <span className="font-mono font-bold text-foreground">Repositorio GitHub</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DocumentationSection;

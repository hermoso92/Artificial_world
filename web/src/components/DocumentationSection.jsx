
import React from 'react';
import { FileText, Terminal, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DocumentationSection = () => {
  return (
    <section className="py-16 w-full bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-4">
            Documentación Técnica
          </h2>
          <p className="text-xl text-slate-300">
            Metodología, ejemplos de código y resultados auditables.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Column: Code & Repo */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-accent-amber/10 rounded-lg">
                  <FileText className="w-6 h-6 text-accent-amber" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Paper & Metodología</h3>
                  <p className="text-sm text-slate-400">Fundamentos matemáticos</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6">
                El documento de investigación detalla las funciones de utilidad, el espacio de acciones discreto y el análisis de las 7 semillas de civilización.
              </p>
              <Button 
                className="w-full bg-accent-amber text-slate-950 hover:bg-accent-amber/90 font-bold"
                onClick={() => window.open('https://smallpdf.com/es/file#s=4fc8b09d-e830-4a1c-8b86-959d26078322', '_blank')}
                aria-label="Leer el Paper Completo"
              >
                Leer el Paper Completo <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-accent-blue/10 rounded-lg">
                  <Terminal className="w-6 h-6 text-accent-blue" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white">Ejemplos de Ejecución</h3>
              </div>
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-sm overflow-x-auto">
                <div className="text-slate-400 mb-2"># Ejecutar sesión canónica (seed 42)</div>
                <div className="text-accent-amber">python main.py --seed 42 --ticks 200</div>
                <div className="text-slate-400 mt-4 mb-2"># Ejecutar semilla específica con visualización</div>
                <div className="text-accent-amber">python main.py --civ Seed_3 --visualize</div>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Specs */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-lg h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-accent-green/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-accent-green" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white">Resultados Auditables</h3>
              </div>
              <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-lg p-4 mb-6">
                <p className="text-white font-medium italic">
                  "Todas las simulaciones son 100% deterministas y reproducibles utilizando la semilla 42 para sesiones canónicas."
                </p>
              </div>
              
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Métricas de Sesión Canónica (Seed 42)</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-300">Agentes promedio vivos</span>
                  <span className="font-mono font-bold text-white">34.2</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-300">Acción dominante</span>
                  <span className="font-mono font-bold text-accent-amber">cooperate</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-300">Utilidad final</span>
                  <span className="font-mono font-bold text-accent-green">142.8</span>
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

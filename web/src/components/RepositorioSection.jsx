
import React from 'react';
import { Github, FileText, Code, BookOpen, ExternalLink } from 'lucide-react';

const resources = [
  {
    title: "Repositorio GitHub",
    description: "El código fuente principal, motor de simulación y lógica central del proyecto Artificial World.",
    icon: Github,
    link: "https://github.com/hermoso92/Artificial_world"
  },
  {
    title: "Paper de Investigación",
    description: "Metodología detallada, modelos matemáticos, funciones de utilidad y hallazgos.",
    icon: FileText,
    link: "https://smallpdf.com/es/file#s=4fc8b09d-e830-4a1c-8b86-959d26078322"
  },
  {
    title: "Documentación del Código",
    description: "Instrucciones de configuración paso a paso para despliegue local y ejecución de scripts.",
    icon: BookOpen,
    link: "https://github.com/hermoso92/Artificial_world#readme"
  },
  {
    title: "Ejemplos y Scripts",
    description: "Scripts de muestra, configuraciones de sesiones canónicas y plantillas de semillas.",
    icon: Code,
    link: "https://github.com/hermoso92/Artificial_world"
  }
];

const RepositorioSection = () => {
  return (
    <section className="py-16 w-full bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-white mb-4">
            Código Fuente
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
            Artificial World es código abierto y completamente auditable.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-amber/10 border border-accent-amber/20 rounded-full text-accent-amber text-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-accent-amber"></span>
            Transparencia Total
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <a 
                key={index}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
                aria-label={`Enlace a ${resource.title}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-accent-amber/20 transition-colors">
                    <Icon className="w-6 h-6 text-accent-amber" aria-hidden="true" />
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-amber transition-colors">
                  {resource.title}
                </h3>
                <p className="text-slate-300 text-sm flex-grow">
                  {resource.description}
                </p>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default RepositorioSection;

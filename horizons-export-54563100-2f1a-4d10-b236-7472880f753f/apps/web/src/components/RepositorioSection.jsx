
import React from 'react';
import { Github, FileText, Code, BookOpen, ExternalLink } from 'lucide-react';

const resources = [
  {
    title: "Repositorio GitHub",
    description: "C?digo fuente principal y referencia t?cnica del proyecto Artificial World.",
    icon: Github,
    link: "https://github.com/hermoso92/Artificial_world"
  },
  {
    title: "Paper web",
    description: "Resumen accesible dentro de esta build p?blica, con contexto y alcance honesto.",
    icon: FileText,
    link: "/paper"
  },
  {
    title: "README del proyecto",
    description: "Punto de entrada para instalaci?n, contexto t?cnico y estructura general del repositorio.",
    icon: BookOpen,
    link: "https://github.com/hermoso92/Artificial_world#readme"
  },
  {
    title: "C?digo y ejemplos",
    description: "C?digo fuente y referencias para ampliar lo que esta web p?blica solo muestra de forma parcial.",
    icon: Code,
    link: "https://github.com/hermoso92/Artificial_world"
  }
];

const RepositorioSection = () => {
  return (
    <section className="py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
            Repositorio y fuentes de verificaci?n
          </h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto mb-6">
            Esta web p?blica remite al repositorio principal para contrastar la implementaci?n completa del proyecto.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
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
                className="group flex flex-col bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Enlace a ${resource.title}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <ExternalLink className="w-5 h-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="text-secondary text-sm flex-grow">
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


import React from 'react';
import { FileText, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScientificPaperSection = () => {
  return (
    <section className="w-full bg-slate-900 rounded-2xl border border-slate-700 p-8 md:p-12 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-accent-amber text-sm font-bold mb-4">
            <FileText className="w-4 h-4" /> Documento Fundacional
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Emergencia Determinista en Sistemas Multi-Agente
          </h1>
          <p className="text-accent-amber font-medium text-lg">
            Por: Hermoso92 | Artificial World Research
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <Button className="bg-accent-amber text-slate-950 hover:bg-accent-amber/90 font-bold">
            <Download className="w-4 h-4 mr-2" /> Descargar PDF
          </Button>
          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
            <Share2 className="w-4 h-4 mr-2" /> Compartir
          </Button>
        </div>
      </div>
      
      <div className="bg-slate-950 p-6 md:p-8 rounded-xl border-l-4 border-accent-amber">
        <h3 className="text-xl font-bold text-white mb-3">Abstract</h3>
        <p className="text-slate-300 leading-relaxed">
          Este documento presenta un marco teórico y práctico para la simulación de agentes autónomos utilizando un motor estrictamente determinista. A través de la implementación de funciones de utilidad discretas y un espacio de acciones limitado, demostramos cómo comportamientos sociales complejos (como la formación de manadas y la cooperación) emergen de manera natural sin necesidad de rutinas preprogramadas o modelos de lenguaje estocásticos.
        </p>
      </div>
    </section>
  );
};

export default ScientificPaperSection;

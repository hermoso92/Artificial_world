
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScientificPaperSection = () => {
  return (
    <section className="py-24 bg-background relative" id="paper">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-foreground mb-4">
            Emergencia de Comportamientos Cooperativos en Entornos Deterministas Basados en Utilidad
          </h2>
          <p className="text-primary font-mono text-sm">
            Autores: Cosigein SL · 2026-03-08 · v1.0
          </p>
        </div>

        <div className="glass rounded-2xl p-8 md:p-12 border-primary/20 relative overflow-hidden mb-12">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary glow-cyan"></div>
          <h3 className="text-xl font-bold text-foreground mb-4">Abstract</h3>
          <p className="text-secondary leading-relaxed">
            Este documento resume la tesis metodológica de Artificial World: explicitar reglas, función de utilidad, trazabilidad y separación entre lo implementado, lo visible como demo y lo que sigue siendo hipótesis o roadmap. Su valor principal aquí es fundacional y arquitectónico, no el cierre de una validación experimental extensa.
          </p>
          <p className="text-xs text-secondary mt-4">
            Esta página es un resumen web. La validación completa del proyecto y de su motor principal debe contrastarse en el repositorio.
          </p>
        </div>

        <div className="bg-elevated rounded-2xl border border-border overflow-hidden mb-12">
          <div className="p-6 border-b border-border bg-card/50 flex items-center gap-3">
            <Terminal className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Referencias del proyecto</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="text-sm">
                <tr className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="p-4 text-foreground font-medium w-1/3">Tipo de pieza</td>
                  <td className="p-4 text-success font-bold font-mono">Preprint técnico / resumen web</td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="p-4 text-foreground font-medium">Valor principal</td>
                  <td className="p-4 text-primary font-bold font-mono">Trazabilidad radical</td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="p-4 text-foreground font-medium">Estado de evidencia</td>
                  <td className="p-4 text-foreground font-mono">Baseline inicial, no validación cerrada</td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="p-4 text-foreground font-medium">Fuente de contraste</td>
                  <td className="p-4 text-warning font-bold font-mono">Repositorio principal</td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="p-4 text-foreground font-medium">Límite de esta página</td>
                  <td className="p-4 text-warning font-bold font-mono">Contexto, no prueba experimental final</td>
                </tr>
                <tr className="hover:bg-card/50 transition-colors bg-primary/5">
                  <td className="p-4 text-primary font-medium">Siguiente contraste</td>
                  <td className="p-4 text-primary font-mono text-xs">Código, logs y salidas del proyecto principal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan h-12 px-8">
            <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer">
              <FileText className="w-4 h-4 mr-2" /> Abrir repositorio
            </a>
          </Button>
          <Button asChild variant="outline" className="bg-transparent border-border h-12 px-8">
            <Link to="/">
              <Download className="w-4 h-4 mr-2" /> Volver a la entrada pública
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
};

export default ScientificPaperSection;


import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import StickyNavbar from '@/components/StickyNavbar.jsx';
import ScientificPaperSection from '@/components/ScientificPaperSection.jsx';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PaperPage = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-24">
      <Helmet>
        <title>Artificial World | Paper web y contexto</title>
        <meta
          name="description"
          content="Resumen web del paper de Artificial World y contexto técnico del proyecto principal."
        />
      </Helmet>
      <StickyNavbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="text-secondary hover:text-primary hover:bg-primary/10 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
            </Button>
          </Link>
        </div>

        <ScientificPaperSection />
        
        <article className="mt-16 space-y-16 text-secondary leading-relaxed text-lg font-serif bg-elevated p-8 md:p-12 rounded-2xl border border-border shadow-2xl">
          <section>
            <h3 className="text-3xl font-bold text-foreground mb-6 font-sans">1. Introducción</h3>
            <p className="mb-6">
              La emergencia de comportamientos complejos a partir de reglas simples es el eje conceptual de Artificial World. Esta página resume la idea general del proyecto y enlaza con sus fuentes principales, pero no pretende sustituir la validación técnica que corresponde al repositorio y al motor principal.
            </p>
            <p>
              El objetivo es explorar agentes autónomos, reglas visibles y superficies auditables, manteniendo una separación clara entre lo que la web pública enseña y lo que el proyecto completo implementa fuera de esta build.
            </p>
          </section>
          
          <section>
            <h3 className="text-3xl font-bold text-foreground mb-6 font-sans">2. Metodología</h3>
            <p className="mb-6">
              A nivel conceptual, Artificial World trabaja con agentes que eligen entre un conjunto discreto de acciones y evalúan su estado mediante funciones de utilidad como <code className="text-primary bg-primary/10 px-2 py-1 rounded font-mono text-sm">U(a,i,t)</code>. En esta build pública solo se muestra una capa visual parcial y varias superficies de entrada al ecosistema.
            </p>
            <div className="bg-background p-6 rounded-xl border border-border my-8 font-mono text-sm">
              <div className="text-primary mb-2">// Función de Utilidad Core</div>
              <div className="text-foreground">U(a, i, t) = w_h * H(i, t) + w_e * E(i, t) + w_s * S(a, i)</div>
              <div className="text-secondary mt-4">Donde:</div>
              <ul className="list-disc list-inside ml-4 text-secondary mt-2 space-y-1">
                <li>H: Nivel de hambre</li>
                <li>E: Nivel de energía</li>
                <li>S: Valor de supervivencia de la acción 'a'</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-3xl font-bold text-foreground mb-6 font-sans">3. Conclusión</h3>
            <p>
              La función de esta página es servir como resumen y contexto. La comprobación rigurosa del comportamiento del motor, sus resultados y sus integraciones debe apoyarse en el repositorio principal y en las superficies realmente accesibles desde el proyecto completo.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PaperPage;

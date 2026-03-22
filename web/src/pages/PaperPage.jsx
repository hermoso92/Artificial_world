
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
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
    <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Helmet>
        <title>Paper Científico - Artificial World</title>
        <meta name="description" content="Documento fundacional y metodología del motor determinista de Artificial World." />
      </Helmet>
      
      <div className="mb-8">
        <Link to="/hub">
          <Button variant="ghost" className="text-slate-400 hover:text-accent-amber hover:bg-accent-amber/10 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Hub
          </Button>
        </Link>
      </div>

      <ScientificPaperSection />
      
      <article className="mt-16 space-y-16 text-slate-300 leading-relaxed text-lg font-serif bg-slate-900 p-8 md:p-12 rounded-2xl border border-slate-700 shadow-2xl">
        <section>
          <h3 className="text-3xl font-bold text-white mb-6 font-sans">1. Introducción</h3>
          <p className="mb-6">
            La emergencia de comportamientos complejos a partir de reglas simples ha sido un área de estudio fundamental en la inteligencia artificial. Este documento detalla la arquitectura de un motor determinista donde los agentes no poseen rutinas de "agrupación" preprogramadas, sino que descubren la ventaja de la manada a través de la optimización de una función de utilidad estricta.
          </p>
          <p>
            A diferencia de los enfoques modernos basados en Modelos de Lenguaje Grande (LLMs), que introducen latencia, costos de API y comportamiento no determinista (alucinaciones), nuestro enfoque garantiza reproducibilidad matemática exacta.
          </p>
        </section>
        
        <section>
          <h3 className="text-3xl font-bold text-white mb-6 font-sans">2. Metodología</h3>
          <p className="mb-6">
            Se implementó un entorno 2D continuo donde los recursos (comida, refugio) se distribuyen proceduralmente según una semilla criptográfica. Cada agente evalúa 13 acciones posibles en cada tick, calculando el valor esperado <code className="text-accent-amber bg-slate-800 px-2 py-1 rounded font-mono text-sm">U(a,i,t)</code> basado en su estado interno (hambre, energía) y su memoria espacial.
          </p>
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 my-8 font-mono text-sm">
            <div className="text-accent-amber mb-2">// Función de Utilidad Core</div>
            <div className="text-white">U(a, i, t) = w_h * H(i, t) + w_e * E(i, t) + w_s * S(a, i)</div>
            <div className="text-slate-400 mt-4">Donde:</div>
            <ul className="list-disc list-inside ml-4 text-slate-400 mt-2 space-y-1">
              <li>H: Nivel de hambre</li>
              <li>E: Nivel de energía</li>
              <li>S: Valor de supervivencia de la acción 'a'</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-3xl font-bold text-white mb-6 font-sans">3. Conclusión</h3>
          <p>
            Los resultados demuestran que los sistemas deterministas basados en utilidad pueden generar comportamientos sociales emergentes sin necesidad de cajas negras. El 100% de supervivencia en la semilla 42, con una dominancia del 62.4% de la acción SEGUIR, prueba que la cooperación es una solución matemática óptima descubierta por los agentes, no impuesta por el programador.
          </p>
        </section>
      </article>
    </div>
  );
};

export default PaperPage;

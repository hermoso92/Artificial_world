
import React from 'react';
import { motion } from 'framer-motion';
import { Box, Eye, MessageSquare, GitMerge, Lock, CheckCircle2 } from 'lucide-react';

const WhyDifferentSection = () => {
  const comparisons = [
    {
      traditional: {
        title: "Caja Negra",
        icon: Box,
        desc: "Le pides algo a la IA y te da un resultado mágico, sin saber cómo llegó ahí."
      },
      artificial: {
        title: "Mundos Observables",
        icon: Eye,
        desc: "Ves cada paso, cada decisión y cómo los agentes construyen tu idea."
      }
    },
    {
      traditional: {
        title: "Respuesta Única",
        icon: MessageSquare,
        desc: "Un texto estático que muere en el momento que cierras la pestaña."
      },
      artificial: {
        title: "Comportamiento Evolutivo",
        icon: GitMerge,
        desc: "Un entorno vivo que sigue funcionando, interactuando y creciendo."
      }
    },
    {
      traditional: {
        title: "Confía a ciegas",
        icon: Lock,
        desc: "No puedes verificar si la lógica detrás de la respuesta es correcta."
      },
      artificial: {
        title: "Verifícalo tú mismo",
        icon: CheckCircle2,
        desc: "Todo es transparente, reproducible y de código abierto."
      }
    }
  ];

  return (
    <section className="py-24 bg-secondary/30 border-y border-border w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            ¿Por qué es distinto?
          </h2>
          <p className="text-xl text-muted-foreground">
            Pasamos de consumir respuestas a construir sistemas que puedes entender.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {comparisons.map((comp, idx) => {
            const TradIcon = comp.traditional.icon;
            const ArtIcon = comp.artificial.icon;
            
            return (
              <motion.div 
                key={idx} 
                className="flex flex-col gap-4 group"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
              >
                {/* Traditional Block */}
                <div className="bg-card p-6 rounded-2xl border border-border opacity-70 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <TradIcon className="w-6 h-6 text-muted-foreground" />
                    <h4 className="font-bold text-lg text-muted-foreground">{comp.traditional.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{comp.traditional.desc}</p>
                </div>
                
                {/* VS Divider */}
                <div className="flex justify-center -my-3 relative z-10">
                  <span className="bg-background px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground border border-border shadow-sm">VS</span>
                </div>

                {/* Artificial World Block */}
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(212,165,116,0.05)] group-hover:shadow-[0_0_25px_rgba(212,165,116,0.15)] group-hover:border-primary/40 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <ArtIcon className="w-6 h-6 text-primary" />
                    <h4 className="font-bold text-lg text-primary">{comp.artificial.title}</h4>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{comp.artificial.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferentSection;

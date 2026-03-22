
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Hammer, Play, TrendingUp } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    { icon: MessageSquare, title: "1. Describes tu idea", desc: "Cuentas en lenguaje natural qué tipo de mundo o simulación quieres crear." },
    { icon: Users, title: "2. Los agentes se organizan", desc: "Un equipo de IA analiza tu idea y propone una estructura lógica." },
    { icon: Hammer, title: "3. Construcción conjunta", desc: "Apruebas o modificas las reglas, y los agentes generan el entorno." },
    { icon: Play, title: "4. El mundo cobra vida", desc: "Ejecutas la simulación y observas cómo interactúan los elementos." },
    { icon: TrendingUp, title: "5. Evolución", desc: "Ajustas parámetros, cambias reglas y ves cómo el mundo se adapta." }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Cómo funciona
          </h2>
          <p className="text-xl text-muted-foreground">
            De la idea a la simulación en 5 pasos sencillos.
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-border hidden md:block"></div>
          {/* Mobile Vertical Line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border md:hidden"></div>

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={idx} 
                  className="relative flex items-start md:items-center gap-4 md:gap-6 group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  {/* Icon Node */}
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-card border border-border group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors shrink-0 shadow-lg">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  {/* Content */}
                  <div className="bg-card p-5 md:p-6 rounded-2xl border border-border flex-grow group-hover:border-primary/30 transition-colors shadow-sm">
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

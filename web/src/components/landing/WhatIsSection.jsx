
import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Users, Eye } from 'lucide-react';

const WhatIsSection = () => {
  const concepts = [
    {
      icon: Lightbulb,
      title: "Tú aportas la visión",
      description: "Artificial Worlds es una plataforma donde creas mundos digitales únicos. Tú aportas la idea o visión. Los agentes de IA colaboran contigo para pensar, estructurar y construir."
    },
    {
      icon: Users,
      title: "Un equipo a tu disposición",
      description: "No necesitas saber programar. Simplemente describes lo que quieres, y los agentes te ayudan a hacerlo realidad. Es como tener un equipo de expertos disponible siempre."
    },
    {
      icon: Eye,
      title: "Resultados reales y tuyos",
      description: "El resultado es un mundo completamente tuyo: observable, reproducible, y que puedes compartir, auditar o evolucionar a tu propio ritmo."
    }
  ];

  return (
    <section id="what-is" className="py-24 bg-background w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            ¿Qué es Artificial Worlds?
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Una nueva forma de crear simulaciones y entornos digitales, donde la IA trabaja contigo como un colaborador activo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {concepts.map((concept, idx) => {
            const Icon = concept.icon;
            return (
              <motion.div 
                key={idx} 
                className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors duration-300 group flex flex-col items-center text-center md:items-start md:text-left"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{concept.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {concept.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatIsSection;

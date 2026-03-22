
import React from 'react';
import { motion } from 'framer-motion';

const MethodSection = () => {
  const metrics = [
    { label: 'Lenguaje Core', value: 'Python 3.x' },
    { label: 'Arquitectura', value: 'Multi-Agente' },
    { label: 'Toma de Decisión', value: 'Utilidad Matemática' },
    { label: 'Dependencias Externas', value: 'Cero (0)' },
  ];

  return (
    <section className="py-32 bg-background relative" id="method">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-6">
            Especificaciones Técnicas
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Un enfoque riguroso hacia la simulación de sistemas complejos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {metrics.map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl text-center border border-border hover:border-primary/30 transition-colors"
            >
              <div className="text-2xl md:text-3xl font-black text-primary mb-2 tracking-tighter">
                {metric.value}
              </div>
              <div className="text-sm font-bold text-secondary uppercase tracking-wider">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodSection;

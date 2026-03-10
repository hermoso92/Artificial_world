
import React from 'react';
import { motion } from 'framer-motion';
import { Car, Activity, BrainCircuit, Flame, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DobackSoftSection = () => {
  const modules = [
    { 
      icon: <Car className="w-6 h-6" />, 
      title: 'Estabilidad', 
      desc: 'Algoritmos de control de tracción y corrección de trayectoria en tiempo real.' 
    },
    { 
      icon: <Activity className="w-6 h-6" />, 
      title: 'Telemetría', 
      desc: 'Análisis de datos de sensores CAN/GPS a 100Hz para diagnóstico predictivo.' 
    },
    { 
      icon: <BrainCircuit className="w-6 h-6" />, 
      title: 'IA Copiloto', 
      desc: 'Asistencia basada en utilidad para optimización de rutas y consumo.' 
    },
    { 
      icon: <Flame className="w-6 h-6" />, 
      title: 'FireSimulator', 
      desc: 'Entorno de pruebas de estrés térmico para componentes críticos.' 
    },
  ];

  return (
    <section className="py-24 bg-background relative" id="dobacksoft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
            DobackSoft StabilSafe V3
          </h2>
          <p className="text-xl text-primary font-medium mb-4">
            Plataforma B2B de telemetría vehicular CAN/GPS
          </p>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Multi-tenant. Producto comercial real. Procesamiento determinista de sensores críticos para flotas industriales.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {modules.map((mod, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] hover:border-primary/50 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              <div className="w-14 h-14 rounded-xl bg-elevated border border-border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform relative z-10">
                {mod.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">{mod.title}</h3>
              <p className="text-secondary text-sm leading-relaxed relative z-10">{mod.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan h-12 px-8">
            Ver DobackSoft <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="bg-card hover:bg-card/80 border-border h-12 px-8">
            <Play className="w-4 h-4 mr-2" /> Ver demo integrada
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DobackSoftSection;


import React from 'react';
import { motion } from 'framer-motion';
import { Car, Sword, ArrowRight } from 'lucide-react';

const VehicleSelection = ({ onSelect }) => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-red/10 rounded-full blur-3xl -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4">
          DobackSoft <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-orange-500">3D</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Select your avatar to explore the deterministic 3D environment.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Car Option */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onSelect('car')}
          className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 cursor-pointer overflow-hidden hover:border-accent-blue transition-all duration-500 hover:shadow-[0_0_40px_rgba(96,165,250,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:border-accent-blue/50">
            <Car className="w-10 h-10 text-accent-blue" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3">Sports Car</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            High-speed exploration vehicle. Features realistic physics, drifting capabilities, and a dynamic follow camera. Perfect for covering large distances quickly.
          </p>
          
          <div className="flex items-center text-accent-blue font-bold group-hover:translate-x-2 transition-transform duration-300">
            Launch Experience <ArrowRight className="ml-2 w-5 h-5" />
          </div>
        </motion.div>

        {/* Tryndamere Option */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('tryndamere')}
          className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 cursor-pointer overflow-hidden hover:border-accent-red transition-all duration-500 hover:shadow-[0_0_40px_rgba(248,113,113,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:border-accent-red/50">
            <Sword className="w-10 h-10 text-accent-red" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3">Tryndamere</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Legendary barbarian avatar. Features third-person character controls, jumping mechanics, and precise movement for detailed environment inspection.
          </p>
          
          <div className="flex items-center text-accent-red font-bold group-hover:translate-x-2 transition-transform duration-300">
            Launch Experience <ArrowRight className="ml-2 w-5 h-5" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VehicleSelection;

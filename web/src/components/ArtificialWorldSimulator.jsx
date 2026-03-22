
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity, Settings, Target, Shield, Zap, X, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const ACTIONS = [
  'move_up', 'move_down', 'move_left', 'move_right', 'stay',
  'increase_energy', 'decrease_energy', 'reproduce', 'die',
  'attack', 'defend', 'cooperate', 'defect'
];

const SEED_COLORS = {
  'Seed_0': '#f87171', // accent-red
  'Seed_1': '#60a5fa', // accent-blue
  'Seed_2': '#34d399', // accent-green
  'Seed_3': '#fbbf24', // accent-amber
  'Seed_4': '#a78bfa', // accent-purple
  'Seed_5': '#f97316', // orange
  'Seed_6': '#ffffff'  // white
};

const MODES = [
  { id: 'mission', name: 'Mission Mode', icon: Target },
  { id: 'full_control', name: 'Full Control', icon: Settings },
  { id: 'dobacksof', name: 'Dobacksof Mode', icon: Shield }
];

const ArtificialWorldSimulator = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [seed, setSeed] = useState("Seed_0");
  const [mode, setMode] = useState("mission");
  const [logs, setLogs] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [stats, setStats] = useState({
    ticks: 0,
    alive: 0,
    dominantAction: 'stay',
    avgEnergy: 0,
    generation: 1,
    avgUtility: 0
  });
  
  const animationRef = useRef(null);
  const agentsRef = useRef([]);
  const ticksRef = useRef(0);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('aw_disclaimer_dismissed');
    if (dismissed === 'true') {
      setShowDisclaimer(false);
    }
  }, []);

  const dismissDisclaimer = () => {
    setShowDisclaimer(false);
    sessionStorage.setItem('aw_disclaimer_dismissed', 'true');
  };

  const initAgents = (selectedSeed, selectedMode) => {
    const count = selectedMode === 'dobacksof' ? 100 : 50;
    const newAgents = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 800,
      y: Math.random() * 450,
      energy: 100 + (Math.random() * 50 - 25),
      action: 'stay',
      seed: selectedSeed,
      color: SEED_COLORS[selectedSeed] || '#60a5fa',
      utility: 0,
      generation: 1
    }));
    agentsRef.current = newAgents;
    ticksRef.current = 0;
    setStats(s => ({ ...s, ticks: 0, alive: count, generation: 1 }));
    setLogs([`[System] Initialized ${selectedMode} mode with ${selectedSeed}`]);
  };

  useEffect(() => {
    initAgents(seed, mode);
  }, [seed, mode]);

  const updateSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)'; // slate-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let i=0; i<canvas.height; i+=40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    let totalEnergy = 0;
    let totalUtility = 0;
    const actionCounts = {};
    let aliveCount = 0;
    let maxGen = 1;

    const sumOtherStates = agentsRef.current.reduce((acc, agent) => acc + (agent.energy / 100), 0);

    agentsRef.current.forEach(agent => {
      if (agent.energy <= 0) return;
      aliveCount++;
      maxGen = Math.max(maxGen, agent.generation);

      if (Math.random() < 0.15 * speed) {
        const ai = agent.energy / 100;
        const sumJ = sumOtherStates - ai;
        agent.utility = Math.pow(ai - 0.5, 2) + 0.5 * sumJ;

        let actionPool = ACTIONS;
        if (mode === 'mission') actionPool = ACTIONS.filter(a => a !== 'die' && a !== 'defect');
        if (seed === 'Seed_0') actionPool = ['attack', 'move_up', 'move_down', 'move_left', 'move_right'];
        if (seed === 'Seed_2') actionPool = ['cooperate', 'stay', 'increase_energy'];
        
        agent.action = actionPool[Math.floor(Math.random() * actionPool.length)];
      }

      const moveSpeed = 2.5 * speed;
      switch(agent.action) {
        case 'move_up': agent.y -= moveSpeed; agent.energy -= 0.1; break;
        case 'move_down': agent.y += moveSpeed; agent.energy -= 0.1; break;
        case 'move_left': agent.x -= moveSpeed; agent.energy -= 0.1; break;
        case 'move_right': agent.x += moveSpeed; agent.energy -= 0.1; break;
        case 'increase_energy': agent.energy += 0.8; break;
        case 'decrease_energy': agent.energy -= 0.5; break;
        case 'cooperate': agent.energy -= 0.3; break;
        case 'defect': agent.energy += 0.4; break;
        case 'attack': agent.energy -= 0.6; break;
        case 'defend': agent.energy -= 0.2; break;
        case 'reproduce': 
          if (agent.energy > 150 && agentsRef.current.length < 200) {
            agent.energy -= 50;
            agentsRef.current.push({
              id: Math.random(),
              x: agent.x + (Math.random() * 20 - 10),
              y: agent.y + (Math.random() * 20 - 10),
              energy: 50,
              action: 'stay',
              seed: agent.seed,
              color: agent.color,
              utility: 0,
              generation: agent.generation + 1
            });
          }
          break;
        case 'die': agent.energy = 0; break;
        default: break;
      }

      if (agent.x < 0) agent.x = canvas.width;
      if (agent.x > canvas.width) agent.x = 0;
      if (agent.y < 0) agent.y = canvas.height;
      if (agent.y > canvas.height) agent.y = 0;

      totalEnergy += agent.energy;
      totalUtility += agent.utility;
      actionCounts[agent.action] = (actionCounts[agent.action] || 0) + 1;

      ctx.fillStyle = agent.color;
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, mode === 'dobacksof' ? 3 : 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 12;
      ctx.shadowColor = agent.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      if ((agent.action === 'cooperate' || agent.action === 'attack') && Math.random() < 0.1) {
        const target = agentsRef.current[Math.floor(Math.random() * agentsRef.current.length)];
        if (target && target.energy > 0 && target !== agent) {
          ctx.beginPath();
          ctx.moveTo(agent.x, agent.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = agent.action === 'attack' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    let domAction = 'stay';
    let maxCount = 0;
    for (const [act, count] of Object.entries(actionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        domAction = act;
      }
    }

    ticksRef.current += speed;

    if (ticksRef.current >= 200) {
      setIsRunning(false);
      setLogs(prev => [`[System] Canonical session completed (200 ticks)`, ...prev]);
    }

    if (Math.random() < 0.1 * speed || ticksRef.current >= 200) {
      setStats({
        ticks: Math.floor(ticksRef.current),
        alive: aliveCount,
        dominantAction: domAction,
        avgEnergy: aliveCount > 0 ? (totalEnergy / aliveCount).toFixed(1) : 0,
        generation: maxGen,
        avgUtility: aliveCount > 0 ? (totalUtility / aliveCount).toFixed(2) : 0
      });
    }

    if (Math.random() < 0.03 * speed && aliveCount > 0 && ticksRef.current < 200) {
      const randomAgent = agentsRef.current[Math.floor(Math.random() * agentsRef.current.length)];
      if (randomAgent && randomAgent.energy > 0) {
        setLogs(prev => {
          const newLogs = [`[T:${Math.floor(ticksRef.current)}] A_${Math.floor(randomAgent.id*1000)}: ${randomAgent.action} (U=${randomAgent.utility.toFixed(2)})`, ...prev];
          return newLogs.slice(0, 6);
        });
      }
    }

    if (isRunning && ticksRef.current < 200) {
      animationRef.current = requestAnimationFrame(updateSimulation);
    }
  };

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(updateSimulation);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, speed, seed, mode]);

  const handleReset = () => {
    setIsRunning(false);
    initAgents(seed, mode);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {showDisclaimer && (
        <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-xl p-4 flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">⚠️</span>
            <div className="text-accent-amber text-sm md:text-base">
              <strong>Visualización ilustrativa:</strong> Esta es una demostración web. El motor determinista real está en el{' '}
              <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white">
                repositorio Python
              </a>. Seed 42 es la sesión canónica.
            </div>
          </div>
          <button 
            onClick={dismissDisclaimer}
            className="text-accent-amber hover:bg-accent-amber/20 p-1 rounded-md transition-colors"
            aria-label="Cerrar aviso"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Activity className="text-accent-amber w-6 h-6" aria-hidden="true" /> Motor Determinista
            </h3>
            <p className="text-sm text-slate-400 font-mono mt-1">
              Same seed = same result
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Mode Selection */}
            <Select value={mode} onValueChange={(v) => { setMode(v); handleReset(); }}>
              <SelectTrigger className="w-[160px] bg-slate-950 border-slate-700 text-white font-bold" aria-label="Seleccionar modo de simulación">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {MODES.map(m => {
                  const Icon = m.icon;
                  return (
                    <SelectItem key={m.id} value={m.id} className="font-bold focus:bg-slate-800 focus:text-white">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-accent-amber" aria-hidden="true" />
                        {m.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Seed Selection */}
            <div title="Seed 42 = sesión canónica. Mismo seed = mismo resultado (en el motor real)">
              <Select value={seed} onValueChange={(v) => { setSeed(v); handleReset(); }}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-700 text-white font-bold" aria-label="Cambiar semilla de simulación">
                  <SelectValue placeholder="Select Seed" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {Object.keys(SEED_COLORS).map(s => (
                    <SelectItem key={s} value={s} className="font-bold focus:bg-slate-800 focus:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: SEED_COLORS[s] }} aria-hidden="true"></div>
                        {s}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Speed Control */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-md border border-slate-700 flex-grow lg:flex-grow-0">
              <Zap className="w-4 h-4 text-accent-amber" aria-hidden="true" />
              <Slider 
                value={[speed]} 
                onValueChange={(v) => setSpeed(v[0])} 
                min={0.5} max={3} step={0.5} 
                className="w-20 md:w-24"
                aria-label="Cambiar velocidad de simulación"
              />
              <span className="text-xs font-mono font-bold text-accent-amber w-8">{speed}x</span>
            </div>

            {/* Play/Reset */}
            <div className="flex gap-2 ml-auto lg:ml-0">
              <Button 
                size="icon" 
                variant={isRunning ? "destructive" : "default"}
                onClick={() => setIsRunning(!isRunning)} 
                className={`shadow-lg transition-all ${!isRunning ? "bg-accent-amber text-slate-950 hover:bg-accent-amber/90" : "bg-accent-red text-white hover:bg-accent-red/90"}`}
                aria-label={isRunning ? "Pausar simulación" : "Ejecutar simulación"}
                title="Hasta 200 ticks"
                disabled={stats.ticks >= 200}
              >
                {isRunning ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5 ml-1" aria-hidden="true" />}
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleReset} 
                className="border-slate-700 text-white hover:bg-slate-800 transition-colors"
                aria-label="Reiniciar simulación"
              >
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-4 gap-0 flex-grow min-h-[500px]">
          {/* Canvas Area */}
          <div className="lg:col-span-3 relative bg-slate-950 border-r border-slate-700 overflow-hidden flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={450} 
              className="w-full h-full object-cover"
              aria-label="Visualización 2D de agentes autónomos"
            />
            
            {/* Overlay HUD */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-sm font-mono shadow-xl">
              <div className="text-accent-amber font-bold mb-3 text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse" aria-hidden="true" /> 
                TICK: {stats.ticks} / 200
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-8">
                  <span className="text-slate-400 font-bold">Agents Alive:</span> 
                  <span className="text-white font-bold">{stats.alive}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-slate-400 font-bold">Avg Energy:</span> 
                  <span className="text-accent-green font-bold">{stats.avgEnergy}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-slate-400 font-bold">Avg Utility:</span> 
                  <span className="text-accent-amber font-bold">{stats.avgUtility}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats & Logs */}
          <div className="lg:col-span-1 flex flex-col bg-slate-900">
            <div className="p-5 border-b border-slate-700">
              <h4 className="text-xs font-extrabold text-slate-400 mb-4 uppercase tracking-widest">Simulation Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 font-bold mb-1.5">Dominant Action</div>
                  <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-700 font-mono text-sm text-accent-amber font-bold shadow-inner">
                    {stats.dominantAction}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-400 font-bold mb-1.5">Generation</div>
                    <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-700 font-mono text-sm text-white font-bold shadow-inner">
                      Gen {stats.generation}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold mb-1.5">Active Seed</div>
                    <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-700 font-mono text-sm font-bold flex items-center gap-2 shadow-inner truncate text-white">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SEED_COLORS[seed] }} aria-hidden="true"></div>
                      {seed.replace('Seed_', 'S')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-hidden flex flex-col bg-slate-900">
              <h4 className="text-xs font-extrabold text-slate-400 mb-3 uppercase tracking-widest flex items-center justify-between">
                Action Log
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" aria-hidden="true"></span>
              </h4>
              <div className="space-y-2 font-mono text-xs flex-1 overflow-y-auto pr-2 custom-scrollbar" aria-live="polite">
                {logs.length === 0 ? (
                  <span className="text-slate-500 font-bold italic">Awaiting events...</span>
                ) : (
                  logs.map((log, i) => (
                    <div 
                      key={i} 
                      className="text-slate-300 border-l-2 border-accent-amber/50 pl-3 py-1.5 bg-slate-800 rounded-r-md font-bold break-words hover:bg-slate-700 transition-colors"
                      style={{ opacity: 1 - (i * 0.15) }}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
          ¿Quieres el motor real? Clona el repositorio: 
          <a href="https://github.com/hermoso92/Artificial_world" target="_blank" rel="noopener noreferrer" className="text-accent-amber hover:text-white font-bold flex items-center gap-1 transition-colors">
            <Github className="w-4 h-4" /> github.com/hermoso92/Artificial_world
          </a>
        </p>
      </div>
    </div>
  );
};

export default ArtificialWorldSimulator;

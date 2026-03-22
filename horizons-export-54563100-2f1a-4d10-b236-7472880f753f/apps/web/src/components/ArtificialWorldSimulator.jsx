
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity, Settings, Target, Shield, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const ACTIONS = [
  'move_up', 'move_down', 'move_left', 'move_right', 'stay',
  'increase_energy', 'decrease_energy', 'reproduce', 'die',
  'attack', 'defend', 'cooperate', 'defect'
];

const SEED_COLORS = {
  'Seed_0': '#ff3366',
  'Seed_1': '#33ccff',
  'Seed_2': '#33ff99',
  'Seed_3': '#ffcc00',
  'Seed_4': '#cc33ff',
  'Seed_5': '#ff9933',
  'Seed_6': '#ffffff'
};

const MODES = [
  { id: 'mission', name: 'Mission Demo', icon: Target },
  { id: 'full_control', name: 'Sandbox Visual', icon: Settings },
  { id: 'dobacksof', name: 'DobackSoft Demo', icon: Shield }
];

const ArtificialWorldSimulator = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [seed, setSeed] = useState("Seed_0");
  const [mode, setMode] = useState("mission");
  const [logs, setLogs] = useState([]);
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

  const initAgents = (selectedSeed, selectedMode) => {
    const count = selectedMode === 'dobacksof' ? 100 : 50;
    const newAgents = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 800,
      y: Math.random() * 450,
      energy: 100 + (Math.random() * 50 - 25),
      action: 'stay',
      seed: selectedSeed,
      color: SEED_COLORS[selectedSeed] || '#00d4ff',
      utility: 0,
      generation: 1
    }));
    agentsRef.current = newAgents;
    ticksRef.current = 0;
    setStats(s => ({ ...s, ticks: 0, alive: count, generation: 1 }));
    setLogs([`[Sistema] Demo visual iniciada: ${selectedMode} con ${selectedSeed}`]);
  };

  useEffect(() => {
    initAgents(seed, mode);
  }, [seed, mode]);

  const updateSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(10, 11, 13, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
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

    // Calculate sum of all agents' states for utility function
    const sumOtherStates = agentsRef.current.reduce((acc, agent) => acc + (agent.energy / 100), 0);

    agentsRef.current.forEach(agent => {
      if (agent.energy <= 0) return; // Dead
      aliveCount++;
      maxGen = Math.max(maxGen, agent.generation);

      // Decision making based on utility
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

      // Apply action
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

      // Bounds wrapping
      if (agent.x < 0) agent.x = canvas.width;
      if (agent.x > canvas.width) agent.x = 0;
      if (agent.y < 0) agent.y = canvas.height;
      if (agent.y > canvas.height) agent.y = 0;

      // Stats collection
      totalEnergy += agent.energy;
      totalUtility += agent.utility;
      actionCounts[agent.action] = (actionCounts[agent.action] || 0) + 1;

      // Draw Agent
      ctx.fillStyle = agent.color;
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, mode === 'dobacksof' ? 3 : 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow
      ctx.shadowBlur = 12;
      ctx.shadowColor = agent.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw connection lines for cooperation/attacks
      if ((agent.action === 'cooperate' || agent.action === 'attack') && Math.random() < 0.1) {
        const target = agentsRef.current[Math.floor(Math.random() * agentsRef.current.length)];
        if (target && target.energy > 0 && target !== agent) {
          ctx.beginPath();
          ctx.moveTo(agent.x, agent.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = agent.action === 'attack' ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,100,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Find dominant action
    let domAction = 'stay';
    let maxCount = 0;
    for (const [act, count] of Object.entries(actionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        domAction = act;
      }
    }

    ticksRef.current += speed;

    // Stop at 200 ticks to keep the demo bounded
    if (ticksRef.current >= 200) {
      setIsRunning(false);
      setLogs(prev => [`[Sistema] Demostración finalizada (200 ticks)`, ...prev]);
    }

    // Update React state periodically to avoid performance hit
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

    // Logging
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
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Instructions Panel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-lg" aria-label="Instrucciones del simulador">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg shrink-0">
            <Info className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Instrucciones de Simulación</h3>
            <ul className="space-y-2 text-sm text-secondary list-disc list-inside ml-4">
              <li>Pulsa Play para lanzar una visualización ilustrativa de agentes.</li>
              <li>Puedes cambiar la semilla visible y la velocidad en el panel de control.</li>
              <li>La sesión se detiene a los 200 ticks para mantener una demo breve y legible.</li>
              <li><strong>Nota:</strong> esta build no demuestra el motor determinista real del proyecto; muestra una capa visual parcial.</li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-xs font-mono text-primary">
              <Shield className="w-3 h-3" aria-hidden="true" />
              Visualización ilustrativa. El motor verificable vive en el repositorio principal del proyecto.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header Controls */}
        <div className="p-4 md:p-6 border-b border-border bg-elevated flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Activity className="text-primary w-6 h-6" aria-hidden="true" /> Simulación visible
            </h3>
            <p className="text-sm text-secondary font-mono mt-1" title="Illustrative simulation shown in the public build">
              Demo parcial de agentes autónomos
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Mode Selection */}
            <Select value={mode} onValueChange={(v) => { setMode(v); handleReset(); }} aria-label="Select simulation mode">
              <SelectTrigger className="w-[160px] bg-background border-border font-bold" aria-label="Simulation mode">
                <SelectValue placeholder="Modo" />
              </SelectTrigger>
              <SelectContent>
                {MODES.map(m => {
                  const Icon = m.icon;
                  return (
                    <SelectItem key={m.id} value={m.id} className="font-bold">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                        {m.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Seed Selection */}
            <Select value={seed} onValueChange={(v) => { setSeed(v); handleReset(); }} aria-label="Select civilization seed">
              <SelectTrigger className="w-[140px] bg-background border-border font-bold" aria-label="Civilization seed">
                <SelectValue placeholder="Semilla" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(SEED_COLORS).map(s => (
                  <SelectItem key={s} value={s} className="font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: SEED_COLORS[s] }} aria-hidden="true"></div>
                      {s}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Speed Control */}
            <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-md border border-border flex-grow lg:flex-grow-0" aria-label="Change simulation speed">
              <Zap className="w-4 h-4 text-warning" aria-hidden="true" />
              <Slider 
                value={[speed]} 
                onValueChange={(v) => setSpeed(v[0])} 
                min={0.5} max={3} step={0.5} 
                className="w-20 md:w-24"
                aria-label="Speed slider"
              />
              <span className="text-xs font-mono font-bold text-primary w-8">{speed}x</span>
            </div>

            {/* Play/Reset */}
            <div className="flex gap-2 ml-auto lg:ml-0">
              <Button 
                size="icon" 
                variant={isRunning ? "destructive" : "default"}
                onClick={() => setIsRunning(!isRunning)} 
                className={`shadow-lg transition-all ${!isRunning ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan" : ""}`}
                aria-label={isRunning ? "Pause simulation" : "Play simulation"}
                disabled={stats.ticks >= 200}
              >
                {isRunning ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5 ml-1" aria-hidden="true" />}
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleReset} 
                className="border-border hover:bg-elevated transition-colors"
                aria-label="Reset simulation"
              >
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-4 gap-0 flex-grow min-h-[500px]">
          {/* Canvas Area */}
          <div className="lg:col-span-3 relative bg-[#0a0b0d] border-r border-border overflow-hidden flex items-center justify-center" aria-label="Simulation visualization canvas">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={450} 
              className="w-full h-full object-cover"
              aria-label="2D Grid showing autonomous agents"
            />
            
            {/* Overlay HUD */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border text-sm font-mono shadow-xl">
              <div className="text-primary font-bold mb-3 text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse" aria-hidden="true" /> 
                TICK: {stats.ticks} / 200
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-8">
                  <span className="text-secondary font-bold">Agentes activos:</span> 
                  <span className="text-foreground font-bold">{stats.alive}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-secondary font-bold">Energía media:</span> 
                  <span className="text-success font-bold">{stats.avgEnergy}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-secondary font-bold">Utilidad media:</span> 
                  <span className="text-primary font-bold">{stats.avgUtility}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats & Logs */}
          <div className="lg:col-span-1 flex flex-col bg-elevated">
            <div className="p-5 border-b border-border">
              <h4 className="text-xs font-extrabold text-secondary mb-4 uppercase tracking-widest">Métricas visibles</h4>
              <p className="text-xs text-secondary mb-4">Métricas de esta demo visual, no del motor completo del proyecto.</p>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-secondary font-bold mb-1.5">Acción dominante</div>
                  <div className="bg-background px-3 py-2.5 rounded-lg border border-border font-mono text-sm text-primary font-bold shadow-inner">
                    {stats.dominantAction}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-secondary font-bold mb-1.5">Generación</div>
                    <div className="bg-background px-3 py-2.5 rounded-lg border border-border font-mono text-sm text-foreground font-bold shadow-inner">
                      Gen {stats.generation}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-bold mb-1.5">Semilla activa</div>
                    <div className="bg-background px-3 py-2.5 rounded-lg border border-border font-mono text-sm font-bold flex items-center gap-2 shadow-inner truncate">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SEED_COLORS[seed] }} aria-hidden="true"></div>
                      {seed.replace('Seed_', 'S')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-hidden flex flex-col bg-card/50">
              <h4 className="text-xs font-extrabold text-secondary mb-3 uppercase tracking-widest flex items-center justify-between">
                Registro de acciones
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
              </h4>
              <div className="space-y-2 font-mono text-xs flex-1 overflow-y-auto pr-2 custom-scrollbar" aria-live="polite">
                {logs.length === 0 ? (
                  <span className="text-secondary/50 font-bold italic">Esperando eventos...</span>
                ) : (
                  logs.map((log, i) => (
                    <div 
                      key={i} 
                      className="text-secondary border-l-2 border-primary/50 pl-3 py-1.5 bg-background/50 rounded-r-md font-bold break-words hover:bg-background transition-colors"
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
    </div>
  );
};

export default ArtificialWorldSimulator;


import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame } from 'lucide-react';
import EcosystemNav from '@/components/EcosystemNav';

const DEMO_CODE = 'DEMO';

const FireSimulator = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState(null);
  const [cells, setCells] = useState([]);
  const GRID = 20;

  useEffect(() => {
    if (!hasAccess) return;
    const grid = Array(GRID * GRID).fill(0);
    grid[Math.floor(GRID * GRID / 2) - GRID] = 1;
    grid[Math.floor(GRID * GRID / 2) + GRID] = 1;
    setCells(grid);
  }, [hasAccess]);

  useEffect(() => {
    if (!hasAccess || cells.length === 0) return;
    const timer = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        for (let i = 0; i < GRID * GRID; i++) {
          if (prev[i] === 1) {
            const r = Math.floor(i / GRID), c = i % GRID;
            [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr, nc]) => {
              const idx = nr * GRID + nc;
              if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID && prev[idx] === 0) {
                next[idx] = Math.random() < 0.4 ? 1 : 0;
              }
            });
          }
        }
        return next;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [hasAccess, cells.length]);

  const handleUnlock = () => {
    const code = accessInput.trim().toUpperCase();
    if (code === DEMO_CODE || code.startsWith('DOBACK-')) {
      setHasAccess(true);
      setAccessError(null);
    } else {
      setAccessError('Usa DEMO o formato DOBACK-XXXX-XXXX');
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Helmet>
          <title>Artificial World | FireSimulator demo</title>
          <meta
            name="description"
            content="Demo pública de propagación 2D dentro del ecosistema Artificial World."
          />
        </Helmet>
        <EcosystemNav />
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-60px)]">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border border-border">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">FireSimulator</h2>
              <p className="text-sm text-secondary">Demo de propagación 2D</p>
            </div>
          </div>
          <p className="text-secondary text-sm mb-4">
            Introduce el código de acceso para jugar. Usa <code className="bg-elevated px-1 rounded">DEMO</code> para acceso rápido.
          </p>
          <input
            type="text"
            value={accessInput}
            onChange={(e) => setAccessInput(e.target.value)}
            placeholder="DEMO o DOBACK-XXXX-XXXX"
            className="w-full bg-background border border-border rounded-lg px-4 py-3 font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {accessError && <p className="text-destructive text-sm mb-4">{accessError}</p>}
          <Button onClick={handleUnlock} className="w-full">Desbloquear</Button>
        </div>
        </div>
      </div>
    );
  }

  const cellSize = Math.min(400 / GRID, 20);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Artificial World | FireSimulator demo</title>
        <meta
          name="description"
          content="Demo pública de propagación 2D dentro del ecosistema Artificial World."
        />
      </Helmet>
      <EcosystemNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <Flame className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">FireSimulator — Demo</h2>
            <p className="text-sm text-secondary">Propagación ilustrativa (no conectada al backend)</p>
          </div>
        </div>
        <div
          className="relative border-2 border-border rounded-xl overflow-hidden bg-[#0a0b0d]"
          style={{ width: GRID * cellSize, height: GRID * cellSize }}
        >
          {cells.map((v, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: (i % GRID) * cellSize,
                top: Math.floor(i / GRID) * cellSize,
                width: cellSize - 1,
                height: cellSize - 1,
                backgroundColor: v === 1 ? '#ff6b35' : 'transparent',
                borderRadius: 2,
              }}
            />
          ))}
        </div>
        <p className="text-secondary text-xs mt-4">Visualización demo. La implementación completa queda fuera de esta build pública.</p>
      </div>
    </div>
  );
};

export default FireSimulator;

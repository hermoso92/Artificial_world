# Artificial Worlds - Testing

## Resumen

- **Backend**: Vitest + Supertest (API)
- **Frontend**: Vitest + React Testing Library
- **Real-time**: WebSocket en `ws://localhost:3001/ws`
- **IA**: Análisis de fallos con OpenAI (opcional)

## Comandos

```powershell
# Backend
cd backend
npm run test          # Tests unitarios + API
npm run test:watch   # Modo watch
npm run test:coverage # Con cobertura
npm run test:ai      # Con análisis IA (requiere OPENAI_API_KEY)

# Frontend
cd frontend
npm run test
npm run test:watch

# Todo
.\scripts\test-all.ps1
```

## Con análisis IA

```powershell
$env:OPENAI_API_KEY = "sk-..."
cd backend
npm run test:ai
```

Si hay fallos, la IA analiza el output y sugiere correcciones.

## WebSocket para tests en tiempo real

El servidor emite el estado de la simulación cada tick:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'simulation') {
    console.log('Tick:', msg.tick, 'Agents:', msg.agentCount);
  }
};
```

## Estructura de tests

```
backend/
  src/
    simulation/
      agent.test.js
      refugeSimulation.test.js
    routes/
      api.test.js

frontend/
  src/
    components/
      GeneticAssemblerPanel.test.jsx
    test/
      setup.js
```

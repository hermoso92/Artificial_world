# Frontend — Artificial World

Aplicación React + Vite para la demo web de Artificial World.

## Estructura

```
frontend/src/
├── main.jsx            ← entrada
├── App.jsx             ← routing, layout
├── config/
│   └── api.js          ← URLs base (NUNCA hardcodear)
├── components/
│   ├── Hub.jsx         ← página principal, navegación
│   ├── HeroRefuge.jsx  ← refugios, mundos, semillas
│   ├── DobackSoft.jsx  ← vertical demo DobackSoft
│   ├── FireSimulator.jsx
│   ├── SimulationView.jsx
│   ├── SimulationCanvas.jsx
│   ├── AdminPanel.jsx  ← #admin (requiere ADMIN_PLAYER_IDS)
│   ├── MissionControl/ ← dashboard, logs, audit
│   └── ...
├── services/
│   └── api.js          ← llamadas API
├── hooks/
│   └── useRealtimeSimulation.js
└── utils/
    └── logger.js
```

## Componentes principales

| Componente | Ruta | Descripción |
|------------|------|-------------|
| Hub | `/` | Página principal, acceso a módulos |
| HeroRefuge | `/hero` | Refugios, mundos, semillas de civilización |
| DobackSoft | `/dobacksoft` | Demo vertical estabilidad vehicular |
| FireSimulator | `/fire` | Minijuego canvas 2D |
| AdminPanel | `#admin` | Reset, overview (solo admin) |

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo (puerto 5173) |
| `npm run build` | Build producción |
| `npm run preview` | Preview del build |
| `npm test` | Tests Vitest |

## Configuración

- **URLs API:** `frontend/src/config/api.js` — base URL del backend
- **Puerto:** 5173 (Vite default)

## Reglas (AGENTS.md)

- Usar `logger` en lugar de `console.log`
- Componentes < 300 líneas
- URLs desde `config/api.js`

## Inicio rápido

```powershell
.\scripts\iniciar_fullstack.ps1
```

Inicia backend (3001) y frontend (5173) en paralelo.

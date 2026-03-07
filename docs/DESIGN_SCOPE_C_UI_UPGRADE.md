# Design: Artificial World — Scope C UI Upgrade

## Technical Approach

Introduce a lightweight client-side navigation layer (state-machine router) that connects three pillars — Simulation, Minigames, and DobackSoft — through a Hub/Lobby screen. Simultaneously migrate App.jsx from 200 ms HTTP polling to the already-written `useRealtimeSimulation` WebSocket hook, split the 582-line `HeroRefugePanel` into focused sub-components, and centralise logging behind a `logger` utility on both frontend and backend.

The guiding constraint is **no new heavy dependencies**: React Router adds ~50 KB; a state machine with `useReducer` costs 0 KB. The WebSocket infrastructure is already on the server (`broadcastSimulationState` in `realtime/websocket.js`). The tic-tac-toe AI mirrors the existing agent decision engine philosophy (utility scoring, no opaque ML).

---

## Architecture Decisions

### Decision: Routing — `useReducer` state machine over React Router

**Choice**: Single `useReducer`-based navigation in `App.jsx` with four routes: `hub`, `simulation`, `minigames`, `dobacksoft`.

**Alternatives considered**:
- React Router 6 (file-based) — adds ~50 KB, introduces loader patterns, overkill for 4 screens.
- Simple `useState` with a string — identical weight but no place to attach guards or transition side effects cleanly.

**Rationale**: The project currently has zero routing. A `useReducer` state machine gives explicit transitions (`GOTO_HUB`, `GOTO_SIMULATION`, `GOTO_MINIGAME`, `GOTO_DOBACKSOFT`), keeps bundle size unchanged, fits in a single file, and can be upgraded to React Router later without touching child components (they receive no router props).

---

### Decision: State management — three isolated contexts, no global store

**Choice**:
- **Navigation state**: `navigationReducer` inside `App.jsx` (lifted state, passed as props).
- **Simulation state**: moved from `App.jsx` flat state into a dedicated `SimulationContext` (`contexts/SimulationContext.jsx`).
- **Game state**: local to `TicTacToeBoard.jsx` via `useReducer`; no cross-pillar sharing needed.

**Alternatives considered**:
- Zustand global store — adds dependency, useful only when sibling trees need deep shared state; no case here.
- Redux Toolkit — vastly over-engineered for this scope.
- Single giant `useState` object in `App.jsx` — current pattern; breaks recomposition as components grow.

**Rationale**: Each pillar is self-contained. Lifting simulation state into a context prevents prop-drilling through 6+ layers (App → sidebar → panel → sub-panel) and makes it available to `SimulationCanvas` and `LogPanel` without threading props.

---

### Decision: WebSocket migration — drop-in replacement of polling interval

**Choice**: Replace the `setInterval(fetchData, 200)` block in `App.jsx` with a call to `useRealtimeSimulation()`. Use the WS `tick/refuge/agentCount` fields to drive the same state variables. Keep `fetchData` as a one-shot fetch on mount and after mutating actions (start/pause/reset/release) — not on a timer.

**Alternatives considered**:
- Keep polling alongside WS as fallback — doubles network load, defeats the purpose.
- Rewrite `useRealtimeSimulation` to return full agents/blueprints arrays — requires backend changes to the WS broadcast payload.

**Rationale**: `broadcastSimulationState` in `websocket.js` already sends `tick`, `refuge`, and `agentCount`. The hook is already written and tested (`useRealtimeSimulation.js`, 46 lines). The only backend change needed is ensuring `engine.js` calls `broadcastSimulationState` on each tick (it likely does; verify at implementation time). Mutating actions (start, pause, reset) continue using REST — they are low-frequency, fire-and-forget operations where polling is fine.

Migration is non-breaking: the WS state updates `tick` and `refuge`; REST calls update `agents`, `blueprints`, and `logs` on demand. No component outside `App.jsx` needs to change.

---

### Decision: Tic-tac-toe AI — utility scoring (not minimax)

**Choice**: A pure utility function `scoreBoard(board, player)` that assigns scores to each empty cell and picks the highest-score move. The scoring rules are:
1. +1000 if this move wins the game.
2. -900 if blocking opponent's win (opponent would win next turn).
3. +30 for centre cell (index 4).
4. +20 for each corner cell (indices 0, 2, 6, 8).
5. +10 for creating a two-in-a-row with an empty third.
6. +5 for occupying a line already held by AI.

**Alternatives considered**:
- Full minimax with alpha-beta pruning — optimal but predictable/unbeatable; kills fun for casual players.
- Random AI — trivially beatable, no challenge.
- Neural net / MCTS — totally disproportionate for 3×3 tic-tac-toe.

**Rationale**: The existing simulation engine uses a utility-based decision system for agents (see `agent.js` `decideAction` method). Using the same philosophy keeps the codebase philosophically consistent. A utility scorer is also transparent: each weight is a readable constant, making it easy to tune difficulty. Adding a `difficulty` prop (`easy`/`medium`/`hard`) simply varies whether the AI occasionally picks a random move instead of the utility maximum.

---

### Decision: HeroRefugePanel split strategy — extract by responsibility cluster

**Choice**: Split the current monolith (582 lines) into four focused files:

| New file | Responsibility | Approx lines |
|---|---|---|
| `HeroRefugePanel.jsx` | Orchestrator: state, fetching, routing between views | ~120 |
| `HeroModeGrid.jsx` | Mode selector grid + `ModeGrid` sub-component | ~80 |
| `HeroWorldCard.jsx` | Single world card + destroy action | ~70 |
| `HeroAgentChat.jsx` | Query input + `AgentBubble` response display | ~60 |
| `HeroWorldCreateForm.jsx` | Create-world form + biome/type selectors | ~90 |

Total ≈ 420 lines across 5 files, all under the 300-line rule.

**Rationale**: The current file mixes form state, fetch logic, world-card presentation, mode selection UI, and chat UI. Each extracted component has a single clear prop contract and can be tested independently.

---

### Decision: Logger utility — thin wrapper over `console`, different levels per env

**Choice**: A `utils/logger.js` on both frontend and backend that exposes `{ info, warn, error, debug }`. In production (`import.meta.env.PROD` for frontend, `NODE_ENV=production` for backend) `debug` calls are no-ops. Format: `[LEVEL][timestamp] message`.

**Alternatives considered**:
- `pino` / `winston` on backend — pino is excellent but adds a dependency; the current project uses raw `console.*` with no structured logging, so any structured output is an improvement.
- Browser `console.groupCollapsed` patterns — too verbose for this codebase size.

**Rationale**: The rule "never use `console.log` — use `logger`" is already in AGENTS.md. The implementation should be as thin as possible so adoption is frictionless. A 20-line wrapper beats a new npm package for a project at this scale.

---

## Data Flow

### Simulation pillar (after WebSocket migration)

```
Backend engine tick
  └─> broadcastSimulationState({ tick, refuge, agentCount })
        └─> WebSocket /ws
              └─> useRealtimeSimulation hook
                    └─> SimulationContext (tick, refuge, agentCount)
                          ├─> SimulationCanvas  (renders agents via refuge)
                          ├─> WorldPanel        (reads world stats)
                          └─> LogPanel          (reads logs — fetched on mount)

User action (Start / Pause / Reset)
  └─> api.startSimulation()  [REST POST]
        └─> fetchData() one-shot refresh
              └─> SimulationContext updated
```

### Navigation flow

```
App.jsx (navigationReducer)
  ├─ state.route === 'hub'        → <HubScreen onNavigate={dispatch} />
  ├─ state.route === 'simulation' → <SimulationView />  (existing panels)
  ├─ state.route === 'minigames'  → <MinigamesView />
  │     └─ state.game === 'ttt'   → <TicTacToeBoard />
  └─ state.route === 'dobacksoft' → <DobackSoftShell />
```

### Tic-tac-toe AI turn

```
Player clicks cell
  └─> gameReducer({ type: 'PLACE', index })
        └─> checks win / draw
        └─> if AI turn: aiMove(board, 'O', difficulty)
              └─> scoreBoard(board, 'O') → scores[]
              └─> pick highest score (or random if easy mode)
              └─> gameReducer({ type: 'PLACE', index: bestMove })
```

---

## File Changes

### Frontend — `frontend/src/`

| File | Action | Description |
|---|---|---|
| `App.jsx` | Modify | Replace polling with `useRealtimeSimulation`; add `navigationReducer`; wrap simulation state in `SimulationContext.Provider` |
| `contexts/SimulationContext.jsx` | Create | React context + provider for world, agents, blueprints, logs |
| `utils/logger.js` | Create | Thin logging utility (`info`, `warn`, `error`, `debug`) |
| `components/HubScreen.jsx` | Create | Hub/Lobby with 3 pillar cards and navigation actions |
| `components/MinigamesView.jsx` | Create | Minigames lobby (currently only tic-tac-toe) |
| `components/TicTacToeBoard.jsx` | Create | Full tic-tac-toe game: PvP + PvAI, `useReducer` game state |
| `components/ttt/aiPlayer.js` | Create | Pure utility AI: `aiMove(board, player, difficulty)` |
| `components/ttt/gameLogic.js` | Create | Pure functions: `checkWin`, `checkDraw`, `getLines` |
| `components/DobackSoftShell.jsx` | Create | Placeholder shell with branding and "coming soon" structure |
| `components/HeroRefugePanel.jsx` | Modify | Shrink to orchestrator only (~120 lines); import sub-components |
| `components/HeroModeGrid.jsx` | Create | Extracted `ModeGrid` + `AgentBubble` sub-components |
| `components/HeroWorldCard.jsx` | Create | Extracted `WorldCard` component |
| `components/HeroAgentChat.jsx` | Create | Query input + answer display |
| `components/HeroWorldCreateForm.jsx` | Create | World creation form |
| `hooks/useRealtimeSimulation.js` | Modify | Fix hardcoded port `3001` → derive from `import.meta.env.VITE_API_PORT ?? 3001` |

### Backend — `backend/src/`

| File | Action | Description |
|---|---|---|
| `utils/logger.js` | Create | `pino`-style wrapper: `{ info, warn, error, debug }`, structured JSON output |
| `middleware/errorHandler.js` | Modify | Replace `console.error` / `console.warn` with `logger.error` / `logger.warn` |
| `audit/eventStore.js` | Modify | Replace `console.*` with `logger.*` |
| `server.js` | Modify | Replace `console.log` startup messages with `logger.info` |

---

## Interfaces / Contracts

### `navigationReducer`

```javascript
// State
/** @typedef {{ route: 'hub' | 'simulation' | 'minigames' | 'dobacksoft', game: string | null }} NavState */

// Actions
/** @typedef {{ type: 'GOTO_HUB' | 'GOTO_SIMULATION' | 'GOTO_MINIGAMES' | 'GOTO_DOBACKSOFT' | 'SELECT_GAME', game?: string }} NavAction */
```

### `SimulationContext`

```javascript
// Value shape
{
  world: object | null,
  agents: array,
  blueprints: array,
  logs: array,
  activeRefugeIndex: number,
  wsConnected: boolean,
  loading: boolean,
  error: string | null,
  // Actions
  onStart: () => Promise<void>,
  onPause: () => Promise<void>,
  onReset: () => Promise<void>,
  onCreateBlueprint: (name, traits) => Promise<void>,
  onRelease: (refugeIndex, blueprintId, count) => Promise<void>,
  onSelectRefuge: (index) => Promise<void>,
  onSelectAgent: (agentOrNull) => void,
  selectedAgent: object | null,
}
```

### `aiMove` (tic-tac-toe)

```javascript
/**
 * Returns the board index the AI should play.
 * @param {(string|null)[]} board - 9-cell array, 'X'|'O'|null
 * @param {'X'|'O'} player - AI's symbol
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {number} index 0–8
 */
export function aiMove(board, player, difficulty = 'hard') {}
```

### `gameReducer` state

```javascript
{
  board: (string|null)[9],   // 'X' | 'O' | null
  current: 'X' | 'O',       // whose turn
  winner: 'X' | 'O' | 'draw' | null,
  history: { board, move }[],
  mode: 'pvp' | 'pvai',
  aiSymbol: 'O',
  difficulty: 'easy' | 'medium' | 'hard',
}
```

### Backend `logger` interface

```javascript
// backend/src/utils/logger.js
export const logger = {
  info:  (msg, meta = {}) => { /* structured output */ },
  warn:  (msg, meta = {}) => { /* structured output */ },
  error: (msg, meta = {}) => { /* structured output */ },
  debug: (msg, meta = {}) => { /* no-op in production */ },
};
```

### Frontend `logger` interface

```javascript
// frontend/src/utils/logger.js
export const logger = {
  info:  (msg, ...args) => { /* console.info in dev */ },
  warn:  (msg, ...args) => { /* console.warn */ },
  error: (msg, ...args) => { /* console.error */ },
  debug: (msg, ...args) => { /* no-op in prod */ },
};
```

---

## Hub/Lobby Screen Design

`HubScreen.jsx` renders three pillar cards in a CSS Grid (1×3 on desktop, stacked on mobile):

```
┌─────────────────────────────────────────────────────────────┐
│                   ARTIFICIAL WORLDS                          │
│              Design life. Watch it survive.                  │
├──────────────┬──────────────────────────┬────────────────────┤
│  🌍           │   🎮                      │   💼               │
│  SIMULATION  │   MINIGAMES               │   DOBACKSOFT       │
│              │                           │                    │
│ Agents: 142  │  ◎ Tic-tac-toe            │  [Coming Soon]     │
│ Tick: 2847   │  ◎ (more soon)            │                    │
│ Status: RUN  │                           │  Foundation shell  │
│              │                           │  for DobackSoft    │
│ [ENTER]      │  [ENTER]                  │  integration       │
└──────────────┴──────────────────────────┴────────────────────┘
```

The Simulation card shows live WebSocket data (`tick`, `agentCount`, `wsConnected`). The Minigames card lists available games. The DobackSoft card is intentionally sparse — it establishes visual presence without faking functionality.

---

## DobackSoft Foundation Shell

`DobackSoftShell.jsx` is a single-screen placeholder (~80 lines) that:
- Displays the DobackSoft brand wordmark and description.
- Shows a "Módulos en desarrollo" section with the 9 official menu items listed as `opacity-50` disabled cards (matching the AGENTS.md menu list).
- Has a prominent "Volver al Hub" back button.
- Imports nothing from the simulation; zero coupling.
- Styled with pure CSS classes consistent with `index.css` conventions (dark background, neon accent pattern already used in `HeroRefugePanel`).

This shell is the **foundation point** — when the DobackSoft frontend is built, `DobackSoftShell.jsx` becomes the router entry point into its own module tree.

---

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `aiMove` — all difficulty levels, win detection, blocking | Vitest pure function tests in `ttt/aiPlayer.test.js` |
| Unit | `checkWin`, `checkDraw` logic | Vitest in `ttt/gameLogic.test.js` |
| Unit | `navigationReducer` — all transitions | Vitest |
| Unit | `gameReducer` — PvP flow, PvAI flow, draw detection | Vitest |
| Unit | Frontend `logger` — no console output in prod mode | Vitest with `vi.spyOn` |
| Unit | Backend `logger` — structured output format | Vitest |
| Component | `TicTacToeBoard` — render, click interaction, AI response | `@testing-library/react` |
| Component | `HubScreen` — pillar cards render, navigation callbacks fired | `@testing-library/react` |
| Component | Extracted `HeroWorldCard` — displays world fields, destroy callback | `@testing-library/react` |
| Integration | App renders HubScreen by default (no simulation panels) | `@testing-library/react` |
| Integration | WebSocket mock → SimulationContext state update | Vitest + mock WS |

---

## Migration / Rollout

### Phase 1 — Logger (zero user-visible change, backend + frontend)
Create `backend/src/utils/logger.js` and `frontend/src/utils/logger.js`. Replace all `console.*` calls in `errorHandler.js`, `eventStore.js`, `server.js` (backend) and any `console.log` in frontend files. No functional change.

### Phase 2 — WebSocket migration (App.jsx only)
Remove the `setInterval` polling block. Call `useRealtimeSimulation()`. Derive `wsConnected` state. Mutating handlers remain unchanged. The `fetchData` function is called once on mount and after each mutation. **Regression risk: low** — the hook is already tested, and the backend WS broadcast is already wired.

### Phase 3 — SimulationContext extraction
Wrap simulation state into `SimulationContext.jsx`. Update all child components to consume context instead of receiving props. This is a pure refactor — behaviour is unchanged.

### Phase 4 — HeroRefugePanel split
Split into 5 files. Tests should pass without modification because the surface API (the `HeroRefugePanel` export and its zero-prop signature) doesn't change.

### Phase 5 — Hub + navigation
Add `navigationReducer` to `App.jsx`. Default route is `'hub'` (shows `HubScreen`). Simulation panels render only when `route === 'simulation'`. **This is the only user-visible breaking change** — the app no longer opens directly to the simulation view on load.

### Phase 6 — Tic-tac-toe
Add `MinigamesView.jsx` and `TicTacToeBoard.jsx`. Accessible from Hub → Minigames → Tic-tac-toe.

### Phase 7 — DobackSoft shell
Add `DobackSoftShell.jsx`. Accessible from Hub → DobackSoft.

---

## Open Questions

- [ ] Does `engine.js` already call `broadcastSimulationState` on each tick? If not, Phase 2 requires a one-line addition in `engine.js`. Verify before implementing Phase 2.
- [ ] Should the Hub show real-time simulation stats (tick, agent count) via WebSocket even before entering Simulation? If yes, `useRealtimeSimulation` must be initialised at the `App` level regardless of current route.
- [ ] `useRealtimeSimulation.js` line 13 hardcodes port `3001` for the dev proxy. The project rule is backend on port `9998`. Clarify which port the WS connects to in dev — update the hook's default before Phase 2.
- [ ] Should tic-tac-toe persist scores across sessions (SQLite via backend) or stay purely in-memory (localStorage)? In-memory is simpler and sufficient for a minigame; a backend call adds complexity.
- [ ] The existing `index.css` uses pure CSS with a dark theme. The split HeroRefugePanel sub-components use inline `style={{}}` with hex colours (hardcoded: `#1a1a2e`, `#e94560`, etc.). The refactor should decide: keep inline styles for the extracted components (consistent with current pattern) or migrate to CSS variables in `index.css`. Recommendation: keep inline styles for now to avoid breaking visual regression, and migrate to CSS variables in a separate cleanup task.

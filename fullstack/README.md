# Artificial World — Full-Stack

Aplicación web de simulación 2D con React (frontend) y Node.js (backend).

## Estructura

```
artificial word/
├── backend/     → API Node.js + Express (puerto 3001)
├── frontend/    → React + Vite (puerto 5173)
└── fullstack/README.md
```

## Inicio rápido

### 1. Backend (desde la raíz del proyecto)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

### 3. Abrir

http://localhost:5173

El frontend usa proxy hacia el backend en desarrollo.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/world | Estado general del mundo |
| GET | /api/agents | Lista de agentes |
| GET | /api/resources | Lista de recursos |
| GET | /api/logs | Eventos de simulación |
| POST | /api/simulation/start | Iniciar simulación |
| POST | /api/simulation/pause | Pausar simulación |
| POST | /api/simulation/reset | Reiniciar mundo |

## Producción

```bash
# Backend
cd backend; npm start

# Frontend (build estático)
cd frontend; npm run build; npm run preview
```

Configura el frontend para apuntar a la URL real del API (variable de entorno `VITE_API_URL` o similar).

## Debug interactivo

Script completo que inicia backend, frontend y consola de debug:

```powershell
.\scripts\debug_fullstack.ps1
```

Se abren 3 ventanas: backend, frontend y consola de comandos. En la consola puedes escribir:

| Comando | Descripción |
|---------|-------------|
| `world` | Estado del mundo (tick, agentes, recursos) |
| `agents` | Lista de agentes con inventario y memoria |
| `agent 1` | Detalle completo del agente 1 |
| `resources` | Recursos disponibles |
| `logs` | Últimos eventos |
| `start` | Iniciar simulación |
| `pause` | Pausar |
| `reset` | Reiniciar mundo |
| `help` | Ayuda |
| `quit` | Salir |

Si backend y frontend ya corren, solo la consola:

```powershell
.\scripts\debug_consola.ps1
```

## Nota sobre rutas con espacios

Si el proyecto está en una ruta con espacios (ej. `artificial word`), `npm install` en el frontend puede dar avisos. Si falla, prueba:
1. Eliminar `frontend/node_modules` y ejecutar `npm install` de nuevo
2. O mover el proyecto a una ruta sin espacios

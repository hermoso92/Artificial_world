# Debug interactivo — Artificial World Full-Stack

Scripts para depurar la simulación con una consola de comandos.

## Script completo

```powershell
.\scripts\debug_fullstack.ps1
```

Inicia:
1. **Backend** (puerto 3001)
2. **Frontend** (puerto 5173)
3. **Consola de debug** (comandos interactivos)
4. Abre el navegador en http://localhost:5173

## Solo consola de debug

Cuando backend y frontend ya están corriendo:

```powershell
.\scripts\debug_consola.ps1
```

O directamente:

```powershell
node scripts/debug_interactivo.js
```

## Comandos disponibles

| Comando | Alias | Descripción |
|---------|-------|-------------|
| `world` | `w` | Estado del mundo (tick, running, agentes, recursos, refugios, energía media) |
| `agents` | `a` | Lista de agentes con posición, energía, estado, inventario, recuerdos |
| `agent <id>` | — | Detalle completo del agente (JSON) |
| `resources` | `r` | Recursos disponibles en el mapa |
| `logs` | `l` | Últimos 15 eventos de la simulación |
| `start` | — | Iniciar simulación |
| `pause` | — | Pausar simulación |
| `reset` | — | Reiniciar mundo |
| `help` | `h` | Mostrar ayuda |
| `quit` | `q` | Salir |

## Ejemplo de sesión

```
> world

--- MUNDO ---
Tick: 42 | Running: true
Agentes: 5 | Recursos: 14 | Refugios: 4
Energía media: 0.72

> agents

--- AGENTES ---
[1] Ana @ (120, 85)
    Energía: 78% | Estado: moving_to_resource
    Acción: Yendo hacia comida | Inventario: 1 comida, 0 material
    Recuerdos: 2 comida, 1 material, 1 refugios

> start
Simulación iniciada

> quit
```

## Requisitos

- Node.js 18+ (para `fetch` nativo)
- Backend corriendo en http://localhost:3001

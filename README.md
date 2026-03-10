# Artificial World

Artificial World es una base para crear **civilizaciones vivas** con memoria, héroes, refugios y comunidades. Proyecto local-first y open source.

## Tesis principal

**Empieza con un refugio. Elige una semilla. Mira nacer tu civilización.**

- **2D** = verdad sistémica (mapa, rutas, recursos, refugios)
- **3D** = encarnación futura (roadmap, no implementada hoy)

Lema interno: *No persigas la IA. Construye un mundo que la necesite.*

## La verdad actual del repo

La línea de verdad de este repositorio sigue siendo esta:

- `Artificial World` es, hoy, un **motor principal en Python + pygame**.
- La web fullstack es una **demo funcional con motor JavaScript propio**, no una interfaz del motor Python.
- `DobackSoft` dentro de este repo es una **vertical demo**; el producto completo de esa línea no vive aquí.

La nueva narrativa del proyecto no sustituye esta base. La reorganiza y la proyecta hacia una categoría más ambiciosa sin confundir presente con visión.

## Ownership estratégico

| Marca | Rol |
|-------|-----|
| **DobackSoft** | Producto principal / empresa (repo `dobackv2`) |
| **Artificial World** | Laboratorio local, auditable y open source |
| **Juego / FireSimulator** | Superficie de demo y entrenamiento, no núcleo de negocio |

Documentos maestros: [docs/OWNERSHIP_ESTRATEGICO.md](docs/OWNERSHIP_ESTRATEGICO.md), [docs/SUPERFICIE_JUEGO.md](docs/SUPERFICIE_JUEGO.md)

## Qué es hoy

`Artificial World` modela entidades que perciben, recuerdan, puntúan acciones y actúan dentro de un mundo persistente. Esa base técnica es el cimiento desde el que ahora se plantea una evolución hacia sistemas locales de comprensión, comparación y auditoría.

La parte más verificable del proyecto está en el motor Python:

- 13 tipos de acción en `tipos/enums.py`
- memoria espacial y social en `systems/memory/memoria_entidad.py`
- persistencia SQLite en `sistemas/sistema_persistencia.py`
- Modo Sombra en `sistemas/gestor_modo_sombra.py`
- runner de pruebas en `pruebas/run_tests_produccion.py`

## Qué puede llegar a ser

- **Motor creador de mundos** compacto y reutilizable
- Civilizaciones con historia emergente, memoria y comunidad
- Puente opcional entre motor Python y capa web
- Análisis de proyectos y auditoría (visión futura)

## Qué incluye este repo

| Componente | Estado | Qué es |
|------------|--------|--------|
| Motor Python (`principal.py`) | Real | Núcleo principal con persistencia, Modo Sombra, watchdog y pruebas |
| Web fullstack (`scripts/iniciar_fullstack.ps1`) | Demo funcional | Motor JavaScript independiente con REST + WebSocket |
| DobackSoft (`frontend/src/components/DobackSoft.jsx`) | Demo vertical | Landing, cupón, visor y ruta demo; no producto B2B completo |
| HeroRefuge | Mixto | Módulo web con persistencia parcial, refugios jugables 2D, companion IA y mundos ligeros |
| IA local base | Real pero acotada | Servicios de chat, resumen, análisis de fallos y memoria documental |

## IA local y automatización

La base mínima compartida ya implementada en este repo incluye:

- `backend/src/services/aiCore.js` con `health`, `chat`, `summarize`, `analyzeTestFailure` y `analyzeSession`
- `backend/src/services/llmService.mjs` como adaptador de `HeroRefuge` sobre el `ai-core`
- memoria local versionada en `docs/ia-memory/`
- endpoints `/api/ai/*`
- `iniciar.ps1` como `bootstrap/doctor/launcher`

Documentación asociada:

- [docs/IMPLEMENTACION_AI_CORE_LOCAL.md](docs/IMPLEMENTACION_AI_CORE_LOCAL.md)
- [docs/IA_LOCAL_BASE.md](docs/IA_LOCAL_BASE.md)

## Mission Control para OpenClaw

La capa web incluye ahora un `MISSION CONTROL` operativo pensado para coordinar agentes con visibilidad central, board kanban, feed en vivo, approvals humanas y soporte multi-gateway local-first.

Qué es hoy:

- vive dentro de la app React existente en la ruta `#missioncontrol`
- usa backend Express existente con un dominio aislado en `/api/mission-control`, `/api/approvals`, `/api/boards` y `/api/gateways`
- persiste en `mission-control.db` con modelo propio para `gateways`, `agents`, `tasks`, `runs`, `approvals`, `events`, `boards` y `board_groups`
- arranca en modo híbrido: runtime seed local persistente ahora, adapter preparado para conectar gateways OpenClaw reales después
- reutiliza el WebSocket existente como transporte, pero emite mensajes propios `mission-control:snapshot` y `mission-control:event`
- incluye adapter OpenClaw real opcional por WebSocket: handshake `connect`, `status`, `heartbeat_trigger`, normalización de `response`, `tool_call`, `tool_result`, `heartbeat_status`, `error` y `exec.approval.requested`

Qué puedes probar ahora:

- dashboard operativo con KPIs, gateways y errores recientes
- rail persistente de agentes con heartbeat y tarea actual
- board kanban con estados `Backlog`, `In Progress`, `Review`, `Done` y `Blocked`
- feed de eventos en vivo con pausa de autoscroll
- approval center con aprobar/rechazar y trazabilidad persistente
- inspector lateral con detalle de tarea, run, approval o evento

Arranque recomendado:

```powershell
.\scripts\iniciar_fullstack.ps1
```

Luego abre:

- `http://localhost:5173/#missioncontrol`

Alternativa con Docker:

```powershell
docker compose up
```

Variables útiles:

- `MISSION_CONTROL_RUNTIME_MODE=seed` para usar el runtime local
- `MISSION_CONTROL_RUNTIME_MODE=disabled` para dejar libre la futura conexión a gateway real
- `MISSION_CONTROL_TICK_MS=4000` para ajustar el ritmo del stream local
- `OPENCLAW_GATEWAY_URLS=ws://localhost:18789` para conectar uno o más gateways OpenClaw reales
- `OPENCLAW_GATEWAY_TOKEN=` si el gateway requiere auth
- `OPENCLAW_GATEWAY_SCOPES=operator.read,operator.approvals` para el rol operador del adapter

## Realidad, demo y visión

### Real hoy

- Un motor Python ejecutable localmente con persistencia en `mundo_artificial.db`
- Un runner de producción con **11 suites** en `pruebas/run_tests_produccion.py`
- Crónica fundacional headless: `python cronica_fundacional.py` o `python principal.py --cronica`
- Base documental extensa y una primera capa de IA local utilitaria

### Demo hoy

- La simulación web usa un motor JavaScript distinto al motor Python
- `DobackSoft` en este repo usa almacenamiento en memoria y rutas mock en `backend/src/routes/dobacksoft.js`
- El modo “ruta real” del `FireSimulator` depende de datos entregados por el visor; no valida por sí solo una integración real con telemetría externa

### Visión defendible

- Convertir Artificial World en una infraestructura local para comprender proyectos reales con IA coordinada y trazable
- Mantener la filosofía local-first, open source y auditable como rasgo central
- Hacer que la narrativa, el producto y la arquitectura dependan de evidencia y no de promesas sueltas

## Qué puede probar alguien hoy en 3 minutos

### Golden path recomendado

Para probar la parte más real del proyecto, sigue [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md).

Resumen corto:

```powershell
pip install -r requirements.txt
python principal.py
```

Eso demuestra el motor principal: simulación, persistencia, Modo Sombra y flujo core.

### Vista rápida de la demo web

```powershell
.\scripts\iniciar_fullstack.ps1
```

Resultado esperado:

- se abre `http://localhost:5173`
- puedes navegar el hub y ver la demo web
- esto demuestra la **capa demo web**, no el motor principal Python

### Crónica fundacional

```powershell
python cronica_fundacional.py --seed 42 --ticks 200
```

Genera `cronica_fundacional.json` y `cronica_fundacional.md` con hitos, entidades finales, alertas y veredicto de supervivencia.

## Ejecución

### Motor principal (Python)

```powershell
pip install -r requirements.txt
python principal.py
```

### Demo web fullstack

```powershell
.\scripts\iniciar_fullstack.ps1
```

### Crónica fundacional (headless)

```powershell
python cronica_fundacional.py
python principal.py --cronica
```

### Landing HTML

```powershell
python principal.py --web
```

### Generar ejecutable Windows

```powershell
.\build_exe.ps1
```

El script existe en el repo. La disponibilidad del binario final depende de ejecutarlo localmente.

### Auditoría Chess (agentes IA independientes)

```powershell
.\scripts\run_chess_audit.ps1
```

Ejecuta 6 agentes Docker que auditan documentación, backend, frontend, BBDD, tests y marketing. Salida: `REPORTE_CHESS_1.md`. Ver [docs/SISTEMA_CHESS.md](docs/SISTEMA_CHESS.md).

## Qué no afirmar con este repo

No conviene presentar como hecho, sin más evidencia, lo siguiente:

- latencia `< 1 ms`
- miles de agentes
- telemetría real integrada
- producto `enterprise`
- DobackSoft completo en este mismo repo
- robustez total o escalado masivo
- comprensión perfecta de cualquier repositorio
- coordinación multiagente madura de extremo a extremo

Si algo de eso se quiere defender, debe apoyarse en benchmarks, pruebas o integración real versionada.

## Documentos fundacionales de esta nueva etapa

- [docs/DOCUMENTO_UNICO_1_PORCIENTO.md](docs/DOCUMENTO_UNICO_1_PORCIENTO.md) — Documento único para el 1%: auditoría completa, precios (9.99 vs 99.99), comparativa agentes IA, definición del sistema
- [docs/PITCH_1_PORCIENTO.md](docs/PITCH_1_PORCIENTO.md) — Resumen ejecutivo para pitch final
- [docs/OWNERSHIP_ESTRATEGICO.md](docs/OWNERSHIP_ESTRATEGICO.md) — DobackSoft = producto; Artificial World = laboratorio; juego = demo
- [docs/FRONTERA_CONTRATOS.md](docs/FRONTERA_CONTRATOS.md) — Contratos versionados (session, route, event, report)
- [docs/NARRATIVA_MAESTRA.md](docs/NARRATIVA_MAESTRA.md)
- [docs/ARQUITECTURA_CONCEPTUAL.md](docs/ARQUITECTURA_CONCEPTUAL.md)
- [docs/PRINCIPIOS_EDITORIALES.md](docs/PRINCIPIOS_EDITORIALES.md)
- [docs/ROADMAP_BASE.md](docs/ROADMAP_BASE.md)
- [docs/DOCUMENTO_FINAL.md](docs/DOCUMENTO_FINAL.md) — **Documento definitivo**
- [docs/ARTIFICIAL_WORD_CRONOGRAMA.md](docs/ARTIFICIAL_WORD_CRONOGRAMA.md) — Cronograma real, GitHub, motor creador de mundos
- [docs/MODO_FUNDADOR.md](docs/MODO_FUNDADOR.md)
- [docs/MANIFIESTO.md](docs/MANIFIESTO.md)

## Documentación por audiencia

- Técnica: [docs/ESENCIAL.md](docs/ESENCIAL.md), [AGENTE_ENTRANTE.md](AGENTE_ENTRANTE.md)
- Producto / dirección: [docs/DOCUMENTACION_COMPLETA.md](docs/DOCUMENTACION_COMPLETA.md)
- Estrategia: [docs/ESTRATEGIA_PRODUCTO.md](docs/ESTRATEGIA_PRODUCTO.md)
- Visión previa: [docs/VISION_CIVILIZACIONES_VIVAS.md](docs/VISION_CIVILIZACIONES_VIVAS.md)
- Relato ampliado: [docs/PAQUETE_RELATO/NARRATIVA_MAESTRA.md](docs/PAQUETE_RELATO/NARRATIVA_MAESTRA.md)
- Exploración general: [docs/CONOCE_ARTIFICIAL_WORLD.md](docs/CONOCE_ARTIFICIAL_WORLD.md)
- Ruta recomendada de prueba: [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md)
- IA local y automatización: [docs/IA_LOCAL_BASE.md](docs/IA_LOCAL_BASE.md)
- Auditoría Chess (agentes Docker): [docs/SISTEMA_CHESS.md](docs/SISTEMA_CHESS.md)
- Plan de acción: [docs/PLAN_ACCION.md](docs/PLAN_ACCION.md)

## Regla editorial central

Artificial World puede hablar en grande, pero no puede prometer por encima de su evidencia. La ambición es obligatoria. La confusión no.

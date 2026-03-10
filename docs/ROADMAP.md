# Roadmap — Artificial World

> Documento maestro único. Sustituye a `ROADMAP_BASE.md`, `ROADMAP_TECNICO.md` y `ROADMAP_V2.md`.  
> **Actualizado:** 2026-03-08

---

## Estado actual — qué existe hoy

| Componente | Estado | Evidencia |
|------------|--------|-----------|
| Motor Python 2D | ✅ Real | `principal.py`, 13 acciones, SQLite |
| Modo Sombra | ✅ Real | `gestor_modo_sombra.py`, tests |
| Web fullstack | ✅ Funcional | Backend 3001, Frontend 5173 |
| HeroRefuge | ✅ Real | 9 semillas, flujo fundador, SQLite |
| DobackSoft demo | ✅ Real | Cupón, Fire Simulator, VisorRuta2D |
| IA local (Ollama) | ✅ Parcial | `aiCore.js`, `/api/ai/*` |
| Minijuegos | ✅ Real | TicTacToe, Damas |
| Panel Admin | ✅ Real | `AdminPanel.jsx`, ruta `#admin` |
| Deploy VPS | ✅ Real | Docker + Nginx, `187.77.94.167:3001` |
| CI GitHub | ✅ Real | Tests, deploy Pages, deploy VPS |
| 11 suites Python | ✅ Real | `run_tests_produccion.py` |
| DobackSoft v2 (StabilSafe) | ✅ Repo separado | `dobackv2/` — producto B2B completo |
| Sistema Chess (auditoría) | ✅ Real | 6 agentes Docker independientes |
| 3D runtime | ❌ Roadmap | — |
| Integración Python/JS | ❌ Roadmap | — |
| Dispositivo Doback HW | ❌ Roadmap | — |

---

## Fase actual — Fase 3: Civilizaciones vivas

**Objetivo:** que el refugio fundacional evolucione con memoria, historia y héroes observables.

### En progreso

| Tarea | Prioridad |
|-------|-----------|
| Refactorizar `FireSimulator.jsx` (936 líneas → <300) | Alta |
| Tests para las 13 acciones Python individuales | Alta |
| Persistencia del mundo y agentes en SQLite | Media |
| SSL/Dominio en VPS | Media |

### Deuda técnica activa (Chess detectó)

| Archivo | Problema | Severidad |
|---------|---------|-----------|
| `FireSimulator.jsx` | 936 líneas (límite 300) | Media |
| `SimulationCanvas.jsx` | 461 líneas | Media |
| `SimulationView.jsx` | 422 líneas | Media |
| `HeroRefugePanel.jsx` | 379 líneas | Media |
| `MCOverview.jsx` | 331 líneas | Media |
| Cobertura tests Python | 25% (umbral: 30%) | Media |

---

## Fase 4 — Motor multi-mundo (próxima)

**Objetivo:** varios jugadores pueden tener mundos simultáneos independientes con su propio tick loop.

| Entregable | Descripción |
|------------|-------------|
| Engine multi-mundo | Cada mundo tiene su tick loop aislado |
| WebSocket scoped | El cliente elige qué mundo observar |
| Persistencia agentes | `worlds`, `agents`, `refuges` en SQLite |
| Rate limiting por tier | Límites reales según suscripción |
| Eventos emergentes | Tormentas, migraciones, descubrimientos |
| Estadísticas históricas | Gráficas de evolución del mundo |

---

## Fase 5 — Experiencia fundador completa

**Objetivo:** un usuario nuevo entiende, crea y disfruta en menos de 5 minutos.

| Entregable | Descripción |
|------------|-------------|
| Animaciones onboarding | Transiciones entre pasos |
| Logros/achievements | Sistema de desbloqueos |
| Ajedrez | Completar el tercer minijuego |
| "Unirme con código" | Acceso compartido con link |
| App ejecutable Windows actualizada | `.exe` con versión web integrada |

---

## Fase 6 — Escala y monetización real

**Objetivo:** cuando haya usuarios reales, escalar con control.

| Entregable | Descripción |
|------------|-------------|
| SSL + dominio propio | Certbot, Nginx, DNS |
| Stripe en producción | Pagos reales activados |
| CI/CD automático | GitHub Actions → deploy VPS en cada push |
| Monitoring | Uptime, errores, métricas |
| Backups SQLite | Automáticos, diarios |
| CDN assets | Estáticos servidos desde CDN |

---

## Fase 7 — Integración Python ↔ JS

**Objetivo:** el motor Python y el motor JS son verificablemente equivalentes.

| Entregable | Descripción |
|------------|-------------|
| Tests de equivalencia | Misma semilla → mismo resultado en Python y JS |
| Puente Python/JS | API o protocolo de comunicación documentado |
| Modo híbrido | Frontend web + motor Python como backend real |

---

## Fase 8 — Civilizaciones 3D (largo plazo)

**Objetivo:** encarnación visual de la tesis en 3D.

| Entregable | Descripción |
|------------|-------------|
| Runtime 3D | Three.js o Babylon.js |
| Assets procedurales | Refugios, terrenos, agentes |
| Sincronización | Motor 2D → render 3D (2D es la verdad, 3D es la piel) |

**Regla invariable:** La lógica de civilización vive en 2D. El 3D solo renderiza lo que el motor 2D decide.

---

## Fase DobackSoft — independiente

DobackSoft v2 (StabilSafe V3) tiene su propio roadmap en `dobackv2/`. Las sinergias con Artificial World:

| Sinergia | Estado | Fase sugerida |
|----------|--------|---------------|
| Hub AW → enlace DobackSoft v2 | Pendiente | Fase 5 |
| Datos reales dispositivo Doback | Pendiente | Largo plazo |
| Narrativa cruzada (refugio = destino de misión) | Visión | Fase 7+ |
| Librería npm de visor de rutas | Evaluando | Fase 6 |

---

## Decisiones de arquitectura (registro)

| Decisión | Elección | Razón |
|----------|---------|-------|
| Base de datos principal | SQLite | Sin servidor externo, suficiente para MVP |
| Auth | `playerId` en localStorage | Sin fricción de registro |
| Pagos | Stripe (test activado) | Estándar de la industria |
| Deploy | Docker single-container | Un solo comando para actualizar |
| Frontend routing | Hash-based (`#`) | Sin configurar servidor para SPA |
| WebSocket | `ws` nativo | Ligero, sin dependencias extra |
| Motor IA | Python (utilidad, sin LLMs) | Determinista, auditable, sin coste de API |
| IA local | Ollama + llama3.2 | Sin costes de API, privacidad, funciona offline |
| Repos separados | AW + dobackv2 | Ciclos de release distintos, stacks distintos |

---

## Convenciones de commit

```
feat:      nueva funcionalidad
fix:       corrección de bug
refactor:  reestructuración sin cambio funcional
docs:      solo documentación
test:      solo tests
chore:     mantenimiento, dependencias, CI
```

---

*Este documento es el único roadmap activo. Ver `CHANGELOG.md` para historial de cambios completados.*

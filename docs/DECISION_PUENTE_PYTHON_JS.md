# Decisión: Puente Python / JavaScript

> Documento de decisión arquitectónica. Estado actual y opciones futuras.

---

## Situación actual

| Motor | Tecnología | Uso |
|-------|------------|-----|
| **Python** | pygame, SQLite | Simulación principal, persistencia, Modo Sombra |
| **JavaScript** | Node + React | Demo web, HeroRefuge, mundos ligeros |

**No existe integración técnica** entre ambos. Son dos motores separados.

---

## Opciones evaluadas

### Opción A — Mantener dos motores separados

| Pros | Contras |
|------|---------|
| Estado actual, sin cambios | Duplicación de lógica |
| Cada uno optimizado para su contexto | Narrativa fragmentada |
| Bajo riesgo | Dos verdades a mantener |

**Recomendación:** Viable si se documenta claramente y el flujo fundador web es suficiente.

---

### Opción B — Exponer Python por API

| Pros | Contras |
|------|---------|
| Un solo núcleo de simulación | Esfuerzo de implementación |
| Web como frontend del motor real | FastAPI + mantenimiento |
| Persistencia y memoria unificadas | Latencia y despliegue |

**Recomendación:** Solo si hay necesidad fuerte de unificar experiencia (ej. mismo mundo en pygame y web).

---

### Opción C — Usar web solo como showcase

| Pros | Contras |
|------|---------|
| Encaja con estado actual | Web no demuestra motor Python |
| Foco en motor Python como golden path | HeroRefuge sigue con motor JS propio |
| Bajo coste | — |

**Recomendación:** **Elegida a corto plazo.** Documentado en [docs/ESTRATEGIA_PRODUCTO.md](ESTRATEGIA_PRODUCTO.md).

---

## Decisión vigente

**Corto plazo:** Opción C. Web = showcase. Motor Python = producto real.

**Futuro:** Revisar si Opción B aporta valor cuando el flujo fundador esté consolidado.

---

## Referencias

- [docs/ESTRATEGIA_PRODUCTO.md](ESTRATEGIA_PRODUCTO.md)
- [docs/MODOS_EJECUCION.md](MODOS_EJECUCION.md)
- [docs/ARTIFICIAL_WORD_CRONOGRAMA.md](ARTIFICIAL_WORD_CRONOGRAMA.md)

# Artificial World — Documento final

> Documento definitivo del proyecto. Una sola lectura para entender todo.

**Fecha:** 2026  
**Repositorio:** artificial-word  
**Marca:** Artificial World  

---

## Resumen ejecutivo

**Artificial World** es una base para crear civilizaciones vivas con memoria, héroes, refugios y comunidades. La verdad estratégica vive en 2D; la encarnación 3D es capa futura.

**Tesis:** *Empieza con un refugio. Elige una semilla. Mira nacer tu civilización.*

**Objetivo final:** Motor creador de mundos compacto y reutilizable.

---

## 1. Qué existe hoy (verificado)

| Componente | Estado | Evidencia |
|------------|--------|-----------|
| Motor Python 2D | Real | `principal.py`, 13 acciones, persistencia SQLite |
| Modo Sombra | Real | `gestor_modo_sombra.py`, tests |
| Web fullstack | Demo | Backend 3001, Frontend 5173 |
| HeroRefuge | Parcial | 7 semillas, mundos ligeros, companion IA |
| Panel Administrador | Real | `AdminPanel.jsx`, ruta `#admin` |
| DobackSoft | Demo | UI en hub, FireSimulator |
| IA local | Parcial | `aiCore.js`, Ollama, `/api/ai/*` |
| CI GitHub | Real | Tests, deploy Pages, deploy VPS |
| 11 suites Python | Real | `run_tests_produccion.py` |

### Qué no existe

- 3D runtime
- Integración Python/JS
- DobackSoft comercial completo en este repo

---

## 2. Cómo ejecutar

### Motor Python (golden path)

```powershell
pip install -r requirements.txt
python principal.py
```

### Demo web

```powershell
.\scripts\iniciar_fullstack.ps1
```

### Tests

```powershell
$env:SDL_VIDEODRIVER="dummy"; $env:SDL_AUDIODRIVER="dummy"
python pruebas/run_tests_produccion.py
python pruebas/verificar_todo.py
cd backend; npm test
cd frontend; npm test
```

---

## 3. Flujo fundador (web)

1. **Semilla** — Elige una de 7 civilizaciones (tribu, tecnócrata, espiritual, guerrero, comerciante, paranoica, decadente)
2. **Constructor** — Tu nombre
3. **Refugio** — Nombre (sugerido por semilla) o personalizado
4. **Listo** — Mundo creado con comunidad fundadora y crónica inicial

**Tiempo:** < 2 minutos.

---

## 4. Estructura del proyecto

```
principal.py              Motor Python
nucleo/                   Orquestación
agentes/                  Decisión por utilidad
acciones/                 13 tipos de acción
sistemas/                 Persistencia, Modo Sombra, watchdog
backend/src/              API, HeroRefuge, motor JS
frontend/src/             React, Landing, Hub, Admin
pruebas/                  run_tests_produccion, verificar_todo
docs/                     Documentación
```

---

## 5. Modelo conceptual

| Entidad | Descripción |
|---------|-------------|
| World | Contenedor global |
| CivilizationSeed | Valores, tensiones, arquetipo |
| Refuge | Unidad base de supervivencia |
| Hero | Agente histórico |
| Community | Agrupación viva |
| MemoryEntry | Registro de memoria |
| HistoricalRecord | Evento histórico |

**Flujo:** semilla → refugio → civilización naciente.

---

## 6. Regla 2D / 3D

- **2D** = Verdad sistémica (implementada)
- **3D** = Encarnación futura (roadmap)

---

## 7. GitHub

- **CI:** `ci-completo.yml`, `pipeline.yml`
- **Deploy:** Pages (docs), VPS (rsync + docker)
- **Secrets:** SSH_HOST, SSH_USER, SSH_PRIVATE_KEY

---

## 8. Documentación

| Documento | Uso |
|-----------|-----|
| [ARTIFICIAL_WORLD_COMPLETO.md](ARTIFICIAL_WORLD_COMPLETO.md) | **Documento único para web** — integra todo |
| [DOCUMENTO_UNICO.md](DOCUMENTO_UNICO.md) | Referencia detallada |
| [ARTIFICIAL_WORD_CRONOGRAMA.md](ARTIFICIAL_WORD_CRONOGRAMA.md) | Cronograma, GitHub, motor creador |
| [DEMO_2_MINUTOS.md](DEMO_2_MINUTOS.md) | Guía para demo/vídeo |
| [INDEX_DOCUMENTACION.md](INDEX_DOCUMENTACION.md) | Índice completo |
| [EVIDENCIAS_ARTIFICIAL_WORLD.pdf](EVIDENCIAS_ARTIFICIAL_WORLD.pdf) | PDF con evidencias |

---

## 9. Regla de foco

Cada cambio debe responder:

**¿Fortalece o distrae de "crear un refugio inicial y ver nacer una civilización"?**

Si distrae → posponer.

---

## 10. Criterio de éxito

Una persona nueva entiende en menos de 5 minutos:

- qué es real
- qué es demo
- qué debe probar primero

---

*artificial-word — El repositorio. Artificial World — La tesis. Motor creador de mundos — El destino.*

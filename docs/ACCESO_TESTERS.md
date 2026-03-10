# Acceso para Testers — Artificial World

> Documento de acceso para grupo reducido de evaluadores.  
> Implementación desde 0. 3 días. Todo observable en tiempo real.

---

## Qué van a ver

**Artificial World** es un motor creador de civilizaciones vivas.  
Una persona elige una semilla de civilización, construye un refugio, y ve nacer su mundo con héroes, comunidades y memoria histórica.

**Estado actual en esta demo:** implementación activa. No es un producto terminado — es un motor funcionando que crece en tiempo real.

---

## Acceso rápido

| Entorno | URL | Notas |
|---------|-----|-------|
| **Demo web** | `http://[HOST]:5173` | Flujo fundador completo |
| **API backend** | `http://[HOST]:3001/api` | REST + WebSocket |
| **Panel admin** | `http://[HOST]:5173/#admin` | Acceso total |
| **Reporte auditoría** | `http://[HOST]:5173/chess-output/REPORTE_CHESS_1.md` | Auditoría independiente |

> El equipo os enviará la IP/host cuando el entorno esté levantado.

---

## Flujo fundador (< 2 minutos)

1. **Abre la demo** → botón "Crear mundo"
2. **Elige una semilla de civilización:**
   - Tribu nómada
   - Tecnócrata
   - Espiritual
   - Guerrero
   - Comerciante
   - Paranoia colectiva
   - Decadente
3. **Escribe tu nombre** como constructor fundador
4. **Nombra tu refugio** (o acepta la sugerencia)
5. **Listo** — tu civilización nace con comunidad fundadora y crónica inicial

---

## Qué evaluar

Valoramos feedback sobre cualquier cosa, especialmente:

- **Fluidez** — ¿El flujo de creación se entiende solo?
- **Coherencia** — ¿Las semillas de civilización se sienten distintas?
- **Credibilidad** — ¿Parece real o parece demo?
- **Potencial** — ¿Dónde lo llevarías tú?

No hay respuestas correctas. Es observación honesta.

---

## El sistema por dentro (para quien quiera verlo)

### Motor de simulación Python

```
principal.py          ← entrada
nucleo/simulacion.py  ← orquestador principal
agentes/              ← IA por utilidad (13 decisiones posibles)
acciones/             ← atacar, comer, explorar, refugio, compartir...
```

**Cómo correrlo:**
```powershell
python principal.py
```

### Web fullstack

```
backend/src/          ← Node.js / Express / WebSocket
frontend/src/         ← React / Tailwind
```

### Sistema de auditoría independiente (Chess)

6 agentes dockerizados que auditan el proyecto sin acceso de escritura:

```
agent-docs      → documentación y claims
agent-backend   → API, logging, URLs
agent-frontend  → React, accesibilidad
agent-bd        → schema, migraciones
agent-tests     → cobertura y calidad
agent-marketing → narrativa y pitch
coordinator     → agrega todo → REPORTE_CHESS_1.md
```

**Para lanzar la auditoría completa:**
```powershell
docker compose -f docker/docker-compose.full.yml --profile audit up
```

El reporte queda en `docker/chess-output/REPORTE_CHESS_1.md`.

---

## Contexto estratégico

| Componente | Estado |
|------------|--------|
| Motor Python 2D | ✅ Real — 13 acciones, persistencia SQLite |
| Modo Sombra | ✅ Real — simulación sin renderizado |
| Web fullstack | 🟡 Demo funcional |
| HeroRefuge | 🟡 Parcial — 9 semillas, flujo fundador |
| IA local | 🟡 Parcial — Ollama conectado |
| 3D runtime | 📋 Roadmap |

**La verdad estratégica vive en 2D. El 3D es la encarnación futura.**

---

## Preguntas, feedback o problemas

Contacto directo con el equipo. Sin formularios, sin burocracia.  
Tenéis acceso total — explorad lo que queráis.

---

*Artificial World — Constrúyelo. Habítalo. Haz que crezca.*

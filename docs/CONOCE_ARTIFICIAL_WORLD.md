# Artificial World — Conócelo. Pruébalo. Adóptalo.

> **Dos páginas** para que cualquiera entienda qué es, por qué importa y cómo empezar.

**Ownership:** Artificial World es laboratorio local y open source. DobackSoft es el producto principal (repo dobackv2). El juego/FireSimulator es superficie de demo y entrenamiento. Ver [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md).

---

## Página 1 — La idea

### No persigas la IA. Construye un mundo que la necesite.

**Artificial World** es una simulación de vida artificial 2D donde los agentes piensan, recuerdan y se relacionan. Sin LLMs. Sin coste por decisión. Todo corre local.

### ¿Por qué existe?

Los personajes de muchos juegos no recuerdan. No evolucionan. No reaccionan a lo que hiciste. Los LLMs dan vida al texto, pero cuestan por uso, añaden latencia y son impredecibles. Para mundos con muchos NPCs, no escalan.

**Artificial World** ofrece otra vía: IA por utilidad, memoria espacial y social, relaciones que cambian con cada interacción. Determinista, trazable y gratis.

### ¿Qué hace?

| Característica | Descripción |
|----------------|-------------|
| **13 acciones** | Mover, comer, compartir, robar, huir, atacar, explorar… |
| **Memoria** | Cada agente recuerda recursos, refugios y entidades vistas |
| **Relaciones** | Confianza, miedo, hostilidad que evolucionan |
| **Modo Sombra** | Toma el control de un agente y juega por turnos |
| **Persistencia** | Guarda y carga el mundo en SQLite |

### ¿Para quién?

- **Estudios indie** que quieren NPCs creíbles sin presupuesto de API
- **Juegos de simulación** con muchos agentes
- **Educación** — ver cómo funciona la IA por utilidad
- **Investigación** — motor abierto y modificable

---

## Página 2 — Pruébalo y únete

### Pruébalo en 3 minutos

| Opción | Cómo | Ideal para |
|--------|------|------------|
| **Demo web** | `.\scripts\iniciar_fullstack.ps1` → http://localhost:5173 | Probar sin instalar |
| **Versión completa** | `python principal.py` | Motor completo, Modo Sombra |
| **Ejecutable Windows** | `.\build_exe.ps1` → `dist\MundoArtificial.exe` | Usuarios sin Python |
| **Landing interactiva** | `python principal.py --web` | Ver demo en navegador |

### Comparativa rápida

| | LLM-based | Artificial World |
|---|-----------|------------------|
| Coste | $ por token | Cero |
| Latencia | 100–500 ms | < 1 ms |
| Determinismo | No | Sí |
| Memoria persistente | Limitada | Sí |
| Control del diseñador | Bajo | Total |

### Cómo adoptarlo

1. **Prueba** — Ejecuta la demo web o descarga el .exe
2. **Explora** — Revisa el código en GitHub
3. **Adapta** — Usa el motor en tu proyecto (Python o Node)
4. **Contribuye** — Issues, PRs, documentación

### Enlaces

- **Repositorio** — Añade aquí la URL de tu repo (ej. `github.com/tu-usuario/artificial-word`)
- **Documentación** — `docs/ESENCIAL.md` (2 páginas técnicas)
- **Relato para dirección e inversores** — `docs/PAQUETE_RELATO/` (dossier, brief, manifiesto)
- **Landing** — `artificial-world.html` o despliega en GitHub Pages

---

<div align="center">

**Artificial World**

*Constrúyelo. Habítalo. Haz que crezca.*

</div>

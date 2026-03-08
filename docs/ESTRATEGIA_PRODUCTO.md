# Estrategia de producto — Artificial World

**Decisión:** Python como motor principal, Web como demo y puerta de entrada.

**Fecha:** Marzo 2025

---

## 1. Decisión

| Componente | Rol | Prioridad |
|------------|-----|-----------|
| **Python (principal.py)** | Motor completo, producto principal | P0 |
| **Web (fullstack)** | Demo, landing, puerta de entrada | P1 |
| **DobackSoft** | Producto B2B integrado en web | P1 |

---

## 2. Justificación

### Python como motor principal

- **13 acciones** con IA por utilidad (mover, comer, compartir, robar, huir, atacar, etc.)
- **Modo Sombra** — control manual de una entidad
- **Relaciones sociales** — confianza, miedo, hostilidad
- **Memoria espacial** — recursos y refugios vistos
- **Persistencia** SQLite
- **Modo competencia** y watchdog
- **68+ tests** pasando
- **`.exe`** listo para Windows
- **VPS** con Docker + noVNC — acceso completo desde navegador

### Web como demo

- Sin instalación, compartir por URL
- Base para DobackSoft y minijuegos
- Motor simplificado (Gather → Decide → Move → Combat → Reproduce)
- Estado en memoria (no persistente)

---

## 3. Próximos pasos

### Corto plazo (Python)

- [ ] Completar FASE 2 del plan de producción (manejo de errores)
- [ ] Completar FASE 4 (CI en cada commit)
- [ ] Documentar diferencia demo vs completo en la web

### Medio plazo (Web)

- [ ] Añadir persistencia al backend (SQLite o schema existente)
- [ ] Banner/tooltip "Versión demo — versión completa: descarga .exe"
- [ ] Enlace a descarga del .exe desde la landing

### Largo plazo (Híbrido)

- [ ] Evaluar API que exponga el motor Python al frontend web
- [ ] O: portar lógica crítica del motor a JS si la web crece

---

## 4. Criterios de éxito

| Métrica | Objetivo |
|---------|----------|
| Python | `.exe` funcional, tests verificar_todo OK |
| Web | Demo estable, sin errores en consola |
| Documentación | PROYECTO_GUIA.md actualizado, ESTRATEGIA_PRODUCTO.md visible |

---

## 5. Referencias

- [PROYECTO_GUIA.md](PROYECTO_GUIA.md) — Guía técnica
- [MODOS_EJECUCION.md](MODOS_EJECUCION.md) — Python vs Fullstack
- [PRODUCCION_PLAN.md](../PRODUCCION_PLAN.md) — Fases de producción

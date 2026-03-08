# Puertos y productos — Artificial World vs DobackSoft

> Aclaración de puertos y nombres para evitar confusión.

---

## Artificial World (este repo)

| Servicio | Puerto | Uso |
|----------|--------|-----|
| Backend | **3001** | API REST, WebSocket |
| Frontend | **5173** | Vite dev server |

**Inicio:** `.\scripts\iniciar_fullstack.ps1`

---

## DobackSoft (repo dobackv2)

| Servicio | Puerto | Uso |
|----------|--------|-----|
| Backend | **9998** | StabilSafe V3 API |
| Frontend | **5174** | Vite dev server |

**Inicio:** `.\iniciar.ps1` (en el repo dobackv2)

---

## Resumen

| Producto | Backend | Frontend |
|----------|---------|----------|
| **Artificial World** | 3001 | 5173 |
| **DobackSoft** | 9998 | 5174 |

No confundir: `.cursorrules` y reglas de DobackSoft usan 9998/5174. Las reglas de este repo (AGENTS.md) usan 3001/5173.

---

## Nombre del proyecto

- **Artificial World** — Nombre oficial del proyecto (este repo).
- Evitar "Artificial Word" en documentación nueva.

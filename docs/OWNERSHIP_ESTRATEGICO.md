# Ownership estratégico — Artificial World y DobackSoft

> **Documento maestro.** Define quién es qué en el ecosistema. Toda documentación pública, landing, pitch o comunicación debe respetar esta jerarquía.

---

## Decisión oficial

| Marca | Rol | Ubicación principal | Qué vende |
|-------|-----|----------------------|------------|
| **DobackSoft** | Producto principal / empresa | Repo `dobackv2` (StabilSafe V3) | Plataforma B2B multi-tenant de estabilidad y telemetría vehicular (CAN/GPS) |
| **Artificial World** | Laboratorio / plataforma hermana | Este repo | Infraestructura local, auditable y open source para comprensión, documentación, copilotos, memoria y pruebas de agentes |
| **Juego / FireSimulator** | Superficie de demo y entrenamiento | Este repo (módulo dentro de Artificial World) | Demostración, formación, storytelling; no núcleo de negocio |

---

## Reglas de ownership

### DobackSoft es el producto principal

- DobackSoft se vende como producto de empresa.
- El producto comercial completo vive en `dobackv2` (StabilSafe V3).
- En este repo, DobackSoft aparece como **vertical demo** integrada en el showcase de Artificial World.
- No se debe presentar este repo como si contuviera el DobackSoft comercial completo.

### Artificial World es el laboratorio

- Artificial World se vende como infraestructura local y auditable para entender proyectos, crear memoria operativa y coordinar inteligencias.
- Sirve como sandbox, copiloto, auditoría documental y base metodológica para DobackSoft.
- No compite con DobackSoft como producto B2B.
- No absorbe la identidad enterprise de DobackSoft.

### El juego es superficie, no núcleo

- FireSimulator y superficies jugables son capa de demo, entrenamiento y storytelling.
- Documento detallado: [docs/SUPERFICIE_JUEGO.md](SUPERFICIE_JUEGO.md).
- Se alimentan con exportaciones o datasets controlados desde DobackSoft.
- No son el producto principal ni la razón de ser del negocio.

---

## Relación entre ambos

```
DobackSoft (producto)  ──exporta──►  Contratos (session, route, event, report)
                                            │
Artificial World (laboratorio)  ◄──lee/audita──  Contratos
                                            │
Juego / FireSimulator  ◄──consume──  Datasets exportados
```

---

## Qué implica en la práctica

- **No fusionar** marcas ni repositorios por ahora.
- **No convertir** Artificial World en el producto B2B principal.
- **No dejar** DobackSoft como simple "módulo del juego".
- **Sí usar** Artificial World como sistema local de auditoría, comparación, documentación viva y copiloto para DobackSoft.
- **Sí usar** el juego como demostración, entrenamiento y storytelling con rutas o datasets exportados desde DobackSoft.

---

## Referencias

- [docs/FRONTERA_CONTRATOS.md](FRONTERA_CONTRATOS.md) — Frontera oficial de interoperabilidad (session, route, event, report)
- [docs/REALIDAD_VS_VISION.md](REALIDAD_VS_VISION.md) — Tabla de claims permitidos y prohibidos
- [docs/PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md](PLAN_INTEGRACION_DOBACKSOFT_ARTIFICIAL_WORLD.md) — Plan de integración por contratos
- [docs/PROMPT_AGENTE_DOBACKSOFT.md](PROMPT_AGENTE_DOBACKSOFT.md) — Relación Artificial World ↔ DobackSoft para agentes

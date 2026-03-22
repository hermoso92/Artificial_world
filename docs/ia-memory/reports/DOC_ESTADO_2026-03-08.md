# Estado de Documentación — 2026-03-08

> Generado por `scripts/populate-docs.js`

---

## Módulos del proyecto

| Módulo | Existe | Archivos fuente | Docs OK | Docs faltantes |
|--------|--------|-----------------|---------|----------------|
| Motor Python | ✅ | 1/1 | 1 | ✅ 0 |
| Backend Node | ✅ | 1/1 | 1 | ✅ 0 |
| Frontend React | ✅ | 1/1 | 1 | ✅ 0 |
| HeroRefuge | ✅ | 2/2 | 0 | ✅ 0 |
| IA Local (aiCore) | ✅ | 2/2 | 1 | ✅ 0 |
| Docker / Agentes Chess | ✅ | 1/1 | 1 | ✅ 0 |
| Tests Python | ✅ | 0/0 | 0 | ✅ 0 |

---

## Documentos clave

| Documento | Descripción | Estado | Líneas | Última modificación |
|-----------|-------------|--------|--------|---------------------|
| `docs/DOCUMENTO_FINAL.md` | Estado real del proyecto | ✅ | 162 | 2026-03-08 |
| `docs/DOCUMENTO_UNICO.md` | Referencia técnica completa | ✅ | 241 | 2026-03-08 |
| `docs/ESENCIAL.md` | Guía de 2 páginas | ✅ | 94 | 2026-03-08 |
| `docs/MODOS_EJECUCION.md` | Python vs Web | ✅ | 180 | 2026-03-08 |
| `docs/VISION_CIVILIZACIONES_VIVAS.md` | Tesis de producto | ✅ | 311 | 2026-03-08 |
| `docs/ESTRATEGIA_PRODUCTO.md` | Estrategia y próximos pasos | ✅ | 162 | 2026-03-08 |
| `docs/ARTIFICIAL_WORD_CRONOGRAMA.md` | Cronograma y GitHub | ✅ | 218 | 2026-03-08 |
| `docs/SISTEMA_CHESS.md` | Sistema de auditoría Chess | ✅ | 199 | 2026-03-08 |
| `docs/ia-memory/README.md` | IA local — memoria y prompts | ✅ | 22 | 2026-03-08 |
| `docs/backend/README.md` | Backend — API reference | ✅ | 72 | 2026-03-08 |
| `docs/frontend/README.md` | Frontend — componentes | ✅ | 68 | 2026-03-08 |
| `README.md` | README principal del repo | ✅ | 224 | 2026-03-08 |

---

## Problemas detectados (0)

✅ Sin problemas detectados.

---

## Instrucciones

- Para crear READMEs faltantes: `node scripts/populate-docs.js --fix`
- Para auditar todo el proyecto: `docker compose -f docker/docker-compose.full.yml --profile audit up`
- Para ejecutar en 3 entornos paralelos (tests + prod + audit): ver `docs/SISTEMA_CHESS.md`

# Changelog — Correcciones post-auditoría integral

**Fecha:** 2026-03-09  
**Origen:** [docs/AUDITORIA_INTEGRAL_AW.md](AUDITORIA_INTEGRAL_AW.md)

Este documento registra todas las correcciones aplicadas tras la auditoría integral del ecosistema Artificial World.

---

## 1. Drift factual corregido

### 1.1 Semillas de civilización: 7 → 9

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/LandingPublic.jsx` | ECOSYSTEM_SURFACES: "7 semillas" → "9 semillas" en descripción de simulación |
| `frontend/src/components/LandingPublic.jsx` | Stats hero: valor "7" → "9" en semillas de civilización |

**Evidencia:** `backend/src/simulation/civilizationSeeds.js` define 9 seeds: frontier-tribe, technocrat-refuge, spiritual-community, warrior-kingdom, merchant-city, paranoid-colony, decadent-empire, tryndamere-champion, synthesis-ai.

### 1.2 Suites de tests: 10 → 11

| Archivo | Cambio |
|---------|--------|
| `docs/DOCUMENTACION_COMPLETA.md` | "10 suites" → "11 suites" |
| `docs/DOCUMENTACION_COMPLETA.md` | Añadida fila `test_cronica_fundacional` en tabla de suites |
| `docs/DOCUMENTACION_COMPLETA.md` | "runner principal de 10 suites" → "runner principal de 11 suites" |

**Evidencia:** `pruebas/run_tests_produccion.py` ejecuta 11 suites (incluye test_cronica_fundacional).

---

## 2. Claims prohibidos eliminados

### 2.1 Latencia "< 1 ms"

| Archivo | Cambio |
|---------|--------|
| `docs/CONOCE_ARTIFICIAL_WORLD.md` | Comparativa LLM vs AW: "Latencia | 100–500 ms | < 1 ms" → "Latencia | 100–500 ms | Determinista (sin coste por token)" |

**Motivo:** REALIDAD_VS_VISION.md prohíbe el claim "< 1 ms" sin benchmark o evidencia versionada.

### 2.2 "100% de funcionalidades operan correctamente"

| Archivo | Cambio |
|---------|--------|
| `docs/VERIFICACION_ECOSISTEMA_AW.md` | "Documentar que el 100% de las funcionalidades operan correctamente" → "Documentar el estado verificable del ecosistema. Cada funcionalidad debe poder comprobarse por logs y capturas de pantalla." |

**Motivo:** Claim demasiado fuerte sin evidencia continua; el documento debe describir el proceso de verificación, no afirmar resultados absolutos.

---

## 3. Alineación narrativa Mission Control

| Archivo | Cambio |
|---------|--------|
| `frontend/src/locales/es/translation.json` | missioncontrol_subtitle: "Observatorio · Vista operativa" → "Centro operativo · Agentes y gateways" |
| `frontend/src/locales/es/translation.json` | missioncontrol_desc: "habitantes" → "agentes, tareas, runs y gateways. Dashboard, boards kanban, feed en vivo y approvals humanas." |
| `frontend/src/locales/es/translation.json` | missioncontrol_f2–f4: alineados con UI real (agents, event feed, approvals) |
| `frontend/src/locales/en/translation.json` | Mismos cambios en inglés |
| `frontend/src/locales/de/translation.json` | Mismos cambios en alemán; missioncontrol_title: "Observatorium" → "Mission Control" |
| `frontend/src/locales/fr/translation.json` | Mismos cambios en francés; missioncontrol_title: "Observatoire" → "Mission Control" |
| `frontend/src/locales/pt/translation.json` | Mismos cambios en portugués; missioncontrol_title: "Observatório" → "Mission Control" |
| `frontend/src/components/LandingPublic.jsx` | ECOSYSTEM_SURFACES missioncontrol: "Observatorio" → "Centro operativo para agentes, tareas y gateways" |

**Motivo:** La UI real (MissionControlShell) muestra "OpenClaw Air Traffic Control" y centro operativo para agentes/gateways. La narrativa "observatorio de habitantes" no coincidía con la implementación.

---

## 4. Horizons export — DobackSoft como demo

| Archivo | Cambio |
|---------|--------|
| `horizons-export-54563100-2f1a-4d10-b236-7472880f753f/apps/web/src/components/DobackSoftSection.jsx` | Título: "DobackSoft StabilSafe V3" → "DobackSoft — Demo vertical" |
| Mismo archivo | Subtítulo: "Plataforma B2B de telemetría vehicular CAN/GPS" → "Vertical demo integrada en Artificial World" |
| Mismo archivo | Descripción: "Multi-tenant. Producto comercial real." → "Estabilidad, telemetría CAN/GPS y FireSimulator. El producto comercial completo vive en dobackv2. Aquí: demo conectada al ecosistema." |

**Motivo:** OWNERSHIP_ESTRATEGICO.md define que en este repo DobackSoft es vertical demo; el producto completo vive en dobackv2. El export de Horizons no debe vender producto comercial completo.

---

## 5. Resumen de archivos modificados

| Archivo | Tipo de cambio |
|---------|----------------|
| `frontend/src/components/LandingPublic.jsx` | Drift factual, Mission Control desc, semillas |
| `docs/DOCUMENTACION_COMPLETA.md` | Suites 10→11 |
| `docs/CONOCE_ARTIFICIAL_WORLD.md` | Claim latencia eliminado |
| `docs/VERIFICACION_ECOSISTEMA_AW.md` | Claim 100% suavizado |
| `frontend/src/locales/es/translation.json` | Mission Control locales |
| `frontend/src/locales/en/translation.json` | Mission Control locales |
| `frontend/src/locales/de/translation.json` | Mission Control locales |
| `frontend/src/locales/fr/translation.json` | Mission Control locales |
| `frontend/src/locales/pt/translation.json` | Mission Control locales |
| `horizons-export-54563100-2f1a-4d10-b236-7472880f753f/apps/web/src/components/DobackSoftSection.jsx` | DobackSoft como demo |

---

## 6. Barrido adicional — 7 semillas y 10 suites en resto del repo

Tras la corrección inicial, se buscaron y corrigieron todas las menciones restantes:

### 7 semillas → 9 semillas

| Archivo | Cambio |
|---------|--------|
| `docs/ARTIFICIAL_WORLD_COMPLETO.md` | HeroRefuge: 7 → 9 semillas |
| `docs/ARTIFICIAL_WORLD_COMPLETO.html` | Idem |
| `docs/ROADMAP.md` | HeroRefuge: 7 → 9 semillas |
| `docs/ACCESO_TESTERS.md` | HeroRefuge: 7 → 9 semillas |
| `docs/DOCUMENTO_FINAL.md` | HeroRefuge: 7 → 9 semillas |
| `docs/ARTIFICIAL_WORLD_EDICION_DEFINITIVA.md` | "7 seeds" → "9 seeds" |
| `docs/ARTIFICIAL_WORD_CRONOGRAMA.md` | CivilizationSeed: 7 → 9 semillas; lista ampliada |
| `docs/CV_Antonio_Hermoso_Gonzalez.md` | HeroRefuge y features: 7 → 9 semillas |
| `docs/CV_Antonio_Hermoso_Gonzalez.tex` | Idem |
| `portfolio.tex` | 7 → 9 semillas |
| `docs/PROMPT_FUNDACIONAL_DEFINITIVO.md` | Métricas y tabla: 7 → 9 semillas |
| `docs/PROMPT_FUNDACIONAL_DEFINITIVO.html` | Idem |
| `docs/PROMPT_HORIZONS_V2.md` | 3 ocurrencias: 7 → 9 semillas |
| `docs/PROMPT_HORIZONS_V2.html` | Idem |
| `docs/PROMPT_HORIZONS_COMPACTO.md` | 2 ocurrencias: 7 → 9 semillas |
| `docs/PROMPT_HORIZONS_COMPACTO.html` | Idem |
| `scripts/generar-pdf-paper-definitivo.js` | Captión figura: 7 → 9 semillas |
| `scripts/generar-paper-v3.js` | Captión figura: 7 → 9 semillas |
| `docs/PAPER_FINAL.html` | Tabla arquitectura: 7 → 9 semillas |
| `docs/paper.html` | Idem |
| `docs/artificial_world_book.html` | arch-chip: 7 → 9 semillas |
| `horizons-export/.../EcosistemaSection.jsx` | 7 → 9 semillas |
| `horizons-export/.../ConceptoSection.jsx` | 7 → 9 semillas |

### 10 suites → 11 suites

| Archivo | Cambio |
|---------|--------|
| `docs/DOCUMENTACION_COMPLETA.md` | Tabla: "Ejecuta 10 suites" → "Ejecuta 11 suites" |
| `docs/ESTRATEGIA_PRODUCTO.md` | "10 suites" → "11 suites" |

---

## 8. Referencias

- [docs/AUDITORIA_INTEGRAL_AW.md](AUDITORIA_INTEGRAL_AW.md) — Auditoría completa
- [docs/REALIDAD_VS_VISION.md](REALIDAD_VS_VISION.md) — Tabla de claims permitidos y prohibidos
- [docs/OWNERSHIP_ESTRATEGICO.md](OWNERSHIP_ESTRATEGICO.md) — DobackSoft = producto; AW = laboratorio; juego = demo

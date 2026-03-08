# Mejoras aplicadas al paquete de relato

**Fecha:** Marzo 2025

---

## Objetivo

Completar el paquete documental con mejoras identificadas tras la implementación inicial:

1. Enlace al paquete desde el README principal
2. Nota sobre modelos locales (Ollama) en el dossier
3. Unificación del nombre "Artificial World" en documentación pública

---

## Cambios realizados

### 1. README principal

- Añadida sección "Documentación para dirección e inversores" con enlace a `docs/PAQUETE_RELATO/`
- Permite que visitantes nuevos encuentren el dossier, brief y manifiesto desde la raíz del proyecto

### 2. Dossier ejecutivo (DOCUMENTO_1)

- Añadida nota en sección "Qué hace de verdad" o "Flujos verificados":
  - El motor de simulación no usa LLMs
  - HeroRefuge (módulo web) puede usar Ollama local opcional para conversación
  - El núcleo de agentes funciona sin modelos externos

### 3. Unificación Artificial World

- `docs/landing_content.md`: "Artificial Word" → "Artificial World" en tabla comparativa
- `docs/ARTIFICIAL_WORD_ENGINE.md`: Título y referencias alineadas con "Artificial World" (el archivo conserva nombre por compatibilidad)
- Otros docs públicos que usaban "Artificial Word" como nombre del producto principal

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| README.md | Enlace a docs/PAQUETE_RELATO/ |
| docs/PAQUETE_RELATO/DOCUMENTO_1_DOSSIER_EJECUTIVO.md | Nota Ollama/modelos locales |
| docs/landing_content.md | Artificial World |
| docs/ARTIFICIAL_WORD_ENGINE.md | Artificial World Engine |

---

## Referencias

- Plan original: paquete_relato_artificial
- NARRATIVA_MAESTRA.md: convenciones de mensaje

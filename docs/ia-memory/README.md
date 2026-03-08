# IA Memory

Esta carpeta define la memoria local, simple y versionada del `ai-core`.

Objetivo:
- dar contexto estable a operaciones locales de IA sin depender de servicios externos
- mantener artefactos legibles por una sola programadora
- separar claramente laboratorio, demo y puentes futuros

Contenido:
- `technical-decisions.md`: decisiones técnicas y límites actuales
- `prompts.json`: prompts base versionados por operación
- `frequent-failures.json`: fallos frecuentes y pasos de diagnóstico
- `glossary.md`: vocabulario común del repositorio
- `reports/`: convenciones de reportes generados
- `session-examples/`: ejemplos mínimos de sesión/ruta para demos y pruebas

Reglas:
- si algo no está implementado en código, debe aparecer como `demo`, `externo` o `roadmap`
- no usar vector DB, multiagente ni sincronización remota en esta capa
- todo debe poder editarse con Markdown o JSON plano

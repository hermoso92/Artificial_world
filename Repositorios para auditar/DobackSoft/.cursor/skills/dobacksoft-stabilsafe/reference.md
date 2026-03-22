# DobackSoft V3 — Referencia detallada

Consultar cuando haga falta detalle por módulo, métricas por área o la checklist completa de verificación.

## Checklist obligatoria por cambio

- [ ] ¿Respeta modularidad?
- [ ] ¿El módulo está en el menú oficial V3?
- [ ] ¿Scroll solo donde es necesario?
- [ ] ¿Comparadores correctos (solo Estabilidad o solo CAN/GPS)?
- [ ] ¿Roles aplicados (ADMIN/MANAGER)?
- [ ] ¿Flujo Subida→Exportación respetado?
- [ ] ¿Exportación PDF en 1 clic disponible?
- [ ] ¿Usa `config/api.ts` en lugar de URLs hardcodeadas?
- [ ] ¿Usa `logger` en lugar de `console.log`?
- [ ] ¿Incluye filtro `organizationId`?
- [ ] ¿Compatible con `iniciar.ps1`?

## Módulos y requisitos por área

### Panel de Control
- KPIs protagonistas (disponibilidad, tiempos, rotativo, incidencias, km, costes). Modo TV Wall: KPIs grandes, colores, sin menús. Bloques secundarios: mantenimiento, alertas, tendencias. Emergencias no es módulo; se refleja en KPIs.

### Estabilidad
- Métricas: horas de conducción, km recorridos, tiempo rotativo (clave 2/5), incidencias (leves, graves, críticas), eventos críticos. Visualización: gráficas, mapa eventos GPS, colores por severidad. Comparador solo entre sesiones de estabilidad. PDF en 1 clic con métricas, gráficas, mapa y análisis IA.

### Telemetría
- CAN + GPS en un solo módulo con pestañas: Datos CAN, Mapa GPS, Alarmas configurables, Comparador CAN/GPS. Alarmas con umbrales por variable. Mapas con puntos GPS coloreados por evento.

### Inteligencia Artificial
- Un módulo tipo copiloto: Chat IA, Patrones detectados, Recomendaciones. IA genera reportes PDF automáticos. Sugerencias explicadas.

### Geofences
- CRUD zonas. Eventos: entrada/salida, tiempo dentro, violaciones. Integración en mapa de Telemetría. Alertas automáticas ligadas a geofences.

### Operaciones
- Unifica Eventos, Alertas y Mantenimiento. Alertas: severidad, reglas configurables, notificaciones (push/email). Mantenimiento: preventivo, correctivo, predictivo. Vista calendario + historial.

### Subida de archivos
- Formulario o FTP. Extraer ID de archivo. Si vehículo no existe, ofrecer crearlo. Asociar a sesión por día/hora/ID. Errores claros (sin ID, duplicados, corruptos).

### Exportación
- PDF en 1 clic desde Panel, Sesiones, IA, comparadores. Incluir métricas, gráficas y análisis IA.

### Roles
- ADMIN: acceso total. MANAGER: solo su empresa y flota. No otros roles.

## Inicio del sistema: iniciar.ps1

- Script único: libera puertos 9998 y 5174, verifica archivos, inicia backend y frontend en ventanas separadas, comprueba que respondan, abre navegador y muestra credenciales. Para conflicto de puertos o reinicio, usar siempre `iniciar.ps1`.

## Búsquedas y análisis

- Preferir búsqueda semántica; grep cuando se conozca el nombre exacto. Leer bloques amplios; analizar imports y dependencias antes de modificar. Verificar estructura de carpetas antes de crear archivos; leer documentación existente; comprobar compatibilidad con reglas DobackSoft.

## Plan ejecutable (brainstorming / análisis Cursor-ready)

Cuando el objetivo sea producir un **plan implementable** (no solo ideas), la salida debe incluir estos tres bloques obligatorios:

1. **Verificaciones obligatorias en repo**
   - Rutas exactas → componente(s) (archivo real).
   - Endpoints usados (path exacto), hook/service que los llama, y si aplican `organizationId` y roles.
   - Confirmar comparador correcto (Estabilidad vs CAN/GPS) donde aplique.

2. **Feature elegida + diseño en 1 página**
   - Una sola feature; no varias.
   - Ruta, componente(s), reuso (p. ej. visor con `?sessionId=`).
   - Contratos API (request/response) o cambio en payload existente; archivos a tocar; criterios de aceptación.
   - Sin proponer endpoints nuevos sin haber comprobado antes que no existe uno equivalente.

3. **Checklist V3 pasada**
   - Cada ítem de la checklist obligatoria con ✅/❌ y motivo breve.

Además:
- **Anti-invención:** Si no hay evidencia en repo, el output debe decir "BLOQUEADO: falta confirmar X" y proponer cómo confirmarlo (buscar en repo). Toda llamada API debe poder pasar por `config/api.ts`. Todo endpoint debe considerar roles y `organizationId`. Nada fuera del menú oficial V3.
- **Slices:** Si se baja a implementación, definir MVP (1–2 commits), luego fases; criterios de aceptación por fase; tests mínimos (unit/integración/e2e y no regresión).

Ejemplo de documento que cumple este formato: `docs/plans/2026-02-08-dashboard-formacion-verificaciones-diseno.md`.

## Verificación en navegador (MCP)

Cuando el usuario pida comprobar algo en el navegador (p. ej. Swagger UI, login, una pantalla), usar el MCP de navegador disponible en el proyecto:

- **cursor-ide-browser**: `browser_tabs` (list) → `browser_navigate` a la URL → `browser_lock` → `browser_snapshot` para ver contenido y refs → interacciones si hace falta → `browser_unlock`. No hacer lock antes de navigate; si ya hay pestaña, hacer lock primero.
- **chrome-devtools** (user-chrome-devtools): `list_pages` → `navigate_page` (type: url, url: por ejemplo `http://localhost:9998/api-docs/`) → `take_snapshot` para ver el árbol a11y y comprobar texto (p. ej. que no salga "No operations defined in spec!"). Opcional: `list_network_requests` para ver si `spec.json` devuelve 200.

URLs útiles: Swagger UI `http://localhost:9998/api-docs/`, spec crudo `http://localhost:9998/api-docs/spec.json`, frontend `http://localhost:5174`. Backend debe estar en 9998 y frontend en 5174 (el usuario usa `iniciar.ps1`; no iniciar servicios por cuenta propia).

## Reglas técnicas

- **API**: `frontend/src/config/api.ts`, headers `organizationId`, variables de entorno para URLs, timeout configurable.
- **Logging**: niveles info/error/warn/debug; captura de errores con contexto.
- **Seguridad**: cookies httpOnly JWT, CSRF, S3 presigned SSE-KMS, filtrado por organización. Reporte de vulnerabilidades: SECURITY.md en la raíz del repo.
- **Performance**: lazy loading, tree-shaking, componentes <300 líneas, bundle <300 KB sin justificar.

## GitHub (Actions, PRs, Dependabot)

- **CI:** `.github/workflows/ci.yml` — build backend/frontend, tests, Prisma (schema en raíz `prisma/schema.prisma`). Se ejecuta solo en push a `main` y en PRs que tengan como base `main`.
- **PRs:** Plantilla en `.github/PULL_REQUEST_TEMPLATE.md` con checklist DobackSoft. Validación en `pr-validation.yml` (título, archivos prohibidos, console.log, URLs hardcodeadas).
- **Dependabot:** `.github/dependabot.yml` — revisor/asignado: hermoso92. Repo: hermoso92/DobackSoft. Configuración: `.github/CONFIGURACION_GITHUB_ACTIONS.md`.

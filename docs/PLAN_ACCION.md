# Plan de acción — Artificial World

> Documento maestro con el plan a seguir. Generado a partir del análisis de implementación vs documentación.

**Fecha:** 2026-03-08  
**Versión:** 1.0

---

## 1. Resumen ejecutivo

Este plan recoge las acciones recomendadas para cerrar las brechas entre lo implementado y lo documentado, y para completar las piezas pendientes del Sistema Chess.

| Prioridad | Acción | Estado |
|-----------|--------|--------|
| Alta | Añadir Chess al README y DOCUMENTO_UNICO | ✅ Hecho |
| Alta | Crear docs/backend/README.md | ✅ Hecho |
| Alta | Crear docs/frontend/README.md | ✅ Hecho |
| Alta | Definir índice de API | ✅ Hecho |
| Media | Pipeline contenedor privado Chess | ✅ Hecho |
| Media | Integración WeTransfer / Transfer.sh | ✅ Hecho |
| Media | Página aceptación términos | ✅ Hecho |
| Baja | Ampliar reglas auditoría por agente | ✅ Hecho |
| Baja | Resolver inconsistencias (puertos, nombres) | ✅ Hecho |

---

## 2. Acciones completadas

### 2.1 Chess en README y DOCUMENTO_UNICO

- Enlace a `docs/SISTEMA_CHESS.md` en la sección de documentación.
- Mención de `run_chess_audit.ps1` para auditoría automatizada.
- Inclusión en DOCUMENTO_UNICO sección de documentos adicionales.

### 2.2 docs/backend/README.md

- Estructura de carpetas `backend/src/`.
- Rutas montadas: `/api`, `/api/ai`, `/api/hero`, `/api/dobacksoft`, `/api/subscription`, `/api/admin`.
- Scripts: `npm start`, `npm test`.
- Variables de entorno relevantes.
- Enlace al índice de API.

### 2.3 docs/frontend/README.md

- Estructura de carpetas `frontend/src/`.
- Componentes principales: Hub, HeroRefuge, DobackSoft, AdminPanel.
- Scripts: `npm run dev`, `npm run build`, `npm test`.
- Configuración: `config/api.js`, puerto 5173.

### 2.4 docs/API_INDEX.md

- Índice único de todos los endpoints `/api/*`.
- Agrupado por módulo: api, ai, hero, dobacksoft, subscription, admin.
- Método, ruta, descripción breve.

---

## 3. Acciones pendientes

### 3.1 Pipeline contenedor privado (Sistema Chess)

**Objetivo:** Aplicar las mejoras del reporte en un contenedor Docker exclusivo del cliente.

**Tareas:**
1. Definir Dockerfile base que copie el repo auditado.
2. Script que aplique parches/mejoras según `reporte-completo.json`.
3. Build de imagen con tag único por cliente.
4. Export a tar o push a registry privado.

**Documento:** `docs/SISTEMA_CHESS.md` sección 4 (Fase 3).

### 3.2 Integración WeTransfer

**Objetivo:** Enviar al cliente el enlace de descarga del contenedor.

**Opciones:**
- WeTransfer API (si existe plan adecuado).
- Alternativas: Transfer.sh, S3 presigned URL, Google Drive API.

**Tareas:**
1. Evaluar APIs disponibles.
2. Implementar servicio de subida.
3. Generar enlace con expiración.
4. Enviar email con enlace (opcional).

### 3.3 Página de aceptación de términos

**Objetivo:** El cliente acepta condiciones antes de acceder al contenedor.

**Condiciones clave:**
- Autorización para usar información (código, patrones, hallazgos) en entrenamiento.
- Propiedad del código sigue siendo del cliente.

**Tareas:**
1. Crear página HTML/React con términos.
2. Checkbox + botón "Acepto".
3. Registrar aceptación (timestamp, IP, email si aplica).
4. Solo tras aceptación, mostrar/enviar enlace.

### 3.4 Ampliar reglas de auditoría ✅

Implementado:
- agent-docs: detección de enlaces rotos en markdown.
- agent-frontend: imágenes sin atributo `alt`.

---

## 4. Inconsistencias resueltas

| Problema | Acción recomendada |
|----------|--------------------|
| Puertos 9998/5174 vs 3001/5173 | Aclarar en docs: 9998/5174 = DobackSoft (dobackv2); 3001/5173 = Artificial World |
| "Artificial Word" vs "Artificial World" | Unificar a "Artificial World" en toda la documentación |
| Estructura core/ vs mundo/ | Actualizar architecture.md con relación real |

---

## 5. Criterios de éxito

- [ ] Un desarrollador nuevo encuentra Chess en el README en menos de 2 minutos.
- [ ] Backend y frontend tienen README con estructura y scripts.
- [ ] Existe un único documento que lista todos los endpoints API.
- [ ] El flujo Chess completo (auditoría → reporte → mejoras → contenedor → WeTransfer → términos) está operativo.

---

## 6. Generar PDF del plan

```powershell
node scripts/generar-pdf-plan.js
```

Salida: `docs/PLAN_ACCION.pdf`

## 7. Referencias

| Documento | Propósito |
|-----------|-----------|
| [docs/SISTEMA_CHESS.md](SISTEMA_CHESS.md) | Sistema Chess completo |
| [docs/DOCUMENTO_UNICO.md](DOCUMENTO_UNICO.md) | Documento único del proyecto |
| [docs/ESENCIAL.md](ESENCIAL.md) | Guía esencial 2 páginas |
| [docs/API_INDEX.md](API_INDEX.md) | Índice de API |
| [docs/backend/README.md](backend/README.md) | Backend estructura |
| [docs/frontend/README.md](frontend/README.md) | Frontend estructura |
| [docs/PUERTOS_Y_PRODUCTOS.md](PUERTOS_Y_PRODUCTOS.md) | Puertos AW vs DobackSoft |
| [docs/PLAN_ACCION.pdf](PLAN_ACCION.pdf) | PDF de este plan |

### Scripts Chess

| Script | Uso |
|--------|-----|
| `run_chess_audit.ps1` | Auditoría completa |
| `chess_apply_build.ps1` | Construir contenedor privado |
| `chess_upload_transfer.ps1` | Subir tar a Transfer.sh |

### Página de términos

`/chess-terminos.html` — Aceptación de condiciones antes de descargar.

---

*Artificial World — Constrúyelo. Habítalo. Haz que crezca.*

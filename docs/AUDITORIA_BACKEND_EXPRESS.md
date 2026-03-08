# Auditoría Backend Express — Artificial Word

**Fecha:** 2025-03-08  
**Stack:** Express 4.21 + better-sqlite3 + ws  
**Rutas:** `api.js`, `heroRefuge.js`, `dobacksoft.js`

---

## 1. Resumen

El backend sigue una arquitectura REST razonable con rutas organizadas, middleware de validación y error centralizado. Hay **problemas críticos** que deben corregirse antes de producción: código de debug activo, ausencia de Helmet/rate limiting, y secretos hardcodeados. La estructura mezcla handlers en rutas con servicios y lógica de simulación, sin capa de controladores explícita.

| Área | Estado | Notas |
|------|--------|-------|
| Diseño REST | ✅ Aceptable | Verbos correctos, códigos coherentes |
| Middleware | ⚠️ Parcial | Falta Helmet, rate limit, CORS restrictivo |
| Errores | ✅ Bueno | errorHandler centralizado, ApiError |
| Debug en prod | 🔴 Crítico | `import('fs')` + `appendFileSync` en api.js |
| Seguridad | ⚠️ Riesgos | COUPON_CODE hardcodeado, CORS abierto |
| Estructura | ⚠️ Mejorable | Sin controllers, lógica en rutas |

---

## 2. Cumplimiento Express Best Practices

### 2.1 Diseño REST

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Verbos HTTP | ✅ | GET (lectura), POST (crear), DELETE (eliminar) usados correctamente |
| Códigos de estado | ✅ | 200, 201, 404, 422, 429, 500 coherentes |
| Formato de respuesta | ✅ | `{ success, data }` / `{ success: false, error: {...} }` consistente |
| 404 API | ✅ | Handler para rutas API no registradas |
| Health check | ✅ | `/health` y `/api/health` |

**Ejemplos correctos:**
- `POST /blueprints` → 201 Created
- `POST /refuges` → 201 o 429 (límite)
- `ApiError` con códigos y statusCode

### 2.2 Middleware

| Middleware | Estado | Observación |
|------------|--------|-------------|
| `express.json()` | ✅ | Presente |
| `cors()` | ⚠️ | Sin opciones → permite cualquier origen |
| `errorHandler` | ✅ | Centralizado, formatea errores |
| `asyncHandler` | ✅ | Envuelve async y pasa errores a `next` |
| `requireBody` | ⚠️ | Usa `throw` en lugar de `next(err)` |
| `validateBlueprint` | ⚠️ | Mismo patrón |
| Helmet | ❌ | No instalado |
| Rate limiting | ❌ | No implementado |
| Morgan/Winston | ⚠️ | Logger custom, sin HTTP request logging |

### 2.3 Manejo de errores

- **errorHandler.js**: Formato estándar, logging por severidad, `x-request-id` soportado.
- **asyncHandler**: Captura rechazos de promesas y llama a `next(err)`.
- **Problema**: `requireBody` y `validateBlueprint` usan `throw` en lugar de `next(err)`. En Express 4, un `throw` síncrono en middleware puede no llegar al errorHandler y provocar crash. Se recomienda `next(new ApiError(...))`.

### 2.4 Bloques catch

| Archivo | Línea | Problema |
|---------|-------|----------|
| `api.js` | 48, 89, 116 | `catch {}` vacío en bloques de debug |
| `eventStore.js` | 96, 146, 171, 184 | `catch` retorna null/[]/0 sin log |
| `diagnostics.js` | 28 | `catch` retorna `''` sin log |

Los de `eventStore` y `diagnostics` son aceptables si el fallo es recuperable; los de `api.js` forman parte del código de debug que debe eliminarse.

---

## 3. Issues de seguridad

### 3.1 Críticos

| Issue | Ubicación | Descripción |
|-------|-----------|-------------|
| Código de debug en producción | `api.js:48, 89, 116` | `import('fs').then(fs => { try { fs.appendFileSync('debug-cc0b57.log', ...) } catch {} })` — escribe en disco en cada request, expone datos internos |
| Secreto hardcodeado | `dobacksoft/store.js:9` | `COUPON_CODE = 'FUNDADOR1000'` — debe estar en variable de entorno |

### 3.2 Altos

| Issue | Ubicación | Descripción |
|-------|-----------|-------------|
| CORS sin restricción | `server.js:26` | `app.use(cors())` permite cualquier origen |
| Sin Helmet | — | No hay cabeceras de seguridad (X-Content-Type-Options, etc.) |
| Sin rate limiting | — | Vulnerable a DoS por request flooding |

### 3.3 Medios

| Issue | Ubicación | Descripción |
|-------|-----------|-------------|
| `ownerId` en query string | `api.js:192` | `ownerId` en `req.query` para DELETE — puede ser sensible |
| `express.json()` sin límite | `server.js:27` | Payloads grandes pueden consumir memoria |
| `validate` lanza en lugar de `next(err)` | `validate.js` | Riesgo de crash no controlado |

### 3.4 SQL Injection

- **eventStore.js**: Usa prepared statements con `?` y parámetros. ✅ Correcto.
- **better-sqlite3**: Prepared statements en todo el código. ✅ Sin riesgo.

### 3.5 Validación de inputs

- `validateBlueprint`: valida `name` y `traits`.
- `requireBody`: comprueba que body sea objeto JSON.
- Otros endpoints: validación parcial (ej. `Number()`, `isNaN`). Falta esquema más robusto (ej. express-validator, Zod) para endpoints sensibles.

---

## 4. Recomendaciones prioritarias

### P0 — Inmediatas

1. **Eliminar código de debug** en `api.js`:
   - Líneas 47–49 (GET /world)
   - Líneas 87–88 (POST /refuges)
   - Líneas 114–116 (POST /refuge/select)

2. **Mover `COUPON_CODE`** a variable de entorno:
   ```javascript
   const COUPON_CODE = process.env.DOBACKSOFT_COUPON_CODE || 'FUNDADOR1000';
   ```

### P1 — Corto plazo

3. **Instalar y configurar Helmet**:
   ```bash
   npm install helmet
   ```
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

4. **Añadir rate limiting**:
   ```bash
   npm install express-rate-limit
   ```
   ```javascript
   import rateLimit from 'express-rate-limit';
   app.use('/api', rateLimit({ windowMs: 60000, max: 100 }));
   ```

5. **Cambiar middleware de validación** para usar `next(err)`:
   ```javascript
   export function requireBody(req, res, next) {
     if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
       return next(new ApiError('VALIDATION_ERROR', 'Request body must be JSON object', 400));
     }
     next();
   }
   ```

### P2 — Medio plazo

6. **Configurar CORS** restrictivo en producción:
   ```javascript
   app.use(cors(corsOptions)); // origins: ['https://tu-dominio.com']
   ```

7. **Límite de body** para `express.json()`:
   ```javascript
   app.use(express.json({ limit: '100kb' }));
   ```

8. **Separar controladores** de rutas y extraer lógica a `controllers/` o `services/`.

9. **HTTP request logging** (Morgan o similar) para trazabilidad.

---

## 5. Production checklist

| Item | Estado |
|------|--------|
| Variables de entorno para secrets | ❌ COUPON_CODE hardcodeado |
| Helmet (security headers) | ❌ |
| CORS configurado | ❌ Permite todo |
| Rate limiting | ❌ |
| Límite de body JSON | ❌ |
| Error handling centralizado | ✅ |
| Logging estructurado | ✅ (logger) |
| Sin console.log en rutas | ✅ |
| Sin código de debug | ❌ |
| SQL con prepared statements | ✅ |
| Tests (Supertest) | ✅ |
| Health check | ✅ |


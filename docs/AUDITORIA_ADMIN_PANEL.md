# Auditoría — Panel Administrador (Modo Dios)

**Fecha:** 2025-03-08  
**Objetivo:** Garantizar que las operaciones de administración no borren tablas ni corrompan datos.

---

## 1. Resumen de persistencia

| Componente | Persistencia | Archivo/Tabla | Operaciones |
|------------|--------------|---------------|-------------|
| **Simulación** (World, refuges, agents) | In-memory | — | reset, delete refuge |
| **Hero Worlds** | In-memory | — | destroy world |
| **Subscriptions** | SQLite | subscriptions.db → subscriptions | UPDATE, SELECT |
| **DobackSoft** | In-memory | — | citizens count |
| **Audit** | SQLite | audit_simulacion.db → eventos_simulacion | INSERT, SELECT |

---

## 2. Operaciones permitidas (modo dios)

### 2.1 In-memory (sin riesgo para BD)

| Operación | Endpoint | Efecto | Riesgo |
|-----------|----------|--------|--------|
| Destruir mundo Hero | DELETE /api/hero/worlds/:id | Elimina 1 mundo del array | Ninguno |
| Destruir todos los mundos Hero | POST /api/admin/hero/worlds/wipe | Vacía array worlds | Ninguno |
| Reset simulación | POST /api/simulation/reset | Reinicia World, refuges, blueprints | Ninguno |
| Eliminar refugio | DELETE /api/admin/refuges/:index | Quita refugio del array | Ninguno |

### 2.2 SQLite — subscriptions.db

| Operación | Tabla | Query | Riesgo |
|-----------|-------|-------|--------|
| Cancelar suscripción | subscriptions | `UPDATE ... WHERE player_id = ?` | Bajo |
| Listar suscripciones | subscriptions | `SELECT *` | Ninguno |

**PROHIBIDO:** `DELETE FROM subscriptions` sin WHERE, `DROP TABLE`, `TRUNCATE`.

### 2.3 SQLite — audit_simulacion.db

| Operación | Tabla | Query | Riesgo |
|-----------|-------|-------|--------|
| Listar eventos | eventos_simulacion | `SELECT ... WHERE ... LIMIT` | Ninguno |
| Borrar eventos por sesión | eventos_simulacion | `DELETE WHERE session_id = ?` | Medio |
| Borrar eventos por rango tick | eventos_simulacion | `DELETE WHERE tick BETWEEN ? AND ?` | Medio |

**PROHIBIDO:** `DELETE FROM eventos_simulacion` sin WHERE, `DROP TABLE`, `TRUNCATE`.

---

## 3. Operaciones prohibidas (audit)

| Patrón | Acción |
|--------|--------|
| `DROP TABLE` | Rechazar siempre |
| `DELETE FROM tabla` (sin WHERE) | Rechazar |
| `TRUNCATE` | Rechazar |
| `ALTER TABLE` | Rechazar |
| `UPDATE tabla SET ...` (sin WHERE) | Rechazar |
| Cualquier SQL con `;` múltiple | Rechazar |

---

## 4. Autorización (admin)

- Solo los `player_id` en `ADMIN_PLAYER_IDS` (env, comma-separated) pueden acceder a `/api/admin/*`.
- Header: `X-Admin-Player-Id` o `playerId` en body para identificar al admin.
- Fallback: si no hay header, usar `playerId` de query/body.

---

## 5. Relación DobackSoft ↔ App completa

| Pregunta | Respuesta |
|----------|-----------|
| ¿Si DobackSoft funciona, funciona el 100%? | **No.** DobackSoft es un módulo independiente. La app tiene: simulación (World, refuges), Hero worlds, subscriptions, minijuegos, Mission Control. |
| ¿Qué comparten? | Backend Express, frontend React, routing. |
| ¿Qué es independiente? | DobackSoft usa su propio store (in-memory). La simulación usa World (in-memory). Subscriptions usa SQLite. |

---

## 6. Flujos de la aplicación

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                                  │
│  ├── Landing → Onboarding → Hub                                   │
│  ├── Hub → SimulationView (Tu Mundo) / Minigames / DobackSoft /  │
│  │         MissionControl / Emergencias                           │
│  ├── DobackSoft: cupón → código → Fire Simulator                  │
│  └── Admin: solo si playerId ∈ ADMIN_PLAYER_IDS                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Checklist de implementación

- [x] Middleware `requireAdmin` que verifica `playerId` en whitelist
- [x] Rutas `/api/admin/*` protegidas
- [x] Operaciones sin SQL raw (usar funciones del store)
- [x] Panel admin en frontend con ruta `#admin`
- [x] Documentación de variables de entorno

## 8. Uso

1. Añadir tu `playerId` a `ADMIN_PLAYER_IDS` en `.env`:
   ```
   ADMIN_PLAYER_IDS=player_abc123,player_xyz789
   ```
2. Obtener tu playerId: está en localStorage como `aw_player_id`, o en el footer del panel Admin al intentar acceder.
3. Acceder a `#admin` desde el Hub (enlace "Admin" en el footer).

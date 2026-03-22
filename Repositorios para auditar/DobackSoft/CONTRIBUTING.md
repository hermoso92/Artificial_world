# Contribuir a DobackSoft (StabilSafe V3)

## Antes de empezar

- **Reglas del proyecto:** [AGENTS.md](AGENTS.md) — multi-tenant, auth, DoD, rutas por ámbito.
- **Seguridad:** [SECURITY.md](SECURITY.md) — cómo reportar vulnerabilidades (no abrir issues públicos).
- **Inicio del sistema:** usar siempre `.\iniciar.ps1` (no arrancar backend/frontend a mano). Puertos: backend 9998, frontend 5174.

## Pull requests

1. Usa la [plantilla de PR](.github/PULL_REQUEST_TEMPLATE.md).
2. Cumple el **checklist DobackSoft** del PR: sin `console.log` (usar `logger`), sin URLs hardcodeadas (`config/api.ts`), filtro `organizationId`, TypeScript estricto, probado con ADMIN/MANAGER si aplica.
3. Los checks de GitHub Actions (CI, PR Validation) deben pasar.

## Convenciones de código

- Un archivo por cambio cuando sea posible; diff agrupado.
- Documentación nueva en `docs/` (por módulo en `docs/MODULOS/`), no en la raíz.
- Más detalle: [.cursor/skills/dobacksoft-stabilsafe/reference.md](.cursor/skills/dobacksoft-stabilsafe/reference.md).

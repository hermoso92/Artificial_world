# Política de seguridad

## Versiones soportadas

Se publican parches de seguridad para la rama **main** (y en su caso la rama **develop** indicada en el repositorio).

## Cómo reportar una vulnerabilidad

- **No** abras un issue público para vulnerabilidades de seguridad.
- Envía un correo o mensaje privado al equipo del proyecto describiendo el problema, pasos para reproducir y impacto estimado.
- Incluye si prefieres ser mencionado en el aviso de créditos.

El equipo responderá en un plazo razonable y coordinará la corrección y, si procede, la divulgación responsable.

## Buenas prácticas en el repositorio

- No subas `.env`, claves, tokens ni URLs sensibles (el CI intenta detectar patrones prohibidos).
- Usa `logger` en lugar de `console.log`; no dejes credenciales en logs.
- Las variables sensibles deben configurarse por entorno o secrets (p. ej. GitHub Actions Secrets), nunca en código.
- Endpoints públicos: solo login, register, refresh-token y health; el resto detrás de autenticación y filtro por organización.

## Configuración recomendada

- JWT en cookies httpOnly; CSRF habilitado.
- Rate limiting en `/api/auth`.
- Filtrado por `organizationId` en todos los datos multi-tenant.

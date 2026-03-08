# Secrets para GitHub Actions

Para que los deploys (Pages y VPS) funcionen, configura estos secrets en:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

---

## Deploy VPS (obligatorios)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `SSH_HOST` | IP o dominio del VPS | `187.77.94.167` o `srv1408715.hstgr.cloud` |
| `SSH_USER` | Usuario SSH | `root` |
| `SSH_PRIVATE_KEY` | Clave privada SSH completa (incluye `-----BEGIN...-----`) | Contenido de tu archivo `.pem` o `id_rsa` |
| `REMOTE_PATH` | (Opcional) Ruta en el VPS | `/opt/constructor-de-mundos` (por defecto) |

**Si faltan estos secrets**, el job Deploy VPS fallará con un mensaje claro.

---

## Deploy Pages

**No requiere secrets** si Pages ya está activo:

1. **Settings** → **Pages** → **Build and deployment**
2. **Source:** GitHub Actions
3. Guardar

Con eso basta; el pipeline usa `enablement: false` y el `GITHUB_TOKEN` por defecto.

---

## Cambios recientes (evitar que se cancelen los deploys)

- `cancel-in-progress: false` — los runs ya no se cancelan al hacer push; los deploys completan aunque haya nuevos commits.
- Si los deploys seguían sin ejecutarse, era porque un push posterior cancelaba el run anterior.

---

## Verificar

Tras configurar los secrets del VPS, haz un push a `main`. Los jobs **Deploy Pages** y **Deploy VPS** deberían ejecutarse. Si fallan, revisa los logs del job para ver el error concreto.

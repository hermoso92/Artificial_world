# Secrets para GitHub Actions

Para que los deploys (Pages y VPS) funcionen, configura estos secrets en:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

---

## Deploy VPS

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `SSH_HOST` | IP o dominio del VPS | `187.77.94.167` o `srv1408715.hstgr.cloud` |
| `SSH_USER` | Usuario SSH | `root` |
| `SSH_PRIVATE_KEY` | Clave privada SSH completa (incluye `-----BEGIN...-----`) | Contenido de tu archivo `.pem` o `id_rsa` |
| `REMOTE_PATH` | (Opcional) Ruta en el VPS | `/opt/constructor-de-mundos` (por defecto) |

---

## Deploy Pages

| Secret | Descripción |
|--------|-------------|
| `PAGES_TOKEN` | Personal Access Token con scope `repo` (para habilitar Pages vía API) |

Además, en **Settings** → **Pages** → **Build and deployment**:
- **Source:** GitHub Actions

---

## Verificar

Tras añadir los secrets, haz un push a `main`. Los jobs **Deploy Pages** y **Deploy VPS** deberían ejecutarse. Si fallan, revisa los logs del job para ver el error concreto.

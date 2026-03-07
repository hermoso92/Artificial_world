# Desplegar landing en GitHub Pages

**5 minutos.** La landing quedara en `https://TU_USUARIO.github.io/artificial-word/`

---

## Opcion A: Sin workflow (mas simple)

1. Ve a tu repo en GitHub
2. **Settings** > **Pages**
3. **Build and deployment** > **Source**: Deploy from a branch
4. **Branch**: main | **Folder**: /docs
5. **Save**

Listo. En 1-2 minutos la pagina estara en vivo.

---

## Opcion B: Con GitHub Actions

1. **Settings** > **Pages**
2. **Source**: GitHub Actions
3. Haz push a main (o ejecuta el workflow manualmente)

El workflow `.github/workflows/pages.yml` desplegara automaticamente.

---

## Antes de desplegar

1. **Cambia el email** en `docs/index.html`: busca `contacto@artificialword.io` y sustituye por tu email real
2. Si usas dominio propio: **Settings** > **Pages** > **Custom domain**

---

## URL final

- Con nombre repo `artificial-word`: `https://TU_USUARIO.github.io/artificial-word/`
- Con dominio custom: `https://artificialword.io` (configura CNAME)

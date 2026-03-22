# Auditoría Web Horizons (Hostinger) — Artificial World

**Fecha:** 2026-03-09  
**Objetivo:** Web creada con Hostinger Horizons (`web/`)  
**Dominio en vivo:** https://artificialworld.es

---

## 1. Resumen Ejecutivo

| Aspecto | Estado | Nota |
|---------|--------|------|
| **Código local** | ✅ Aceptable | Estructura limpia, sin branding Horizons en componentes |
| **Sitio en vivo** | ⚠️ Crítico | Muestra "Created with Hostinger Horizons" y "Use template" |
| **PWA** | ✅ Implementada | Manifest, SW, iconos SVG presentes |
| **SEO** | ⚠️ Parcial | Falta og-image.png, sitemap incompleto |
| **Reglas AGENTS.md** | ⚠️ Violaciones | console.log, console.warn suprimido |
| **Accesibilidad** | ✅ Buena base | ARIA, focus-visible, navegación por teclado |

---

## 2. Hallazgos Críticos

### 2.1 Sitio en vivo vs código local

**El sitio publicado en artificialworld.es muestra:**
- "Created with Hostinger Horizons"
- "Use template"

**El código en `web/src/` NO contiene estos textos.** Esto indica que:
- El sitio en vivo puede estar desplegado desde la plataforma Horizons directamente (no desde este repo), O
- Horizons inyecta estos elementos en runtime en el iframe/entorno de edición

**Acción:** Si el despliegue es vía Hostinger Horizons (no self-hosted), contactar soporte para eliminar el branding. Si se despliega desde este repo (VPS, Netlify, etc.), el código local está limpio.

### 2.2 FireSimulator vacío

```jsx
// web/src/components/FireSimulator.jsx
const FireSimulator = () => null;
export default FireSimulator;
```

La ruta `/fire` renderiza un componente placeholder. La página `FireSimulatorPage` existe pero el simulador no tiene lógica.

**Acción:** Implementar lógica o mostrar un aviso "Próximamente" con enlace al repo.

### 2.3 Imagen Open Graph ausente

`index.html` referencia:
```html
<meta property="og:image" content="/og-image.png" />
<meta property="twitter:image" content="/og-image.png" />
```

**No existe** `public/og-image.png`. Redes sociales y previews usarán una imagen por defecto o fallarán.

**Acción:** Crear `og-image.png` (1200×630 px recomendado) en `public/`.

---

## 3. Violaciones de Reglas del Proyecto (AGENTS.md)

### 3.1 Uso de `console.log`

| Archivo | Línea | Problema |
|---------|-------|----------|
| `src/main.jsx` | 11 | `console.log('SW registration failed:', err)` — debe usar `logger` |

### 3.2 Supresión global de `console.warn`

```javascript
// vite.config.js línea 268
console.warn = () => {};
```

Suprime **todos** los `console.warn` en desarrollo. Oculta advertencias de React, dependencias, etc.

**Acción:** Eliminar o restringir solo al contexto del iframe Horizons si es necesario para su integración.

---

## 4. SEO y Metadatos

| Elemento | Estado |
|---------|--------|
| `lang="es"` en `<html>` | ✅ |
| Meta description | ✅ |
| Open Graph básico | ✅ (falta imagen) |
| Twitter Cards | ✅ (falta imagen) |
| JSON-LD WebApplication | ✅ |
| `robots.txt` | ✅ |
| `sitemap.xml` | ✅ (incluye /dobacksoft) |
| Canonical / og:url | ✅ https://artificialworld.es |

**Sitemap:** Incluye 7 URLs. Falta verificar que todas las rutas SPA respondan correctamente con el fallback a `index.html` (`.htaccess` ya lo configura).

---

## 5. PWA

| Elemento | Estado |
|---------|--------|
| `manifest.webmanifest` | ✅ |
| `sw.js` | ✅ |
| Iconos 192/512 (SVG) | ✅ |
| Iconos maskable | ✅ |
| Registro SW en `main.jsx` | ✅ |

**Nota:** Algunos dispositivos iOS antiguos prefieren PNG. Los SVG son válidos para la mayoría de navegadores modernos.

---

## 6. Seguridad y Headers

| Aspecto | Estado |
|---------|--------|
| `X-Powered-By: Hostinger Horizons` | ⚠️ Expone stack (`.htaccess`) |
| Enlaces externos | ✅ `rel="noopener noreferrer"` |
| URLs hardcodeadas | ✅ No localhost ni IPs en src |
| postMessage `'*'` | ⚠️ En plugins Horizons (iframe) — aceptable en contexto de edición |

---

## 7. Accesibilidad (WCAG 2.1)

| Criterio | Estado |
|---------|--------|
| `aria-label` en enlaces/iconos | ✅ |
| `aria-current="page"` en nav | ✅ |
| `aria-expanded` en menú móvil | ✅ |
| `focus-visible:ring-2` | ✅ |
| `lang="es"` | ✅ |
| Skip link | ❌ No hay enlace "Saltar al contenido" |
| Contraste | ⚠️ Revisar manualmente (slate-300 sobre slate-950) |

**Recomendación:** Añadir skip link al inicio del body para usuarios de teclado.

---

## 8. Arquitectura y Código

| Aspecto | Estado |
|---------|--------|
| Rutas React Router | ✅ Bien definidas |
| AppLayout vs HomePage | ✅ Sin doble navbar (corregido en auditoría previa) |
| Componentes >300 líneas | ⚠️ Revisar `ArtificialWorldSimulator`, `TryndamereExperience` |
| Plugins Horizons | Solo en dev (`isDev`) — no afectan build de producción |

---

## 9. Checklist de Correcciones Prioritarias

| # | Acción | Prioridad | Estado |
|---|--------|-----------|--------|
| 1 | Deshabilitar inyección de banner Horizons en build | Alta | ✅ Aplicado (vite.config.js) |
| 2 | Crear `public/og-image.svg` para Open Graph | Alta | ✅ Aplicado (exportar a PNG 1200×630 si redes no soportan SVG) |
| 3 | Sustituir `console.log` por logger en `main.jsx` | Media | ✅ Aplicado |
| 4 | Revisar/eliminar `console.warn = () => {}` en vite.config.js | Media | ✅ Aplicado |
| 5 | Implementar FireSimulator o aviso "Próximamente" | Media | ✅ Aplicado |
| 6 | Añadir skip link para accesibilidad | Baja | ✅ Aplicado |
| 7 | Eliminar `X-Powered-By` en .htaccess | Baja | ✅ Aplicado |

---

## 10. Auditoría con Squirrel (opcional)

Para una auditoría automatizada de SEO, rendimiento, enlaces rotos y más de 230 reglas:

1. Instalar squirrel: https://squirrelscan.com/download  
2. Ejecutar: `squirrel audit https://artificialworld.es --format llm`  
3. Revisar el informe y aplicar correcciones sugeridas.

---

**Firma:** Auditoría manual de código y sitio en vivo.  
**Referencias:** AGENTS.md, AUDIT.md, DEPLOYMENT_SUMMARY.md, review-ux-ui skill, typescript-react-reviewer skill.

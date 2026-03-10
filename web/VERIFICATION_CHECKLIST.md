
# Checklist de Verificación - Artificial World

Utiliza este checklist antes y después de cada despliegue para asegurar la calidad y estabilidad del proyecto.

## 1. Checklist Pre-Despliegue

### Calidad de Código
- [ ] No hay errores ni advertencias en la consola de desarrollo.
- [ ] El comando `npm run build` se ejecuta sin errores.
- [ ] No hay dependencias no utilizadas o prohibidas.

### Rutas y Navegación
- [ ] `/` (Landing Page) carga correctamente.
- [ ] `/hub` muestra todas las tarjetas de superficie.
- [ ] `/games` muestra los juegos y permite interactuar con los activos.
- [ ] `/fire` carga el simulador de fuego.
- [ ] `/simulation` carga el simulador principal.
- [ ] `/paper` muestra la documentación.
- [ ] Redirecciones (ej. `/repo` a GitHub) funcionan.

### Enlaces
- [ ] Todos los enlaces internos funcionan y usan `<Link>` de React Router.
- [ ] Todos los enlaces externos se abren en una nueva pestaña (`target="_blank" rel="noopener noreferrer"`).
- [ ] No hay enlaces rotos (404).

### PWA (Progressive Web App)
- [ ] `manifest.webmanifest` es válido y está enlazado en `index.html`.
- [ ] Los 4 iconos SVG están presentes en `public/icons/`.
- [ ] `sw.js` se registra correctamente sin errores.
- [ ] La aplicación es instalable (verificado en Chrome DevTools).

### Diseño Responsivo
- [ ] **Móvil (375px):** Menú hamburguesa funciona, sin scroll horizontal, tarjetas en 1 columna.
- [ ] **Tablet (768px):** Diseño fluido, tarjetas en 2 columnas.
- [ ] **Escritorio (1920px):** Diseño centrado, tarjetas en 3 columnas, uso óptimo del espacio.

### Accesibilidad (A11y)
- [ ] Navegación por teclado (Tab) funciona en todos los elementos interactivos.
- [ ] Contraste de color cumple con WCAG AA.
- [ ] Botones sin texto tienen `aria-label`.
- [ ] Imágenes tienen atributos `alt` descriptivos.

### Funcionalidades
- [ ] **Simulador:** Controles de Play/Pause, Reset, Velocidad y Semilla funcionan.
- [ ] **Juegos:** 3 en Raya y Damas son jugables hasta el final.
- [ ] **Avisos:** El banner de advertencia en el simulador se puede cerrar y recuerda el estado (`sessionStorage`).

### Contenido y Honestidad
- [ ] No hay texto de plantillas genéricas ("Lorem ipsum", "Built with Horizons").
- [ ] Las etiquetas de estado (REAL, DEMO, PARCIAL, ROADMAP) son precisas.
- [ ] Las funciones no implementadas usan `ComingSoonSurface`.

### Rendimiento
- [ ] Las animaciones (Framer Motion) son fluidas.
- [ ] El canvas del simulador no bloquea el hilo principal.
- [ ] Los assets estáticos están optimizados.

---

## 2. Checklist Post-Despliegue

### Despliegue
- [ ] El dominio `artificialworld.es` resuelve correctamente.
- [ ] El certificado SSL/HTTPS está activo y es válido.

### Verificación en Producción
- [ ] Carga inicial rápida (Lighthouse score > 90 en Performance).
- [ ] Recargar una sub-ruta (ej. `/hub`) no devuelve error 404 (configuración de SPA en el servidor correcta).
- [ ] El Service Worker se instala y cachea los recursos.

### Monitorización Inicial
- [ ] Revisar la consola del navegador en producción para asegurar que no hay errores de red (CORS, 404 de assets).
- [ ] Probar la aplicación en al menos un dispositivo móvil real (iOS y Android).

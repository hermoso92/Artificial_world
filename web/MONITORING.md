
# Guía de Monitorización - Artificial World

Para asegurar que la aplicación mantiene un alto nivel de calidad y rendimiento en producción, se deben seguir estas prácticas de monitorización.

## 1. Revisiones Periódicas

### Revisiones Diarias (Post-Lanzamiento Inmediato)
- **Disponibilidad:** Verificar que `artificialworld.es` carga correctamente.
- **Consola de Errores:** Abrir la web y revisar la consola del navegador en busca de errores silenciosos.
- **Feedback de Usuarios:** Revisar menciones en redes sociales o issues en el repositorio de GitHub.

### Revisiones Semanales
- **Auditoría de Rendimiento:** Ejecutar Google Lighthouse en modo incógnito.
- **Prueba de Flujos Críticos:** Jugar una partida rápida, ejecutar el simulador y navegar por todas las páginas principales.
- **Revisión de Enlaces:** Comprobar que los enlaces externos (especialmente al repositorio de GitHub) siguen activos.

### Revisiones Mensuales
- **Actualización de Dependencias:** Revisar si hay actualizaciones críticas de seguridad en los paquetes de npm.
- **Revisión de Accesibilidad:** Ejecutar herramientas como WAVE o axe DevTools para asegurar que no se han introducido regresiones de accesibilidad.

## 2. Métricas Clave a Monitorizar (Core Web Vitals)

Utiliza herramientas como PageSpeed Insights o Chrome User Experience Report (CrUX) para medir:

- **LCP (Largest Contentful Paint):** Debe ser **< 2.5 segundos**. Mide el tiempo de carga del contenido principal.
- **FID / TTI (First Input Delay / Time to Interactive):** Debe ser **< 100 milisegundos**. Mide la capacidad de respuesta.
- **CLS (Cumulative Layout Shift):** Debe ser **< 0.1**. Mide la estabilidad visual (evitar saltos de contenido al cargar).
- **FCP (First Contentful Paint):** Debe ser **< 1.8 segundos**.

## 3. Herramientas Recomendadas

1. **Chrome DevTools:**
   - *Network tab:* Para monitorizar el tamaño de los bundles y tiempos de carga.
   - *Application tab:* Para verificar el estado del Service Worker y la PWA.
   - *Performance tab:* Para perfilar el rendimiento del canvas en el Simulador.

2. **Google Lighthouse:**
   - Integrado en Chrome DevTools. Útil para obtener una puntuación general de Rendimiento, Accesibilidad, Mejores Prácticas y SEO.

3. **WAVE / axe DevTools:**
   - Extensiones del navegador para auditorías profundas de accesibilidad (contraste, ARIA, estructura de encabezados).

4. **Analíticas (Opcional para el futuro):**
   - Si se decide implementar, herramientas respetuosas con la privacidad como Plausible o Umami pueden ayudar a entender qué superficies (Hub, Arena, Simulador) son las más visitadas.

5. **Monitorización de Errores (Opcional para el futuro):**
   - Integrar Sentry o LogRocket para capturar excepciones de JavaScript en los navegadores de los usuarios en tiempo real.

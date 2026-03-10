# Changelog

## [2.1.1] - 2026-03-05

### Corregido
- Todas las tildes y acentos en textos en español (popup, políticas de privacidad, README)
- Versión en PRIVACY_POLICY.md (de 2.0 a 2.1.0)
- Número de motores en manifest.json (de "30+" a "33")
- Twitter renombrado a "X (Twitter)" con URL actualizada a x.com
- SearX renombrado a SearXNG
- Kagi y SearXNG recategorizados como "Privacidad" en lugar de "IA" en README
- Color de Wikipedia ajustado para mejor contraste (#636466 en lugar de #000000)
- Sincronización entre privacy-policy.html y PRIVACY_POLICY.md

### Accesibilidad
- `role="status"` y `aria-live="polite"` en el indicador de estado
- `role="alert"` en las notificaciones temporales
- `aria-hidden="true"` en todos los iconos de Font Awesome
- `aria-label` en botones de motor de búsqueda, botones de copiar y botón limpiar
- `aria-expanded` y `aria-controls` en el botón de configuración
- `:focus-visible` para todos los elementos interactivos
- Botón de copiar visible con foco de teclado (`:focus-within`)
- `@media (prefers-reduced-motion: reduce)` para desactivar animaciones

### Rendimiento
- Sortable.js reemplazado por Sortable.min.js (de 126 KB a 45 KB, -64%)
- FontAwesome subset con solo los 37 iconos usados (de 273 KB a 6.5 KB, -97%)
- Debounce en saveConfiguration() para reducir escrituras al storage

### Calidad de código
- Tests ampliados de 6 a 57 (cobertura de funciones ~85%)
- Magic numbers extraídos a constantes con nombre
- Valores por defecto de dominio centralizados via DOMAIN_DEFAULTS

## [2.1.0] - 2025-01-18

### Añadido
- 33 motores de búsqueda soportados
- Búsqueda rápida con campo de texto y selector de motor
- Menú contextual mejorado con acción rápida y submenú
- Detección de búsqueda de imágenes
- Botones de copiar URL convertida
- Atajos de teclado (Alt+1-9, Ctrl+K, ESC)
- Drag-and-drop para reordenar motores
- Configuración de dominios regionales (Amazon, YouTube)
- Configuración de motores visibles con checkboxes
- Motor predeterminado para menú contextual
- Content Security Policy restrictiva
- Política de privacidad

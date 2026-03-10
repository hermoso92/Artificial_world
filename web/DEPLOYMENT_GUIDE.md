
# Guía de Despliegue - Artificial World

Esta guía detalla el proceso completo para desplegar la aplicación web de Artificial World en producción (artificialworld.es).

## 1. Checklist Pre-Despliegue

Antes de iniciar el despliegue, asegúrate de haber completado los siguientes pasos:
- [ ] **Código:** Todo el código está commiteado y no hay errores de linting (`npm run lint`).
- [ ] **Rutas:** Todas las rutas (`/`, `/hub`, `/games`, `/fire`, `/simulation`, `/paper`) funcionan correctamente.
- [ ] **PWA:** Los iconos SVG están presentes, el `manifest.webmanifest` es válido y el `sw.js` está registrado.
- [ ] **Responsividad:** La interfaz se adapta correctamente a móviles, tablets y escritorio.
- [ ] **Accesibilidad:** Contraste adecuado, navegación por teclado funcional y etiquetas ARIA presentes.
- [ ] **Contenido:** Textos revisados, sin errores tipográficos y con la clasificación honesta (REAL, DEMO, PARCIAL, ROADMAP).

## 2. Proceso de Despliegue

### Paso 2.1: Construcción Local (Verificación)
Verifica que el proyecto se construye correctamente sin errores:

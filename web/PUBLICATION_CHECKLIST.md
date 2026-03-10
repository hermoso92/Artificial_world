
# Checklist de Publicación - Artificial World

Esta lista de verificación asegura que todos los pasos críticos se completen antes de publicar la aplicación en producción.

---

## 1. Verificación de Build Final

### Build Local
- [ ] Ejecutar `npm run build` sin errores
- [ ] Verificar que la carpeta `dist/` se genera correctamente
- [ ] Verificar que no hay advertencias críticas en el build
- [ ] Verificar que todos los assets (imágenes, iconos, manifest) están incluidos en `dist/`

### Tamaño del Bundle
- [ ] Bundle principal < 500KB
- [ ] CSS < 100KB
- [ ] Total de assets < 2MB

### Verificación de Archivos
- [ ] `dist/index.html` existe y es válido
- [ ] `dist/manifest.webmanifest` existe y es válido
- [ ] `dist/sw.js` existe
- [ ] `dist/icons/` contiene los 4 iconos SVG
- [ ] `dist/assets/` contiene JS y CSS compilados

---

## 2. Pruebas de Preview Local

### Servidor de Preview
- [ ] Ejecutar `npm run preview`
- [ ] Verificar que el servidor inicia en `http://localhost:3000`
- [ ] Verificar que la página carga correctamente

### Pruebas de Rutas
- [ ] `/` (Landing Page) carga sin errores
- [ ] `/hub` carga y muestra todas las tarjetas
- [ ] `/games` carga y los juegos son jugables
- [ ] `/fire` carga el FireSimulator
- [ ] `/simulation` carga el simulador con controles funcionales
- [ ] `/paper` carga la documentación
- [ ] Recargar cualquier ruta no devuelve 404

### Pruebas de Enlaces
- [ ] Todos los enlaces internos funcionan (navbar, breadcrumbs, footer)
- [ ] Todos los enlaces externos se abren en nueva pestaña
- [ ] El enlace a GitHub funciona
- [ ] No hay enlaces rotos (404)

### Consola del Navegador
- [ ] No hay errores en la consola
- [ ] No hay advertencias críticas
- [ ] Service Worker se registra correctamente
- [ ] No hay errores de red (404, 500)

### Funcionalidades
- [ ] **3 en Raya:** Juego completo funciona
- [ ] **Damas:** Juego completo funciona
- [ ] **Simulador:** Controles (play, pause, reset, velocidad, semilla) funcionan
- [ ] **FireSimulator:** Controles funcionan
- [ ] **Disclaimer del Simulador:** Se puede cerrar y recuerda el estado

---

## 3. Publicación vía Horizons

### Preparación
- [ ] Asegurarse de que `apps/web/package.json` está actualizado
- [ ] Asegurarse de que todos los cambios están commiteados (si aplica)
- [ ] Revisar que no hay archivos temporales o de desarrollo en el proyecto

### Proceso de Publicación
- [ ] Hacer clic en el botón "Publish" en la interfaz de Horizons
- [ ] Esperar a que el despliegue se complete (puede tardar 1-3 minutos)
- [ ] Verificar que no hay errores en los logs de despliegue
- [ ] Anotar la URL de producción (debería ser `artificialworld.es`)

### Verificación Inmediata
- [ ] Abrir `https://artificialworld.es` en modo incógnito
- [ ] Verificar que la página carga correctamente
- [ ] Verificar que el certificado SSL es válido (candado verde)

---

## 4. Verificación Post-Publicación

### Pruebas en Producción

#### Homepage
- [ ] `https://artificialworld.es` carga correctamente
- [ ] Título de la página es correcto
- [ ] Meta descripción está presente
- [ ] Open Graph tags están presentes
- [ ] Favicon se muestra correctamente

#### Hub
- [ ] `https://artificialworld.es/hub` carga correctamente
- [ ] Todas las 7 tarjetas se muestran
- [ ] Badges de estado son correctos (REAL, DEMO, PARCIAL, ROADMAP)
- [ ] Botones de acción funcionan

#### Rutas Principales
- [ ] `/games` carga y los juegos funcionan
- [ ] `/fire` carga el FireSimulator
- [ ] `/simulation` carga el simulador
- [ ] `/paper` carga la documentación

#### Navegación
- [ ] Navbar funciona en todas las páginas
- [ ] Breadcrumbs funcionan correctamente
- [ ] Footer se muestra en todas las páginas
- [ ] Menú móvil funciona (probar en móvil o DevTools)

#### Enlaces
- [ ] Todos los enlaces internos funcionan
- [ ] Enlace a GitHub funciona y abre en nueva pestaña
- [ ] No hay enlaces rotos

#### Consola del Navegador (Producción)
- [ ] No hay errores en la consola
- [ ] No hay errores de red (404, 500)
- [ ] Service Worker se registra correctamente
- [ ] No hay advertencias de CORS

#### PWA
- [ ] El botón "Instalar" aparece en Chrome
- [ ] La aplicación se puede instalar correctamente
- [ ] Los iconos se muestran correctamente en la instalación
- [ ] La aplicación instalada funciona correctamente
- [ ] El tema de color se aplica correctamente

#### Diseño Responsivo
- [ ] **Móvil (375px):** Diseño fluido, menú hamburguesa funciona, sin scroll horizontal
- [ ] **Tablet (768px):** Diseño fluido, tarjetas en 2 columnas
- [ ] **Escritorio (1920px):** Diseño centrado, tarjetas en 3 columnas

#### Rendimiento
- [ ] Ejecutar Google Lighthouse en modo incógnito
- [ ] Performance Score > 90
- [ ] Accessibility Score > 90
- [ ] Best Practices Score > 90
- [ ] SEO Score > 90

#### Accesibilidad
- [ ] Navegación por teclado funciona
- [ ] Contraste de color es adecuado
- [ ] Botones tienen aria-labels
- [ ] Imágenes tienen alt text

---

## 5. Checklist de Documentación

### Archivos de Documentación
- [ ] `USER_GUIDE.md` está completo y actualizado
- [ ] `ARCHITECTURE.md` está completo y actualizado
- [ ] `DEPLOYMENT_GUIDE.md` está completo y actualizado
- [ ] `ROADMAP.md` está completo y actualizado
- [ ] `TROUBLESHOOTING.md` está completo y actualizado
- [ ] `MONITORING_PLAN.md` está completo y actualizado
- [ ] `QUICK_START.md` está completo y actualizado
- [ ] `VERIFICATION_CHECKLIST.md` está completo y actualizado
- [ ] `DEPLOYMENT_REPORT.md` está completo y actualizado
- [ ] `DEPLOYMENT_SUMMARY.md` está completo y actualizado
- [ ] `LAUNCH_ANNOUNCEMENT.md` está completo y actualizado
- [ ] `SOCIAL_MEDIA.md` está completo y actualizado
- [ ] `PRESS_KIT.md` está completo y actualizado
- [ ] `PUBLICATION_CHECKLIST.md` (este archivo) está completo

### README.md
- [ ] README.md en el repositorio está actualizado
- [ ] Incluye descripción del proyecto
- [ ] Incluye instrucciones de instalación
- [ ] Incluye enlaces a la documentación
- [ ] Incluye badges (si aplica)

---

## 6. Checklist de Configuración de Monitorización

### UptimeRobot
- [ ] Monitor configurado para `https://artificialworld.es`
- [ ] Intervalo de verificación: 5 minutos
- [ ] Alertas por email configuradas
- [ ] Página de estado pública creada (opcional)

### Sentry (Opcional)
- [ ] Proyecto creado en Sentry
- [ ] SDK instalado y configurado
- [ ] DSN añadido a la configuración
- [ ] Alertas configuradas

### Google Analytics (Opcional)
- [ ] Propiedad GA4 creada
- [ ] Measurement ID añadido a `index.html`
- [ ] Eventos personalizados configurados (instalación PWA, clics en CTA)

### Lighthouse CI (Opcional)
- [ ] Lighthouse CI configurado
- [ ] Ejecutado manualmente para verificar scores

---

## 7. Checklist de Redes Sociales

### Preparación de Contenido
- [ ] Posts de Twitter/X preparados (ver `SOCIAL_MEDIA.md`)
- [ ] Posts de LinkedIn preparados
- [ ] Posts de Facebook preparados
- [ ] Posts de Reddit preparados
- [ ] Post de Hacker News preparado

### Publicación
- [ ] Publicar en Twitter/X (Post 1: Anuncio)
- [ ] Publicar en LinkedIn (Post 1: Lanzamiento Profesional)
- [ ] Publicar en Facebook (Post 1: Lanzamiento General)
- [ ] Publicar en Reddit (r/artificial)
- [ ] Enviar a Hacker News

### Seguimiento
- [ ] Responder a comentarios en Twitter
- [ ] Responder a comentarios en LinkedIn
- [ ] Responder a comentarios en Reddit
- [ ] Responder a comentarios en Hacker News

---

## 8. Checklist de Distribución del Press Kit

### Preparación
- [ ] `PRESS_KIT.md` está completo
- [ ] Capturas de pantalla generadas
- [ ] Logo en alta resolución disponible
- [ ] Video demo creado (opcional)

### Distribución
- [ ] Enviar press kit a medios de tecnología
- [ ] Enviar press kit a blogs de IA/ML
- [ ] Enviar press kit a comunidades de desarrolladores
- [ ] Publicar press kit en el sitio web (opcional)

---

## 9. Criterios de Éxito

### Inmediato (Día 1)
- [ ] Sitio web accesible en `https://artificialworld.es`
- [ ] No hay errores críticos
- [ ] PWA instalable
- [ ] Al menos 1 publicación en redes sociales

### Corto Plazo (Semana 1)
- [ ] 100 visitas únicas
- [ ] 10 instalaciones de PWA
- [ ] 5 estrellas en GitHub
- [ ] Feedback inicial de usuarios

### Medio Plazo (Mes 1)
- [ ] 1,000 visitas únicas
- [ ] 100 instalaciones de PWA
- [ ] 50 estrellas en GitHub
- [ ] 10 issues/discussions en GitHub

---

## 10. Checklist Final

### Antes de Marcar como Completo
- [ ] Todos los items de las secciones 1-8 están marcados
- [ ] No hay errores críticos pendientes
- [ ] La documentación está completa
- [ ] El equipo está listo para responder a feedback
- [ ] Los canales de comunicación están activos (GitHub, email, redes sociales)

### Confirmación Final
- [ ] **El proyecto está listo para producción**
- [ ] **Todos los stakeholders han aprobado el lanzamiento**
- [ ] **El plan de monitorización está activo**
- [ ] **El plan de comunicación está en marcha**

---

## 🎉 ¡Listo para Lanzar!

Una vez que todos los items estén marcados, el proyecto está oficialmente listo para su lanzamiento público en `artificialworld.es`.

**Fecha de lanzamiento:** _________________
**Responsable:** _________________
**Firma:** _________________

---

**Última actualización:** 9 de marzo de 2026
**Versión:** 1.0


# Plan de Monitorización - Artificial World

Este documento define la estrategia de monitorización y alertas para asegurar la disponibilidad, rendimiento y calidad de la experiencia de usuario en `artificialworld.es`.

## Objetivo

Mantener un servicio de alta calidad mediante:
- **Disponibilidad:** Uptime > 99.5% (máximo 3.6 horas de downtime al mes)
- **Rendimiento:** Lighthouse Performance Score > 90
- **Errores:** Error rate < 1% de las sesiones
- **Experiencia de Usuario:** Core Web Vitals en verde (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **Seguridad:** Certificado SSL válido, sin vulnerabilidades críticas

## Niveles de Monitorización

### Nivel 1: Monitorización Manual (Mínimo Viable)
**Esfuerzo:** 15-30 minutos/día
**Costo:** Gratis
**Herramientas:** Navegador, Chrome DevTools, Google Lighthouse

### Nivel 2: Monitorización Automatizada (Recomendado)
**Esfuerzo:** 1-2 horas setup inicial, 30 minutos/semana
**Costo:** $0-50/mes
**Herramientas:** UptimeRobot, Sentry, Google Analytics, Lighthouse CI

### Nivel 3: Monitorización Avanzada (Futuro)
**Esfuerzo:** 4-8 horas setup, 2-4 horas/semana
**Costo:** $100-500/mes
**Herramientas:** Datadog, New Relic, PagerDuty, LogRocket

## Configuración Recomendada (Nivel 1 + 2)

Para el lanzamiento inicial, implementar **Nivel 1** inmediatamente y **Nivel 2** en las primeras 2 semanas.

---

## Checklist de Monitorización

### Checklist Diario (5-10 minutos)
- [ ] Verificar que `artificialworld.es` carga correctamente
- [ ] Revisar alertas de UptimeRobot (si configurado)
- [ ] Revisar errores en Sentry (si configurado)
- [ ] Verificar que no hay errores en la consola del navegador
- [ ] Probar una ruta aleatoria (ej. `/hub`, `/games`, `/simulation`)

### Checklist Semanal (30-45 minutos)
- [ ] Ejecutar Google Lighthouse en modo incógnito
- [ ] Verificar Core Web Vitals en PageSpeed Insights
- [ ] Revisar métricas de Google Analytics (si configurado):
  - Sesiones totales
  - Páginas más visitadas
  - Tasa de rebote
  - Tiempo promedio en sitio
- [ ] Probar todos los flujos críticos:
  - Navegación completa (Landing → Hub → Arena → Simulador → Paper)
  - Jugar una partida de 3 en Raya
  - Ejecutar el simulador durante 30 segundos
- [ ] Verificar enlaces externos (GitHub, redes sociales)
- [ ] Revisar issues nuevos en GitHub

### Checklist Mensual (1-2 horas)
- [ ] Auditoría completa de accesibilidad con WAVE o axe DevTools
- [ ] Revisar y actualizar dependencias de npm (seguridad)
- [ ] Analizar tendencias de tráfico y comportamiento de usuarios
- [ ] Revisar y actualizar el roadmap basado en feedback
- [ ] Ejecutar pruebas en múltiples navegadores:
  - Chrome (Desktop y Android)
  - Safari (Desktop y iOS)
  - Firefox (Desktop)
  - Edge (Desktop)
- [ ] Verificar que la PWA se instala correctamente en todos los navegadores
- [ ] Revisar y optimizar el tamaño del bundle (si ha crecido)

---

## Métricas a Monitorizar

### 1. Disponibilidad (Uptime)
**Objetivo:** > 99.5%
**Herramienta:** UptimeRobot (gratis hasta 50 monitores)
**Configuración:**
- Monitor HTTP(s) en `https://artificialworld.es`
- Intervalo de verificación: 5 minutos
- Alertas por email/SMS si el sitio está caído > 2 minutos

### 2. Rendimiento (Performance)
**Objetivo:** Lighthouse Score > 90
**Herramientas:** Google Lighthouse, PageSpeed Insights
**Métricas clave:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **FCP (First Contentful Paint):** < 1.8s
- **TTI (Time to Interactive):** < 3.5s

### 3. Experiencia de Usuario (UX)
**Herramienta:** Google Analytics 4 (gratis)
**Métricas clave:**
- **Sesiones totales:** Tendencia semanal/mensual
- **Usuarios únicos:** Crecimiento mes a mes
- **Tasa de rebote:** < 60% (objetivo)
- **Tiempo promedio en sitio:** > 2 minutos (objetivo)
- **Páginas por sesión:** > 3 (objetivo)
- **Rutas más visitadas:** Identificar contenido popular

### 4. Tráfico y Conversión
**Herramienta:** Google Analytics 4
**Métricas clave:**
- **Fuentes de tráfico:** Orgánico, directo, referido, social
- **Dispositivos:** Desktop vs Mobile vs Tablet
- **Navegadores:** Chrome, Safari, Firefox, Edge
- **Países:** Distribución geográfica
- **Conversiones (eventos personalizados):**
  - Instalación de PWA
  - Clic en "Explorar Hub"
  - Inicio de partida en Arena
  - Ejecución del Simulador
  - Clic en GitHub

### 5. Errores y Excepciones
**Objetivo:** Error rate < 1%
**Herramienta:** Sentry (gratis hasta 5,000 eventos/mes)
**Configuración:**
- Captura de errores de JavaScript
- Captura de errores de red (404, 500)
- Alertas por email si error rate > 5%
**Métricas clave:**
- **Error rate:** Porcentaje de sesiones con errores
- **Errores únicos:** Número de tipos de errores diferentes
- **Errores más frecuentes:** Top 10 errores

---

## Reglas de Alertas

### Alertas Críticas (Acción Inmediata)
**Notificación:** Email + SMS
**Tiempo de respuesta:** < 15 minutos

- **Sitio caído:** Uptime < 100% durante > 2 minutos
- **Error rate > 10%:** Más del 10% de las sesiones tienen errores
- **Certificado SSL expirado:** HTTPS no funciona

### Alertas de Alta Prioridad (Acción en < 1 hora)
**Notificación:** Email

- **Lighthouse Performance Score < 70:** Degradación significativa del rendimiento
- **Error rate > 5%:** Aumento notable de errores
- **LCP > 4s:** Experiencia de carga muy lenta

### Alertas de Prioridad Media (Acción en < 24 horas)
**Notificación:** Email diario (resumen)

- **Lighthouse Performance Score < 90:** Rendimiento por debajo del objetivo
- **Error rate > 1%:** Errores por encima del objetivo
- **Tasa de rebote > 70%:** Usuarios abandonan rápidamente

### Alertas de Baja Prioridad (Revisión Semanal)
**Notificación:** Informe semanal

- **Dependencias desactualizadas:** Actualizaciones de seguridad disponibles
- **Enlaces rotos:** Enlaces externos que devuelven 404
- **Nuevos issues en GitHub:** Feedback de usuarios

---

## Procedimientos de Respuesta a Incidentes

### Incidente Crítico (Sitio Caído)
1. **Verificar el problema:**
   - Abrir `artificialworld.es` en modo incógnito
   - Verificar desde múltiples ubicaciones (usar `downforeveryoneorjustme.com`)
2. **Identificar la causa:**
   - Revisar logs del servidor (si disponible)
   - Verificar estado del hosting (Horizons)
   - Verificar DNS (usar `nslookup artificialworld.es`)
3. **Acciones inmediatas:**
   - Si es problema del hosting, contactar soporte de Horizons
   - Si es problema de DNS, verificar configuración del dominio
   - Si es problema de código, hacer rollback a la versión anterior
4. **Comunicación:**
   - Actualizar estado en redes sociales (Twitter)
   - Añadir banner de mantenimiento (si es posible)
5. **Post-mortem:**
   - Documentar la causa raíz
   - Implementar medidas preventivas
   - Actualizar el runbook

### Incidente de Alta Prioridad (Errores Masivos)
1. **Verificar el alcance:**
   - Revisar Sentry para identificar el error
   - Verificar qué rutas/funcionalidades están afectadas
2. **Mitigación temporal:**
   - Si es una funcionalidad específica, considerar deshabilitarla temporalmente
   - Añadir un aviso en la interfaz si es necesario
3. **Corrección:**
   - Identificar y corregir el bug
   - Probar localmente (`npm run build && npm run preview`)
   - Desplegar la corrección
4. **Verificación:**
   - Confirmar que el error rate vuelve a niveles normales
   - Probar la funcionalidad afectada

### Incidente de Prioridad Media (Rendimiento Degradado)
1. **Análisis:**
   - Ejecutar Lighthouse para identificar cuellos de botella
   - Revisar el tamaño del bundle
   - Verificar tiempos de carga de recursos
2. **Optimización:**
   - Optimizar imágenes si es necesario
   - Revisar y eliminar dependencias no utilizadas
   - Implementar lazy loading si aplica
3. **Despliegue y verificación:**
   - Desplegar optimizaciones
   - Re-ejecutar Lighthouse para confirmar mejora

---

## Configuración de Herramientas

### 1. UptimeRobot (Monitorización de Disponibilidad)
**Costo:** Gratis (hasta 50 monitores)
**Setup:**
1. Crear cuenta en `uptimerobot.com`
2. Añadir nuevo monitor:
   - Tipo: HTTP(s)
   - URL: `https://artificialworld.es`
   - Intervalo: 5 minutos
3. Configurar alertas:
   - Email: [tu-email]
   - Notificar si está caído > 2 minutos
4. (Opcional) Configurar página de estado pública

### 2. Sentry (Monitorización de Errores)
**Costo:** Gratis (hasta 5,000 eventos/mes)
**Setup:**
1. Crear cuenta en `sentry.io`
2. Crear nuevo proyecto (React)
3. Instalar SDK:
   
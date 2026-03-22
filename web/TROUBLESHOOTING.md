
# Guía de Solución de Problemas (Troubleshooting)

Esta guía proporciona soluciones a los problemas más comunes que pueden surgir durante el desarrollo o en producción.

## 1. Página en Blanco (White Screen of Death)
**Síntoma:** La aplicación carga pero solo muestra un fondo vacío.
**Causas comunes y soluciones:**
- **Error de sintaxis en React:** Revisa la consola del navegador. Un error no capturado en el renderizado rompe el árbol de componentes. Solución: Añadir un `ErrorBoundary` o corregir el error de sintaxis.
- **Importaciones incorrectas:** Asegúrate de que todas las importaciones de componentes incluyen la extensión `.jsx` (ej. `import Component from './Component.jsx'`).
- **Rutas mal configuradas:** Verifica que `App.jsx` tiene las rutas correctamente definidas dentro de `<Routes>`.

## 2. Errores 404 al Recargar (En Producción)
**Síntoma:** Navegar funciona, pero al recargar la página en una ruta como `/hub` da un error 404.
**Causa:** El servidor estático no está configurado para redirigir todas las peticiones a `index.html` (comportamiento típico de SPA).
**Solución:** Asegúrate de que la configuración del servidor (Nginx, Apache, o el hosting de Horizons) tiene una regla de "catch-all" o fallback hacia `index.html`.

## 3. Problemas de Instalación PWA
**Síntoma:** El botón "Instalar aplicación" no aparece en el navegador.
**Causas comunes y soluciones:**
- **Manifest inválido:** Verifica en Chrome DevTools > Application > Manifest que no hay errores.
- **Iconos faltantes:** Asegúrate de que las rutas en `manifest.webmanifest` coinciden exactamente con los archivos en `public/icons/`.
- **Service Worker no registrado:** Verifica que `sw.js` se carga correctamente y no hay errores en la consola durante el registro.
- **Falta de HTTPS:** Las PWA requieren un entorno seguro (localhost o HTTPS).

## 4. Fallos en los Juegos (Arena)
**Síntoma:** El 3 en Raya o las Damas no responden a los clics.
**Solución:** 
- Verifica que el estado del juego no esté bloqueado (ej. esperando una animación que falló).
- Revisa la consola por errores de lógica en los arrays de estado.
- Asegúrate de que el componente no está envuelto en un contenedor con `pointer-events-none`.

## 5. Problemas en el Simulador
**Síntoma:** Los agentes no se mueven o el canvas parpadea.
**Solución:**
- **No se mueven:** Verifica que el estado `isRunning` es `true` y que `requestAnimationFrame` se está llamando recursivamente.
- **Parpadeo:** Asegúrate de que el canvas se limpia correctamente en cada frame (`ctx.fillRect` o `ctx.clearRect`).
- **Rendimiento:** Si va lento, reduce el número de agentes o simplifica los cálculos de utilidad en el bucle principal.

## 6. Enlaces Rotos
**Síntoma:** Al hacer clic en un enlace no ocurre nada o lleva a una página equivocada.
**Solución:**
- Para enlaces internos, usa `<Link to="/ruta">` de `react-router-dom`. No uses `<a href="/ruta">` ya que causará una recarga completa de la página.
- Para enlaces externos, usa `<a href="..." target="_blank" rel="noopener noreferrer">`.

## 7. Problemas de Diseño en Móviles
**Síntoma:** Elementos superpuestos o scroll horizontal no deseado.
**Solución:**
- Busca elementos con anchos fijos (`w-[500px]`) y cámbialos por anchos responsivos (`w-full max-w-[500px]`).
- Asegúrate de que los contenedores principales tienen `overflow-hidden` si hay elementos absolutos que se salen de los límites.

## 8. Problemas del Service Worker (Caché Obsoleta)
**Síntoma:** Los usuarios ven una versión antigua de la página después de un despliegue.
**Solución:**
- El Service Worker actual usa una estrategia "Network-first" para HTML, lo que debería mitigar esto.
- Si persiste, cambia el `CACHE_NAME` en `public/sw.js` (ej. de `v1` a `v2`) para forzar la invalidación de la caché estática en los clientes.

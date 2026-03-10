# Search Engine Converter - Política de privacidad

**Última actualización**: 5 de febrero de 2026
**Versión de la extensión**: 2.1.0
**Desarrollador**: [@686f6c61](https://github.com/686f6c61)

---

## 1. Introducción

Search Engine Converter es una extensión de navegador de código abierto que permite convertir búsquedas entre más de 33 motores de búsqueda diferentes. Esta política de privacidad describe de forma transparente cómo la extensión maneja (o no maneja) los datos del usuario.

La extensión está disponible como software libre bajo licencia MIT y su código fuente completo puede ser auditado en [GitHub](https://github.com/686f6c61/chrome-search-engine-converter).

---

## 2. Datos recopilados

**Esta extensión no recopila ningún dato personal del usuario.**

De forma específica:

- No se recopilan nombres, direcciones de correo electrónico ni identificadores personales
- No se registran los términos de búsqueda introducidos por el usuario
- No se almacena el historial de navegación ni las URLs visitadas
- No se recopilan datos de geolocalización
- No se generan perfiles de usuario ni identificadores de seguimiento
- No se recopilan datos demográficos, de comportamiento ni de uso
- No se recopila información del dispositivo, sistema operativo ni navegador
- No se utilizan cookies ni tecnologías de rastreo equivalentes

---

## 3. Almacenamiento local

La extensión utiliza la API `chrome.storage.local` exclusivamente para guardar las preferencias de configuración del usuario dentro del propio navegador. Los datos almacenados son:

| Dato | Descripción | Ejemplo |
|------|-------------|---------|
| Dominio de Amazon | Región preferida del usuario para búsquedas en Amazon | `es`, `com`, `de` |
| Dominio de YouTube | Región preferida para YouTube | `com`, `es` |
| Motores visibles | Qué motores de búsqueda aparecen en el popup | `{google: true, bing: false}` |
| Orden de botones | Posición personalizada de cada motor en el grid | `["google", "brave", ...]` |
| Motor predeterminado | Motor usado por defecto en el menú contextual | `google` |

**Características del almacenamiento:**

- Todos los datos se almacenan **localmente en el navegador** del usuario mediante `chrome.storage.local`
- Los datos **nunca se transmiten** a ningún servidor, API o servicio externo
- Los datos **nunca se comparten** con terceros, socios comerciales ni anunciantes
- Los datos se pueden eliminar en cualquier momento desinstalando la extensión o limpiando los datos de la extensión desde la configuración del navegador (`chrome://extensions/`)
- No se utiliza `chrome.storage.sync`, por lo que los datos **no se sincronizan** entre dispositivos

---

## 4. Permisos solicitados y justificación

La extensión solicita únicamente tres permisos, todos estrictamente necesarios para su funcionamiento:

### 4.1. `activeTab`

- **Qué hace**: permite a la extensión leer la URL de la pestaña activa únicamente cuando el usuario interactúa con ella (hace clic en el icono de la extensión o usa un atajo de teclado)
- **Para qué se usa**: detectar qué motor de búsqueda está usando el usuario y extraer el término de búsqueda de la URL para poder convertirlo a otro motor
- **Qué NO hace**: no accede al contenido de la página (DOM, texto, imágenes), no lee datos de formularios, no intercepta la navegación, no funciona en segundo plano y no tiene acceso a pestañas inactivas
- **Cuándo se activa**: solo cuando el usuario interactúa explícitamente con la extensión

### 4.2. `contextMenus`

- **Qué hace**: permite crear entradas en el menú contextual del navegador (clic derecho)
- **Para qué se usa**: ofrecer al usuario la posibilidad de seleccionar texto en cualquier página web y buscarlo directamente en el motor de búsqueda que prefiera, sin necesidad de abrir el popup
- **Qué NO hace**: no accede al contenido de las páginas, no modifica el comportamiento del navegador ni intercepta otros menús

### 4.3. `storage`

- **Qué hace**: permite almacenar y recuperar datos en el almacenamiento local del navegador
- **Para qué se usa**: guardar las preferencias de configuración del usuario (motores visibles, orden de botones, dominios regionales, motor predeterminado) para que persistan entre sesiones
- **Qué NO hace**: no sincroniza datos entre dispositivos, no envía datos a servidores externos, no almacena datos personales ni de navegación

---

## 5. Comunicaciones de red

La extensión **no realiza ninguna comunicación de red**. No se envían ni reciben datos a través de internet.

De forma específica:

- No se realizan peticiones HTTP/HTTPS a ningún servidor
- No se utilizan APIs externas ni servicios en la nube
- No se cargan recursos remotos (scripts, estilos, fuentes ni imágenes)
- Todas las dependencias (Font Awesome, Roboto, Sortable.js) están empaquetadas localmente dentro de la extensión
- La Content Security Policy (CSP) de la extensión restringe explícitamente la carga de recursos a `'self'` (solo ficheros locales de la extensión)

La CSP configurada en el manifiesto de la extensión es:

```
script-src 'self'; object-src 'none'; style-src 'self'; font-src 'self'; img-src 'self' data:;
```

Esta política impide por diseño la carga de cualquier recurso externo.

---

## 6. Uso de código remoto

La extensión **no utiliza código remoto** de ninguna forma:

- No se ejecuta código descargado dinámicamente
- No se cargan scripts desde CDN u otros servidores externos
- No se utiliza ejecución dinámica de código (ni funciones constructoras de código, ni temporizadores con cadenas de texto, ni ninguna otra técnica equivalente)
- Todo el código JavaScript se incluye como archivos estáticos dentro del paquete de la extensión
- El código fuente no minificado está disponible públicamente para su inspección

---

## 7. Datos compartidos con terceros

**No se comparten datos con terceros.** No existen terceros, socios ni proveedores de servicios involucrados en el funcionamiento de la extensión.

Cuando el usuario convierte una búsqueda a otro motor, la extensión simplemente abre una nueva pestaña del navegador con la URL del motor de destino y el término de búsqueda. Esta navegación es idéntica a la que el usuario realizaría manualmente escribiendo la URL en la barra de direcciones. La extensión no actúa como intermediario ni proxy en esta comunicación.

---

## 8. Seguridad

Las medidas de seguridad implementadas incluyen:

- **Manifest V3**: la extensión utiliza la última versión del sistema de manifiestos de Chrome, que proporciona un modelo de seguridad mejorado con Service Workers aislados
- **Content Security Policy restrictiva**: solo se permite la ejecución de código y la carga de recursos locales
- **Sin inyección de contenido**: la extensión no inyecta scripts ni modifica el contenido de las páginas web
- **Validación de datos**: los dominios configurables (Amazon, YouTube) se validan contra una lista cerrada de valores permitidos antes de ser utilizados
- **Sin ejecución de código dinámico**: no se usan mecanismos de ejecución dinámica de código de ningún tipo
- **Permisos mínimos**: se solicitan únicamente los tres permisos estrictamente necesarios

---

## 9. Datos de menores

La extensión no está dirigida a menores de 13 años y no recopila conscientemente datos de menores. Dado que la extensión no recopila ningún tipo de dato personal, no existe riesgo de recopilación inadvertida de datos de menores.

---

## 10. Cambios en esta política

Cualquier cambio en esta política de privacidad se publicará en este mismo documento dentro del repositorio de GitHub. La fecha de "última actualización" en la cabecera del documento se modificará para reflejar la revisión más reciente.

Dado que la extensión no recopila datos, no se requiere consentimiento adicional del usuario ante cambios en la política.

---

## 11. Derechos del usuario

El usuario puede en cualquier momento:

- **Inspeccionar el código fuente** en [GitHub](https://github.com/686f6c61/chrome-search-engine-converter) para verificar estas afirmaciones
- **Eliminar sus preferencias** desinstalando la extensión o limpiando sus datos desde `chrome://extensions/`
- **Desactivar o desinstalar** la extensión sin consecuencia alguna
- **Contactar al desarrollador** mediante un issue en GitHub para cualquier consulta relacionada con la privacidad

---

## 12. Contacto

Para cualquier consulta, duda o solicitud relacionada con esta política de privacidad:

- **Issues de GitHub**: [github.com/686f6c61/chrome-search-engine-converter/issues](https://github.com/686f6c61/chrome-search-engine-converter/issues)
- **Repositorio**: [github.com/686f6c61/chrome-search-engine-converter](https://github.com/686f6c61/chrome-search-engine-converter)

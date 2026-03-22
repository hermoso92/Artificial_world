# Search Engine Converter v2.1.0

Extensión para navegadores Chromium que convierte búsquedas entre más de 33 motores diferentes manteniendo los términos exactos. Compatible con Chrome, Brave y Edge.

[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/686f6c61/chrome-search-engine-converter)
[![Chrome](https://img.shields.io/badge/Chrome-compatible-brightgreen)](https://github.com/686f6c61/chrome-search-engine-converter)
[![Brave](https://img.shields.io/badge/Brave-compatible-brightgreen)](https://github.com/686f6c61/chrome-search-engine-converter)
[![Edge](https://img.shields.io/badge/Edge-compatible-brightgreen)](https://github.com/686f6c61/chrome-search-engine-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Capturas de pantalla

### Interfaz principal
![Popup principal](assets/screenshot_1_main.png)

Vista principal con motor detectado y botones de conversión en grid de 2 columnas.

### Búsqueda rápida
![Búsqueda rápida](assets/screenshot_2_search.png)

Modo búsqueda con campo de texto y selector de motor para buscar directamente.

### Configuración
![Configuración](assets/screenshot_3_config.png)

Panel de configuración con dominios regionales, visibilidad de motores y checkboxes individuales.

### Orden personalizable
![Orden de botones](assets/screenshot_4_order.png)

Drag-and-drop para reordenar los motores en el popup.

### Todos los motores
![33 motores](assets/screenshot_5_all_engines.png)

Los 33 motores de búsqueda soportados.

---

## Funcionalidades

- **Conversión instantánea**: detecta automáticamente el motor de búsqueda actual y permite convertir a cualquier otro motor soportado
- **33 motores**: Google, Brave, DuckDuckGo, Bing, Amazon, YouTube, Wikipedia, X (Twitter), GitHub, GitLab, Stack Overflow, Reddit, Pinterest, Startpage, Ecosia, Qwant, Yandex, Baidu, eBay, AliExpress, Etsy, Google Scholar, Internet Archive, Wolfram Alpha, Spotify, SoundCloud, Vimeo, LinkedIn, TikTok, Perplexity, Kagi, SearXNG, You.com
- **Búsqueda rápida**: escribe un término y busca en cualquier motor sin necesidad de navegar a su página
- **Menú contextual mejorado**: acción rápida con motor predeterminado + submenú completo para elegir cualquier motor
- **Detección de imágenes**: si estás en búsqueda de imágenes, la conversión mantiene el modo imágenes
- **Copiar URL**: copia la URL convertida al portapapeles sin abrir nueva pestaña
- **Atajos de teclado**: Alt+1-9 conversión directa, Ctrl+K búsqueda rápida, ESC cerrar popup
- **Personalización**: motores visibles, orden drag-and-drop, dominios regionales (Amazon, YouTube)
- **Accesibilidad**: navegación completa por teclado, ARIA labels, soporte para lectores de pantalla, respeto a `prefers-reduced-motion`

---

## Instalación

### Desde código fuente (modo desarrollador)

```bash
git clone https://github.com/686f6c61/chrome-search-engine-converter.git
```

1. Abrir `chrome://extensions/` (o `brave://extensions/` o `edge://extensions/`)
2. Activar "Modo de desarrollador"
3. Pulsar "Cargar extensión sin empaquetar"
4. Seleccionar la carpeta `extension/`

### Desde Chrome Web Store

*(Pendiente de publicación)*

---

## Tests

```bash
npm test
```

Ejecuta los tests con el runner nativo de Node.js (`node:test`). Los tests verifican el registro de motores, funciones de búsqueda, validación de dominios y detección de motores.

---

## Estructura del proyecto

```
chrome-search-engine-converter/
  .github/
    workflows/
      ci.yml                 # Checks automáticos (sintaxis + tests)
  extension/
    manifest.json           # Manifest V3, permisos mínimos
    engines.js              # Registro centralizado de 33 motores (SSOT)
    background.js           # Service Worker (menú contextual)
    popup.html              # Interfaz del popup (esqueleto mínimo)
    popup.js                # Controlador del popup (genera HTML dinámico)
    popup.css               # Estilos del popup
    Sortable.js             # Librería drag-and-drop (local)
    privacy-policy.html     # Política de privacidad
    css/
      fontawesome.min.css   # Font Awesome 6 (local)
      fonts.css             # Declaraciones @font-face
    fonts/
      fa-solid-900.woff2    # Iconos sólidos
      fa-brands-400.woff2   # Iconos de marcas
      roboto-{400,500,700}.woff2  # Fuente Roboto
    images/
      icon{16,32,48,128,256}.png  # Iconos en todos los tamaños
  tests/
    engines.smoke.test.cjs  # Pruebas de funciones críticas
  package.json              # Scripts de validación local
  LICENSE                   # MIT License
  README.md
```

### Arquitectura

- **engines.js** es la única fuente de verdad (SSOT) para todos los motores. Define configuración, URLs, patrones de detección y funciones de búsqueda/extracción. Lo consumen tanto `background.js` como `popup.js` mediante `importScripts()` y `<script>`.
- **popup.js** genera todo el HTML dinámicamente desde `SEARCH_ENGINES` - botones, checkboxes, selects, lista de orden.
- **background.js** crea los menús contextuales y gestiona las búsquedas desde el clic derecho.
- **Cero dependencias externas**: fuentes, iconos y Sortable.js están empaquetados localmente. No se carga ningún recurso remoto.

---

## Privacidad y seguridad

- **Sin recopilación de datos**: no se envía información a servidores externos
- **100% local**: toda la lógica se ejecuta en el navegador
- **Sin analíticas**: no se usa Google Analytics ni ningún servicio de telemetría
- **Código abierto**: todo el código está disponible para auditoría

### Permisos (3 permisos mínimos)

| Permiso | Uso |
|---------|-----|
| `activeTab` | Lee la URL de la pestaña activa para detectar el motor y extraer el término de búsqueda |
| `contextMenus` | Crea el menú de clic derecho para buscar texto seleccionado |
| `storage` | Guarda preferencias del usuario localmente |

### Content Security Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'; style-src 'self'; font-src 'self'; img-src 'self' data:;"
}
```

Solo se permite cargar recursos locales (`'self'`). Sin `unsafe-inline`, sin CDN externos.

---

## Motores soportados

| Categoría | Motores |
|-----------|---------|
| Generalistas | Google, Brave, DuckDuckGo, Bing, Startpage, Ecosia, Qwant, Yandex, Baidu |
| IA | Perplexity, You.com |
| Privacidad | Kagi, SearXNG, Startpage |
| Redes sociales | X (Twitter), Reddit, LinkedIn, Pinterest, TikTok |
| Multimedia | YouTube, Spotify, SoundCloud, Vimeo |
| Comercio | Amazon, eBay, AliExpress, Etsy |
| Desarrollo | GitHub, GitLab, Stack Overflow |
| Académico | Wikipedia, Google Scholar, Internet Archive, Wolfram Alpha |

---

## Licencia

[MIT License](LICENSE) - [@686f6c61](https://github.com/686f6c61)

Política de privacidad: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)

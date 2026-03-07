# Damas AI — Configuración de producción

## 1. Integración en landing

- **artificial-world.html**: botón "Damas vs IA" en hero + sección Minijuegos
- **docs/index.html**: enlaces en hero y roadmap

## 2. PWA (Progressive Web App)

Archivos: `manifest-damas.json`, `sw-damas.js`

- Instalable en móvil/escritorio
- Caché offline básico
- Para cambiar icono: editar `manifest-damas.json` y sustituir el `src` del icono por una URL a tu PNG/SVG

## 3. Analytics

En `damas-ai.html` hay un bloque comentado. Para activar:

**Google Analytics 4:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
```

**Plausible (privacidad):**
```html
<script defer data-domain="tudominio.com" src="https://plausible.io/js/script.js"></script>
```

Eventos ya instrumentados: `game_start`, `game_end`, `game_restart`, `premium_click`

## 4. Monetización

**Anuncios (AdSense):** pegar el bloque `<ins class="adsbygoogle">` dentro de `#ad-slot`

**Premium:** el enlace "Premium: sin anuncios" dispara `premium_click`. Conectar a tu página de pago o Stripe.

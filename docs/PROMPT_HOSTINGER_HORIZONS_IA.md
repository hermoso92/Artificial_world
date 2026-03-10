# Instrucciones para la IA de Hostinger Horizons

## Contexto

**Tienes acceso a:** el código exportado de Horizons en `horizons-export-54563100-2f1a-4d10-b236-7472880f753f`. Si no tienes acceso a esa carpeta, pide el código antes de actuar.

**Despliegue:** Ese código es lo que se publica en `artificialworld.es`. El proyecto real **Artificial World** vive en otro repositorio (`artificial word`) con frontend React completo, backend Node, motor Python y Hub navegable.

**Objetivo:** Que la web publicada en Horizons sea la **puerta de entrada honesta** que conecta con el ecosistema, con jerarquía clara y sin sobreprometer.

---

## Prioridades (si hay límites de tiempo o plataforma)

| Prioridad | Qué hacer | Si no puedes |
|-----------|-----------|--------------|
| **1** | Hub + rutas navegables (/hub, /games, /fire) | Al menos CTA "Entrar al Hub" que lleve al app real |
| **2** | PWA (manifest + iconos + theme-color) | Solo manifest y meta tags |
| **3** | Metadatos (title, description) y disclaimer en simulador | Mínimo: title correcto |
| **4** | EcosistemaSection y GamesSection con enlaces reales | Badges + "Próximamente" donde no exista |
| **5** | Paper en URL controlada | Mantener enlace actual |
| **6** | Coherencia visual y naming honesto | No añadir señales de plantilla |

---

## Separación clara: Horizons vs Repo

| Ámbito | Qué hacer |
|--------|-----------|
| **En Horizons** (artificialworld.es) | Implementar Hub, Arena, FireSimulator, PWA, metadatos. Es lo que controlas aquí. |
| **En el repo** `artificial word` | Ya existe: Hub completo, SimulationView con backend, Mission Control, DobackSoft, Hero Refuge. No lo modifiques desde Horizons. |

---

## Respuestas directas a preguntas clave

### ¿Qué aplicaciones/módulos existen ahora mismo?

| Módulo | Dónde existe | Estado |
|--------|--------------|--------|
| **Landing pública** | Repo `artificial word` (LandingPublic.jsx) + Horizons (HomePage) | Mejorada en repo. En Horizons es otra versión. |
| **Simulador** | Repo: SimulationView (con backend). Horizons: ArtificialWorldSimulator (cosmético, sin backend) | Repo: real. Horizons: falso (Math.random) |
| **FireSimulator** | Repo + export Horizons reciente | Demo de propagación 2D en ambos |
| **Arena de minijuegos** | Repo + export Horizons reciente | 3 en Raya ✅, Damas ✅, Ajedrez ❌ (Próximamente) |
| **Mystic Quest** | Solo en repo | Parcial, capa narrativa |
| **DobackSoft** | Solo en repo | Vertical demo, conectada a FireSimulator |
| **Mission Control** | Solo en repo | Parcial, vista operativa |
| **Hero Refuge** | Solo en repo | Parcial, embebido en simulador |
| **Hub** | Repo + export Horizons reciente | Núcleo navegable con pilares |
| **Docs, Admin** | Solo en repo | Reales |

**¿Hay más?** Sí: **Hub**, **Mission Control**, **Hero Refuge**. En el export reciente de Horizons ya hay Hub y Arena; Mission Control y Hero Refuge siguen solo en repo.

### ¿Dónde están desplegadas actualmente?

| Despliegue | URL | Contenido |
|------------|-----|-----------|
| **artificialworld.es** | https://artificialworld.es | Código Horizons. Si se despliega el export reciente: Landing + Hub + Arena + FireSimulator. **Sin backend.** Rutas: `/`, `/hub`, `/games`, `/fire`, `/landing`, `/paper` |
| **VPS Hostinger** | http://187.77.94.167:3001 | Backend real (API, WebSocket). No está claro si el frontend del repo se sirve desde aquí. |
| **Local** | http://localhost:5173 | Frontend completo del repo (Hub, todas las superficies) |
| **Local** | http://localhost:3001 | Backend del repo |

**¿Todas en el mismo dominio?** No. artificialworld.es = Horizons (estático). El ecosistema completo (Hub + superficies) vive en el repo y se ejecuta localmente o en el VPS, pero **no está integrado en artificialworld.es**.

**¿Subdominios?** No hay evidencia de subdominios.

**¿Repos/servidores separados?** Sí. Horizons (artificialworld.es) y repo `artificial word` (backend + frontend) son despliegues distintos.

### Estado del export local (horizons-export-*)

**Ya implementado en el export del repo:**
- Rutas `/hub`, `/games`, `/games/tictactoe`, `/games/checkers`, `/fire`, `/demos` (redirige a `/hub`)
- HubPage con tarjetas de superficies y badges
- GamesPage con lobby (3 en Raya, Damas jugables; Ajedrez "Próximamente")
- FireSimulator con gate DEMO y demo de propagación 2D
- EcosystemNav, EcosistemaSection navegable, GamesSection con enlaces reales
- StickyNavbar con enlaces a Hub y Arena
- HeroSection con CTA "Entrar al Hub"

**Si despliegas ese export en artificialworld.es, ya tendrás lo anterior.** Si trabajas sobre una versión anterior publicada, lo que sigue aplica.

### ¿Qué puede faltar (versión publicada antigua)?

- **Hub** como núcleo navegable
- **Superficies jugables** (Arena, FireSimulator) accesibles
- **Rutas rotas**: DemosPage y GamesPage vacíos; "Jugar ahora" sin destino
- **Simulador desconectado**: cosmético, sin backend
- **Dos landings distintas**: `/` y `/landing` con mensajes diferentes
- **Navegación**: solo scroll por anclas

### PWA

| Pregunta | Respuesta |
|----------|-----------|
| **¿Existe manifest.json?** | **Repo:** Sí. `manifest.webmanifest` generado por vite-plugin-pwa. **Horizons:** No. |
| **¿Hay service worker?** | **Repo:** Sí. `sw.js` + `registerSW.js` (vite-plugin-pwa). **Horizons:** No. |
| **¿Instalable como app?** | **Repo:** Sí, en build. **Horizons:** No. **¿Queremos que lo sea?** Sí. |

### ¿Qué entendemos por "ecosistema único"?

- **Un menú central que acceda a todo:** Sí. El Hub es ese menú. Tarjetas de superficies (Simulación, Arena, DobackSoft, Mission Control, Mystic Quest) con un clic.
- **Navegación fluida entre apps:** Sí. Sin recargar, sin ventanas nuevas. Hash routing (`#simulation`, `#minigames`, etc.) dentro del mismo SPA.
- **Datos compartidos entre módulos:** Parcial. Hero, mundos y suscripción se comparten vía API. Cada superficie tiene su estado pero el contexto (héroe, mundo activo) es común.
- **Experiencia de usuario cohesiva:** Sí. Una identidad visual, un AppShell común, breadcrumbs, "volver al Hub" consistente.

---

## A. Diagnóstico del código Horizons actual

### Qué existe realmente (versión base; el export reciente puede tener más)

| Elemento | Ubicación | Estado |
|----------|-----------|--------|
| Rutas | `App.jsx` | `/` (HomePage), `/landing` (LandingPage), `/paper` (PaperPage) |
| HomePage | `pages/HomePage.jsx` | Página única con scroll: Hero, Concepto, Ecosistema, Simulador, Docs, Repositorio, CTA |
| Simulador | `ArtificialWorldSimulator.jsx` | **Cosmético**: usa `Math.random()` para decisiones. No es determinista. No conecta con backend. |
| EcosistemaSection | `EcosistemaSection.jsx` | Tarjetas descriptivas de superficies. **No navegables**. |
| GamesSection | `GamesSection.jsx` | Botones "Jugar ahora" que no llevan a ningún sitio |
| DemosPage, GamesPage | `DemosPage.jsx`, `GamesPage.jsx` | **Vacíos** (`return null`) |
| LandingPage | `pages/LandingPage.jsx` | Otra landing distinta (HeroSection, WhatIsSection, etc.). No es la puerta al Hub. |
| StickyNavbar | `StickyNavbar.jsx` | Navegación por anclas (#hero, #concepto, #ecosistema, #simulator, #docs, #repositorio) |
| Paper | `DocumentationSection.jsx` | Enlace a smallpdf.com (externo, no controlado) |
| GitHub | Varios | Enlace a `github.com/hermoso92/Artificial_world` |

### Qué puede faltar (verifica en tu export)

- **Hub** como núcleo navegable — *puede existir ya en export reciente*
- **Superficies jugables** (Arena, FireSimulator) — *pueden existir ya*
- **PWA**: `manifest.json`, service worker, iconos, `theme-color` — *suele faltar*
- **Conexión con backend** real — *el simulador es 100% cliente*
- **Clasificación REAL/DEMO/PARCIAL/ROADMAP** visible
- **Mission Control**, **Hero Refuge** como superficies visibles — *opcional en Horizons*

### Deficiencias críticas

1. **Simulador engañoso**: El "Simulador en Vivo" usa `Math.random()` y no es determinista. Las instrucciones dicen "sesión canónica (seed 42)" pero la semilla no afecta al resultado real.
2. **Superficies no accesibles**: EcosistemaSection describe Arena, FireSimulator, DobackSoft, Mystic Quest, pero no hay forma de entrar a ninguna.
3. **GamesSection**: "Jugar ahora" no funciona; GamesPage y DemosPage están vacíos.
4. **Dos landings distintas**: `/` (HomePage) y `/landing` (LandingPage) con mensajes y diseño diferentes. No hay jerarquía clara.
5. **index.html**: Título "Cosigein SL - Portfolio", no "Artificial World". Metadatos desalineados.
6. **Sin PWA**: No es instalable como app.

### Virtudes a conservar

- Diseño visual coherente (Tailwind, colores cyan/primary, dark mode)
- Secciones bien estructuradas (Hero, Concepto, Ecosistema, Docs, Repositorio)
- Enlaces a GitHub y paper
- Responsive y accesible (aria-labels, focus-visible)
- Framer Motion para animaciones

---

## B. Jerarquía obligatoria que debes implementar

```
Landing pública = puerta de entrada
       ↓
Hub = núcleo del ecosistema (navegación central)
       ↓
Módulos = superficies del mismo mundo
       ↓
Recursos / paper / repositorio = capa de verificación
```

---

## C. Qué debes crear o cambiar

### 1. Landing como puerta de entrada

- La landing **no** debe fingir ser toda la aplicación.
- Debe explicar el sistema y **conectar con el Hub**.
- Si no puedes implementar un Hub real (por limitaciones de Horizons), al menos:
  - Añadir un CTA claro: "Entrar al ecosistema" que lleve a la única URL del app real (si existe) o a una sección Hub simulada.
  - Incluir tabla/clasificación REAL / DEMO / PARCIAL / ROADMAP por superficie.

### 2. Hub como núcleo

- Si Horizons permite rutas y componentes dinámicos:
  - Crear una sección o página **Hub** que sea el centro de navegación.
  - Tarjetas con: Simulación, Arena, DobackSoft, FireSimulator, Mission Control, Mystic Quest.
  - Cada tarjeta con badge de estado (Real, Demo, Parcial, Roadmap).
- Si no puedes crear rutas:
  - Convertir el HomePage en una estructura tipo Hub: Hero → Mapa de superficies (con badges) → Simulador → Docs → Repo.
  - Las superficies que no existan en Horizons deben enlazar al app real o a "Próximamente" con descripción honesta.

### 3. Superficies y naming honesto

| Superficie | Estado real | Cómo presentarla |
|------------|-------------|------------------|
| Simulación principal | REAL (motor Python) / DEMO (web) | "Constructor de Mundos. Motor 2D determinista. Demo web." |
| Hero Refuge | PARCIAL | "Refugios dentro del simulador. Mundos ligeros." |
| Arena | DEMO | "3 en Raya y Damas jugables. Ajedrez próximamente." |
| DobackSoft | DEMO | "Vertical demo integrada. Conectada con FireSimulator. No suite enterprise." |
| FireSimulator | DEMO | "Superficie temática de propagación 2D." |
| Mission Control | PARCIAL | "Observatorio / vista operativa. Boards, approvals." |
| Mystic Quest | PARCIAL | "Serie de visiones. Capa narrativa." |
| Runtime 3D | ROADMAP | "Encarnación visual futura. La verdad sistémica vive en 2D." |

### 4. Simulador

- **Opción A (recomendada):** Añadir disclaimer visible: "Esta es una visualización ilustrativa. El motor determinista real está en el repositorio Python."
- **Opción B:** Conectar con el backend real si existe una API pública (requiere configuración de CORS y URL).
- **No:** Seguir mostrando un simulador con `Math.random()` como si fuera determinista.

### 5. GamesSection y DemosPage

- Si no hay juegos implementados en Horizons:
  - Cambiar "Jugar ahora" por "Ver en el ecosistema" (enlace al app real) o "Próximamente".
  - Añadir badges: "3 en Raya: Real", "Damas: Real", "Ajedrez: Próximamente".
- Si implementas DemosPage o GamesPage:
  - Deben contener componentes jugables (TicTacToe, Checkers) o enlaces claros.

### 6. PWA

- Añadir `manifest.webmanifest` (o `manifest.json`) con:
  - `name`: "Artificial World"
  - `short_name`: "AW"
  - `theme_color`: "#0a0b0d"
  - `background_color`: "#0a0b0d"
  - `display`: "standalone"
  - `start_url`: "/"
  - `icons`: al menos 192x192 y 512x512 (PNG o SVG)
- Añadir en `index.html`:
  - `<link rel="manifest" href="/manifest.webmanifest">`
  - `<meta name="theme-color" content="#0a0b0d">`
- Si Horizons permite service worker:
  - Registrar un service worker mínimo para precache del app shell.
- Si no puedes añadir service worker:
  - Al menos el manifest + meta tags permitirán instalación básica en algunos navegadores.

### 7. index.html y metadatos

- `title`: "Artificial World — Constructor de Mundos"
- `description`: "Simulación 2D de agentes autónomos con refugios, héroes y memoria. Motor determinista. Open source."
- Eliminar o ajustar branding "Cosigein SL - Portfolio" si no aplica al producto público.

### 8. DobackSoft

- No presentarlo como "solo un juego".
- No presentarlo como "suite enterprise completa operativa".
- Presentarlo como: "Vertical demo integrada. Capa conectada al ecosistema. Especialmente relacionada con FireSimulator."

### 9. Paper y repositorio

- Paper: sustituir enlace a smallpdf por uno controlado (ej. `/paper` con PDF local o enlace a docs del repo).
- Repositorio: mantener `github.com/hermoso92/Artificial_world`.

---

## D. Plan de implementación sugerido

### Fase 1: Sin romper lo desplegado

1. Actualizar `index.html`: title, description, theme-color, manifest link.
2. Crear `public/manifest.webmanifest` y iconos.
3. Añadir disclaimer al simulador: "Visualización ilustrativa. Motor real en repo Python."

### Fase 2: Jerarquía y honestidad

4. Reorganizar HomePage: Hero → Ecosistema (con badges REAL/DEMO/PARCIAL/ROADMAP) → Simulador → Docs → Repo.
5. Actualizar EcosistemaSection: cada superficie con badge de estado.
6. Actualizar GamesSection: "Jugar ahora" → enlaces o "Próximamente" según corresponda.
7. Añadir sección "Verificación" con enlaces a Docs, Hub (si existe), Repo.

### Fase 3: Hub y navegación

8. Si es posible: crear ruta `/hub` con tarjetas de superficies navegables.
9. Si no: convertir la sección Ecosistema en pseudo-Hub con CTAs que lleven a rutas o al app real.
10. Unificar landing: decidir si `/` es la landing o el Hub; evitar dos landings contradictorias.

### Fase 4: PWA completa

11. Añadir service worker si la plataforma lo permite.
12. Verificar installability en Chrome DevTools (Application > Manifest, Service Workers).

---

## E. Restricciones

- **No destruyas** lo existente. No rehagas todo desde cero.
- **No sobreprometas**: no vendas como implementado lo que no está accesible.
- **No mezcles** branding: Artificial World es el producto; Cosigein puede ser la empresa en footer.
- **Mantén** la identidad visual (colores, tipografía, espaciado) para que no parezca plantilla.
- **Respeta** la jerarquía: Landing → Hub → Módulos → Verificación.

---

## F. Archivos clave a modificar

| Archivo | Cambios |
|---------|---------|
| `index.html` | title, description, theme-color, manifest link |
| `public/manifest.webmanifest` | Crear (nuevo) |
| `public/icons/` | Crear iconos 192, 512 |
| `ArtificialWorldSimulator.jsx` | Disclaimer de visualización ilustrativa |
| `EcosistemaSection.jsx` | Badges por superficie, CTAs si hubiera rutas |
| `GamesSection.jsx` | Enlaces reales o "Próximamente" |
| `HomePage.jsx` | Reordenar secciones, añadir verificación |
| `StickyNavbar.jsx` | Añadir Hub si existe ruta |
| `App.jsx` | Ruta `/hub` si implementas Hub |
| `DocumentationSection.jsx` | Enlace paper controlado |

---

## G. Resultado final esperado

- Una sola identidad visual coherente.
- Una sola navegación central (o pseudo-Hub en sección).
- Una landing honesta que explica el sistema y conecta con el hub/ecosistema.
- Clasificación REAL/DEMO/PARCIAL/ROADMAP visible.
- PWA instalable (manifest + iconos mínimos).
- Cero señales de plantilla genérica.
- Cero sobrepromesa de funcionalidad no accesible.

---

## H. Ejemplo de salida (wireframe en texto)

**Landing (/)**
```
[Logo] Artificial World — Constructor de Mundos
[Nav: Hub | Arena | Paper | Repo]

Hero: "Simulación 2D de agentes autónomos con refugios y memoria"
[CTA: Entrar al Hub]

Concepto | Ecosistema (tarjetas con badges) | Simulador (con disclaimer) | Docs | Repo
```

**Hub (/hub)**
```
[Nav: Inicio | Hub | Arena | Paper | Repo]

Título: "Ecosistema Artificial World"

[Grid de tarjetas]
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Simulación  │ │ Arena       │ │ FireSim     │
│ [DEMO]      │ │ [DEMO]      │ │ [DEMO]      │
│ [Entrar]    │ │ [Entrar]    │ │ [Entrar]    │
└─────────────┘ └─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ MissionControl│ │ Mystic Quest│ │ Runtime 3D│
│ [PARCIAL]   │ │ [PARCIAL]   │ │ [ROADMAP]  │
│ [Próximamente]│ │ [Próximamente]│ │ [Próximamente]│
└─────────────┘ └─────────────┘ └─────────────┘
```

**Games (/games)**
```
[Nav: Inicio | Hub | Arena | Paper | Repo]

Título: "Arena de minijuegos"

[3 en Raya] [Real] [Jugar]
[Damas] [Real] [Jugar]
[Ajedrez] [Próximamente]
```

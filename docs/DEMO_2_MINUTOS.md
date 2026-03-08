# Demo de 2 minutos — Artificial World

> Guía para grabar o mostrar el flujo fundador en menos de 2 minutos.

---

## Prerrequisitos

1. Backend y frontend en marcha:
   ```powershell
   .\scripts\iniciar_fullstack.ps1
   ```

2. Navegador en `http://localhost:5173`

3. (Opcional) Borrar `localStorage` para simular usuario nuevo:
   - DevTools → Application → Local Storage → Clear

---

## Guion (≈ 90 segundos)

### Paso 1 — Semilla (15 s)

- Pantalla: *Crea tu primer refugio y mira nacer tu civilización*
- Elige una semilla (ej. **Tribu de frontera** o **Reino guerrero**)
- Clic en la tarjeta → pasa al paso 2

### Paso 2 — Constructor (15 s)

- *¿Cómo te llamas, constructor?*
- Escribe un nombre (ej. *Ana*)
- Clic **Continuar** (o ← Cambiar semilla si quieres volver)

### Paso 3 — Refugio (20 s)

- *Nombra tu refugio*
- Usa la sugerencia o escribe uno propio (ej. *Refugio de frontera*)
- Clic **Crear mi refugio**
- Espera *Construyendo…*

### Paso 4 — Listo (10 s)

- *Tu mundo está listo*
- Clic **Entrar en mi mundo →**

### Paso 5 — Hub (30 s)

- Muestra el Hub con tu mundo
- Entra al mundo (Tu Mundo / HeroRefuge)
- Muestra el refugio, el mapa, la crónica fundacional

---

## Para grabar

### Opción A — OBS / captura de pantalla

1. Abre OBS o similar
2. Captura ventana del navegador
3. Sigue el guion
4. Exporta a MP4 o GIF

### Opción B — Playwright (screenshots)

```powershell
.\scripts\iniciar_fullstack.ps1
# En otra terminal, cuando la app esté lista:
node scripts/capture-screenshots.js
```

Las capturas quedan en `docs/tutorial/screenshots/`.

### Opción C — PDF con evidencias

```powershell
node scripts/generar-pdf-evidencias.js
```

Genera `docs/EVIDENCIAS_ARTIFICIAL_WORLD.pdf` con capturas y logs.

---

## Mensaje clave

> *En menos de 2 minutos creas un refugio, eliges una semilla y ves nacer tu civilización. No es un editor de mapas. Es el inicio de un mundo vivo.*

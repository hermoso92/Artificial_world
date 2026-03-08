# Tutorial — Artificial World (demo web)

Guía paso a paso obligatoria para nuevos usuarios. Flujo: Unirse o crear mundo → Crear héroe → Crear refugio y comunidad → Acceder a tu casa → Decorar con muebles.

---

## Requisitos previos

1. **App en ejecución** — Ejecuta `.\scripts\iniciar_fullstack.ps1` desde la raíz del proyecto
2. **Navegador** — Se abrirá en http://localhost:5173

---

## Paso 1 — Unirse o crear mundo

Al abrir la app por primera vez verás el tutorial obligatorio.

- **Crear mi mundo** — Empieza desde cero (opción por defecto)
- **Unirme con código** — Próximamente (para unirse a un mundo existente)

Selecciona "Crear mi mundo" y pulsa **Continuar**.

---

## Paso 2 — Crear héroe

Cada mundo necesita un constructor. Introduce tu nombre y un título (ej. "Constructor de Mundos").

- **Tu nombre** — Cómo te identificarás en el mundo
- **Título** — Rol o descripción de tu héroe

Pulsa **Crear héroe** para continuar.

---

## Paso 3 — Crear refugio y comunidad

Tu refugio es el primer lugar de tu mundo. Dale un nombre a tu casa y comunidad.

- **Nombre del refugio** — Ej. "Mi refugio", "Mi casa"
- Es donde vivirás, colocarás muebles y darás vida a tus habitantes

Pulsa **Crear refugio y comunidad** para continuar.

---

## Paso 4 — Acceder a tu casa

Desde el **Hub** (centro de mando), entra en **Tu Mundo**. Tu refugio te espera.

**Flujo:** Hub → Tu Mundo → Tu refugio

Desde el Hub puedes controlar todo:
- **Tu Mundo** — Simulación, refugios, agentes
- **Arena** — Minijuegos (3 en raya, damas, ajedrez)
- **Emergencias** — DobackSoft — misiones de rescate
- **Observatorio** — Mission Control — vista en vivo

---

## Paso 5 — Decorar tu casa

Cuando entres en tu refugio por primera vez verás:

> **Tu casa está vacía. Pulsa "Editar" debajo del mapa para colocar muebles.**

### Ubicación del botón Editar

El botón **Editar** está **debajo del mapa** (canvas de la simulación), dentro de los controles de edición. Al pulsarlo se abren las opciones para colocar muebles.

### Muebles recomendados

| Mueble | Zona | Efecto |
|--------|------|--------|
| **Cama** | Dormitorio (arriba-izquierda) | +30 energía |
| **Mesa** | Cocina (arriba-derecha) | +25 hambre |
| **Sofá** | Salón (centro) | +15 ánimo, +10 energía |

**Cómo colocar:**
1. Pulsa **Editar** debajo del mapa
2. Selecciona el mueble (Cama, Mesa, Sofá, etc.)
3. Haz clic en la celda del grid donde quieres colocarlo
4. Pulsa **Cerrar editor** cuando termines

---

## Crear casa desde cero

Si tu casa está vacía, el mensaje que verás es:

> Tu casa está vacía. Pulsa **Editar** debajo del mapa para colocar muebles.
>
> Prueba a poner una **Cama** en el Dormitorio, una **Mesa** en la Cocina o un **Sofá** en el Salón.

El botón Editar se resalta cuando la casa está vacía para que sea más visible.

---

## Control total

Desde el Hub accedes a todas las zonas:

| Zona | Descripción |
|------|-------------|
| **Tu Mundo** | Simulación principal, refugios, agentes, decorar tu casa |
| **Arena** | Minijuegos contra otros o contra tu IA |
| **Emergencias** | DobackSoft — misiones de rescate |
| **Observatorio** | Mission Control — vista en vivo, logs, auditoría |

---

## Generar las capturas

Si las imágenes no aparecen, genera los screenshots con:

```powershell
# Con la app corriendo (iniciar_fullstack.ps1)
node scripts/capture-screenshots.js
```

Las capturas se guardan en `docs/tutorial/screenshots/`.

---

## Siguientes pasos

- **Versión completa (Python):** `python principal.py` — Motor completo con Modo Sombra
- **Ejecutable Windows:** `.\build_exe.ps1` → `dist\MundoArtificial.exe`
- **Documentación:** `docs/ESENCIAL.md`

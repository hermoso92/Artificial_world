# DobackSoft — Guía para testers

> Qué probar, cómo probarlo y qué esperar en cada caso.  
> Para testers manuales, evaluadores externos y early adopters.  
> **Fecha:** 2026-03-08

---

## Los dos entornos

| Entorno | URL | Propósito |
|---------|-----|-----------|
| **Demo (Fire Simulator)** | `http://localhost:5173` | Flujo cupón + juego + visor rutas |
| **Producto completo** | `http://localhost:5174` | Plataforma B2B StabilSafe V3 |

Para iniciar ambos: `.\iniciar.ps1` en cada repo.

---

## ENTORNO 1: artificial-word (demo)

### TC-001 — Flujo cupón fundador

**Objetivo:** Verificar que un usuario puede obtener acceso early adopter.

**Pasos:**
1. Abre `http://localhost:5173`
2. Haz clic en "Crear mundo"
3. Selecciona cualquier semilla de civilización
4. Escribe tu nombre y un nombre de refugio
5. Desde el Hub, haz clic en "Emergencias"
6. En el campo de cupón, escribe `FUNDADOR1000`
7. Haz clic en "Validar"

**Esperado:**
- Aparece el mensaje: *"Cupón válido. Tu precio: €9.99/mes"*
- Se muestra un código de acceso formato `DOBACK-XXXX-XXXX`
- Aparece botón "Reservar por €9.99/mes"
- Aparece botón "Copiar" junto al código

**Variante — Cupón DEMO:**
- Mismos pasos con `DEMO`
- Mismo resultado (siempre válido)

**Variante — Cupón inválido:**
- Escribe `INVALIDO`
- Esperado: *"Cupón no válido. Precio estándar: €29/mes."*

---

### TC-002 — Fire Simulator básico

**Objetivo:** Verificar que el juego arranca y es jugable.

**Prerrequisito:** TC-001 completado (cupón válido).

**Pasos:**
1. Tras validar el cupón, haz clic en la pestaña "Jugar"
2. Haz clic en "Jugar Fire Simulator"
3. En el simulador: usa WASD o flechas para mover el camión

**Esperado:**
- El camión se mueve con WASD
- Se ve el mapa 2D con calles, edificios, tráfico
- Panel lateral muestra: velocidad, combustible, temperatura, agua, sirena
- Hay un incendio marcado en el mapa (punto naranja/rojo)
- Mini-mapa en esquina muestra posición relativa

**Acciones a probar:**
| Tecla | Acción |
|-------|--------|
| W / ↑ | Acelerar |
| S / ↓ | Frenar/marcha atrás |
| A / ← | Girar izquierda |
| D / → | Girar derecha |
| E | Sirena on/off |
| Espacio | Frenar de emergencia |

---

### TC-003 — Fire Simulator niveles

**Objetivo:** Verificar que la dificultad escala entre niveles.

**Pasos:**
1. Completa el Nivel 1 (llega al incendio)
2. Observa la transición al Nivel 2

**Esperado:**
- Nivel 2 tiene más tráfico o condiciones distintas
- El tiempo límite es diferente (o hay más presión)
- Se muestran hasta 5 niveles de dificultad creciente

**Condiciones especiales a observar:**
- Lluvia: visibilidad reducida
- Niebla: visibilidad muy limitada
- Tormenta: lluvia + viento

---

### TC-004 — Visor de rutas 2D

**Objetivo:** Verificar que el visor de rutas funciona con datos mock.

**Pasos:**
1. Valida un cupón (TC-001)
2. Haz clic en la pestaña "Ver rutas"
3. En la lista de sesiones (izquierda), haz clic en "Vehículo demo"

**Esperado:**
- El canvas muestra una ruta en color azul-cian
- Los puntos de inicio y fin son círculos más grandes
- Los eventos de incidente son círculos naranjas con borde blanco
- Aparece leyenda: "Ruta GPS" + "Eventos"
- Aparece badge "Demo" indicando que son datos de demostración
- Botón "Jugar esta ruta" lleva al Fire Simulator

---

### TC-005 — Subida de archivos

**Objetivo:** Verificar que el formulario de subida funciona.

**Pasos:**
1. Valida un cupón (TC-001)
2. Haz clic en la pestaña "Subir"
3. Rellena el nombre del vehículo: "Bombero Test 01"
4. Selecciona un archivo CSV cualquiera (o `.txt`) en el campo "GPS"
5. Haz clic en "Subir archivos"

**Esperado:**
- Mensaje de éxito con número de archivos recibidos
- Aparece botón "Ver rutas"
- Al hacer clic en "Ver rutas", la sesión subida aparece en la lista

**Caso error — sin archivos:**
- Haz clic en "Subir archivos" sin seleccionar ningún archivo
- Esperado: mensaje de error "Selecciona al menos un archivo"

**Caso error — archivo muy grande:**
- Intenta subir un archivo de más de 50 MB
- Esperado: error de tamaño antes de enviar

---

### TC-006 — Contador de ciudadanos

**Objetivo:** Verificar que el contador se actualiza al registrarse.

**Pasos:**
1. Anota el número de ciudadanos en el panel de estadísticas
2. Valida cupón → haz clic en "Reservar"
3. Observa el contador

**Esperado:**
- El contador sube en 1
- Mensaje: "¡Bienvenido, ciudadano #X!"
- El precio queda reservado

---

## ENTORNO 2: dobackv2 (producto completo)

**URL:** `http://localhost:5174`  
**Credenciales:** `antoniohermoso92@manager.com` / `password123`

---

### TC-010 — Login y autenticación

**Pasos:**
1. Abre `http://localhost:5174`
2. Introduce email y password
3. Haz clic en "Iniciar sesión"

**Esperado:**
- Redirección al Dashboard
- Menú lateral con todos los módulos
- Nombre del usuario en la cabecera

**Caso error — credenciales incorrectas:**
- Introduce password: `incorrecto`
- Esperado: mensaje de error claro, sin redirección

---

### TC-011 — Panel de Control (Dashboard)

**Objetivo:** Verificar que los KPIs se muestran correctamente.

**Pasos:**
1. Navega a Panel de Control

**Esperado:**
- KPIs visibles: disponibilidad de flota, tiempos de respuesta, incidencias, km recorridos
- Gráficas interactivas (hover para valores)
- Alertas activas en panel secundario
- Estado de mantenimiento de la flota

**Modo TV Wall:**
- Busca botón "TV Wall" o pantalla completa
- Esperado: KPIs grandes, colores, sin menús laterales

---

### TC-012 — Subida de archivos reales

**Objetivo:** Verificar el flujo completo de subida y procesamiento.

**Pasos:**
1. Navega a cualquier sección con botón de subida
2. Selecciona un vehículo de la lista
3. Sube un archivo CSV de muestra

**Esperado:**
- Feedback de "procesando"
- Notificación cuando termina el procesamiento
- Los datos aparecen en Estabilidad/Telemetría

---

### TC-013 — Módulo Estabilidad

**Pasos:**
1. Navega a "Estabilidad"
2. Selecciona un vehículo de la lista
3. Selecciona un rango de fechas

**Esperado:**
- Métricas: horas conducción, km, tiempo con rotativo, incidencias
- Gráfica de eventos por severidad
- Mapa de eventos GPS (puntos coloreados)
- Botón "Exportar PDF" visible

---

### TC-014 — Exportación PDF

**Objetivo:** Verificar que el PDF en 1 clic funciona.

**Pasos:**
1. Desde Estabilidad, haz clic en "Exportar PDF"

**Esperado:**
- Se descarga o abre un PDF
- El PDF incluye: métricas, gráficas, análisis

---

### TC-015 — Módulo Telemetría

**Pasos:**
1. Navega a "Telemetría"
2. Observa las pestañas: Datos CAN, Mapa GPS, Alarmas, Comparador

**En "Mapa GPS":**
- Esperado: mapa Leaflet/TomTom con puntos GPS
- Los puntos están coloreados por tipo de evento

**En "Alarmas":**
- Esperado: lista de alarmas con umbrales configurables
- Posibilidad de editar umbral de una alarma

---

### TC-016 — Geofences

**Pasos:**
1. Navega a "Geofences"
2. Observa las zonas existentes en el mapa
3. Intenta crear una nueva zona:
   - Nombre: "Zona Test"
   - Dibuja un polígono en el mapa
   - Activa "Alerta al entrar"

**Esperado:**
- La zona aparece en el mapa tras guardar
- En la lista aparece con nombre y estado activo

---

### TC-017 — Módulo IA

**Pasos:**
1. Navega a "Inteligencia Artificial"
2. En la pestaña "Chat IA", escribe: "¿Cuál es el vehículo con más incidencias esta semana?"

**Esperado:**
- Respuesta del asistente con información relevante
- Respuesta explicada en lenguaje natural, no solo números

**En "Patrones detectados":**
- Esperado: lista de patrones identificados en los datos

---

### TC-018 — Administración (ADMIN)

> Solo accesible con rol ADMIN.

**Pasos:**
1. Navega a "Administración" (si aparece en el menú)
2. Observa las pestañas: Parques, Vehículos, Usuarios, Configuración

**Esperado:**
- CRUD completo de vehículos y usuarios
- Posibilidad de cambiar rol de usuario

---

## Qué anotar en el feedback

Para cada test que hagas, anota:

```
TC: [número del test]
Resultado: PASS / FAIL / PARCIAL
Descripción: [qué pasó exactamente]
Severidad (si falla): BLOCKER / MAYOR / MENOR
Captura: [si es posible]
```

### Escala de severidad

| Severidad | Descripción |
|-----------|-------------|
| BLOCKER | Impide usar la funcionalidad completamente |
| MAYOR | Funciona pero con comportamiento incorrecto significativo |
| MENOR | Pequeño problema visual o de UX, no impide el uso |

---

## Estado esperado del sistema

| Componente | Estado al testear |
|------------|------------------|
| Cupón DEMO | Siempre válido |
| Cupón FUNDADOR1000 | Válido mientras `ciudadanos < 1000` |
| Fire Simulator | Funcional, WASD, 5 niveles |
| Visor rutas | Funcional con datos mock siempre |
| Dashboard | Funcional con datos demo |
| KPIs | Calculados si hay datos subidos |
| PDF | Funcional |
| Chat IA | Funcional si Ollama está corriendo |
| Mapas | Funcional (Leaflet, sin API key para demo) |

---

*DobackSoft Testing Guide — 2026-03-08*

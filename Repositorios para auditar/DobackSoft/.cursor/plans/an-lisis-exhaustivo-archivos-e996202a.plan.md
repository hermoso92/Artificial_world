<!-- e996202a-868a-4f0d-960c-2d9bbb6d232b 5fe633fb-2abd-4ac3-a8f3-874170b73e2c -->
# Plan Completo: Sistema DobackSoft V3 - StabilSafe

## 🎯 Objetivo General

Implementar un sistema robusto y completo que procese archivos de vehículos Doback, calcule KPIs precisos, detecte eventos críticos, gestione claves operacionales de bomberos y genere reportes profesionales.

---

## FASE 1: AUDITORÍA Y DISEÑO DE BASE DE DATOS

### 1.1 Auditoría Completa del Sistema Actual

- Revisar todos los controladores de subida existentes (`MassUploadController`, `SessionsUploadController`, `upload.ts`, `upload-simple.ts`)
- Identificar qué funciona y qué está duplicado
- Documentar problemas críticos detectados

### 1.2 Diseño de Nuevas Tablas BD

**Crear migration Prisma con:**

```prisma
// Mejorar ArchivoSubido existente
model ArchivoSubido {
  // ... campos existentes ...
  lineasTotales    Int
  lineasValidas    Int
  lineasInvalidas  Int
  porcentajeValido Float
  problemasDetectados Json  // Array de problemas: GPS sin señal, timestamps, etc.
}

// NUEVA: Tabla de Claves Operacionales
model OperationalKey {
  id             String   @id @default(uuid())
  sessionId      String
  session        Session  @relation(fields: [sessionId], references: [id])
  keyType        Int      // 0=Taller, 1=Parque, 2=Emergencia, 3=Incendio, 5=Regreso
  startTime      DateTime
  endTime        DateTime?
  duration       Int?     // segundos
  startLat       Float?
  startLon       Float?
  endLat         Float?
  endLon         Float?
  rotativoState  Boolean?
  geofenceId     String?  // ID de geocerca involucrada
  details        Json?    // Metadata adicional
  
  @@index([sessionId, keyType])
  @@index([keyType, startTime])
}

// Mejorar StabilityEvent existente
model StabilityEvent {
  // ... campos existentes ...
  severity       String   // "CRITICA", "ALTA", "MODERADA", "LEVE"
  keyType        Int?     // Clave activa en ese momento
  interpolatedGPS Boolean @default(false)
}

// NUEVA: Tabla de Calidad de Datos
model DataQualityMetrics {
  id                String   @id @default(uuid())
  sessionId         String   @unique
  session           Session  @relation(fields: [sessionId], references: [id])
  
  gpsTotal          Int
  gpsValidas        Int
  gpsSinSenal       Int
  gpsInterpoladas   Int
  porcentajeGPSValido Float
  
  estabilidadTotal  Int
  estabilidadValidas Int
  
  rotativoTotal     Int
  rotativoValidas   Int
  
  problemas         Json     // Lista detallada de problemas
  createdAt         DateTime @default(now())
}
```

**Índices optimizados:**

```sql
CREATE INDEX idx_session_vehicle_date ON "Session"("vehicleId", "startTime" DESC);
CREATE INDEX idx_gps_valid_fix ON "GpsMeasurement"("sessionId", "timestamp") WHERE "fix" = '1';
CREATE INDEX idx_stability_low_si ON "StabilityMeasurement"("sessionId", "si") WHERE "si" < 0.50;
CREATE INDEX idx_events_severity ON "StabilityEvent"("severity", "timestamp" DESC);
CREATE INDEX idx_operational_keys ON "OperationalKey"("sessionId", "keyType", "startTime");
```

---

## FASE 2: SISTEMA DE SUBIDA ROBUSTO (CONSOLIDADO)

### 2.1 Crear Procesador Unificado

**Archivo:** `backend/src/services/UnifiedFileProcessor.ts`

**Funcionalidades:**

1. **Detección de sesiones múltiples** en un solo archivo
2. **Validación robusta** de GPS (manejo de "sin datos GPS")
3. **Corrección de timestamps** (usar Hora Raspberry, no GPS)
4. **Interpolación de timestamps** en ESTABILIDAD (entre marcadores HH:MM:SS)
5. **Validación de datos corruptos** (coordenadas truncadas, valores nulos)
6. **Estadísticas de calidad** por archivo
```typescript
interface ProcessingResult {
  sesionesCreadas: number;
  archivosValidos: number;
  archivosConProblemas: number;
  estadisticas: {
    gpsValido: number;
    gpsInterpolado: number;
    gpsSinSenal: number;
    estabilidadValida: number;
    rotativoValido: number;
  };
  problemas: Array<{tipo: string; descripcion: string; gravedad: string}>;
}
```


### 2.2 Parsers Mejorados

#### GPS Parser con validación

```typescript
function parseGPSRobust(buffer: Buffer): GPSData[] {
  const lineas = buffer.toString('utf-8').split('\n');
  const puntosValidos = [];
  const problemas = [];
  
  for (const linea of lineas) {
    if (linea.includes('sin datos GPS')) {
      problemas.push({tipo: 'GPS_SIN_SENAL', linea});
      continue;
    }
    
    const partes = linea.split(',');
    const lat = parseFloat(partes[3]);
    const lon = parseFloat(partes[4]);
    
    // Validar coordenadas
    if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
      problemas.push({tipo: 'GPS_INVALIDO', linea});
      continue;
    }
    
    // Usar HORA RASPBERRY (no GPS)
    const timestamp = parseTimestampRaspberry(partes[0], partes[1]);
    
    puntosValidos.push({timestamp, lat, lon, ...});
  }
  
  return {puntos: puntosValidos, problemas};
}
```

#### ESTABILIDAD Parser con timestamps interpolados

```typescript
function parseEstabilidadRobust(buffer: Buffer, fechaSesion: Date) {
  const lineas = buffer.toString('utf-8').split('\n');
  const datos = [];
  let ultimoMarcador: Date | null = null;
  let lineasDesdeMarcador = 0;
  
  for (const linea of lineas) {
    // Detectar marcador temporal (HH:MM:SS)
    if (linea.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const [h, m, s] = linea.split(':');
      ultimoMarcador = new Date(fechaSesion);
      ultimoMarcador.setHours(parseInt(h), parseInt(m), parseInt(s));
      lineasDesdeMarcador = 0;
      continue;
    }
    
    if (linea.includes(';') && ultimoMarcador) {
      // Interpolar timestamp (~10 Hz)
      const timestamp = new Date(ultimoMarcador.getTime() + lineasDesdeMarcador * 100);
      const valores = linea.split(';').map(v => parseFloat(v.trim()));
      
      datos.push({
        timestamp,
        ax: valores[0], ay: valores[1], az: valores[2],
        gx: valores[3], gy: valores[4], gz: valores[5],
        roll: valores[6], pitch: valores[7], yaw: valores[8],
        si: valores[16], accmag: valores[17]
      });
      
      lineasDesdeMarcador++;
    }
  }
  
  return datos;
}
```

### 2.3 Detección de Sesiones Múltiples

```typescript
function detectarSesionesMultiples(buffer: Buffer, tipo: string) {
  const contenido = buffer.toString('utf-8');
  const sesiones = [];
  let sesionActual = null;
  
  const regex = new RegExp(`^${tipo};(\\d{2}/\\d{2}/\\d{4}).*Sesión:(\\d+)`, 'gm');
  let match;
  
  while ((match = regex.exec(contenido)) !== null) {
    if (sesionActual) {
      sesiones.push(sesionActual);
    }
    
    sesionActual = {
      fecha: match[1],
      numeroSesion: parseInt(match[2]),
      inicioLinea: match.index,
      finLinea: null
    };
  }
  
  if (sesionActual) {
    sesiones.push(sesionActual);
  }
  
  return sesiones;
}
```

### 2.4 Controlador Unificado

**Archivo:** `backend/src/routes/upload-unified.ts`

- Deprecar controladores antiguos
- Endpoint único: `POST /api/upload/unified`
- Acepta múltiples archivos simultáneos
- Agrupa automáticamente por vehículo y sesión
- Guarda estadísticas de calidad en `DataQualityMetrics`

---

## FASE 3: CORRELACIÓN DE DATOS

### 3.1 Servicio de Correlación

**Archivo:** `backend/src/services/DataCorrelationService.ts`

```typescript
async function correlacionarSesion(sessionId: string) {
  const [gps, estabilidad, rotativo] = await Promise.all([
    prisma.gpsMeasurement.findMany({where: {sessionId}, orderBy: {timestamp: 'asc'}}),
    prisma.stabilityMeasurement.findMany({where: {sessionId}, orderBy: {timestamp: 'asc'}}),
    prisma.rotativoMeasurement.findMany({where: {sessionId}, orderBy: {timestamp: 'asc'}})
  ]);
  
  // 1. Interpolar GPS si hay gaps < 10s
  const gpsInterpolado = interpolarGPS(gps);
  
  // 2. Crear mapa de estado rotativo por timestamp
  const rotativoMap = crearMapaRotativo(rotativo);
  
  // 3. Correlacionar GPS con Rotativo
  const gpsConRotativo = gps.map(g => ({
    ...g,
    rotativoOn: encontrarEstadoMasCercano(g.timestamp, rotativoMap, 5000)
  }));
  
  // 4. Correlacionar Estabilidad con GPS (para eventos)
  const estabilidadConGPS = estabilidad.map(e => {
    const gpsMasCercano = encontrarPuntoMasCercano(e.timestamp, gpsInterpolado, 5000);
    return {
      ...e,
      lat: gpsMasCercano?.latitude || 0,
      lon: gpsMasCercano?.longitude || 0,
      speed: gpsMasCercano?.speed || 0,
      interpolatedGPS: gpsMasCercano?.interpolado || false
    };
  });
  
  return {gpsConRotativo, estabilidadConGPS};
}
```

### 3.2 Interpolación GPS

```typescript
function interpolarGPS(puntos: GPSPoint[]) {
  const completos = [];
  
  for (let i = 0; i < puntos.length - 1; i++) {
    completos.push(puntos[i]);
    
    const siguiente = puntos[i + 1];
    const diffSegundos = (siguiente.timestamp - puntos[i].timestamp) / 1000;
    
    // Interpolar si gap < 10s
    if (diffSegundos > 1 && diffSegundos <= 10) {
      const numPuntos = Math.floor(diffSegundos) - 1;
      
      for (let j = 1; j <= numPuntos; j++) {
        const ratio = j / (numPuntos + 1);
        completos.push({
          timestamp: new Date(puntos[i].timestamp.getTime() + diffSegundos * 1000 * ratio),
          latitude: puntos[i].latitude + (siguiente.latitude - puntos[i].latitude) * ratio,
          longitude: puntos[i].longitude + (siguiente.longitude - puntos[i].longitude) * ratio,
          interpolado: true
        });
      }
    }
  }
  
  completos.push(puntos[puntos.length - 1]);
  return completos;
}
```

---

## FASE 4: DETECCIÓN Y ALMACENAMIENTO DE EVENTOS

### 4.1 Event Detector con GPS

**Archivo:** `backend/src/services/EventDetectorWithGPS.ts`

```typescript
async function detectarYGuardarEventos(sessionId: string) {
  const {estabilidadConGPS} = await correlacionarSesion(sessionId);
  
  const eventos = [];
  
  for (const muestra of estabilidadConGPS) {
    // Solo detectar si SI < 50%
    if (muestra.si >= 0.50) continue;
    
    let tipo = null;
    let severidad = 'LEVE';
    
    // Vuelco inminente
    if (muestra.si < 0.10 && (Math.abs(muestra.roll) > 10 || Math.abs(muestra.gx) > 30)) {
      tipo = 'VUELCO_INMINENTE';
      severidad = 'CRITICA';
    }
    // Deriva peligrosa
    else if (Math.abs(muestra.gx) > 45 && muestra.si > 0.70) {
      tipo = 'DERIVA_PELIGROSA';
      severidad = 'ALTA';
    }
    // Maniobra brusca
    else if (Math.abs(muestra.ay) > 300) {
      tipo = 'MANIOBRA_BRUSCA';
      severidad = 'MODERADA';
    }
    
    if (!tipo) continue;
    
    await prisma.stabilityEvent.create({
      data: {
        sessionId,
        timestamp: muestra.timestamp,
        type: tipo,
        severity: severidad,
        lat: muestra.lat,
        lon: muestra.lon,
        speed: muestra.speed,
        interpolatedGPS: muestra.interpolatedGPS,
        details: {ax: muestra.ax, ay: muestra.ay, ...}
      }
    });
    
    eventos.push(tipo);
  }
  
  return eventos;
}
```

---

## FASE 5: CÁLCULO DE CLAVES OPERACIONALES

### 5.1 Servicio de Claves

**Archivo:** `backend/src/services/OperationalKeyCalculator.ts`

```typescript
async function calcularClavesOperacionales(sessionId: string) {
  const {gpsConRotativo} = await correlacionarSesion(sessionId);
  const geocercas = await cargarGeocercas();
  
  const claves = [];
  let estadoActual = null;
  
  for (const punto of gpsConRotativo) {
    const enParque = verificarEnGeocerca(punto, geocercas.parques);
    const enTaller = verificarEnGeocerca(punto, geocercas.talleres);
    
    // Clave 0 - Taller
    if (enTaller) {
      if (!estadoActual || estadoActual.keyType !== 0) {
        if (estadoActual) await guardarClave(estadoActual);
        estadoActual = {keyType: 0, startTime: punto.timestamp, startLat: punto.lat, startLon: punto.lon};
      }
    }
    // Clave 1 - En Parque
    else if (enParque && !punto.rotativoOn) {
      if (!estadoActual || estadoActual.keyType !== 1) {
        if (estadoActual) await guardarClave(estadoActual);
        estadoActual = {keyType: 1, startTime: punto.timestamp, startLat: punto.lat, startLon: punto.lon};
      }
    }
    // Clave 2 - Salida Emergencia
    else if (!enParque && punto.rotativoOn && estadoActual?.keyType === 1) {
      await guardarClave(estadoActual);
      estadoActual = {keyType: 2, startTime: punto.timestamp, startLat: punto.lat, startLon: punto.lon, rotativoState: true};
    }
    // Clave 3 - En Incendio (parado > 5 min)
    else if (punto.speed < 5 && estadoActual?.keyType === 2) {
      // Detectar si lleva parado > 5 min
      const tiempoParado = await calcularTiempoParado(sessionId, punto.timestamp);
      if (tiempoParado > 300) {
        await guardarClave(estadoActual);
        estadoActual = {keyType: 3, startTime: punto.timestamp, startLat: punto.lat, startLon: punto.lon};
      }
    }
    // Clave 5 - Regreso
    else if (!punto.rotativoOn && estadoActual?.keyType === 3) {
      await guardarClave(estadoActual);
      estadoActual = {keyType: 5, startTime: punto.timestamp, startLat: punto.lat, startLon: punto.lon, rotativoState: false};
    }
  }
  
  if (estadoActual) await guardarClave(estadoActual);
  
  return claves;
}
```

### 5.2 Integración Radar.com

```typescript
async function verificarEnGeocerca(punto: GPSPoint, geocercas: Geofence[]) {
  // Opción 1: Usar Radar.com API
  if (process.env.RADAR_SECRET_KEY) {
    try {
      const context = await radarService.getContext(punto.lat, punto.lon);
      const geofence = context.geofences?.find(g => g.tag === 'parque' || g.tag === 'taller');
      return !!geofence;
    } catch (error) {
      // Fallback a BD local
    }
  }
  
  // Opción 2: Usar geocercas de BD
  return geocercas.some(g => puntoEnPoligono(punto.lat, punto.lon, g.coordinates));
}
```

---

## FASE 6: INTEGRACIÓN TOMTOM (VELOCIDADES)

### 6.1 Servicio TomTom

**Archivo:** `backend/src/services/TomTomSpeedService.ts`

```typescript
async function obtenerLimiteVelocidad(lat: number, lon: number): Promise<number> {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`;
  const params = {
    key: process.env.TOMTOM_API_KEY,
    point: `${lat},${lon}`
  };
  
  const response = await axios.get(url, {params});
  const speedLimit = response.data.flowSegmentData?.currentSpeed || 50;
  
  return speedLimit;
}

async function detectarExcesosVelocidad(sessionId: string) {
  const {gpsConRotativo} = await correlacionarSesion(sessionId);
  const excesos = [];
  
  for (const punto of gpsConRotativo) {
    if (!punto.speed || punto.speed < 10) continue;
    
    const limiteVia = await obtenerLimiteVelocidad(punto.lat, punto.lon);
    const limiteBomberos = calcularLimiteBomberos(limiteVia, punto.rotativoOn);
    
    if (punto.speed > limiteBomberos) {
      excesos.push({
        timestamp: punto.timestamp,
        lat: punto.lat,
        lon: punto.lon,
        velocidad: punto.speed,
        limite: limiteBomberos,
        exceso: punto.speed - limiteBomberos,
        rotativoOn: punto.rotativoOn
      });
    }
  }
  
  return excesos;
}

function calcularLimiteBomberos(limiteVia: number, rotativoOn: boolean) {
  // Límites específicos para camiones de bomberos
  const limitesCamion = {
    autopista: 90,
    convencional: 80,
    urbana: 70,
    sinPavimentar: 30
  };
  
  // Si rotativo ON, pueden exceder según protocolo (pero registrar)
  return rotativoOn ? limiteVia + 20 : limitesCamion.convencional;
}
```

---

## FASE 7: DASHBOARD Y REPORTES

### 7.1 Actualizar KPI Calculator

**Archivo:** `backend/src/services/kpiCalculator.ts`

Agregar:

- Tiempos por clave operacional (0,1,2,3,5)
- Eventos con coordenadas GPS
- Excesos de velocidad con límites reales
- Índice de calidad de datos

### 7.2 Endpoints de Claves

**Archivo:** `backend/src/routes/operationalKeys.ts`

```typescript
router.get('/operational-keys/summary', async (req, res) => {
  const {sessionId, vehicleIds, startDate, endDate} = req.query;
  
  const claves = await prisma.operationalKey.groupBy({
    by: ['keyType'],
    where: {sessionId: {in: sessionIds}},
    _sum: {duration: true},
    _count: true
  });
  
  res.json({
    clave0_taller: claves.find(c => c.keyType === 0)?._sum.duration || 0,
    clave1_parque: claves.find(c => c.keyType === 1)?._sum.duration || 0,
    clave2_emergencia: claves.find(c => c.keyType === 2)?._sum.duration || 0,
    clave3_incendio: claves.find(c => c.keyType === 3)?._sum.duration || 0,
    clave5_regreso: claves.find(c => c.keyType === 5)?._sum.duration || 0
  });
});
```

### 7.3 Componente Frontend Claves

**Archivo:** `frontend/src/components/kpi/OperationalKeysTab.tsx`

- Gráfica de tiempo por clave
- Mapa con trayectorias coloreadas por clave
- Tabla de transiciones clave a clave
- Alertas si secuencia atípica (ej: 1→5 sin pasar por 2,3)

### 7.4 Generación de PDF

**Archivo:** `backend/src/services/PDFExportService.ts`

Incluir secciones:

1. Resumen Ejecutivo (KPIs principales)
2. Claves Operacionales (tiempos, transiciones)
3. Eventos de Estabilidad (con mapa)
4. Excesos de Velocidad (tabla + mapa)
5. Calidad de Datos (% válido, interpolaciones)
6. Recomendaciones automáticas

---

## FASE 8: TESTING CON RESUMENDOBACK

### 8.1 Script de Testing

**Archivo:** `backend/test-resumendoback.ts`

```typescript
async function testearConResumenDoback() {
  const archivos = [
    'backend/data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251008.txt',
    'backend/data/datosDoback/CMadrid/doback024/GPS/GPS_DOBACK024_20251008.txt',
    'backend/data/datosDoback/CMadrid/doback024/ROTATIVO/ROTATIVO_DOBACK024_20251008.txt'
  ];
  
  // 1. Procesar con sistema unificado
  const resultado = await procesarArchivosUnificado(archivos);
  
  // 2. Verificar sesiones creadas
  console.log(`Sesiones creadas: ${resultado.sesionesCreadas}`);
  console.log(`GPS válido: ${resultado.estadisticas.gpsValido}%`);
  
  // 3. Calcular claves
  for (const sessionId of resultado.sessionIds) {
    const claves = await calcularClavesOperacionales(sessionId);
    console.log(`Sesión ${sessionId}: ${claves.length} claves detectadas`);
  }
  
  // 4. Detectar eventos
  for (const sessionId of resultado.sessionIds) {
    const eventos = await detectarYGuardarEventos(sessionId);
    console.log(`Sesión ${sessionId}: ${eventos.length} eventos detectados`);
  }
  
  // 5. Generar reporte
  const pdf = await generarReporteSesion(resultado.sessionIds[0]);
  fs.writeFileSync('reporte-test.pdf', pdf);
}
```

### 8.2 Validación de Resultados

- Comparar con `resumendoback/Analisis_Sesiones_CMadrid_Exhaustivo.docx`
- Verificar que número de sesiones coincide
- Validar que eventos detectados son realistas
- Confirmar que claves siguen secuencia lógica

---

## 🎯 ENTREGABLES FINALES

1. ✅ Sistema de subida consolidado y robusto
2. ✅ Base de datos con nuevas tablas (OperationalKey, DataQualityMetrics)
3. ✅ Correlación GPS-ESTABILIDAD-ROTATIVO funcional
4. ✅ Detección de eventos con coordenadas GPS
5. ✅ Cálculo de claves operacionales (0,1,2,3,5)
6. ✅ Integración Radar.com para geocercas
7. ✅ Integración TomTom para límites de velocidad
8. ✅ Dashboard actualizado con claves y eventos
9. ✅ Reportes PDF profesionales completos
10. ✅ Testing exhaustivo con datos reales de resumendoback

---

## 📋 ORDEN DE IMPLEMENTACIÓN

1. **Migración BD** (tablas nuevas, índices)
2. **Procesador Unificado** (parsers robustos, multi-sesión)
3. **Correlación de Datos** (GPS-ESTABILIDAD-ROTATIVO)
4. **Detector de Eventos** (con GPS)
5. **Calculador de Claves** (con geocercas)
6. **Integración APIs** (Radar, TomTom)
7. **Dashboard Frontend** (claves, eventos, mapas)
8. **Generador de Reportes** (PDF completo)
9. **Testing** (con resumendoback)
10. **Deprecar Sistemas Antiguos** (consolidación final)

### To-dos

- [ ] Auditar controladores de subida existentes y documentar problemas
- [ ] Crear migration Prisma con OperationalKey, DataQualityMetrics y mejoras a tablas existentes
- [ ] Implementar UnifiedFileProcessor.ts con detección multi-sesión y validación robusta
- [ ] Crear parsers mejorados para GPS (sin datos), ESTABILIDAD (timestamps interpolados) y ROTATIVO
- [ ] Crear endpoint /api/upload/unified que use el procesador unificado
- [ ] Implementar DataCorrelationService.ts con interpolación GPS y correlación GPS-ESTABILIDAD-ROTATIVO
- [ ] Crear EventDetectorWithGPS.ts que detecta eventos y los guarda con coordenadas GPS
- [ ] Implementar OperationalKeyCalculator.ts para calcular claves 0,1,2,3,5
- [ ] Integrar Radar.com para verificación de geocercas (parques, talleres)
- [ ] Implementar TomTomSpeedService.ts para obtener límites de velocidad reales
- [ ] Actualizar kpiCalculator.ts para incluir claves operacionales y eventos con GPS
- [ ] Crear endpoints API para claves operacionales (/api/operational-keys/*)
- [ ] Crear OperationalKeysTab.tsx con gráficas y mapas de claves
- [ ] Mejorar PDFExportService.ts con secciones de claves, eventos y calidad de datos
- [ ] Crear script test-resumendoback.ts y validar con datos reales
- [ ] Deprecar controladores antiguos y consolidar en sistema unificado
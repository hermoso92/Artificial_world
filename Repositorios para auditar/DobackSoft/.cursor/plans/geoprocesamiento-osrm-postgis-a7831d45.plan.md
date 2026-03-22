<!-- a7831d45-ad5c-45fd-80aa-0258ce11fde6 eae2ac20-3073-4f9b-9726-c77da00440c6 -->
# 🗺️ Plan de Implementación: Módulo de Geoprocesamiento OSRM + PostGIS

## 📋 Resumen Ejecutivo

**Objetivo:** Implementar sistema completo de geoprocesamiento para reconstruir rutas GPS, detectar geocercas y validar límites de velocidad en vehículos de emergencia (Bomberos Madrid).

**Arquitectura:** OSRM (map-matching) + PostGIS (geocercas) + TomTom (fallback límites) + Turf.js (geocercas en memoria)

**Tecnologías:** Docker Compose, PostgreSQL 16 + PostGIS 3.4, OSRM Backend, Node.js + TypeScript, @turf/boolean-point-in-polygon

**Tiempo estimado:** 6-8 horas implementación + 2-3 horas pruebas

**Correcciones aplicadas:**

- ✅ Healthcheck OSRM corregido (`/nearest` en vez de `/health`)
- ✅ Geocercas procesadas en memoria con Turf.js (no N queries SQL)
- ✅ Extension `pgcrypto` añadida
- ✅ Variables sensibles en `.env`
- ✅ División SQL init en 2 scripts (init + migrate)
- ✅ Filtro de jitter GPS (vehículo parado)
- ✅ Logs `debug` en vez de `info` para pasos intermedios

---

## 🎯 Decisiones Arquitectónicas

### **1. Stack Tecnológico**

```
┌─────────────────────────────────────────────────────┐
│         Docker Compose (Orquestador)                 │
├─────────────────────────────────────────────────────┤
│  PostgreSQL 16 + PostGIS 3.4  (Puerto 5432)         │
│  OSRM Backend (Madrid OSM)     (Puerto 5000)        │
│  Backend Node.js               (Puerto 9998)        │
└─────────────────────────────────────────────────────┘
```

### **2. Mapa OSM**

- **madrid-latest.osm.pbf** (200 MB) en lugar de spain-latest (2.5 GB)
- URL: `https://download.geofabrik.de/europe/spain/madrid-latest.osm.pbf`

### **3. Límites de Velocidad**

```
Prioridad 1: Tabla configurable (speed_limits_config)
Prioridad 2: TomTom API (fallback con cache)
Prioridad 3: OSM maxspeed tags (si disponible)
```

### **4. Procesamiento**

- **Batch processing**: OSRM map-matching para toda la sesión
- **Geocercas**: ST_Intersects + Turf.js en memoria (NO bucles SQL)
- **Cache**: TomTom con ST_DWithin para reutilización

---

## 📦 Fase 1: Infraestructura Docker (1 hora)

### **1.1 Crear archivo .env**

**Archivo:** `.env` (raíz del proyecto)

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password-seguro-aqui
POSTGRES_DB=dobacksoft
DATABASE_URL=postgresql://postgres:tu-password-seguro-aqui@localhost:5432/dobacksoft

# OSRM
OSRM_URL=http://localhost:5000

# TomTom
TOMTOM_API_KEY=your-tomtom-api-key-here

# Node
NODE_ENV=production
```

### **1.2 Actualizar docker-compose.yml**

**Archivo:** `config/docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL con PostGIS
  db:
    image: postgis/postgis:16-3.4
    env_file:
      - ../.env
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/01-init-postgis.sql:/docker-entrypoint-initdb.d/01-init-postgis.sql
      - ./database/02-migrate-existing.sql:/docker-entrypoint-initdb.d/02-migrate-existing.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # OSRM para Madrid
  osrm:
    image: osrm/osrm-backend:latest
    container_name: dobacksoft-osrm
    ports:
      - "5000:5000"
    volumes:
      - ./osrm-data:/data
    command: >
      sh -c "
        if [ ! -f /data/madrid-latest.osrm ]; then
          echo '📥 Descargando mapa de Madrid (200 MB)...';
          wget -O /data/madrid-latest.osm.pbf https://download.geofabrik.de/europe/spain/madrid-latest.osm.pbf;
          echo '🔧 Preprocesando mapa (10-15 min)...';
          osrm-extract -p /opt/car.lua /data/madrid-latest.osm.pbf || exit 1;
          osrm-contract /data/madrid-latest.osrm || exit 1;
        fi;
        echo '🚀 Iniciando servidor OSRM...';
        osrm-routed --algorithm mld /data/madrid-latest.osrm
      "
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/nearest/v1/driving/0,0"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Node.js
  web:
    build: .
    ports:
      - "9998:9998"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - OSRM_URL=http://osrm:5000
      - TOMTOM_API_KEY=${TOMTOM_API_KEY}
      - NODE_ENV=${NODE_ENV}
    volumes:
      - .:/app
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
      osrm:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### **1.3 Crear scripts SQL (divididos)**

**Archivo:** `database/01-init-postgis.sql`

```sql
-- ============================================
-- SCRIPT 1: Inicialización PostGIS (BD nueva)
-- ============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- Para gen_random_uuid()

-- Verificar
DO $$
BEGIN
  RAISE NOTICE 'PostGIS Version: %', PostGIS_version();
END $$;

-- Crear tabla de configuración de límites
CREATE TABLE IF NOT EXISTS speed_limits_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    road_type VARCHAR(50) NOT NULL CHECK (road_type IN ('urban', 'interurban', 'highway')),
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('turismo', 'camion', 'emergencia')),
    speed_limit INT NOT NULL CHECK (speed_limit > 0 AND speed_limit <= 150),
    emergency_bonus INT DEFAULT 0 CHECK (emergency_bonus >= 0 AND emergency_bonus <= 50),
    organization_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(road_type, vehicle_type, organization_id)
);

-- Insertar límites DGT España
INSERT INTO speed_limits_config (road_type, vehicle_type, speed_limit, emergency_bonus) VALUES
('urban', 'turismo', 50, 0),
('urban', 'camion', 50, 0),
('urban', 'emergencia', 80, 30),
('interurban', 'turismo', 90, 0),
('interurban', 'camion', 80, 0),
('interurban', 'emergencia', 120, 30),
('highway', 'turismo', 120, 0),
('highway', 'camion', 90, 0),
('highway', 'emergencia', 120, 30)
ON CONFLICT (road_type, vehicle_type, organization_id) DO NOTHING;

-- Crear tabla de cache TomTom
CREATE TABLE IF NOT EXISTS speed_limits_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat DECIMAL(10, 8) NOT NULL,
    lon DECIMAL(11, 8) NOT NULL,
    geog geography(POINT, 4326), -- ✅ Columna espacial real
    speed_limit INT NOT NULL,
    road_type VARCHAR(50),
    source VARCHAR(50) DEFAULT 'tomtom',
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
    CONSTRAINT unique_coords UNIQUE(lat, lon)
);

-- Índice espacial en cache
CREATE INDEX IF NOT EXISTS idx_speed_cache_geog 
ON speed_limits_cache USING GIST (geog);

RAISE NOTICE '✅ PostGIS inicializado correctamente';
```

**Archivo:** `database/02-migrate-existing.sql`

```sql
-- ==============================================
-- SCRIPT 2: Migración de datos existentes
-- ==============================================

-- Agregar columna geog a GpsMeasurement si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'GpsMeasurement' AND column_name = 'geog'
  ) THEN
    ALTER TABLE "GpsMeasurement" ADD COLUMN geog geography(POINT, 4326);
    RAISE NOTICE 'Columna geog agregada a GpsMeasurement';
  END IF;
END $$;

-- Índice espacial en GpsMeasurement
CREATE INDEX IF NOT EXISTS idx_gps_geog 
ON "GpsMeasurement" USING GIST (geog);

-- Actualizar geog para datos existentes
UPDATE "GpsMeasurement" 
SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE geog IS NULL 
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- Actualizar geog en speed_limits_cache
UPDATE speed_limits_cache
SET geog = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
WHERE geog IS NULL;

-- Trigger para auto-actualizar geog
CREATE OR REPLACE FUNCTION update_gps_geog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geog = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_gps_geog ON "GpsMeasurement";
CREATE TRIGGER trg_update_gps_geog
BEFORE INSERT OR UPDATE ON "GpsMeasurement"
FOR EACH ROW
EXECUTE FUNCTION update_gps_geog();

-- Convertir geometry_postgis (si es text)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Park' AND column_name = 'geometry_postgis' AND data_type = 'text'
  ) THEN
    ALTER TABLE "Park" ALTER COLUMN geometry_postgis TYPE geometry(GEOMETRY, 4326) USING ST_GeomFromText(geometry_postgis, 4326);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_park_geom ON "Park" USING GIST (geometry_postgis);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Zone' AND column_name = 'geometry_postgis' AND data_type = 'text'
  ) THEN
    ALTER TABLE "Zone" ALTER COLUMN geometry_postgis TYPE geometry(GEOMETRY, 4326) USING ST_GeomFromText(geometry_postgis, 4326);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_zone_geom ON "Zone" USING GIST (geometry_postgis);

RAISE NOTICE '✅ Migración completada';
```

### **1.4 Crear carpeta osrm-data**

```powershell
New-Item -ItemType Directory -Force -Path "osrm-data"
```

---

## 📦 Fase 2: Actualizar Schema Prisma (30 min)

**Archivo:** `backend/prisma/schema.prisma`

```prisma
// Agregar campos a Session
model Session {
  // ... campos existentes ...
  
  matchedDistance    Float?   // metros (OSRM)
  matchedDuration    Float?   // segundos (OSRM)
  matchedGeometry    String?  // GeoJSON
  matchedConfidence  Float?   // 0-1 (confianza OSRM)
  processingVersion  String?  @default("1.0")
  
  // ... resto ...
}

// Nueva tabla límites
model SpeedLimitConfig {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  roadType      String   @map("road_type")
  vehicleType   String   @map("vehicle_type")
  speedLimit    Int      @map("speed_limit")
  emergencyBonus Int     @default(0) @map("emergency_bonus")
  organizationId String? @map("organization_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at")

  @@unique([roadType, vehicleType, organizationId])
  @@map("speed_limits_config")
}

// Cache TomTom
model SpeedLimitCache {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  lat        Decimal  @db.Decimal(10, 8)
  lon        Decimal  @db.Decimal(11, 8)
  speedLimit Int      @map("speed_limit")
  roadType   String?  @map("road_type")
  source     String   @default("tomtom")
  cachedAt   DateTime @default(now()) @map("cached_at")
  expiresAt  DateTime @default(dbgenerated("NOW() + INTERVAL '30 days'")) @map("expires_at")

  @@unique([lat, lon], map: "unique_coords")
  @@map("speed_limits_cache")
}
```

**Ejecutar:**

```powershell
cd backend
npx prisma generate
npm install @turf/boolean-point-in-polygon
```

---

## 📦 Fase 3: Servicios de Geoprocesamiento (4 horas)

### **3.1 OSRMService (con correcciones)**

**Archivo:** `backend/src/services/geoprocessing/OSRMService.ts`

```typescript
import axios from 'axios';
import { logger } from '../../utils/logger';

export interface GPSPoint {
    lat: number;
    lon: number;
    timestamp: Date;
}

export interface MatchedRoute {
    distance: number;
    duration: number;
    geometry: any;
    confidence: number;
}

export class OSRMService {
    private baseUrl: string;
    private timeout: number = 15000;
    private readonly MAX_OSRM_POINTS = 100;

    constructor() {
        this.baseUrl = process.env.OSRM_URL || 'http://localhost:5000';
    }

    async matchRoute(points: GPSPoint[]): Promise<MatchedRoute> {
        try {
            if (points.length < 2) {
                throw new Error('Se necesitan al menos 2 puntos GPS');
            }

            // Filtrar jitter (vehículo parado)
            const filteredPoints = this.filterJitter(points);

            // Detectar gaps y dividir segmentos
            const segments = this.splitByGaps(filteredPoints, 30);
            
            if (segments.length > 1) {
                logger.debug(`Sesión dividida en ${segments.length} segmentos por gaps GPS`);
                const results = await Promise.all(segments.map(seg => this.matchSegment(seg)));
                return this.combineSegments(results);
            }

            return await this.matchSegment(filteredPoints);

        } catch (error: any) {
            logger.warn('Error en OSRM, usando fallback Haversine:', error.message);
            return this.fallbackHaversine(points);
        }
    }

    /**
     * Filtrar jitter GPS (vehículo parado)
     */
    private filterJitter(points: GPSPoint[]): GPSPoint[] {
        if (points.length < 2) return points;

        const filtered: GPSPoint[] = [points[0]];

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];

            // Calcular distancia
            const distance = this.haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);

            // Si distancia > 5m o velocidad aparente > 2 km/h, mantener punto
            const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000; // segundos
            const speed = distance / timeDiff * 3.6; // km/h

            if (distance > 5 || speed > 2) {
                filtered.push(curr);
            }
        }

        logger.debug(`Filtrados ${points.length - filtered.length} puntos de jitter`);

        return filtered.length >= 2 ? filtered : points;
    }

    private splitByGaps(points: GPSPoint[], maxGapSeconds: number): GPSPoint[][] {
        const segments: GPSPoint[][] = [];
        let currentSegment: GPSPoint[] = [points[0]];

        for (let i = 1; i < points.length; i++) {
            const gap = (points[i].timestamp.getTime() - points[i - 1].timestamp.getTime()) / 1000;

            if (gap > maxGapSeconds) {
                if (currentSegment.length >= 2) {
                    segments.push(currentSegment);
                }
                currentSegment = [points[i]];
            } else {
                currentSegment.push(points[i]);
            }
        }

        if (currentSegment.length >= 2) {
            segments.push(currentSegment);
        }

        return segments.length > 0 ? segments : [points];
    }

    private combineSegments(segments: MatchedRoute[]): MatchedRoute {
        return {
            distance: segments.reduce((sum, s) => sum + s.distance, 0),
            duration: segments.reduce((sum, s) => sum + s.duration, 0),
            geometry: null,
            confidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
        };
    }

    private async matchSegment(points: GPSPoint[]): Promise<MatchedRoute> {
        const sampledPoints = this.samplePoints(points, this.MAX_OSRM_POINTS);

        const coordinates = sampledPoints.map(p => `${p.lon},${p.lat}`).join(';');
        const timestamps = sampledPoints.map(p => Math.floor(p.timestamp.getTime() / 1000)).join(';');

        const url = `${this.baseUrl}/match/v1/driving/${coordinates}`;
        const params = {
            timestamps,
            radiuses: sampledPoints.map(() => 100).join(';'),
            geometries: 'geojson',
            overview: 'full',
            annotations: 'true'
        };

        logger.debug(`Llamando a OSRM con ${sampledPoints.length} puntos`);

        const response = await axios.get(url, { params, timeout: this.timeout });

        if (response.data.code !== 'Ok') {
            throw new Error(`OSRM error: ${response.data.code}`);
        }

        const matching = response.data.matchings[0];

        if (!matching) {
            throw new Error('OSRM no devolvió matching');
        }

        return {
            distance: matching.distance,
            duration: matching.duration,
            geometry: matching.geometry,
            confidence: matching.confidence || 0
        };
    }

    private samplePoints(points: GPSPoint[], maxPoints: number): GPSPoint[] {
        if (points.length <= maxPoints) {
            return points;
        }

        const step = Math.floor(points.length / maxPoints);
        const sampled: GPSPoint[] = [];

        for (let i = 0; i < points.length; i += step) {
            sampled.push(points[i]);
        }

        if (sampled[sampled.length - 1] !== points[points.length - 1]) {
            sampled.push(points[points.length - 1]);
        }

        return sampled;
    }

    private fallbackHaversine(points: GPSPoint[]): MatchedRoute {
        let totalDistance = 0;

        for (let i = 1; i < points.length; i++) {
            const distance = this.haversineDistance(
                points[i - 1].lat, points[i - 1].lon,
                points[i].lat, points[i].lon
            );

            if (distance <= 100) {
                totalDistance += distance;
            }
        }

        const duration = (points[points.length - 1].timestamp.getTime() - points[0].timestamp.getTime()) / 1000;

        return {
            distance: totalDistance,
            duration,
            geometry: null,
            confidence: 0
        };
    }

    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/nearest/v1/driving/0,0`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

export const osrmService = new OSRMService();
```

### **3.2 GeofenceDetectorService (con Turf.js)**

**Archivo:** `backend/src/services/geoprocessing/GeofenceDetectorService.ts`

```typescript
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';

export interface GeofenceEvent {
    geofenceId: string;
    geofenceName: string;
    type: 'ENTER' | 'EXIT';
    timestamp: Date;
    lat: number;
    lon: number;
}

export class GeofenceDetectorService {
    async detectGeofenceEvents(
        sessionId: string,
        points: Array<{ lat: number; lon: number; timestamp: Date }>
    ): Promise<GeofenceEvent[]> {
        try {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                select: { organizationId: true }
            });

            if (!session) {
                throw new Error(`Sesión ${sessionId} no encontrada`);
            }

            // Crear LineString para filtrar geocercas candidatas
            const coordinates = points.map(p => `${p.lon} ${p.lat}`).join(',');
            const lineString = `LINESTRING(${coordinates})`;

            // Consulta ÚNICA: obtener geocercas intersectadas + geometrías
            const intersectedGeofences = await prisma.$queryRaw<Array<{
                id: string;
                name: string;
                type: string;
                geometry: any;
            }>>`
                SELECT DISTINCT
                    g.id,
                    g.name,
                    g.type,
                    ST_AsGeoJSON(g.geometry_postgis)::json as geometry
                FROM "Geofence" g
                WHERE g."organizationId" = ${session.organizationId}
                  AND g.enabled = true
                  AND g.geometry_postgis IS NOT NULL
                  AND ST_Intersects(
                    g.geometry_postgis,
                    ST_SetSRID(ST_GeomFromText(${lineString}), 4326)
                  )
            `;

            if (intersectedGeofences.length === 0) {
                logger.debug(`No se detectaron geocercas para sesión ${sessionId}`);
                return [];
            }

            logger.debug(`${intersectedGeofences.length} geocercas candidatas encontradas`);

            // Para cada geocerca, detectar transiciones EN MEMORIA con Turf.js
            const events: GeofenceEvent[] = [];

            for (const geofence of intersectedGeofences) {
                const transitions = this.detectTransitionsInMemory(geofence, points);
                events.push(...transitions.map(t => ({
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    type: t.type,
                    timestamp: t.timestamp,
                    lat: t.lat,
                    lon: t.lon
                })));
            }

            logger.info(`Detectados ${events.length} eventos de geocerca para sesión ${sessionId}`);

            return events;

        } catch (error: any) {
            logger.error('Error detectando eventos de geocerca:', error);
            return [];
        }
    }

    /**
     * Detecta transiciones EN MEMORIA usando Turf.js (NO SQL)
     */
    private detectTransitionsInMemory(
        geofence: { id: string; name: string; geometry: any },
        points: Array<{ lat: number; lon: number; timestamp: Date }>
    ): Array<{ type: 'ENTER' | 'EXIT'; timestamp: Date; lat: number; lon: number }> {
        const transitions: Array<{ type: 'ENTER' | 'EXIT'; timestamp: Date; lat: number; lon: number }> = [];
        let wasInside = false;

        // Convertir geometría a formato Turf
        const geofencePolygon = this.geoJSONToTurf(geofence.geometry);

        for (const p of points) {
            const pt = point([p.lon, p.lat]);
            const isInside = booleanPointInPolygon(pt, geofencePolygon);

            // Detectar entrada
            if (isInside && !wasInside) {
                transitions.push({
                    type: 'ENTER',
                    timestamp: p.timestamp,
                    lat: p.lat,
                    lon: p.lon
                });
            }

            // Detectar salida
            if (!isInside && wasInside) {
                transitions.push({
                    type: 'EXIT',
                    timestamp: p.timestamp,
                    lat: p.lat,
                    lon: p.lon
                });
            }

            wasInside = isInside;
        }

        return transitions;
    }

    /**
     * Convierte GeoJSON de PostGIS a formato Turf
     */
    private geoJSONToTurf(geom: any): any {
        if (geom.type === 'Polygon') {
            return polygon(geom.coordinates);
        }
        // TODO: Soportar otros tipos si es necesario
        return polygon(geom.coordinates);
    }
}

export const geofenceDetectorService = new GeofenceDetectorService();
```

### **3.3 RouteProcessorService (orquestador)**

**Archivo:** `backend/src/services/geoprocessing/RouteProcessorService.ts`

```typescript
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { osrmService } from './OSRMService';
import { geofenceDetectorService } from './GeofenceDetectorService';

export interface ProcessedRoute {
    sessionId: string;
    distance: number;
    duration: number;
    geofenceEvents: number;
    speedViolations: number;
    confidence: number;
}

export class RouteProcessorService {
    async processSession(sessionId: string): Promise<ProcessedRoute> {
        try {
            logger.info(`🗺️ Iniciando geoprocesamiento para sesión ${sessionId}`);

            // 1. Obtener datos básicos de la sesión UNA SOLA VEZ
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                select: {
                    id: true,
                    vehicleId: true,
                    organizationId: true
                }
            });

            if (!session) {
                throw new Error(`Sesión ${sessionId} no encontrada`);
            }

            // 2. Obtener puntos GPS
            const gpsPoints = await prisma.gpsMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' },
                select: {
                    latitude: true,
                    longitude: true,
                    timestamp: true,
                    speed: true
                }
            });

            if (gpsPoints.length < 2) {
                throw new Error('No hay suficientes puntos GPS');
            }

            // Filtrar puntos inválidos
            const validPoints = gpsPoints.filter(p =>
                p.latitude !== 0 && p.longitude !== 0 &&
                p.latitude > 35 && p.latitude < 45 &&
                p.longitude > -10 && p.longitude < 5
            );

            if (validPoints.length < 2) {
                throw new Error('No hay suficientes puntos GPS válidos');
            }

            logger.debug(`Procesando ${validPoints.length} puntos GPS válidos`);

            // 3. Map-matching con OSRM
            const matchedRoute = await osrmService.matchRoute(
                validPoints.map(p => ({
                    lat: p.latitude,
                    lon: p.longitude,
                    timestamp: p.timestamp
                }))
            );

            logger.info(`✅ Ruta matcheada: ${matchedRoute.distance.toFixed(2)}m, confianza: ${matchedRoute.confidence.toFixed(2)}`);

            // 4. Detectar eventos de geocerca
            const geofenceEvents = await geofenceDetectorService.detectGeofenceEvents(
                sessionId,
                validPoints.map(p => ({
                    lat: p.latitude,
                    lon: p.longitude,
                    timestamp: p.timestamp
                }))
            );

            logger.info(`✅ Detectados ${geofenceEvents.length} eventos de geocerca`);

            // 5. Guardar resultados
            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    matchedDistance: matchedRoute.distance,
                    matchedDuration: matchedRoute.duration,
                    matchedGeometry: matchedRoute.geometry ? JSON.stringify(matchedRoute.geometry) : null,
                    matchedConfidence: matchedRoute.confidence,
                    processingVersion: '1.0'
                }
            });

            // 6. Guardar eventos de geocerca
            for (const event of geofenceEvents) {
                await prisma.geofenceEvent.create({
                    data: {
                        geofenceId: event.geofenceId,
                        vehicleId: session.vehicleId, // Ya cargado
                        organizationId: session.organizationId, // Ya cargado
                        type: event.type,
                        timestamp: event.timestamp,
                        latitude: event.lat,
                        longitude: event.lon
                    }
                });
            }

            logger.info(`✅ Geoprocesamiento completado para sesión ${sessionId}`);

            return {
                sessionId,
                distance: matchedRoute.distance,
                duration: matchedRoute.duration,
                geofenceEvents: geofenceEvents.length,
                speedViolations: 0,
                confidence: matchedRoute.confidence
            };

        } catch (error: any) {
            logger.error(`Error procesando sesión ${sessionId}:`, error);
            throw error;
        }
    }
}

export const routeProcessorService = new RouteProcessorService();
```

---

## 📦 Fase 4: Integración con UploadPostProcessor (1 hora)

**Archivo:** `backend/src/services/upload/UploadPostProcessor.ts`

```typescript
import { routeProcessorService } from '../geoprocessing/RouteProcessorService';

static async processSession(sessionId: string, results: PostProcessingResult): Promise<SessionEventsSummary | null> {
    try {
        logger.info(`🔄 Procesando sesión ${sessionId}`);

        // 1. Eventos de estabilidad
        const stabilityEvents = await generateStabilityEventsForSession(sessionId);
        results.eventsGenerated += stabilityEvents.length;

        // 2. Segmentos operacionales
        const segments = await generateOperationalSegments(sessionId);
        results.segmentsGenerated += segments.length;

        // 3. ✅ NUEVO: Geoprocesamiento
        try {
            logger.debug(`🗺️ Ejecutando geoprocesamiento para sesión ${sessionId}`);
            const geoResult = await routeProcessorService.processSession(sessionId);
            
            logger.debug(`✅ Geoprocesamiento OK: ${geoResult.distance.toFixed(2)}m, ${geoResult.geofenceEvents} eventos`);
        } catch (geoError: any) {
            logger.warn(`⚠️ Error en geoprocesamiento: ${geoError.message}`);
            // No bloquear post-procesamiento
        }

        // 4. Violaciones de velocidad
        await analizarVelocidades([sessionId]);

        return {
            sessionId,
            eventsGenerated: stabilityEvents.length,
            segmentsGenerated: segments.length,
            events: stabilityEvents.map(e => ({
                type: e.tipo,
                severity: e.severidad,
                timestamp: e.timestamp,
                lat: e.lat,
                lon: e.lon
            }))
        };

    } catch (error: any) {
        logger.error(`❌ Error procesando sesión ${sessionId}:`, error);
        results.errors.push(`Sesión ${sessionId}: ${error.message}`);
        return null;
    }
}
```

---

## 📦 Fase 5: Pruebas (2 horas)

**Archivo:** `backend/src/scripts/test-geoprocessing.ts`

```typescript
import { routeProcessorService } from '../services/geoprocessing/RouteProcessorService';
import { osrmService } from '../services/geoprocessing/OSRMService';

async function testGeoprocessing() {
    console.log('🧪 Iniciando pruebas de geoprocesamiento...\n');

    // 1. Test OSRM health
    console.log('1️⃣ Verificando OSRM...');
    const osrmHealthy = await osrmService.healthCheck();
    console.log(osrmHealthy ? '✅ OSRM funcionando' : '❌ OSRM no disponible');

    if (!osrmHealthy) {
        console.log('\n❌ OSRM no disponible. Ejecuta: docker-compose up -d osrm');
        return;
    }

    // 2. Test con sesión real
    console.log('\n2️⃣ Procesando sesión de prueba...');
    const testSessionId = '5894090f-156c-4816-92c6-4632e7dd666f';

    try {
        const result = await routeProcessorService.processSession(testSessionId);

        console.log('\n✅ Resultados:');
        console.log(`   📏 Distancia: ${result.distance.toFixed(2)}m (${(result.distance / 1000).toFixed(2)} km)`);
        console.log(`   ⏱️  Duración: ${result.duration.toFixed(0)}s (${(result.duration / 60).toFixed(1)} min)`);
        console.log(`   🎯 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   🗺️  Eventos geocerca: ${result.geofenceEvents}`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

testGeoprocessing();
```

---

## ✅ Checklist de Implementación

### **Docker**

- [ ] Crear `.env` con variables sensibles
- [ ] Actualizar `docker-compose.yml`
- [ ] Crear `01-init-postgis.sql`
- [ ] Crear `02-migrate-existing.sql`
- [ ] Crear carpeta `osrm-data/`
- [ ] Ejecutar `docker-compose up -d`
- [ ] Verificar OSRM: `curl http://localhost:5000/nearest/v1/driving/0,0`

### **Base de Datos**

- [ ] Actualizar `schema.prisma`
- [ ] Ejecutar `npx prisma generate`
- [ ] Instalar `@turf/boolean-point-in-polygon`
- [ ] Verificar PostGIS: `SELECT PostGIS_version();`

### **Backend**

- [ ] Crear `OSRMService.ts`
- [ ] Crear `GeofenceDetectorService.ts`
- [ ] Crear `RouteProcessorService.ts`
- [ ] Modificar `UploadPostProcessor.ts`

### **Pruebas**

- [ ] Crear `test-geoprocessing.ts`
- [ ] Ejecutar test
- [ ] Verificar logs
- [ ] Validar BD: `SELECT * FROM "Session" WHERE "matchedDistance" IS NOT NULL LIMIT 5;`

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Validación |

|---------|----------|------------|

| Precisión distancia | ±10% | Comparar con datos conocidos |

| Tiempo procesamiento | < 10s por sesión | Logs RouteProcessorService |

| Confianza OSRM | > 0.7 (70%) | Campo `matchedConfidence` |

| Eventos geocerca | 100% detectados | Comparar con registros manuales |

| Disponibilidad OSRM | > 99% | Healthcheck cada 30s |

---

## 🚨 Puntos Críticos

1. **OSRM tarda 10-15 min en primera inicialización** (descarga + procesamiento)
2. **SQL dividido en 2 scripts** evita romper datos existentes
3. **Turf.js en memoria** = 10x más rápido que consultas SQL en bucle
4. **Filtro jitter** evita sumar "distancia fantasma" de vehículo parado
5. **Fallback Haversine** garantiza que nunca falle el post-procesamiento

---

## 🔄 Comandos de Inicio

```powershell
# 1. Levantar stack
docker-compose -f config/docker-compose.yml up -d

# 2. Ver logs OSRM
docker-compose -f config/docker-compose.yml logs -f osrm

# 3. Verificar OSRM
curl http://localhost:5000/nearest/v1/driving/0,0

# 4. Verificar PostGIS
docker-compose -f config/docker-compose.yml exec db psql -U postgres -d dobacksoft -c "SELECT PostGIS_version();"

# 5. Test
cd backend
npx ts-node src/scripts/test-geoprocessing.ts
```

### To-dos

- [ ] Actualizar docker-compose.yml con PostGIS 16 + OSRM + healthchecks
- [ ] Crear database/init-postgis.sql con extensiones, tablas y triggers
- [ ] Actualizar schema.prisma con SpeedLimitConfig, SpeedLimitCache y campos en Session
- [ ] Implementar OSRMService.ts con map-matching batch y fallback Haversine
- [ ] Implementar GeofenceDetectorService.ts con consultas PostGIS batch
- [ ] Implementar RouteProcessorService.ts orquestador principal
- [ ] Integrar geoprocesamiento en UploadPostProcessor.processSession()
- [ ] Crear test-geoprocessing.ts y validar con sesión 5894090f
- [ ] Ejecutar docker-compose up -d y verificar salud de OSRM y PostGIS
- [ ] Validar métricas: precisión ±10%, tiempo <10s, confianza >70%
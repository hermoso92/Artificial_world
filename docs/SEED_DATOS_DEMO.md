# Seed de datos demo — DobackSoft v2

> Guía para pre-cargar datos de demostración antes de una sesión con testers.  
> Sin seed, el panel aparece vacío y los testers no pueden evaluar nada.

---

## Cuándo ejecutar

- Antes de cualquier sesión con testers externos
- Después de un `docker compose down -v` (datos borrados)
- Al iniciar en un entorno nuevo

---

## Qué carga el seed

| Dato | Cantidad | Descripción |
|------|----------|-------------|
| Organización | 1 | "Parque Central Demo" |
| Vehículos | 3 | Bomba 01, Bomba 02, Escalera 01 |
| Sesiones de conducción | 10 | Últimos 30 días |
| Puntos GPS | ~700 | Rutas urbanas realistas en Madrid |
| KPIs calculados | 30 | Un registro por vehículo/día |
| Eventos de estabilidad | 25 | Frenazos, excesos velocidad, giros bruscos |
| Alertas activas | 5 | Severidades mixed |
| Geofences | 3 | Parque central, zona sensible, zona escolar |
| Usuarios | 2 | ADMIN + MANAGER de prueba |

---

## Cómo ejecutar

```powershell
cd "C:\Users\Cosigein SL\Desktop\dobackv2"

# 1. Verificar que Docker está corriendo y el backend está activo
Invoke-WebRequest http://localhost:9998/health | Select-Object StatusCode

# 2. Ejecutar el seed oficial de dobackv2
.\scripts\setup\crear-datos-completos.ps1

# 3. Verificar que los datos están cargados
Invoke-WebRequest http://localhost:9998/api/vehicles -Headers @{"Authorization"="Bearer [token]"}
```

---

## Credenciales tras el seed

| Rol | Email | Password |
|-----|-------|----------|
| ADMIN | `antoniohermoso92@manager.com` | `password123` |
| MANAGER | `manager@demo.com` | `password123` |

---

## Verificación manual

Después del seed, comprueba en el navegador (`http://localhost:5174`):

- [ ] Dashboard muestra KPIs con valores (no ceros)
- [ ] Lista de vehículos muestra 3 vehículos
- [ ] Estabilidad tiene sesiones seleccionables
- [ ] Telemetría muestra puntos en el mapa
- [ ] Geofences muestra 3 zonas en el mapa
- [ ] Alertas tiene 5 alertas activas

---

## Si el seed falla

**Error: conexión rechazada**
```powershell
# Verificar que Docker está activo
docker ps | findstr postgres
# Si no está: .\iniciar.ps1
```

**Error: organización ya existe**
```powershell
# Limpiar y re-seed
docker compose down -v
.\iniciar.ps1
.\scripts\setup\crear-datos-completos.ps1
```

**Error: migración pendiente**
```powershell
cd backend
npx prisma migrate deploy --schema=../prisma/schema.prisma
```

---

## Seed mínimo manual (si el script falla)

Si el script oficial no está disponible, puedes crear datos mínimos vía la API:

```powershell
$BASE = "http://localhost:9998/api"

# 1. Login → obtener token
$login = Invoke-WebRequest "$BASE/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"antoniohermoso92@manager.com","password":"password123"}'
$token = ($login.Content | ConvertFrom-Json).accessToken

$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# 2. Crear vehículo demo
Invoke-WebRequest "$BASE/vehicles" -Method POST -Headers $headers -Body '{"name":"Bomba 01 Demo","plateNumber":"0001-BSF","vehicleType":"BOMBA"}'

Write-Host "Vehículo demo creado. Abre http://localhost:5174 para verificar."
```

---

*Para la demo completa de dobackv2, ver `docs/DOC_DOBACKSOFT_PARA_TESTERS.md`*

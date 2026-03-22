# 🔧 SOLUCIÓN DEFINITIVA: Errores de SPM

## 🚨 Problemas que estás experimentando:

```
❌ error: Couldn't load SwiftAWCore because it is already opened from another project or workspace
❌ error: Missing package product 'AWPersistence'
❌ error: Missing package product 'AWAgent'
❌ error: Missing package product 'AWDomain'
```

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Cerrar Todo en Xcode
```bash
1. Xcode > File > Close Workspace (⌘⌃W) en TODAS las ventanas
2. Si tienes varias ventanas abiertas, cierra TODO
3. Verifica en Window > "No hay ventanas abiertas"
4. Cierra Xcode completamente (⌘Q)
```

### Paso 2: Limpiar Caché de Derived Data
```bash
# En Terminal:
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# O manualmente:
# Finder > Go > Go to Folder... (⇧⌘G)
# ~/Library/Developer/Xcode/DerivedData/
# Eliminar toda la carpeta ArtificialWorldV2-*
```

### Paso 3: Abrir SOLO el Proyecto Principal
```bash
# En Terminal, navega a tu proyecto:
cd ~/repos/Artificial_world/ArtificialWorldV2/

# Abre SOLO el .xcodeproj (NO el SPM):
open ArtificialWorldV2.xcodeproj

# ⚠️ IMPORTANTE: NO abras SwiftAWCore/Package.swift directamente
```

### Paso 4: Reset Package Caches
```bash
# Dentro de Xcode:
1. File > Packages > Reset Package Caches
2. Espera a que termine (puede tomar 30-60 segundos)
```

### Paso 5: Clean Build Folder
```bash
# Dentro de Xcode:
1. Product > Clean Build Folder (⌘⇧K)
2. Espera a que termine
```

### Paso 6: Rebuild
```bash
# Dentro de Xcode:
1. Product > Build (⌘B)
2. Si hay errores, continúa al Paso 7
```

---

## 🔍 SI TODAVÍA HAY ERRORES

### Verificar Estructura de Carpetas

Tu estructura debería ser así:
```
~/repos/Artificial_world/
├── SwiftAWCore/                    ← Paquete SPM
│   ├── Package.swift
│   └── Sources/
│       ├── AWDomain/
│       ├── AWAgent/
│       └── AWPersistence/
│
└── ArtificialWorldV2/              ← Proyecto principal
    ├── ArtificialWorldV2.xcodeproj ← Abre ESTE
    └── ... (código de la app)
```

### Verificar Package.swift

Abre `SwiftAWCore/Package.swift` y verifica que tenga esto:

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftAWCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "AWDomain", targets: ["AWDomain"]),
        .library(name: "AWAgent", targets: ["AWAgent"]),
        .library(name: "AWPersistence", targets: ["AWPersistence"]),
    ],
    targets: [
        .target(name: "AWDomain"),
        .target(name: "AWAgent", dependencies: ["AWDomain"]),
        .target(name: "AWPersistence", dependencies: ["AWDomain"]),
        .testTarget(name: "AWDomainTests", dependencies: ["AWDomain"]),
        .testTarget(name: "AWAgentTests", dependencies: ["AWAgent"]),
        .testTarget(name: "AWPersistenceTests", dependencies: ["AWPersistence"]),
    ]
)
```

### Verificar Dependencias del Proyecto

1. En Xcode, selecciona el **proyecto** (icono azul) en el navegador
2. Ve a la pestaña **Package Dependencies**
3. Deberías ver `SwiftAWCore` en la lista
4. Si NO está:
   - Click en el botón **+**
   - Selecciona "Add Local..."
   - Navega a `~/repos/Artificial_world/SwiftAWCore`
   - Click "Add Package"

### Verificar Targets y Frameworks

1. Selecciona el **target** `ArtificialWorldV2` (debajo del proyecto)
2. Ve a **General** > **Frameworks, Libraries, and Embedded Content**
3. Deberías ver:
   - `AWDomain`
   - `AWAgent`
   - `AWPersistence`
4. Si NO están:
   - Click en **+**
   - Busca "AW" en el filtro
   - Añade los 3 productos
   - Asegúrate de que estén en "Do Not Embed"

---

## 🎯 VERIFICACIÓN FINAL

### Test Rápido en el Editor

Crea un archivo temporal `Test.swift` en tu proyecto con esto:

**Módulos SPM** (en un Swift playground del paquete o target que solo importe SwiftAWCore):

```swift
import AWDomain
import AWAgent

struct SPMCompilationSmoke {
    func run() {
        let vitals = SurvivalVitals(energy: 1.0, hunger: 0.0)
        let inv = InventoryState(fiberScraps: 0, nutrientPackets: 0)
        let ctx = UtilityContext(vitals: vitals, presence: .insideRefuge, inventory: inv)
        _ = UtilitySafetyRules.chooseDirective(context: ctx)
    }
}
```

**Persistencia JSON de la app** (`WorldPersistenceEngine` vive en el target **ArtificialWorldV2**, no en `AWPersistence`):

```swift
import ArtificialWorldV2

struct AppPersistenceSmoke {
    func run() throws {
        _ = try WorldPersistenceEngine.listSaves()
    }
}
```

Si compila → ✅ Todo bien!  
Si NO compila → ⬇️ Continúa abajo

---

## 🆘 SOLUCIÓN NUCLEAR (Último Recurso)

Si nada funciona, reconstruye el vínculo:

### Opción A: Re-link del SPM

```bash
# 1. Elimina el paquete del proyecto:
#    Project > Package Dependencies > SwiftAWCore > (-)

# 2. Cierra Xcode

# 3. Elimina caché:
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 4. Elimina workspace data:
cd ~/repos/Artificial_world/ArtificialWorldV2/
rm -rf ArtificialWorldV2.xcodeproj/project.xcworkspace/
rm -rf ArtificialWorldV2.xcodeproj/xcuserdata/

# 5. Reabre el proyecto

# 6. Project > (+) > Add Local Package
#    Selecciona ~/repos/Artificial_world/SwiftAWCore

# 7. Marca los 3 productos: AWDomain, AWAgent, AWPersistence

# 8. Product > Clean Build Folder (⌘⇧K)

# 9. Product > Build (⌘B)
```

### Opción B: Workspace en lugar de Project

Si el problema persiste, crea un workspace:

```bash
# 1. File > New > Workspace
#    Nombre: ArtificialWorld.xcworkspace
#    Ubicación: ~/repos/Artificial_world/

# 2. Arrastra estos DOS elementos al workspace:
#    - SwiftAWCore (Package.swift)
#    - ArtificialWorldV2.xcodeproj

# 3. Cierra y reabre el workspace

# 4. Ahora los cambios en el SPM se reflejan inmediatamente
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Cerré todas las ventanas de Xcode
- [ ] Eliminé DerivedData
- [ ] Abrí SOLO el .xcodeproj (no el Package.swift)
- [ ] Ejecuté "Reset Package Caches"
- [ ] Ejecuté "Clean Build Folder"
- [ ] Package.swift tiene los 3 products correctos
- [ ] Los 3 módulos aparecen en Package Dependencies
- [ ] Los 3 módulos aparecen en Frameworks del target
- [ ] El archivo Test.swift compila sin errores
- [ ] La app compila y corre

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### "Module 'AWDomain' not found"
```bash
# Causa: El módulo no está en el search path
# Solución:
1. Project Settings > Build Settings
2. Busca "SWIFT_INCLUDE_PATHS"
3. Debería estar vacío (Xcode lo gestiona automáticamente)
4. Si tiene algo raro, elimínalo
```

### "Circular dependency detected"
```bash
# Causa: AWAgent o AWPersistence importan entre sí
# Solución:
# Verifica que SOLO AWDomain sea importado por los otros dos
# AWAgent -> AWDomain ✅
# AWPersistence -> AWDomain ✅
# AWAgent -> AWPersistence ❌
# AWPersistence -> AWAgent ❌
```

### "Package product 'AWDomain' is linked as a static library..."
```bash
# Causa: Configuración de linking
# Solución:
1. Target Settings > General > Frameworks
2. AWDomain/AWAgent/AWPersistence deben estar "Do Not Embed"
3. NO deben estar en "Embed & Sign"
```

---

## 📞 SI NADA FUNCIONA

Comparte estos datos para debugging:

```bash
# En Terminal (SwiftAWCore es carpeta HERMANA de ArtificialWorldV2, no hija):
cd ~/repos/Artificial_world/
ls -la SwiftAWCore/Sources/

# Debería mostrar:
# AWDomain/
# AWAgent/
# AWPersistence/

# Verifica fuentes:
find SwiftAWCore/Sources -name "*.swift"
```

---

## ✅ ÉXITO!

Cuando todo compile, deberías ver:

```
Build Succeeded
Artificial World V2 — Ready to Run
```

**Ahora podés seguir con el desarrollo.**

**Estado del repo (marzo 2026):** `GridMap`, `MapGenerator`, `TerrainSquareKind`, persistencia JSON (`WorldPersistenceEngine`), `SaveLoadView` y tests base ya están en el árbol; no hace falta “implementar GridMap” como primer paso.

**Siguientes focos** (detalle y prioridades): ver **`ROADMAP.md`** — por ejemplo consumo de inventario / crafting, autosave periódico, migración de `schemaVersion`, más UI de refugio y tests de integración.

---

**Última actualización:** 22 de marzo de 2026

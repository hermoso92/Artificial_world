# 🔧 GUÍA DE IMPLEMENTACIÓN MANUAL

**Última actualización:** 22 de marzo de 2026

---

## 🚨 PROBLEMAS DETECTADOS

### Error 1: Build database locked
```
error: accessing build database "build.db": database is locked
```

**Causa:** Xcode tiene múltiples builds concurrentes o DerivedData corrupto.

**Solución:**
```bash
# 1. Cerrar Xcode completamente
killall Xcode

# 2. Limpiar DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 3. Reabrir Xcode
open ~/repos/Artificial_world/ArtificialWorldV2/ArtificialWorldV2.xcodeproj
```

---

### Error 2: No such module 'Testing'
```
error: No such module 'Testing'
```

**Causa:** `IntegrationTests.swift` está en el **lugar incorrecto**.

- ❌ **Ubicación actual:** `ArtificialWorldV2/IntegrationTests.swift` (en la app)
- ✅ **Ubicación correcta:** `SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift` (en el SPM)

El módulo `Testing` solo está disponible en **targets de Swift Package**, no en apps de Xcode.

---

## ✅ SOLUCIÓN COMPLETA

### OPCIÓN A: Script Automático (RECOMENDADO)

```bash
# 1. Cerrar Xcode
killall Xcode

# 2. Ir al directorio del proyecto
cd ~/repos/Artificial_world/ArtificialWorldV2/

# 3. Dar permisos al script
chmod +x implementar.sh

# 4. Ejecutar el script
./implementar.sh

# 5. Reabrir Xcode
open ArtificialWorldV2.xcodeproj
```

**El script hace:**
- ✅ Mueve `IntegrationTests.swift` al lugar correcto
- ✅ Limpia DerivedData
- ✅ Compila el SPM
- ✅ Ejecuta los tests
- ✅ Verifica que todo funciona

---

### OPCIÓN B: Manual Paso a Paso

#### Paso 1: Cerrar Xcode

```bash
killall Xcode
```

#### Paso 2: Mover IntegrationTests.swift al SPM

```bash
cd ~/repos/Artificial_world/ArtificialWorldV2/

# Mover el archivo
mv IntegrationTests.swift ../SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift

# Verificar
ls -la ../SwiftAWCore/Tests/AWAgentTests/
```

**Deberías ver:**
```
IntegrationTests.swift  ← NUEVO
UtilityTests.swift      ← Ya existía
```

#### Paso 3: Limpiar DerivedData

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

#### Paso 4: Compilar el SPM directamente

```bash
cd ~/repos/Artificial_world/SwiftAWCore/

# Compilar
swift build

# Ejecutar tests
swift test
```

**Output esperado:**
```
Test Suite 'All tests' passed at ...
Executed 10 tests, with 0 failures ...
```

#### Paso 5: Abrir Xcode y compilar la app

```bash
cd ~/repos/Artificial_world/ArtificialWorldV2/
open ArtificialWorldV2.xcodeproj
```

**En Xcode:**
1. Product → Clean Build Folder (⌘⇧K)
2. Product → Build (⌘B)
3. Product → Test (⌘U)
4. Product → Run (⌘R)

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Archivos en sus lugares correctos:

- [ ] `SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift` ← **Aquí debe estar**
- [ ] `ArtificialWorldV2/Views/AgentStatusOverlay.swift`
- [ ] `ArtificialWorldV2/Views/GridMapCanvas.swift` (modificado)
- [ ] `ArtificialWorldV2/Views/V2PlayView.swift` (modificado)
- [ ] `ArtificialWorldV2/V2WorldSession.swift` (modificado)

### Imports correctos:

**IntegrationTests.swift:**
```swift
import Testing           ← Solo disponible en SPM
@testable import AWAgent
@testable import AWDomain
```

**AgentStatusOverlay.swift:**
```swift
import SwiftUI
```

**GridMapCanvas.swift:**
```swift
import AWDomain
import SwiftUI
```

**V2PlayView.swift:**
```swift
import AWAgent  ← NUEVO import
import AWDomain
import Combine
import SwiftUI
```

---

## 🧪 VERIFICAR QUE TODO FUNCIONA

### Test 1: Compilar SPM

```bash
cd ~/repos/Artificial_world/SwiftAWCore/
swift build
```

**✅ Esperado:** `Build complete!`

---

### Test 2: Ejecutar tests del SPM

```bash
swift test
```

**✅ Esperado:**
```
Test Suite 'All tests' passed
Executed 10 tests, with 0 failures (0 unexpected) in 0.234 seconds
```

**Breakdown:**
- 5 tests viejos (UtilityTests, etc.)
- 5 tests nuevos (IntegrationTests)

---

### Test 3: Compilar la app en Xcode

1. Abrir `ArtificialWorldV2.xcodeproj`
2. Product → Clean Build Folder (⌘⇧K)
3. Product → Build (⌘B)

**✅ Esperado:** `Build Succeeded`

---

### Test 4: Ejecutar la app

1. Product → Run (⌘R)
2. Ir a la pestaña "Partida"

**✅ Esperado:**
- Ver barras verde/naranja sobre cada agente (overlays)
- Ver badges coloridos en la lista de agentes ("Explorar", "Refugio", etc.)
- Los badges cambian en tiempo real cada tick

---

### Test 5: Verificar overlays visuales

**Qué buscar:**
- Cada agente tiene 2 barras pequeñas encima:
  - Verde = energy
  - Naranja = hunger (invertido)
- Si un agente tiene hunger > 0.7: ícono 🍴 naranja
- Si un agente tiene energy < 0.3: ícono ⚡ rojo

**Probar:**
- Dejar correr auto-tick varios segundos
- Ver cómo los vitales cambian y los íconos aparecen/desaparecen

---

### Test 6: Verificar badges de directivas

**Qué buscar:**
- Lista de agentes abajo del D-pad
- Cada agente tiene un badge pequeño al lado del nombre
- Colores:
  - 🔵 Azul = Explorar
  - 🔴 Rojo = Perseguir
  - 🟢 Verde = Refugio
  - 🟣 Púrpura = Descansar
  - 🟠 Naranja = Comer

**Probar:**
- Cambiar a modo Autónomo
- Ver cómo los badges cambian cada tick
- Cuando un agente está débil → debería mostrar "Refugio" verde

---

## 🐛 TROUBLESHOOTING

### Problema: "Build database locked" persiste

```bash
# Solución nuclear:
killall Xcode
killall xcodebuild
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/repos/Artificial_world/ArtificialWorldV2/ArtificialWorldV2.xcodeproj/project.xcworkspace/
rm -rf ~/repos/Artificial_world/ArtificialWorldV2/ArtificialWorldV2.xcodeproj/xcuserdata/

# Reabrir
open ~/repos/Artificial_world/ArtificialWorldV2/ArtificialWorldV2.xcodeproj
```

---

### Problema: "No such module 'AWAgent'" en V2PlayView

**Causa:** El import no se agregó.

**Solución:** Verificar que `V2PlayView.swift` tiene:
```swift
import AWAgent  ← Debe estar
import AWDomain
import Combine
import SwiftUI
```

---

### Problema: Tests no aparecen en Xcode

**Causa:** IntegrationTests.swift sigue en la app en lugar del SPM.

**Solución:**
1. Verificar ubicación: `SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift`
2. Si no está ahí, moverlo manualmente:
```bash
mv ~/repos/Artificial_world/ArtificialWorldV2/IntegrationTests.swift \
   ~/repos/Artificial_world/SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift
```
3. En Xcode: File → Packages → Reset Package Caches

---

### Problema: Overlays no se ven

**Causa 1:** AgentStatusOverlay.swift no está en el target correcto.

**Solución:** Verificar en Xcode:
1. Seleccionar `AgentStatusOverlay.swift`
2. File Inspector (⌥⌘1)
3. Target Membership → `ArtificialWorldV2` debe estar checked ✅

**Causa 2:** GridMapCanvas no tiene el ForEach.

**Solución:** Verificar que `GridMapCanvas.swift` tiene:
```swift
}
.allowsHitTesting(false)

// ✨ NUEVO: Overlays de estado sobre agentes
ForEach(session.agents) { agent in
    AgentStatusOverlay(agent: agent, cellSize: cell)
}
.allowsHitTesting(false)

Color.clear
```

---

### Problema: Badges no se ven

**Causa:** Los helpers no se agregaron o falta el import AWAgent.

**Solución:** Verificar en `V2PlayView.swift`:
1. Import al inicio: `import AWAgent`
2. Helpers al final (después de `agentAccessibilitySummary`):
   - `currentDirective(for:)`
   - `directiveBadge(for:)`
   - `directiveIconAndColor(_:)`
   - `directiveName(_:)`

---

## 📊 ESTADO DESPUÉS DE IMPLEMENTAR

### Archivos creados: 3
- `AgentStatusOverlay.swift` (69 líneas)
- `IntegrationTests.swift` (130 líneas) ← Ahora en SPM
- `implementar.sh` (script de automatización)

### Archivos modificados: 3
- `GridMapCanvas.swift` (+6 líneas)
- `V2PlayView.swift` (+66 líneas)
- `V2WorldSession.swift` (+1 línea - cambio private→public)

### Total de líneas agregadas: ~272

### Tests totales: 10
- 5 tests viejos (ya existían)
- 5 tests nuevos (IntegrationTests)

---

## ✅ ÉXITO CUANDO VES:

1. **En Terminal:**
```
$ swift test
Test Suite 'All tests' passed at ...
Executed 10 tests, with 0 failures
```

2. **En Xcode:**
```
Build Succeeded
10 tests passed
```

3. **En la app corriendo:**
- Barras verde/naranja sobre agentes ✅
- Íconos 🍴/⚡ cuando tienen problemas ✅
- Badges coloridos en lista ("Explorar", "Refugio", etc.) ✅
- Badges cambian en tiempo real ✅

---

## 🎯 DESPUÉS DE VERIFICAR TODO

Si todo funciona correctamente, tu proyecto está al **78% completado**.

**Próximos pasos recomendados:**
1. Personalidades por agente (pesos distintos en curvas)
2. Anti-aglomeración multi-agente
3. Animaciones de movimiento suave
4. Log de eventos en UI
5. Configuración de dificultad

---

**¿Listo para continuar con los siguientes features? 🚀**

---

**Compilado por:** Xcode Assistant  
**Fecha:** 22 de marzo de 2026  
**Versión:** 1.0 (guía de implementación)

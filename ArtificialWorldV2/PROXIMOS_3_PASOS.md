# 🚀 PRÓXIMOS 3 PASOS - REVISADOS Y ESPECÍFICOS

**Fecha:** 22 de marzo de 2026  
**Basado en:** Auditoría completa del proyecto real

---

## ✅ LO QUE YA ESTÁ HECHO (que pensaba que faltaba)

Después de revisar el código completo, veo que **ya implementaste**:

1. ✅ **Selector de bioma** — `RootContentView` tiene `onStartNewGame: (TerrainBiomeDefinition) -> Void`
2. ✅ **Autosave periódico** — Timer de 300s (5 min) en `RootContentView`
3. ✅ **Display de bioma** — `V2PlayView` muestra "Bioma: {nombre}"
4. ✅ **Persistence completa** — `V2WorldSession+Persistence` con `makeSaveData()` y `restored(from:)`

**¡Estás más avanzado de lo que pensaba! 🎉**

---

## 🎯 NUEVOS 3 PASOS PRIORITARIOS

Basándome en lo que **realmente** falta según tu código:

### 1. 🔥 Overlays visuales de estado (3-4h) — PRIORIDAD #1

**Estado:** ⏳ No implementado  
**Impacto:** 🟢 ALTO — mejora mucho la UX

**Qué agregar:**
- Íconos de hambre/cansancio sobre cada agente
- Barras de progreso de vitales (energy/hunger)
- Indicador visual de la directiva actual

**Archivos a crear:**

#### `ArtificialWorldV2/Views/AgentStatusOverlay.swift`

```swift
import SwiftUI
import AWAgent

/// Overlays visuales sobre cada agente en el canvas (hambre, cansancio, barras).
struct AgentStatusOverlay: View {
    let agent: V2GridAgent
    let cellSize: CGFloat
    
    var body: some View {
        VStack(spacing: 2) {
            // Íconos de alerta (solo si hay problema)
            HStack(spacing: 3) {
                if agent.vitals.hunger > 0.7 {
                    Image(systemName: "fork.knife.circle.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(.orange)
                        .accessibilityLabel("Hambriento")
                }
                if agent.vitals.energy < 0.3 {
                    Image(systemName: "bolt.slash.circle.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(.red)
                        .accessibilityLabel("Cansado")
                }
            }
            .shadow(color: .black.opacity(0.3), radius: 1)
            
            // Barra de energy (verde)
            ProgressView(value: agent.vitals.energy)
                .progressViewStyle(ThinBarProgressStyle(tint: .green))
                .frame(width: cellSize * 0.7, height: 3)
                .shadow(color: .black.opacity(0.2), radius: 1)
            
            // Barra de hunger (naranja, invertida: 0=bueno, 1=malo)
            ProgressView(value: 1.0 - agent.vitals.hunger)
                .progressViewStyle(ThinBarProgressStyle(tint: .orange))
                .frame(width: cellSize * 0.7, height: 3)
                .shadow(color: .black.opacity(0.2), radius: 1)
        }
        .position(
            x: (CGFloat(agent.position.x) + 0.5) * cellSize,
            y: CGFloat(agent.position.y) * cellSize - 12
        )
    }
}

/// Estilo de barra delgada para progreso.
struct ThinBarProgressStyle: ProgressViewStyle {
    let tint: Color
    
    func makeBody(configuration: Configuration) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Fondo
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.black.opacity(0.2))
                
                // Barra de progreso
                RoundedRectangle(cornerRadius: 2)
                    .fill(tint)
                    .frame(width: geo.size.width * CGFloat(configuration.fractionCompleted ?? 0))
            }
        }
    }
}
```

#### Modificar `GridMapCanvas.swift`

**Encontrar esta línea (aprox línea 53):**
```swift
}
.allowsHitTesting(false)
```

**Agregar DESPUÉS del Canvas, DENTRO del ZStack:**

```swift
}
.allowsHitTesting(false)

// ✨ NUEVO: Overlays de estado sobre agentes
ForEach(session.agents) { agent in
    AgentStatusOverlay(agent: agent, cellSize: cell)
}
.allowsHitTesting(false)

Color.clear
    .contentShape(Rectangle())
    .gesture(
```

**Resultado esperado:**
- Cada agente muestra 2 barras pequeñas (verde=energy, naranja=hunger invertido)
- Si está hambriento (>0.7): ícono 🍴 naranja
- Si está cansado (<0.3): ícono ⚡ rojo
- Overlays semi-transparentes con sombra

---

### 2. 🔥 Tests de integración (2-3h) — PRIORIDAD #2

**Estado:** ⏳ Parcialmente hecho (tests unitarios sí, integración no)  
**Impacto:** 🟢 ALTO — detecta bugs ocultos

**Qué agregar:**
- Test de 100 ticks simulados
- Test de supervivencia de agentes
- Test de save/load mid-game
- Test de recolección de recursos

**Archivo a crear:**

#### `SwiftAWCore/Tests/AWAgentTests/IntegrationTests.swift`

```swift
import Testing
@testable import AWAgent
@testable import AWDomain

@Suite("Integration Tests — Long Simulations")
struct IntegrationTests {
    
    @Test("100 ticks simulation — agents should survive and gather resources")
    func hundredTicksSimulation() async throws {
        // Setup: Crear una sesión mock (necesitarás crear TestV2WorldSession en AWAgent)
        var mockAgents = [
            MockAgent(id: UUID(), position: GridCoord(x: 5, y: 5)),
            MockAgent(id: UUID(), position: GridCoord(x: 10, y: 10)),
            MockAgent(id: UUID(), position: GridCoord(x: 15, y: 15))
        ]
        
        // Simular 100 ticks
        for tick in 0..<100 {
            // Aplicar drain de vitales
            for i in mockAgents.indices {
                mockAgents[i].vitals.applyExplorationDrain(deltaTime: 1.0)
            }
            
            // Ejecutar IA para cada agente
            for i in mockAgents.indices {
                let ctx = UtilityContext(
                    vitals: mockAgents[i].vitals,
                    presence: .exploring(zone: ZoneID("test")),
                    nearestHostileDistance: nil,
                    inventory: mockAgents[i].inventory,
                    memory: mockAgents[i].memory
                )
                
                let directive = UtilitySafetyRules.chooseDirective(context: ctx)
                
                // Simular recolección si está explorando
                if directive == .explore, Double.random(in: 0...1) < 0.2 {
                    mockAgents[i].inventory.fiberScraps += 1
                }
                
                // Simular retorno al refugio y rest
                if directive == .returnToRefuge || directive == .rest {
                    mockAgents[i].vitals.applyRefugeRest(deltaTime: 1.0)
                }
            }
        }
        
        // Verificaciones
        let alive = mockAgents.filter { 
            $0.vitals.energy > 0 && $0.vitals.hunger < 1.0 
        }
        #expect(alive.count >= 2, "Al menos 2 agentes deberían sobrevivir 100 ticks")
        
        let totalFiber = mockAgents.reduce(0) { $0 + $1.inventory.fiberScraps }
        #expect(totalFiber > 5, "Los agentes deberían haber recolectado fibra")
    }
    
    @Test("Memory streak updates correctly over time")
    func memoryStreakTracking() async throws {
        var memory = AgentMemory()
        
        // Simular 5 éxitos consecutivos
        for _ in 0..<5 {
            memory.recordSuccess(at: 1)
        }
        #expect(memory.successStreak == 5)
        #expect(memory.failureStreak == 0)
        
        // Un fallo resetea la racha
        memory.recordFailure(at: 6)
        #expect(memory.successStreak == 0)
        #expect(memory.failureStreak == 1)
    }
    
    @Test("Flee threshold adapts to stress")
    func fleeThresholdAdaptation() async throws {
        var memory = AgentMemory()
        
        // Registrar amenaza cercana
        memory.notableEvents.append(
            .perceived_threat_stress(distance: 5, at: 1)
        )
        
        // El umbral de huida debería aumentar
        let initialThreshold = memory.fleeThresholdMultiplier
        #expect(initialThreshold > 1.0, "Umbral debería aumentar con amenaza")
    }
}

// MARK: - Mock Types para tests

struct MockAgent {
    var id: UUID
    var position: GridCoord
    var vitals: SurvivalVitals = SurvivalVitals(energy: 0.8, hunger: 0.3)
    var inventory: InventoryState = InventoryState(fiberScraps: 0, nutrientPackets: 0)
    var memory: AgentMemory = AgentMemory()
}
```

**Ejecutar tests:**
```bash
# En Terminal:
cd ~/repos/Artificial_world/SwiftAWCore
swift test

# En Xcode:
# Product → Test (⌘U)
```

**Resultado esperado:**
- 3 tests de integración pasando
- Verificación de supervivencia
- Verificación de memoria
- Verificación de adaptación de IA

---

### 3. 🔥 Indicador de directiva actual (1-2h) — PRIORIDAD #3

**Estado:** ⏳ No implementado  
**Impacto:** 🟡 MEDIO — útil para debugging de IA

**Qué agregar:**
- Mostrar la directiva actual de cada agente en la lista
- Color-coding por tipo de directiva
- Ícono visual asociado

**Modificar `V2PlayView.swift`:**

**Encontrar esta sección (aprox línea 150):**

```swift
private var agentList: some View {
    List {
        Section("Agentes (tocá el mapa para controlar)") {
            ForEach(session.agents) { agent in
                HStack {
                    Circle()
                        .fill(Color(hue: agent.hue, saturation: 0.78, brightness: 0.92))
                        .frame(width: 10, height: 10)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(agent.displayName)
                            .font(.subheadline.weight(agent.id == session.controlledId ? .bold : .regular))
                        Text("(\(agent.position.x), \(agent.position.y)) · E \(agent.vitals.energy, format: .number.precision(.fractionLength(2))) · H \(agent.vitals.hunger, format: .number.precision(.fractionLength(2)))")
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
    .listStyle(.plain)
    .frame(minHeight: 160, maxHeight: 220)
}
```

**Reemplazar con:**

```swift
private var agentList: some View {
    List {
        Section("Agentes (tocá el mapa para controlar)") {
            ForEach(session.agents) { agent in
                HStack {
                    Circle()
                        .fill(Color(hue: agent.hue, saturation: 0.78, brightness: 0.92))
                        .frame(width: 10, height: 10)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(agent.displayName)
                                .font(.subheadline.weight(agent.id == session.controlledId ? .bold : .regular))
                            
                            // ✨ NUEVO: Indicador de directiva
                            if let directive = currentDirective(for: agent) {
                                directiveBadge(for: directive)
                            }
                        }
                        
                        Text("(\(agent.position.x), \(agent.position.y)) · E \(agent.vitals.energy, format: .number.precision(.fractionLength(2))) · H \(agent.vitals.hunger, format: .number.precision(.fractionLength(2)))")
                            .font(.caption2.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
    .listStyle(.plain)
    .frame(minHeight: 160, maxHeight: 220)
}

// ✨ NUEVO: Calcular directiva actual
private func currentDirective(for agent: V2GridAgent) -> UtilityDirective? {
    let ctx = session.makeContext(for: agent)
    
    // Primero verificar reglas de seguridad
    if let forced = UtilitySafetyRules.forcedDirective(for: ctx) {
        return forced
    }
    
    // Si no hay regla forzada, calcular con scoring
    return UtilityScoring.chooseExploringDirective(context: ctx)
}

// ✨ NUEVO: Badge visual por directiva
@ViewBuilder
private func directiveBadge(for directive: UtilityDirective) -> some View {
    let (icon, color) = directiveIconAndColor(directive)
    
    HStack(spacing: 2) {
        Image(systemName: icon)
        Text(directiveName(directive))
    }
    .font(.caption2)
    .foregroundStyle(.white)
    .padding(.horizontal, 6)
    .padding(.vertical, 2)
    .background(color.opacity(0.8))
    .clipShape(RoundedRectangle(cornerRadius: 4))
}

private func directiveIconAndColor(_ directive: UtilityDirective) -> (String, Color) {
    switch directive {
    case .explore:
        return ("location.circle", .blue)
    case .captureNearest:
        return ("target", .red)
    case .returnToRefuge:
        return ("house.circle", .green)
    case .rest:
        return ("bed.double.circle", .purple)
    case .consumeNutrient:
        return ("fork.knife.circle", .orange)
    }
}

private func directiveName(_ directive: UtilityDirective) -> String {
    switch directive {
    case .explore:
        return "Explorar"
    case .captureNearest:
        return "Perseguir"
    case .returnToRefuge:
        return "Refugio"
    case .rest:
        return "Descansar"
    case .consumeNutrient:
        return "Comer"
    }
}
```

**⚠️ NOTA:** Necesitarás agregar este método público en `V2WorldSession.swift`:

```swift
// ✨ NUEVO: Exponer makeContext para UI
public func makeContext(for agent: V2GridAgent) -> UtilityContext {
    let dist = nearestOtherAgentDistance(from: agent)
    let presence: PresenceState = agent.position == .refugeOrigin
        ? .insideRefuge
        : .exploring(zone: encounterZoneID)
    return UtilityContext(
        vitals: agent.vitals,
        presence: presence,
        nearestHostileDistance: dist.map { Double($0) },
        inventory: agent.inventory,
        memory: agent.memory
    )
}
```

**Resultado esperado:**
- Lista de agentes muestra badge colorido con la directiva actual
- Azul "Explorar", Rojo "Perseguir", Verde "Refugio", etc.
- Se actualiza en tiempo real cada tick

---

## 📊 IMPACTO ESPERADO

| Paso | Tiempo | Líneas | Impacto UX | Impacto Dev |
|------|--------|--------|------------|-------------|
| 1. Overlays visuales | 3-4h | ~80 | 🟢 ALTO | 🟡 MEDIO |
| 2. Tests integración | 2-3h | ~120 | 🟡 BAJO | 🟢 ALTO |
| 3. Badge directivas | 1-2h | ~60 | 🟡 MEDIO | 🟢 ALTO |
| **TOTAL** | **6-9h** | **~260** | **🟢** | **🟢** |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Paso 1: Overlays visuales

- [ ] Crear `AgentStatusOverlay.swift`
- [ ] Crear `ThinBarProgressStyle`
- [ ] Modificar `GridMapCanvas.swift` (agregar ForEach con overlays)
- [ ] Compilar y probar con 6 agentes
- [ ] Ajustar tamaños/colores si es necesario
- [ ] Verificar accesibilidad (VoiceOver)

### Paso 2: Tests de integración

- [ ] Crear `IntegrationTests.swift` en AWAgentTests
- [ ] Crear `MockAgent` struct
- [ ] Implementar test de 100 ticks
- [ ] Implementar test de memoria
- [ ] Implementar test de flee threshold
- [ ] Ejecutar `swift test` — todos pasando
- [ ] Ejecutar en Xcode (⌘U) — todos pasando

### Paso 3: Badge de directivas

- [ ] Agregar `makeContext(for:)` público en V2WorldSession
- [ ] Modificar `agentList` en V2PlayView
- [ ] Crear `currentDirective(for:)` helper
- [ ] Crear `directiveBadge(for:)` ViewBuilder
- [ ] Crear `directiveIconAndColor(_:)` helper
- [ ] Crear `directiveName(_:)` helper
- [ ] Compilar y verificar badges en lista
- [ ] Verificar cambios en tiempo real (auto-tick)

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### Día 1 (3-4h): Overlays visuales

**Por qué primero:** Mejora inmediata de UX, fácil de testear visualmente

1. Crear `AgentStatusOverlay.swift` (30 min)
2. Modificar `GridMapCanvas.swift` (15 min)
3. Compilar y ajustar (30 min)
4. Probar con diferentes estados de vitales (1h)
5. Polish y accesibilidad (1h)

**Resultado:** App con overlays visuales funcionales

---

### Día 2 (1-2h): Badge de directivas

**Por qué segundo:** Complementa los overlays, útil para debugging

1. Agregar `makeContext(for:)` en V2WorldSession (10 min)
2. Modificar `agentList` en V2PlayView (30 min)
3. Crear helpers (30 min)
4. Probar y ajustar colores (20 min)

**Resultado:** Lista de agentes muestra directiva actual

---

### Día 3 (2-3h): Tests de integración

**Por qué último:** Requiere concentración, menos visual

1. Crear estructura de archivo (15 min)
2. Implementar MockAgent (20 min)
3. Implementar test de 100 ticks (1h)
4. Implementar tests de memoria (30 min)
5. Ejecutar y debuggear (1h)

**Resultado:** Suite de tests de integración completa

---

## 🐛 PROBLEMAS POTENCIALES Y SOLUCIONES

### Problema 1: Overlays tapan los taps en agentes

**Solución:** Agregar `.allowsHitTesting(false)` al ForEach de overlays (ya incluido arriba)

### Problema 2: makeContext(for:) ya existe como privado

**Solución:** Cambiar de `private` a `public` y ajustar la firma si hace falta

### Problema 3: Tests de integración muy lentos

**Solución:** Reducir a 50 ticks en lugar de 100, o usar async/await con Task

### Problema 4: Badges muy grandes en lista de agentes

**Solución:** Ajustar `.font(.caption2)` a `.font(.system(size: 9))` si hace falta

---

## 📈 DESPUÉS DE ESTOS 3 PASOS

Tu proyecto estará al **~75-78%** completado:

```
Fase 0: Fundamentos        [████████████████████] 100%
Fase 1C: Terreno/Mapa      [████████████████████] 100%
Fase 1: Utilidad           [████████████████░░░░]  80%
Fase 2: Mundo Rico         [███████████████░░░░░]  75%
Fase 3: Persistencia       [█████████████████░░░]  85%
Fase 4: UI/UX              [███████████████░░░░░]  75% ← +15%
Fase 5: Testing            [█████████████░░░░░░░]  65% ← +10%

TOTAL                      [███████████████░░░░░]  78% ← +8%
```

**Próximos pasos después:**
1. Personalidades por agente
2. Anti-aglomeración multi-agente
3. Animaciones de movimiento
4. Log de eventos
5. Configuración de dificultad

---

## 💬 FEEDBACK ESPERADO

Después de implementar estos 3 pasos, deberías ver:

✅ **Overlays:** Barras verdes/naranjas sobre agentes, íconos cuando tienen problemas  
✅ **Tests:** `swift test` pasa con 8+ tests (5 existentes + 3 nuevos)  
✅ **Badges:** Lista de agentes muestra "Explorar", "Refugio", etc. en color  

**¿Listo para empezar? Dime cuál de los 3 quieres implementar primero y te guío paso a paso.**

---

**Compilado por:** Xcode Assistant  
**Fecha:** 22 de marzo de 2026  
**Versión:** 2.0 (revisado con código real)

import Foundation
import Testing
@testable import AWAgent
@testable import AWDomain

@Suite("Integration Tests — Long Simulations")
struct IntegrationTests {
    
    @Test("100 ticks simulation — agents should survive and gather resources")
    func hundredTicksSimulation() async throws {
        // Setup: Crear agentes mock
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
    
    @Test("Exploration choice streak increments when repeating directive")
    func explorationStreakTracking() async throws {
        var memory = AgentMemory()
        memory.recordDecision(.explore, at: 1)
        memory.recordDecision(.explore, at: 2)
        memory.recordDecision(.explore, at: 3)
        #expect(memory.consecutiveExploringSameChoice == 3)

        memory.recordDecision(.captureNearest, at: 4)
        #expect(memory.consecutiveExploringSameChoice == 1)

        memory.recordDecision(.returnToRefuge, at: 5)
        #expect(memory.consecutiveExploringSameChoice == 0)
    }

    /// Con `perceived_threat_stress` en memoria, el radio base de huida pasa de 2 a 4 celdas (× cautela).
    @Test("Stress widens hostile flee radius")
    func fleeRadiusWidensWithStress() async throws {
        let calmMemory = AgentMemory()
        var stressedMemory = AgentMemory()
        stressedMemory.noteEvent(AgentMemory.perceivedThreatStressEvent)

        let vitals = SurvivalVitals(energy: 0.5, hunger: 0.3)
        let zone = ZoneID("test")
        let distance: Double = 3.0

        let calmCtx = UtilityContext(
            vitals: vitals,
            presence: .exploring(zone: zone),
            nearestHostileDistance: distance,
            inventory: nil,
            memory: calmMemory
        )
        #expect(UtilitySafetyRules.forcedDirective(for: calmCtx) == nil)

        let stressCtx = UtilityContext(
            vitals: vitals,
            presence: .exploring(zone: zone),
            nearestHostileDistance: distance,
            inventory: nil,
            memory: stressedMemory
        )
        #expect(UtilitySafetyRules.forcedDirective(for: stressCtx) == .returnToRefuge)
    }
    
    @Test("Safety rules force return when energy critical")
    func safetyRulesCriticalEnergy() async throws {
        let ctx = UtilityContext(
            vitals: SurvivalVitals(energy: 0.08, hunger: 0.5),
            presence: .exploring(zone: ZoneID("test")),
            nearestHostileDistance: nil,
            inventory: InventoryState(fiberScraps: 0, nutrientPackets: 0),
            memory: AgentMemory()
        )
        
        let forced = UtilitySafetyRules.forcedDirective(for: ctx)
        #expect(forced == .returnToRefuge, "Debería forzar retorno con energy < 0.12 (needsRefugeSoon)")
    }
    
    @Test("Safety rules force return when hunger critical")
    func safetyRulesCriticalHunger() async throws {
        let ctx = UtilityContext(
            vitals: SurvivalVitals(energy: 0.8, hunger: 0.93),
            presence: .exploring(zone: ZoneID("test")),
            nearestHostileDistance: nil,
            inventory: InventoryState(fiberScraps: 0, nutrientPackets: 0),
            memory: AgentMemory()
        )
        
        let forced = UtilitySafetyRules.forcedDirective(for: ctx)
        #expect(forced == .returnToRefuge, "Debería forzar retorno con hunger > 0.85")
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

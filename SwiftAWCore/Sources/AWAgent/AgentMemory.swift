import AWDomain
import Foundation

/// Memoria operativa mínima del agente para modular utilidad y reglas de seguridad (Fase 1B).
/// El resumen `AgentMemorySummary` sigue siendo el contrato serializable de dominio.
public struct AgentMemory: Equatable, Sendable, Codable {
    public var summary: AgentMemorySummary

    /// Último tick en el que se registró una decisión (`recordDecision`).
    public var lastDecisionTick: UInt64
    /// Última directiva elegida por el motor (cualquier modo).
    public var lastChosenDirective: UtilityDirective?
    /// Última directiva de exploración (solo `.explore` o `.captureNearest`).
    public var lastExploringDirective: UtilityDirective?
    /// Cuántas veces seguidas se repitió `lastExploringDirective` en exploración.
    public var consecutiveExploringSameChoice: UInt16

    public init(
        summary: AgentMemorySummary = AgentMemorySummary(),
        lastDecisionTick: UInt64 = 0,
        lastChosenDirective: UtilityDirective? = nil,
        lastExploringDirective: UtilityDirective? = nil,
        consecutiveExploringSameChoice: UInt16 = 0
    ) {
        self.summary = summary
        self.lastDecisionTick = lastDecisionTick
        self.lastChosenDirective = lastChosenDirective
        self.lastExploringDirective = lastExploringDirective
        self.consecutiveExploringSameChoice = consecutiveExploringSameChoice
    }

    public static let preferExploreEvent = "prefer_explore"
    public static let perceivedThreatStressEvent = "perceived_threat_stress"

    /// Registra un hito; recorta por la cabeza si supera `maxEvents`.
    public mutating func noteEvent(_ raw: String, maxEvents: Int = 32) {
        summary.notableEvents.append(raw)
        while summary.notableEvents.count > maxEvents {
            summary.notableEvents.removeFirst()
        }
    }

    public var prefersExploreFromEvents: Bool {
        summary.notableEvents.contains(Self.preferExploreEvent)
    }

    public var stressFromPerceivedThreat: Bool {
        summary.notableEvents.contains(Self.perceivedThreatStressEvent)
    }

    /// Mantiene el hito `perceived_threat_stress` alineado con la proximidad a un hostil (mismo umbral base que `UtilitySafetyRules` sin estrés: distancia estrictamente menor que 12).
    /// No apila duplicados; al salir del radio se quita el hito para volver al radio de huida estrecho.
    public mutating func syncPerceivedHostileThreat(isWithinThreatRadius: Bool) {
        let key = Self.perceivedThreatStressEvent
        if isWithinThreatRadius {
            if !summary.notableEvents.contains(key) {
                noteEvent(key)
            }
        } else {
            summary.notableEvents.removeAll { $0 == key }
        }
    }

    /// Registra la directiva ejecutada en `tick` (FSM/simulación). Actualiza rachas de exploración.
    public mutating func recordDecision(_ directive: UtilityDirective, at tick: UInt64) {
        lastDecisionTick = tick
        lastChosenDirective = directive
        switch directive {
        case .explore, .captureNearest:
            if lastExploringDirective == directive, consecutiveExploringSameChoice < UInt16.max {
                consecutiveExploringSameChoice += 1
            } else {
                consecutiveExploringSameChoice = 1
            }
            lastExploringDirective = directive
        case .returnToRefuge, .rest, .consumeNutrient:
            consecutiveExploringSameChoice = 0
            lastExploringDirective = nil
        }
    }

    /// Copia inmutable: misma memoria tras registrar una decisión.
    public func updating(afterChosen directive: UtilityDirective, tick: UInt64) -> AgentMemory {
        var next = self
        next.recordDecision(directive, at: tick)
        return next
    }
}

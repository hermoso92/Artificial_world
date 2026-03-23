import AWDomain
import Foundation

/// Intención de alto nivel para la FSM / motor de utilidad (MVP).
public enum UtilityDirective: String, Sendable, Codable, Equatable {
    case explore
    case captureNearest
    case returnToRefuge
    case rest
    /// Aplicar `NutrientConsumeRules.consumeNutrient` (típicamente en refugio).
    case consumeNutrient
}

public struct UtilityContext: Sendable {
    public var vitals: SurvivalVitals
    public var presence: PresenceState
    public var nearestHostileDistance: Double?
    public var inventory: InventoryState?
    public var memory: AgentMemory?
    public var personality: AgentPersonality

    public init(
        vitals: SurvivalVitals,
        presence: PresenceState,
        nearestHostileDistance: Double? = nil,
        inventory: InventoryState? = nil,
        memory: AgentMemory? = nil,
        personality: AgentPersonality = .neutral
    ) {
        self.vitals = vitals
        self.presence = presence
        self.nearestHostileDistance = nearestHostileDistance
        self.inventory = inventory
        self.memory = memory
        self.personality = personality
    }
}

/// Reglas de seguridad mínimas antes del scoring fino (Fase 3).
public enum UtilitySafetyRules {
    public static func forcedDirective(for context: UtilityContext) -> UtilityDirective? {
        if context.vitals.needsRefugeSoon {
            return .returnToRefuge
        }
        // Solo huir si un agente está EXTREMADAMENTE cerca (< 3 celdas base × cautela).
        // Los agentes del mismo mundo no son inherentemente hostiles.
        if let d = context.nearestHostileDistance {
            let baseRadius: Double =
                context.memory?.stressFromPerceivedThreat == true ? 4 : 2
            let hostileFleeRadius = baseRadius * context.personality.caution
            if d < hostileFleeRadius {
                return .returnToRefuge
            }
        }
        return nil
    }

    public static func chooseDirective(context: UtilityContext) -> UtilityDirective {
        if let forced = forcedDirective(for: context) {
            return forced
        }
        switch context.presence {
        case .insideRefuge:
            if let inv = context.inventory, inv.nutrientPackets > 0, context.vitals.hunger >= 0.22 {
                return .consumeNutrient
            }
            return .rest
        case .exploring:
            return UtilityScoring.chooseExploringDirective(context: context)
        }
    }
}

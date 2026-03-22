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

    public init(
        vitals: SurvivalVitals,
        presence: PresenceState,
        nearestHostileDistance: Double? = nil,
        inventory: InventoryState? = nil,
        memory: AgentMemory? = nil
    ) {
        self.vitals = vitals
        self.presence = presence
        self.nearestHostileDistance = nearestHostileDistance
        self.inventory = inventory
        self.memory = memory
    }
}

/// Reglas de seguridad mínimas antes del scoring fino (Fase 3).
public enum UtilitySafetyRules {
    public static func forcedDirective(for context: UtilityContext) -> UtilityDirective? {
        if context.vitals.needsRefugeSoon {
            return .returnToRefuge
        }
        if let d = context.nearestHostileDistance {
            let hostileFleeRadius: Double =
                context.memory?.stressFromPerceivedThreat == true ? 18 : 12
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
            if let inv = context.inventory, inv.nutrientPackets > 0, context.vitals.hunger >= 0.28 {
                return .consumeNutrient
            }
            return .rest
        case .exploring:
            return UtilityScoring.chooseExploringDirective(context: context)
        }
    }
}

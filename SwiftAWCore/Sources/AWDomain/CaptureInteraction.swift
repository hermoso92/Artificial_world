import Foundation

/// Resultado de reglas de captura puras (testeable sin SpriteKit).
public enum CaptureOutcome: Sendable, Equatable {
    case captured(scoreGain: Int, vitalsDelta: SurvivalVitals)
    case rejectedHostile
    case missed
}

public enum CaptureRules {
    /// Si la distancia es menor o igual al umbral, captura según arquetipo.
    public static func resolve(
        distance: Double,
        captureRange: Double,
        archetype: SquareArchetype,
        currentVitals: SurvivalVitals
    ) -> CaptureOutcome {
        guard distance <= captureRange else {
            return .missed
        }
        if archetype == .hostile {
            return .rejectedHostile
        }
        var v = currentVitals
        let h = archetype.hungerDeltaOnCapture
        v.hunger = max(0, min(1, v.hunger + h))
        v.energy = min(1, v.energy + 0.02)
        return .captured(scoreGain: archetype.scoreValue, vitalsDelta: v)
    }
}

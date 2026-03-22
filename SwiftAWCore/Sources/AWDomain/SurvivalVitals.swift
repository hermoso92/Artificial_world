import Foundation

/// Necesidades físicas del avatar en el mundo (dominio puro, sin UI).
public struct SurvivalVitals: Equatable, Sendable, Codable {
    public var energy: Double
    public var hunger: Double

    public init(energy: Double, hunger: Double) {
        self.energy = max(0, min(1, energy))
        self.hunger = max(0, min(1, hunger))
    }

    /// Gasto por unidad de tiempo de exploración (MVP; valores calibrables).
    public mutating func applyExplorationDrain(deltaTime: TimeInterval, energyRate: Double = 0.08, hungerRate: Double = 0.05) {
        energy = max(0, energy - energyRate * deltaTime)
        hunger = min(1, hunger + hungerRate * deltaTime)
    }

    /// Recuperación suave en refugio (MVP). `recoveryMultiplier` refleja mejoras del refugio (≥ 1).
    public mutating func applyRefugeRest(
        deltaTime: TimeInterval,
        energyRecovery: Double = 0.06,
        hungerRelief: Double = 0.04,
        recoveryMultiplier: Double = 1.0
    ) {
        let m = max(0.25, recoveryMultiplier)
        energy = min(1, energy + energyRecovery * deltaTime * m)
        hunger = max(0, hunger - hungerRelief * deltaTime * m)
    }

    public var needsRefugeSoon: Bool {
        energy < 0.25 || hunger > 0.85
    }
}

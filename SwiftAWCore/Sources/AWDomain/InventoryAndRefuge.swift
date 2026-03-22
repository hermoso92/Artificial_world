import Foundation

/// Inventario mínimo del vertical slice (recursos de campo → mejoras).
public struct InventoryState: Equatable, Sendable, Codable {
    public var fiberScraps: Int
    public var nutrientPackets: Int

    public init(fiberScraps: Int = 0, nutrientPackets: Int = 0) {
        self.fiberScraps = max(0, fiberScraps)
        self.nutrientPackets = max(0, nutrientPackets)
    }
}

/// Mejoras persistentes del refugio (multiplicadores suaves; sin UI de construcción aún).
public struct RefugeImprovements: Equatable, Sendable, Codable {
    /// 0…3 — mejora `applyRefugeRest` (energía / hambre).
    public var restEfficiencyRank: Int
    /// 0…3 — reservado (capacidad / craft futuro).
    public var storageRank: Int

    public init(restEfficiencyRank: Int = 0, storageRank: Int = 0) {
        self.restEfficiencyRank = min(3, max(0, restEfficiencyRank))
        self.storageRank = min(3, max(0, storageRank))
    }

    /// Factor ≥ 1 aplicado a tasas de recuperación en refugio.
    public var restRecoveryMultiplier: Double {
        1.0 + Double(restEfficiencyRank) * 0.12
    }
}

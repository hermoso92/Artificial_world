import Foundation

/// Entrada de tabla de spawn (evita tuplas sin `Codable`/`Equatable` automáticos).
public struct WeightedArchetype: Equatable, Sendable, Codable {
    public var archetype: SquareArchetype
    public var weight: Int

    public init(archetype: SquareArchetype, weight: Int) {
        self.archetype = archetype
        self.weight = weight
    }
}

/// Tabla de aparición ponderada por zona (bioma). Sin geometría: alimenta encuentros abstractos hasta el grid (Fase 2+).
public struct ZoneSpawnProfile: Equatable, Sendable, Codable {
    public var zoneID: ZoneID
    public var weightedArchetypes: [WeightedArchetype]

    public init(zoneID: ZoneID, weightedArchetypes: [WeightedArchetype]) {
        self.zoneID = zoneID
        self.weightedArchetypes = weightedArchetypes
    }

    /// Elige un arquetipo según pesos relativos.
    public func rollEncounter<G: RandomNumberGenerator>(using gen: inout G) -> SquareArchetype {
        let weights = weightedArchetypes.map { max(1, $0.weight) }
        let total = weights.reduce(0, +)
        guard total > 0 else { return .common }
        var roll = Int(gen.next(upperBound: UInt64(total)))
        for (index, w) in weights.enumerated() {
            if roll < w {
                return weightedArchetypes[index].archetype
            }
            roll -= w
        }
        return weightedArchetypes.last?.archetype ?? .common
    }
}

/// Catálogo mínimo de biomas (Fase 2: un bioma jugable).
public enum BiomeCatalog: Sendable {
    /// Borde salvaje: mezcla común, rápidos, nutrientes, raros y hostiles.
    public static let wildEdge = ZoneSpawnProfile(
        zoneID: ZoneID("wild-1"),
        weightedArchetypes: [
            WeightedArchetype(archetype: .common, weight: 40),
            WeightedArchetype(archetype: .fast, weight: 25),
            WeightedArchetype(archetype: .nourishing, weight: 15),
            WeightedArchetype(archetype: .rare, weight: 12),
            WeightedArchetype(archetype: .hostile, weight: 8),
        ]
    )

    public static func profile(for zone: ZoneID) -> ZoneSpawnProfile {
        switch zone.raw {
        case wildEdge.zoneID.raw:
            return wildEdge
        default:
            return wildEdge
        }
    }
}

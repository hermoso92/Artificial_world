import Foundation

/// Arquetipo de **terreno** por celda (distinto de `SquareArchetype` de encuentros en el mismo módulo).
public enum TerrainSquareKind: String, Sendable, Codable, CaseIterable {
    case empty = "vacío"
    case refuge = "refugio"
    case wildGrass = "hierba salvaje"
    case denseForest = "bosque denso"
    case rockOutcrop = "afloramiento rocoso"

    /// Probabilidad base de encontrar recursos al explorar esta celda.
    public var resourceDropChance: Double {
        switch self {
        case .empty, .refuge:
            return 0.0
        case .wildGrass:
            return 0.30
        case .denseForest:
            return 0.40
        case .rockOutcrop:
            return 0.18
        }
    }

    /// Costo de movimiento (1 = normal, >1 = más lento). Reservado para fases futuras.
    public var movementCost: Double {
        switch self {
        case .empty, .wildGrass:
            return 1.0
        case .refuge:
            return 0.8
        case .denseForest:
            return 1.5
        case .rockOutcrop:
            return 1.3
        }
    }
}

/// Definición de bioma de terreno con zona lógica.
public struct TerrainBiomeDefinition: Equatable, Hashable, Sendable {
    public let zoneID: ZoneID
    public let displayName: String
    public let dominantTerrain: TerrainSquareKind

    public init(zoneID: ZoneID, displayName: String, dominantTerrain: TerrainSquareKind) {
        self.zoneID = zoneID
        self.displayName = displayName
        self.dominantTerrain = dominantTerrain
    }
}

/// Catálogo de biomas de terreno (presentación / generación).
public enum TerrainBiomeCatalog {
    public static let wildEdge = TerrainBiomeDefinition(
        zoneID: ZoneID("wild_edge_01"),
        displayName: "Borde Salvaje",
        dominantTerrain: .wildGrass
    )

    public static let deepWoods = TerrainBiomeDefinition(
        zoneID: ZoneID("deep_woods_01"),
        displayName: "Bosque Profundo",
        dominantTerrain: .denseForest
    )

    public static let rockyPlains = TerrainBiomeDefinition(
        zoneID: ZoneID("rocky_plains_01"),
        displayName: "Llanuras Rocosas",
        dominantTerrain: .rockOutcrop
    )

    public static let allBiomes: [TerrainBiomeDefinition] = [
        wildEdge,
        deepWoods,
        rockyPlains,
    ]

    /// Resuelve un bioma persistido por `zoneID.raw`; `nil` o desconocido → el llamador suele usar `wildEdge`.
    public static func definition(forZoneIDRaw raw: String?) -> TerrainBiomeDefinition? {
        guard let raw, !raw.isEmpty else { return nil }
        return allBiomes.first { $0.zoneID.raw == raw }
    }
}

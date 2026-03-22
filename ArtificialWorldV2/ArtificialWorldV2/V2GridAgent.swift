import AWDomain
import Foundation

/// Agente en el mapa V2 (identidad + estado).
struct V2GridAgent: Identifiable, Sendable {
    let id: UUID
    var displayName: String
    var position: GridCoord
    var vitals: SurvivalVitals
    var inventory: InventoryState
    /// Tinte para el círculo en el mapa (0…1).
    var hue: Double
}

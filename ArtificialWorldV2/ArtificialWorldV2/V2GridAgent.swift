import AWAgent
import AWDomain
import Foundation

/// Agente en el mapa V2 (identidad + estado + personalidad + memoria operativa para utilidad).
struct V2GridAgent: Identifiable, Sendable {
    let id: UUID
    var displayName: String
    var position: GridCoord
    /// Celda de su refugio (única por agente en una partida).
    var homeRefuge: GridCoord
    /// Mejoras de craft/descanso aplican solo en su refugio.
    var refugeImprovements: RefugeImprovements
    var vitals: SurvivalVitals
    var inventory: InventoryState
    /// Memoria para `UtilityContext` (rachas, eventos, umbral de huida).
    var memory: AgentMemory
    /// Tinte para el círculo en el mapa (0…1).
    var hue: Double
    /// Personalidad única que modula decisiones de utilidad.
    var personality: AgentPersonality
    /// Ticks consecutivos en el refugio con vitales ya fuera de emergencia (tope → salir a explorar).
    var leisureRefugeTicks: UInt16 = 0
}

import Foundation

/// Línea de registro de actividad para la ficha de personaje (solo sesión en memoria).
struct AgentActivityLogEntry: Identifiable, Sendable, Equatable {
    let id: UUID
    let tick: UInt64
    let line: String

    init(tick: UInt64, line: String) {
        self.id = UUID()
        self.tick = tick
        self.line = line
    }
}

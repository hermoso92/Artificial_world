import Foundation

/// Memoria resumida serializable del agente (ampliar en Fase 3).
public struct AgentMemorySummary: Equatable, Sendable, Codable {
    public var lastRefugeExitTick: UInt64
    public var notableEvents: [String]

    public init(lastRefugeExitTick: UInt64 = 0, notableEvents: [String] = []) {
        self.lastRefugeExitTick = lastRefugeExitTick
        self.notableEvents = notableEvents
    }
}

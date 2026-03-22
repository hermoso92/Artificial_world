import Foundation

/// Identificador estable para sync futuro.
public struct ZoneID: Hashable, Sendable, Codable {
    public var raw: String

    public init(_ raw: String) {
        self.raw = raw
    }
}

/// Refugio / exterior (estado de alto nivel).
public enum PresenceState: Sendable, Codable, Equatable {
    case insideRefuge
    case exploring(zone: ZoneID)
}

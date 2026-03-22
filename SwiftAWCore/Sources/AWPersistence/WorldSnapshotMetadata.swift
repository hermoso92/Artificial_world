import Foundation

/// Cabecera para persistencia versionada (local ahora; sync después).
public struct WorldSnapshotMetadata: Equatable, Sendable, Codable {
    public var schemaVersion: Int
    public var worldSeed: UInt64
    public var savedAt: Date

    public init(schemaVersion: Int, worldSeed: UInt64, savedAt: Date = .now) {
        self.schemaVersion = schemaVersion
        self.worldSeed = worldSeed
        self.savedAt = savedAt
    }
}

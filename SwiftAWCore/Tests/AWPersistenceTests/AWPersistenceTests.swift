import AWPersistence
import Foundation
import Testing

private final class InMemoryMetaStore: WorldSnapshotStoring, @unchecked Sendable {
    private var meta: WorldSnapshotMetadata?

    init(meta: WorldSnapshotMetadata? = nil) {
        self.meta = meta
    }

    func loadMetadata() throws -> WorldSnapshotMetadata? { meta }

    func save(metadata: WorldSnapshotMetadata) throws {
        meta = metadata
    }
}

@Test func snapshotMetadataRoundTrip() throws {
    let store = InMemoryMetaStore(meta: nil)
    let m = WorldSnapshotMetadata(schemaVersion: 1, worldSeed: 42)
    try store.save(metadata: m)
    let loaded = try store.loadMetadata()
    #expect(loaded?.schemaVersion == 1)
    #expect(loaded?.worldSeed == 42)
}

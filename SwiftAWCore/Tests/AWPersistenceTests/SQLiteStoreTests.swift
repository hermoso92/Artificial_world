import AWDomain
import AWPersistence
import Foundation
import Testing

@Test func sqliteRoundTripAllStores() throws {
    let path = FileManager.default.temporaryDirectory
        .appendingPathComponent("aw-test-\(UUID().uuidString).sqlite")
        .path
    defer { try? FileManager.default.removeItem(atPath: path) }

    let store = try SQLiteArtificialWorldStore(path: path)

    let meta = WorldSnapshotMetadata(schemaVersion: 1, worldSeed: 9_007_199_254_740_991)
    try store.save(metadata: meta)
    let loadedMeta = try store.loadMetadata()
    #expect(loadedMeta?.worldSeed == meta.worldSeed)

    let vitals = SurvivalVitals(energy: 0.33, hunger: 0.77)
    try store.save(vitals: vitals)
    let loadedVitals = try store.loadVitals()
    #expect(loadedVitals == vitals)

    let mem = AgentMemorySummary(lastRefugeExitTick: 42, notableEvents: ["a", "b"])
    try store.save(summary: mem)
    let loadedMem = try store.loadSummary()
    #expect(loadedMem == mem)

    let inv = InventoryState(fiberScraps: 5, nutrientPackets: 2)
    try store.save(inventory: inv)
    let loadedInv = try store.loadInventory()
    #expect(loadedInv == inv)

    let imp = RefugeImprovements(restEfficiencyRank: 2, storageRank: 1)
    try store.save(improvements: imp)
    let loadedImp = try store.loadImprovements()
    #expect(loadedImp == imp)
}

@Test func telemetryOutboxEnvelopeAndMarkSent() throws {
    let path = FileManager.default.temporaryDirectory
        .appendingPathComponent("aw-telemetry-\(UUID().uuidString).sqlite")
        .path
    defer { try? FileManager.default.removeItem(atPath: path) }

    let store = try SQLiteArtificialWorldStore(path: path)
    let id = try store.appendTelemetry(kind: .captureSuccess, metadata: ["gain": "10"], createdAt: .now)
    #expect(id > 0)
    #expect(try store.pendingTelemetryCount() == 1)

    let env = try store.buildSyncEnvelopeV1(
        pendingLimit: 10,
        worldSeed: 123,
        tenant: TenantContext(organizationId: "org-demo", worldId: "world-1"),
        deviceInstallationId: "device-test"
    )
    #expect(env.schemaVersion == SyncEnvelopeV1.currentSchemaVersion)
    #expect(env.events.count == 1)
    #expect(env.events[0].metadata["gain"] == "10")

    try store.markTelemetrySent(rowIds: [id])
    #expect(try store.pendingTelemetryCount() == 0)
}

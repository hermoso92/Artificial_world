import AWAgent
import AWDomain
@testable import ArtificialWorldV2
import Foundation
import Testing

@MainActor
struct WorldPersistenceEngineTests {
    @Test
    func saveLoadRoundTrip() throws {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("AWV2PersistenceTests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        WorldPersistenceEngine.savesDirectoryOverride = dir
        defer {
            WorldPersistenceEngine.savesDirectoryOverride = nil
            try? FileManager.default.removeItem(at: dir)
        }

        let map = MapGenerator.generate(side: 12, seed: 3, profile: TerrainBiomeCatalog.wildEdge)
        let agentId = UUID()
        var mem = AgentMemory()
        mem.noteEvent(AgentMemory.preferExploreEvent)
        mem.recordDecision(.explore, at: 5)
        let data = WorldSaveData(
            schemaVersion: 1,
            worldTick: 42,
            gridSide: 12,
            worldSeed: 3,
            terrainCellRawValues: map.flattenedTerrainRawValues,
            agents: [
                AgentSnapshot(
                    id: agentId,
                    displayName: "Test",
                    positionX: 2,
                    positionY: 3,
                    vitals: SurvivalVitals(energy: 0.5, hunger: 0.5),
                    inventory: InventoryState(fiberScraps: 1, nutrientPackets: 2),
                    hue: 0.25,
                    memory: mem
                ),
            ],
            controlledAgentID: agentId,
            controlMode: .manual,
            refugeImprovements: RefugeImprovements(restEfficiencyRank: 1, storageRank: 0)
        )

        try WorldPersistenceEngine.save(data, name: "roundtrip")
        let loaded = try WorldPersistenceEngine.load(name: "roundtrip")
        #expect(loaded.gridSide == 12)
        #expect(loaded.worldTick == 42)
        #expect(loaded.worldSeed == 3)
        #expect(loaded.terrainCellRawValues == map.flattenedTerrainRawValues)
        #expect(loaded.agents.count == 1)
        #expect(loaded.agents[0].displayName == "Test")
        #expect(loaded.agents[0].memory.prefersExploreFromEvents == true)
        #expect(loaded.agents[0].memory.lastExploringDirective == .explore)
        #expect(loaded.refugeImprovements.restEfficiencyRank == 1)
        #expect(loaded.rngState == nil)
        #expect(loaded.schemaVersion == 1)
    }

    @Test
    func saveLoadRoundTripPreservesRngStateAndSchema2() throws {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("AWV2PersistenceTests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        WorldPersistenceEngine.savesDirectoryOverride = dir
        defer {
            WorldPersistenceEngine.savesDirectoryOverride = nil
            try? FileManager.default.removeItem(at: dir)
        }

        let agentId = UUID()
        let rngState: UInt64 = 0x1234_ABCD_5678_EF01
        let deepWoodsZone = TerrainBiomeCatalog.deepWoods.zoneID.raw
        let data = WorldSaveData(
            schemaVersion: WorldSaveData.currentSchemaVersion,
            worldTick: 7,
            gridSide: 12,
            worldSeed: 99,
            terrainBiomeZoneID: deepWoodsZone,
            terrainCellRawValues: nil,
            agents: [
                AgentSnapshot(
                    id: agentId,
                    displayName: "R",
                    positionX: 1,
                    positionY: 1,
                    vitals: SurvivalVitals(energy: 0.5, hunger: 0.5),
                    inventory: InventoryState(fiberScraps: 0, nutrientPackets: 0),
                    hue: 0
                ),
            ],
            controlledAgentID: agentId,
            controlMode: .manual,
            rngState: rngState
        )

        try WorldPersistenceEngine.save(data, name: "rng")
        let loaded = try WorldPersistenceEngine.load(name: "rng")
        #expect(loaded.schemaVersion == WorldSaveData.currentSchemaVersion)
        #expect(loaded.rngState == rngState)
        #expect(loaded.terrainBiomeZoneID == deepWoodsZone)
        let session = try V2WorldSession.restored(from: loaded)
        #expect(session.terrainProfile.zoneID.raw == deepWoodsZone)
    }

    @Test
    func decodesLegacyJsonWithoutRngStateKey() throws {
        let json = """
        {
          "schemaVersion": 1,
          "worldTick": 1,
          "gridSide": 12,
          "worldSeed": 3,
          "agents": [],
          "controlledAgentID": "00000000-0000-0000-0000-000000000001",
          "controlMode": "manual",
          "refugeImprovements": {"restEfficiencyRank": 0, "storageRank": 0},
          "savedAt": "2020-01-01T00:00:00Z"
        }
        """
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let data = try decoder.decode(WorldSaveData.self, from: Data(json.utf8))
        #expect(data.schemaVersion == 1)
        #expect(data.rngState == nil)
    }
}

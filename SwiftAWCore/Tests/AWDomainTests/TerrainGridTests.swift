import AWDomain
import Foundation
import Testing

@Test func seededRandomNumberGeneratorIsDeterministic() {
    var g1 = SeededRandomNumberGenerator(seed: 42)
    var g2 = SeededRandomNumberGenerator(seed: 42)
    let a = (0 ..< 20).map { _ in g1.next() }
    let b = (0 ..< 20).map { _ in g2.next() }
    #expect(a == b)
}

@Test func gridMapFlattenRoundTrip() throws {
    let raw = (0 ..< 9).map { _ in TerrainSquareKind.wildGrass.rawValue }
    let map = try GridMap.fromFlattened(side: 3, rawValues: raw)
    #expect(map.flattenedTerrainRawValues == raw)
    #expect(map[GridCoord(x: 0, y: 0)] == .wildGrass)
}

@Test func mapGeneratorIsDeterministicForSameSeed() {
    let profile = TerrainBiomeCatalog.wildEdge
    let a = MapGenerator.generate(side: 16, seed: 9_999, profile: profile)
    let b = MapGenerator.generate(side: 16, seed: 9_999, profile: profile)
    #expect(a == b)
}

@Test func resourceGatherSkipsBarrenTerrain() {
    var inv = InventoryState()
    var rng = SeededRandomNumberGenerator(seed: 7)
    ResourceGatherRules.tryGatherOnEnter(terrain: .refuge, inventory: &inv, rng: &rng)
    ResourceGatherRules.tryGatherOnEnter(terrain: .empty, inventory: &inv, rng: &rng)
    #expect(inv.fiberScraps == 0 && inv.nutrientPackets == 0)
}

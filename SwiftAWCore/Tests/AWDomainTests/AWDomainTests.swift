import AWDomain
import Foundation
import Testing

@Test func survivalVitalsClamp() {
    let v = SurvivalVitals(energy: 2, hunger: -1)
    #expect(v.energy == 1)
    #expect(v.hunger == 0)
}

@Test func captureResolvesNourishing() {
    let vitals = SurvivalVitals(energy: 0.5, hunger: 0.8)
    let outcome = CaptureRules.resolve(distance: 5, captureRange: 10, archetype: .nourishing, currentVitals: vitals)
    guard case let .captured(_, newV) = outcome else {
        Issue.record("Expected capture")
        return
    }
    #expect(newV.hunger < vitals.hunger)
}

private struct LCG: RandomNumberGenerator {
    var state: UInt64
    mutating func next() -> UInt64 {
        state = state &* 6_364_132_238_467_930_005 &+ 1
        return state
    }
}

@Test func zoneSpawnRollIsDeterministicWithSeed() {
    let profile = BiomeCatalog.wildEdge
    var g1 = LCG(state: 42)
    var g2 = LCG(state: 42)
    let a = profile.rollEncounter(using: &g1)
    let b = profile.rollEncounter(using: &g2)
    #expect(a == b)
}

@Test func refugeRestIncreasesEnergy() {
    var v = SurvivalVitals(energy: 0.2, hunger: 0.9)
    v.applyRefugeRest(deltaTime: 5)
    #expect(v.energy > 0.2)
    #expect(v.hunger < 0.9)
}

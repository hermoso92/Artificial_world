import AWAgent
import AWDomain
import Testing

@Test func safetyForcesRefugeWhenStarving() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.1, hunger: 0.9),
        presence: .exploring(zone: ZoneID("alpha")),
        nearestHostileDistance: nil
    )
    #expect(UtilitySafetyRules.chooseDirective(context: ctx) == .returnToRefuge)
}

@Test func scoringPrefersCaptureWhenHungry() {
    // Hambre alta pero por debajo del umbral `needsRefugeSoon` (>0.85) para no forzar refugio.
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.5, hunger: 0.72),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil
    )
    #expect(UtilitySafetyRules.chooseDirective(context: ctx) == .captureNearest)
}

@Test func scoringPrefersExploreWhenSatiated() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.85, hunger: 0.15),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: InventoryState(fiberScraps: 0, nutrientPackets: 0)
    )
    #expect(UtilitySafetyRules.chooseDirective(context: ctx) == .explore)
}

@Test func scoringDownweightsCaptureWithNutrientPackets() {
    let hungryButStocked = UtilityContext(
        vitals: SurvivalVitals(energy: 0.7, hunger: 0.78),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: InventoryState(nutrientPackets: 3)
    )
    #expect(UtilitySafetyRules.chooseDirective(context: hungryButStocked) == .explore)
}

@Test func refugeDirectiveConsumesNutrientWhenStockedAndHungry() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.5, hunger: 0.45),
        presence: .insideRefuge,
        inventory: InventoryState(nutrientPackets: 1)
    )
    #expect(UtilitySafetyRules.chooseDirective(context: ctx) == .consumeNutrient)
}

@Test func refugeDirectiveRestsWhenSatiatedDespiteStock() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.9, hunger: 0.1),
        presence: .insideRefuge,
        inventory: InventoryState(nutrientPackets: 2)
    )
    #expect(UtilitySafetyRules.chooseDirective(context: ctx) == .rest)
}

@Test func refugeDirectiveRestsWithoutNutrients() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.4, hunger: 0.6),
        presence: .insideRefuge,
        inventory: InventoryState(nutrientPackets: 0)
    )
    #expect(UtilitySafetyRules.chooseDirective(context: ctx) == .rest)
}

@Test func utilityScoringExploresWhenSatiatedDirect() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.9, hunger: 0.1),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil
    )
    #expect(UtilityScoring.chooseExploringDirective(context: ctx) == .explore)
}

@Test func utilityScoringCapturesWhenHungryDirect() {
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.35, hunger: 0.92),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil
    )
    #expect(UtilityScoring.chooseExploringDirective(context: ctx) == .captureNearest)
}

// MARK: - ResponseCurve (Fase 1B)

@Test func responseCurveSmoothstepEndpoints() {
    #expect(ResponseCurve.smoothstep.evaluate(0) == 0)
    #expect(ResponseCurve.smoothstep.evaluate(1) == 1)
    let mid = ResponseCurve.smoothstep.evaluate(0.5)
    #expect(abs(mid - 0.5) < 0.000_001)
}

@Test func responseCurveIdentityClamps() {
    #expect(ResponseCurve.identity.evaluate(-0.5) == 0)
    #expect(ResponseCurve.identity.evaluate(1.25) == 1)
    #expect(ResponseCurve.identity.evaluate(0.37) == 0.37)
}

@Test func responseCurvePowerShapesSignal() {
    #expect(ResponseCurve.power(exponent: 1).evaluate(0.5) == 0.5)
    #expect(ResponseCurve.power(exponent: 2).evaluate(0.5) == 0.25)
}

@Test func exploringCurvesSmoothstepCanChangeDirectiveVersusIdentity() {
    // En (0.5, 0.5) `smoothstep` coincide con la identidad; aquí la curva desplaza el balance.
    let ctx = UtilityContext(
        vitals: SurvivalVitals(energy: 0.6, hunger: 0.4),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil
    )
    let withIdentity = UtilityScoring.chooseExploringDirective(context: ctx, curves: .default)
    let curved = ExploringUtilityCurves(hunger: .smoothstep, energy: .smoothstep)
    let withSmooth = UtilityScoring.chooseExploringDirective(context: ctx, curves: curved)
    #expect(withIdentity == .captureNearest)
    #expect(withSmooth == .explore)
}

// MARK: - AgentMemory + reglas (Fase 1B)

@Test func memoryPreferExploreTipsMarginalScoring() {
    var mem = AgentMemory()
    mem.noteEvent(AgentMemory.preferExploreEvent)
    let marginal = UtilityContext(
        vitals: SurvivalVitals(energy: 0.6, hunger: 0.36),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil,
        memory: mem
    )
    #expect(UtilityScoring.chooseExploringDirective(context: marginal) == .explore)
    let without = UtilityContext(
        vitals: SurvivalVitals(energy: 0.6, hunger: 0.36),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil,
        memory: nil
    )
    #expect(UtilityScoring.chooseExploringDirective(context: without) == .captureNearest)
}

@Test func memoryStressExtendsHostileRefugeThreshold() {
    var mem = AgentMemory()
    mem.noteEvent(AgentMemory.perceivedThreatStressEvent)
    let stressed = UtilityContext(
        vitals: SurvivalVitals(energy: 0.5, hunger: 0.75),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 15,
        inventory: nil,
        memory: mem
    )
    #expect(UtilitySafetyRules.chooseDirective(context: stressed) == .returnToRefuge)
    let calm = UtilityContext(
        vitals: SurvivalVitals(energy: 0.5, hunger: 0.75),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 15,
        inventory: nil,
        memory: nil
    )
    #expect(UtilitySafetyRules.chooseDirective(context: calm) == .captureNearest)
}

@Test func agentMemoryTrimsNotableEvents() {
    var mem = AgentMemory()
    for i in 0 ..< 10 {
        mem.noteEvent("e\(i)", maxEvents: 4)
    }
    #expect(mem.summary.notableEvents.count == 4)
    #expect(mem.summary.notableEvents.first == "e6")
    #expect(mem.summary.notableEvents.last == "e9")
}

// MARK: - Ciclo de memoria (Fase 1C)

@Test func memoryRecordDecisionIncrementsExploreStreak() {
    var mem = AgentMemory()
    mem.recordDecision(.explore, at: 1)
    #expect(mem.consecutiveExploringSameChoice == 1)
    mem.recordDecision(.explore, at: 2)
    #expect(mem.consecutiveExploringSameChoice == 2)
    mem.recordDecision(.explore, at: 3)
    #expect(mem.consecutiveExploringSameChoice == 3)
    #expect(mem.lastExploringDirective == .explore)
    #expect(mem.lastDecisionTick == 3)
}

@Test func memoryReturnToRefugeClearsExploringStreak() {
    var mem = AgentMemory()
    mem.recordDecision(.explore, at: 1)
    mem.recordDecision(.explore, at: 2)
    mem.recordDecision(.returnToRefuge, at: 3)
    #expect(mem.consecutiveExploringSameChoice == 0)
    #expect(mem.lastExploringDirective == nil)
    #expect(mem.lastChosenDirective == .returnToRefuge)
}

@Test func memoryUpdatingLeavesOriginalUnchanged() {
    let base = AgentMemory()
    let next = base.updating(afterChosen: .explore, tick: 7)
    #expect(base.lastChosenDirective == nil)
    #expect(next.lastChosenDirective == .explore)
    #expect(next.lastDecisionTick == 7)
}

@Test func exploreStreakNudgesMarginalScoringTowardCapture() {
    var mem = AgentMemory()
    mem.recordDecision(.explore, at: 1)
    mem.recordDecision(.explore, at: 2)
    mem.recordDecision(.explore, at: 3)
    let withStreak = UtilityContext(
        vitals: SurvivalVitals(energy: 0.65, hunger: 0.35),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil,
        memory: mem
    )
    #expect(UtilityScoring.chooseExploringDirective(context: withStreak) == .captureNearest)
    let fresh = UtilityContext(
        vitals: SurvivalVitals(energy: 0.65, hunger: 0.35),
        presence: .exploring(zone: ZoneID("z")),
        nearestHostileDistance: 100,
        inventory: nil,
        memory: nil
    )
    #expect(UtilityScoring.chooseExploringDirective(context: fresh) == .explore)
}

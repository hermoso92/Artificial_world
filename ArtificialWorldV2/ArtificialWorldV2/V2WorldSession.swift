import AWAgent
import AWDomain
import Foundation
import Observation

/// Sesión de mundo: grid, varios agentes, un controlado y tick con utilidad del SPM.
@MainActor
@Observable
final class V2WorldSession {
    let side: Int
    let worldSeed: UInt64
    private(set) var gridMap: GridMap
    private(set) var agents: [V2GridAgent]
    var controlledId: UUID
    var controlMode: PlayerControlMode = .manual
    private(set) var worldTick: UInt64 = 0
    var statusMessage: String = ""
    var refugeImprovements: RefugeImprovements
    /// Último fallo de autosave (p. ej. disco lleno); visible en UI.
    var autosaveWarning: String?

    private var rng: PersistableSplitMix64
    /// Zona lógica de encuentros (`ZoneSpawnProfile`), no confundir con terreno visual.
    private let encounterZoneID: ZoneID
    private let tickDelta: TimeInterval = 1.0

    init(
        side: Int = GameWorldBlueprint.resolvedGridSideCells(),
        agentCount: Int = GameWorldBlueprint.agentCount,
        worldSeed: UInt64 = GameWorldBlueprint.defaultWorldSeed,
        gridMap: GridMap? = nil,
        refugeImprovements: RefugeImprovements = RefugeImprovements(),
        presetAgents: [V2GridAgent]? = nil,
        presetControlledId: UUID? = nil,
        restoredWorldTick: UInt64 = 0,
        restoredControlMode: PlayerControlMode? = nil,
        restoredRngState: UInt64? = nil
    ) {
        let s = max(8, min(128, side))
        let effectiveSeed = worldSeed == 0 ? GameWorldBlueprint.defaultWorldSeed : worldSeed
        self.worldSeed = worldSeed
        self.side = s
        if let existing = gridMap, existing.side == s {
            self.gridMap = existing
        } else {
            self.gridMap = MapGenerator.generate(side: s, seed: worldSeed, profile: TerrainBiomeCatalog.wildEdge)
        }
        var generator: PersistableSplitMix64
        if let preset = presetAgents, !preset.isEmpty {
            self.agents = preset
            self.controlledId = presetControlledId ?? preset[0].id
            let state = restoredRngState ?? WorldSaveData.inferredSessionRngState(
                worldSeed: effectiveSeed,
                worldTick: restoredWorldTick
            )
            generator = PersistableSplitMix64(state: state)
        } else {
            generator = PersistableSplitMix64(seed: effectiveSeed)
            let placed = Self.scatterAgents(side: s, count: agentCount, rng: &generator)
            self.agents = placed
            self.controlledId = placed[0].id
        }
        self.worldTick = restoredWorldTick
        if let mode = restoredControlMode {
            self.controlMode = mode
        }
        self.rng = generator
        self.encounterZoneID = BiomeCatalog.wildEdge.zoneID
        self.refugeImprovements = refugeImprovements
        statusMessage = "Elegí agente tocando el mapa. Refugio en (0,0)."
    }

    /// Estado del RNG de sesión para `WorldSaveData` (mismo archivo que `rng`).
    func currentPersistedRngState() -> UInt64 {
        rng.state
    }

    var controlledAgent: V2GridAgent? {
        agents.first { $0.id == controlledId }
    }

    func selectAgent(id: UUID) {
        guard agents.contains(where: { $0.id == id }) else { return }
        controlledId = id
        statusMessage = "Control: \(agents.first { $0.id == id }?.displayName ?? "?")"
    }

    // MARK: - Inventario y craft (delegación a AWDomain)

    /// Consume un nutriente del inventario del controlado (`NutrientConsumeRules`).
    @discardableResult
    func tryConsumeNutrientForControlled() -> Bool {
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return false }
        var agent = agents[idx]
        let ok = NutrientConsumeRules.consumeNutrient(
            inventory: &agent.inventory,
            vitals: &agent.vitals
        )
        if ok {
            agents[idx] = agent
            updateStatusMessage()
        }
        return ok
    }

    /// Craft de eficiencia de descanso: inventario del controlado + refugio mundial (`CraftingRules`). Solo en celda refugio.
    @discardableResult
    func tryCraftRestEfficiencyAtRefugeForControlled() -> Bool {
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return false }
        guard agents[idx].position == .refugeOrigin else { return false }
        var agent = agents[idx]
        let ok = CraftingRules.tryUpgradeRestEfficiency(
            inventory: &agent.inventory,
            improvements: &refugeImprovements
        )
        if ok {
            agents[idx] = agent
            updateStatusMessage()
        }
        return ok
    }

    /// Craft de almacén: mismas condiciones que `tryCraftRestEfficiencyAtRefugeForControlled`.
    @discardableResult
    func tryCraftStorageAtRefugeForControlled() -> Bool {
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return false }
        guard agents[idx].position == .refugeOrigin else { return false }
        var agent = agents[idx]
        let ok = CraftingRules.tryUpgradeStorage(
            inventory: &agent.inventory,
            improvements: &refugeImprovements
        )
        if ok {
            agents[idx] = agent
            updateStatusMessage()
        }
        return ok
    }

    /// Si el controlado puede craftear descanso (posición + stock según `CraftingRules.restEfficiencyUpgradeCost`).
    var canCraftRestEfficiencyAtRefuge: Bool {
        guard let agent = controlledAgent, agent.position == .refugeOrigin else { return false }
        let cost = CraftingRules.restEfficiencyUpgradeCost(currentRank: refugeImprovements.restEfficiencyRank)
        guard cost.fiber != Int.max else { return false }
        return agent.inventory.fiberScraps >= cost.fiber && agent.inventory.nutrientPackets >= cost.nutrient
    }

    /// Igual que descanso, usando `CraftingRules.storageUpgradeCost`.
    var canCraftStorageAtRefuge: Bool {
        guard let agent = controlledAgent, agent.position == .refugeOrigin else { return false }
        let cost = CraftingRules.storageUpgradeCost(currentRank: refugeImprovements.storageRank)
        guard cost.fiber != Int.max else { return false }
        return agent.inventory.fiberScraps >= cost.fiber && agent.inventory.nutrientPackets >= cost.nutrient
    }

    /// Movimiento manual del agente controlado (un paso cardinal).
    func moveControlled(dx: Int, dy: Int) {
        guard controlMode == .manual || controlMode == .hybrid else { return }
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return }
        tryMoveAgent(at: idx, dx: dx, dy: dy, reason: "manual")
    }

    /// Un tick de simulación: vitales + IA para quien corresponda.
    func advanceTick() {
        worldTick += 1
        applyVitalsPhase()
        runMovementPhase()
        updateStatusMessage()
    }

    private func updateStatusMessage() {
        if let controlled = controlledAgent {
            let energyPct = Int(controlled.vitals.energy * 100)
            let hungerPct = Int(controlled.vitals.hunger * 100)
            let inv = controlled.inventory
            statusMessage =
                "\(controlled.displayName): E\(energyPct)% H\(hungerPct)% · fib \(inv.fiberScraps) nut \(inv.nutrientPackets)"
        } else {
            statusMessage = "Sin agente controlado"
        }
    }

    // MARK: - Private

    private func occupiedCells(excludingAgentId exclude: UUID?) -> Set<GridCoord> {
        var set = Set<GridCoord>()
        for a in agents where a.id != exclude {
            set.insert(a.position)
        }
        return set
    }

    private func inBounds(_ c: GridCoord) -> Bool {
        c.x >= 0 && c.y >= 0 && c.x < side && c.y < side
    }

    private func tryMoveAgent(at index: Int, dx: Int, dy: Int, reason: String) {
        guard index < agents.count else { return }
        let next = agents[index].position.offset(dx: dx, dy: dy)
        guard inBounds(next) else { return }
        let occ = occupiedCells(excludingAgentId: agents[index].id)
        guard !occ.contains(next) else { return }
        agents[index].position = next
        applyGatherAfterMove(agentIndex: index, cell: next)
        _ = reason
    }

    private func applyGatherAfterMove(agentIndex: Int, cell: GridCoord) {
        guard let terrain = gridMap[cell] else { return }
        ResourceGatherRules.tryGatherOnEnter(
            terrain: terrain,
            inventory: &agents[agentIndex].inventory,
            rng: &rng
        )
    }

    private func applyVitalsPhase() {
        for i in agents.indices {
            if agents[i].position == .refugeOrigin {
                agents[i].vitals.applyRefugeRest(
                    deltaTime: tickDelta,
                    recoveryMultiplier: refugeImprovements.restRecoveryMultiplier
                )
            } else {
                agents[i].vitals.applyExplorationDrain(deltaTime: tickDelta)
            }
        }
    }

    private func runMovementPhase() {
        var order = Array(agents.indices)
        order.shuffle(using: &rng)
        for i in order {
            let agent = agents[i]
            guard shouldRunAI(for: agent) else { continue }
            let plan = aiMovementPlan(for: agent, index: i)
            greedyStep(agentIndex: i, target: plan.target, exploreRandom: plan.exploreRandom)
        }
    }

    private func shouldRunAI(for agent: V2GridAgent) -> Bool {
        if agent.id != controlledId { return true }
        switch controlMode {
        case .autonomous:
            return true
        case .manual:
            return false
        case .hybrid:
            let ctx = makeContext(for: agent)
            return UtilitySafetyRules.forcedDirective(for: ctx) != nil
        }
    }

    private func makeContext(for agent: V2GridAgent) -> UtilityContext {
        let dist = nearestOtherAgentDistance(from: agent)
        let presence: PresenceState = agent.position == .refugeOrigin
            ? .insideRefuge
            : .exploring(zone: encounterZoneID)
        return UtilityContext(
            vitals: agent.vitals,
            presence: presence,
            nearestHostileDistance: dist.map { Double($0) },
            inventory: agent.inventory
        )
    }

    private func nearestOtherAgentDistance(from agent: V2GridAgent) -> Int? {
        var best: Int?
        for other in agents where other.id != agent.id {
            let d = agent.position.manhattan(to: other.position)
            if best == nil || d < best! { best = d }
        }
        return best
    }

    private func aiMovementPlan(for agent: V2GridAgent, index: Int) -> (target: GridCoord?, exploreRandom: Bool) {
        let ctx = makeContext(for: agent)
        let directive: UtilityDirective
        if let forced = UtilitySafetyRules.forcedDirective(for: ctx) {
            directive = forced
        } else {
            directive = UtilitySafetyRules.chooseDirective(context: ctx)
        }
        switch directive {
        case .returnToRefuge, .rest:
            let t = agent.position == .refugeOrigin ? nil : GridCoord.refugeOrigin
            return (t, false)
        case .captureNearest:
            return (nearestEnemyPosition(from: agent), false)
        case .explore:
            return (nil, true)
        case .consumeNutrient:
            if agent.position == .refugeOrigin {
                tryAIConsumeNutrient(agentIndex: index)
            }
            return (nil, false)
        }
    }

    private func tryAIConsumeNutrient(agentIndex: Int) {
        var agent = agents[agentIndex]
        let ok = NutrientConsumeRules.consumeNutrient(
            inventory: &agent.inventory,
            vitals: &agent.vitals
        )
        if ok { agents[agentIndex] = agent }
    }

    private func nearestEnemyPosition(from agent: V2GridAgent) -> GridCoord? {
        var best: GridCoord?
        var bestD = Int.max
        for other in agents where other.id != agent.id {
            let d = agent.position.manhattan(to: other.position)
            if d < bestD {
                bestD = d
                best = other.position
            }
        }
        return best
    }

    private func greedyStep(agentIndex: Int, target: GridCoord?, exploreRandom: Bool) {
        let agent = agents[agentIndex]
        let blocked = occupiedCells(excludingAgentId: agent.id)
        var dirs = GridCoord.cardinalOffsets
        if exploreRandom {
            dirs.shuffle(using: &rng)
        } else if let t = target {
            dirs.sort { a, b in
                let na = agent.position.offset(dx: a.0, dy: a.1)
                let nb = agent.position.offset(dx: b.0, dy: b.1)
                return na.manhattan(to: t) < nb.manhattan(to: t)
            }
        }
        for (dx, dy) in dirs {
            let next = agent.position.offset(dx: dx, dy: dy)
            guard inBounds(next), !blocked.contains(next) else { continue }
            agents[agentIndex].position = next
            applyGatherAfterMove(agentIndex: agentIndex, cell: next)
            return
        }
    }

    private static func scatterAgents<R: RandomNumberGenerator>(side: Int, count: Int, rng: inout R) -> [V2GridAgent] {
        let center = side / 2
        var used = Set<GridCoord>()
        var list: [V2GridAgent] = []
        let names = ["Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron"]
        for i in 0 ..< count {
            var p: GridCoord
            repeat {
                let ox = Int.random(in: -4 ... 4, using: &rng)
                let oy = Int.random(in: -4 ... 4, using: &rng)
                p = GridCoord(x: max(1, min(side - 2, center + ox)), y: max(1, min(side - 2, center + oy)))
            } while used.contains(p)
            used.insert(p)
            let hue = Double(i) / Double(max(count, 1))
            list.append(
                V2GridAgent(
                    id: UUID(),
                    displayName: i < names.count ? names[i] : "Agent \(i + 1)",
                    position: p,
                    vitals: SurvivalVitals(energy: 0.75 + Double.random(in: 0 ... 0.2, using: &rng), hunger: Double.random(in: 0.15 ... 0.45, using: &rng)),
                    inventory: InventoryState(fiberScraps: 0, nutrientPackets: 0),
                    hue: hue
                )
            )
        }
        return list
    }
}

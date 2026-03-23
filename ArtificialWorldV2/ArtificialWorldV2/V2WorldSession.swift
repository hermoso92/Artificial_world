import AWAgent
import AWDomain
import Foundation
import Observation

/// Evento de recolección de recurso (para feedback visual en el mapa).
struct ResourcePickupEvent: Identifiable {
    let id = UUID()
    let position: GridCoord
    let kind: String // "fibra" o "nutriente"
    let tickCreated: UInt64
}

/// Destino para `sheet(item:)` — evita builders vacíos que congelan la UI.
struct ProfileSheetRoute: Identifiable, Equatable, Sendable {
    let id: UUID
}

/// Sesión de mundo: grid, varios agentes, un controlado y tick con utilidad del SPM.
@MainActor
@Observable
final class V2WorldSession {
    let side: Int
    let worldSeed: UInt64
    /// Bioma usado al generar terreno (y zona lógica de exploración en el contexto de utilidad).
    let terrainProfile: TerrainBiomeDefinition
    private(set) var gridMap: GridMap
    private(set) var agents: [V2GridAgent]
    var controlledId: UUID
    var controlMode: PlayerControlMode = .manual
    private(set) var worldTick: UInt64 = 0
    var statusMessage: String = ""
    /// Último fallo de autosave (p. ej. disco lleno); visible en UI.
    var autosaveWarning: String?
    /// Ficha de agente abierta (se resuelve contra `agents` en cada render).
    var profileSheetRoute: ProfileSheetRoute?
    /// Eventos recientes de recolección (se limpian tras 3 ticks).
    var recentPickups: [ResourcePickupEvent] = []

    /// Registro de acciones por agente (no persiste en disco).
    private(set) var activityLogs: [UUID: [AgentActivityLogEntry]] = [:]
    private let maxActivityLogEntriesPerAgent = 100

    private var rng: PersistableSplitMix64
    /// Zona lógica de encuentros (`ZoneSpawnProfile`), no confundir con terreno visual.
    private let encounterZoneID: ZoneID
    private let tickDelta: TimeInterval = 1.0

    init(
        side: Int = GameWorldBlueprint.resolvedGridSideCells(),
        agentCount: Int = GameWorldBlueprint.agentCount,
        worldSeed: UInt64 = GameWorldBlueprint.defaultWorldSeed,
        terrainProfile: TerrainBiomeDefinition = TerrainBiomeCatalog.wildEdge,
        gridMap: GridMap? = nil,
        presetAgents: [V2GridAgent]? = nil,
        presetControlledId: UUID? = nil,
        restoredWorldTick: UInt64 = 0,
        restoredControlMode: PlayerControlMode? = nil,
        restoredRngState: UInt64? = nil
    ) {
        let s = max(8, min(128, side))
        let effectiveSeed = worldSeed == 0 ? GameWorldBlueprint.defaultWorldSeed : worldSeed
        self.worldSeed = worldSeed
        self.terrainProfile = terrainProfile
        self.side = s
        var generator: PersistableSplitMix64
        if let preset = presetAgents, !preset.isEmpty {
            if let existing = gridMap, existing.side == s {
                self.gridMap = existing
            } else {
                self.gridMap = MapGenerator.generate(side: s, seed: effectiveSeed, profile: terrainProfile)
            }
            self.agents = preset
            self.controlledId = presetControlledId ?? preset[0].id
            let state = restoredRngState ?? WorldSaveData.inferredSessionRngState(
                worldSeed: effectiveSeed,
                worldTick: restoredWorldTick
            )
            generator = PersistableSplitMix64(state: state)
        } else {
            generator = PersistableSplitMix64(seed: effectiveSeed)
            let homes = MapGenerator.uniqueRefugeCoordinates(side: s, count: agentCount, seed: effectiveSeed)
            let refugeSet = Set(homes)
            if let existing = gridMap, existing.side == s {
                self.gridMap = existing
            } else {
                self.gridMap = MapGenerator.generate(
                    side: s,
                    seed: effectiveSeed,
                    profile: terrainProfile,
                    refugeCoordinates: refugeSet
                )
            }
            let placed = Self.scatterAgents(homes: homes, rng: &generator)
            self.agents = placed
            self.controlledId = placed[0].id
        }
        self.worldTick = restoredWorldTick
        if let mode = restoredControlMode {
            self.controlMode = mode
        }
        self.rng = generator
        self.encounterZoneID = terrainProfile.zoneID
        statusMessage = String(localized: "session.status.welcome")
    }

    /// Ancla de scroll del mapa: refugio del controlado o el primero.
    var mapScrollAnchorHome: GridCoord {
        controlledAgent?.homeRefuge ?? agents.first?.homeRefuge ?? GridCoord.refugeOrigin
    }

    /// Celdas refugio (una por agente).
    var refugeCellsOnMap: [GridCoord] {
        Array(Set(agents.map(\.homeRefuge))).sorted {
            if $0.y != $1.y { return $0.y < $1.y }
            return $0.x < $1.x
        }
    }

    /// Meta blanda de fibra para el controlado (solo guía en UI; escala con el tamaño del mapa).
    var softFiberGoalTarget: Int {
        max(6, min(20, side / 3))
    }

    /// Meta blanda de nutrientes (más baja que fibra — suelen ser más raros).
    var softNutrientGoalTarget: Int {
        max(2, min(8, side / 10 + 2))
    }

    /// Última línea del registro del controlado (lectura rápida en la barra).
    var controlledLatestActivityLine: String? {
        guard let id = controlledAgent?.id else { return nil }
        return activityLogs[id]?.first?.line
    }

    /// Primera entrada “importante” del controlado (evita ruido de pasos repetidos).
    var controlledLatestNotableActivityLine: String? {
        guard let id = controlledAgent?.id, let entries = activityLogs[id], !entries.isEmpty else { return nil }
        for e in entries where Self.isNotableActivityLine(e.line) {
            return e.line
        }
        return entries.first?.line
    }

    /// Pista de proximidad a otro agente (Manhattan); `nil` si está lejos o estás solo.
    var controlledProximityHint: String? {
        guard let c = controlledAgent, let d = nearestOtherAgentDistance(from: c) else { return nil }
        if d > 7 { return nil }
        if d <= 2 {
            return String(format: String(localized: "session.proximity.alert_fmt"), locale: .current, d)
        }
        return String(format: String(localized: "session.proximity.near_fmt"), locale: .current, d)
    }

    /// Estado del RNG de sesión para `WorldSaveData` (mismo archivo que `rng`).
    func currentPersistedRngState() -> UInt64 {
        rng.state
    }

    func activityLog(for agentId: UUID) -> [AgentActivityLogEntry] {
        activityLogs[agentId] ?? []
    }

    private func appendActivityLog(agentId: UUID, line: String) {
        let entry = AgentActivityLogEntry(tick: worldTick, line: line)
        var list = activityLogs[agentId] ?? []
        list.insert(entry, at: 0)
        if list.count > maxActivityLogEntriesPerAgent {
            list.removeLast(list.count - maxActivityLogEntriesPerAgent)
        }
        activityLogs[agentId] = list
    }

    private static var notableActivityPrefixes: [String] {
        [
            String(localized: "log.prefix.found"),
            String(localized: "log.prefix.improved"),
            String(localized: "log.prefix.ate"),
            String(localized: "log.prefix.arrived"),
            String(localized: "log.prefix.left"),
            String(localized: "log.prefix.entered"),
            String(localized: "log.prefix.heading"),
            String(localized: "log.prefix.approaching"),
            String(localized: "log.prefix.exploring"),
        ]
    }

    private static func isNotableActivityLine(_ line: String) -> Bool {
        notableActivityPrefixes.contains { line.hasPrefix($0) }
    }

    private func postControlledSuccessFeedback(action: String) {
        NotificationCenter.default.post(
            name: .awGameControlledSuccess,
            object: nil,
            userInfo: ["action": action]
        )
    }

    private func postControlledFailureFeedback() {
        NotificationCenter.default.post(name: .awGameControlledFailure, object: nil)
    }

    private static func cardinalDirection(dx: Int, dy: Int) -> String {
        switch (dx, dy) {
        case (0, -1): String(localized: "session.cardinal.north")
        case (0, 1): String(localized: "session.cardinal.south")
        case (1, 0): String(localized: "session.cardinal.east")
        case (-1, 0): String(localized: "session.cardinal.west")
        default: String(localized: "session.cardinal.generic")
        }
    }

    private static func semanticManualMoveLine(from: GridCoord, to: GridCoord, homeRefuge: GridCoord, gridMap: GridMap) -> String {
        if to == homeRefuge, from != homeRefuge {
            return String(localized: "session.move.manual.arrived_refuge")
        }
        if from == homeRefuge {
            return String(localized: "session.move.manual.left_refuge")
        }
        let dx = to.x - from.x
        let dy = to.y - from.y
        let dir = cardinalDirection(dx: dx, dy: dy)
        if let t = gridMap[to], t.resourceDropChance > 0 {
            return String(format: String(localized: "session.move.manual.walked_foraging_fmt"), locale: .current, dir)
        }
        return String(format: String(localized: "session.move.manual.walked_fmt"), locale: .current, dir)
    }

    private static func semanticAIMoveLine(
        directive: UtilityDirective,
        from: GridCoord,
        to: GridCoord,
        homeRefuge: GridCoord,
        gridMap: GridMap
    ) -> String {
        if to == homeRefuge, from != homeRefuge {
            switch directive {
            case .returnToRefuge, .rest:
                return String(localized: "session.move.ai.arrived_rest")
            default:
                return String(localized: "session.move.ai.entered_refuge")
            }
        }
        let dx = to.x - from.x
        let dy = to.y - from.y
        let dir = cardinalDirection(dx: dx, dy: dy)
        switch directive {
        case .returnToRefuge:
            return String(format: String(localized: "session.move.ai.toward_refuge_fmt"), locale: .current, dir)
        case .captureNearest:
            return String(format: String(localized: "session.move.ai.approach_fmt"), locale: .current, dir)
        case .explore:
            if from == homeRefuge {
                return String(format: String(localized: "session.move.ai.explore_after_rest_fmt"), locale: .current, dir)
            }
            if let t = gridMap[to], t.resourceDropChance > 0 {
                return String(format: String(localized: "session.move.ai.explore_forage_fmt"), locale: .current, dir)
            }
            return String(format: String(localized: "session.move.ai.explore_map_fmt"), locale: .current, dir)
        case .rest, .consumeNutrient:
            return String(format: String(localized: "session.move.ai.shifted_fmt"), locale: .current, dir)
        }
    }

    var controlledAgent: V2GridAgent? {
        agents.first { $0.id == controlledId }
    }

    func selectAgent(id: UUID) {
        guard agents.contains(where: { $0.id == id }) else { return }
        controlledId = id
        let name = agents.first { $0.id == id }?.displayName ?? "?"
        statusMessage = String(format: String(localized: "session.status.control_fmt"), locale: .current, name)
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
            agent.memory.recordDecision(.consumeNutrient, at: worldTick)
            agents[idx] = agent
            appendActivityLog(agentId: agent.id, line: String(localized: "session.log.ate_nutrient_manual"))
            postControlledSuccessFeedback(action: "consume")
            updateStatusMessage()
        } else {
            postControlledFailureFeedback()
            statusMessage = String(localized: "session.error.no_nutrients")
        }
        return ok
    }

    /// Craft de eficiencia de descanso: gasta fibra del **controlado** y sube mejoras del refugio mundial.
    /// No exige estar en (0,0): el refugio es la base compartida del mundo.
    @discardableResult
    func tryCraftRestEfficiencyAtRefugeForControlled() -> Bool {
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return false }
        var agent = agents[idx]
        let ok = CraftingRules.tryUpgradeRestEfficiency(
            inventory: &agent.inventory,
            improvements: &agent.refugeImprovements
        )
        if ok {
            agents[idx] = agent
            appendActivityLog(agentId: agent.id, line: String(localized: "session.log.upgrade_rest"))
            postControlledSuccessFeedback(action: "craft")
            updateStatusMessage()
        } else {
            postControlledFailureFeedback()
            statusMessage = String(localized: "session.error.craft_rest_max")
        }
        return ok
    }

    /// Craft de almacén: mismas reglas que `tryCraftRestEfficiencyAtRefugeForControlled`.
    @discardableResult
    func tryCraftStorageAtRefugeForControlled() -> Bool {
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return false }
        var agent = agents[idx]
        let ok = CraftingRules.tryUpgradeStorage(
            inventory: &agent.inventory,
            improvements: &agent.refugeImprovements
        )
        if ok {
            agents[idx] = agent
            appendActivityLog(agentId: agent.id, line: String(localized: "session.log.upgrade_storage"))
            postControlledSuccessFeedback(action: "craft")
            updateStatusMessage()
        } else {
            postControlledFailureFeedback()
            statusMessage = String(localized: "session.error.craft_storage_max")
        }
        return ok
    }

    /// Puede mejorar descanso: controlado existe, no está en rango máximo y hay fibra (y nutrientes si el coste lo pide).
    var canCraftRestEfficiencyAtRefuge: Bool {
        guard let agent = controlledAgent else { return false }
        let cost = CraftingRules.restEfficiencyUpgradeCost(currentRank: agent.refugeImprovements.restEfficiencyRank)
        guard cost.fiber != Int.max else { return false }
        return agent.inventory.fiberScraps >= cost.fiber && agent.inventory.nutrientPackets >= cost.nutrient
    }

    /// Igual que descanso, usando `CraftingRules.storageUpgradeCost`.
    var canCraftStorageAtRefuge: Bool {
        guard let agent = controlledAgent else { return false }
        let cost = CraftingRules.storageUpgradeCost(currentRank: agent.refugeImprovements.storageRank)
        guard cost.fiber != Int.max else { return false }
        return agent.inventory.fiberScraps >= cost.fiber && agent.inventory.nutrientPackets >= cost.nutrient
    }

    /// Movimiento manual del agente controlado (un paso cardinal). `true` si el paso se aplicó.
    @discardableResult
    func moveControlled(dx: Int, dy: Int) -> Bool {
        guard controlMode == .manual || controlMode == .hybrid else { return false }
        guard let idx = agents.firstIndex(where: { $0.id == controlledId }) else { return false }
        return tryMoveAgent(at: idx, dx: dx, dy: dy, reason: "manual")
    }

    /// Un tick de simulación: vitales + IA para quien corresponda.
    func advanceTick() {
        worldTick += 1
        recentPickups.removeAll { worldTick - $0.tickCreated > 3 }
        syncHostileThreatMemoryForAllAgents()
        applyVitalsPhase()
        runMovementPhase()
        updateLeisureRefugeTicksAfterMovement()
        updateStatusMessage()
    }

    /// Actualiza `perceived_threat_stress` — solo si el agente más cercano está MUY cerca (< 4 celdas).
    /// Los agentes no son inherentemente hostiles entre sí; el estrés solo sube ante proximidad extrema.
    private func syncHostileThreatMemoryForAllAgents() {
        let threatDistance = 4.0
        for i in agents.indices {
            let dist = nearestOtherAgentDistance(from: agents[i]).map { Double($0) }
            let within = (dist ?? .infinity) < threatDistance
            agents[i].memory.syncPerceivedHostileThreat(isWithinThreatRadius: within)
        }
    }

    private func updateStatusMessage() {
        if let controlled = controlledAgent {
            let energyPct = Int(controlled.vitals.energy * 100)
            let hungerPct = Int(controlled.vitals.hunger * 100)
            let inv = controlled.inventory
            statusMessage = String(
                format: String(localized: "session.status.controlled_vitals_fmt"),
                locale: .current,
                controlled.displayName,
                energyPct,
                hungerPct,
                inv.fiberScraps,
                inv.nutrientPackets
            )
        } else {
            statusMessage = String(localized: "session.status.no_controlled")
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

    @discardableResult
    private func tryMoveAgent(at index: Int, dx: Int, dy: Int, reason: String) -> Bool {
        guard index < agents.count else { return false }
        let agentId = agents[index].id
        let from = agents[index].position
        let next = from.offset(dx: dx, dy: dy)
        guard inBounds(next) else { return false }
        let occ = occupiedCells(excludingAgentId: agents[index].id)
        guard !occ.contains(next) else { return false }
        agents[index].position = next
        applyGatherAfterMove(agentIndex: index, cell: next)
        if reason == "manual" {
            let home = agents[index].homeRefuge
            appendActivityLog(
                agentId: agentId,
                line: Self.semanticManualMoveLine(from: from, to: next, homeRefuge: home, gridMap: gridMap)
            )
        }
        return true
    }

    private func applyGatherAfterMove(agentIndex: Int, cell: GridCoord) {
        guard let terrain = gridMap[cell] else { return }
        let before = agents[agentIndex].inventory
        ResourceGatherRules.tryGatherOnEnter(
            terrain: terrain,
            inventory: &agents[agentIndex].inventory,
            rng: &rng
        )
        let after = agents[agentIndex].inventory
        let aid = agents[agentIndex].id
        if after.fiberScraps > before.fiberScraps {
            recentPickups.append(ResourcePickupEvent(position: cell, kind: "fibra", tickCreated: worldTick))
            appendActivityLog(agentId: aid, line: String(localized: "session.log.pickup_fiber"))
            NotificationCenter.default.post(
                name: .awGamePickupFiber,
                object: nil,
                userInfo: ["agentId": aid.uuidString]
            )
        }
        if after.nutrientPackets > before.nutrientPackets {
            recentPickups.append(ResourcePickupEvent(position: cell, kind: "nutriente", tickCreated: worldTick))
            appendActivityLog(agentId: aid, line: String(localized: "session.log.pickup_nutrient"))
            NotificationCenter.default.post(
                name: .awGamePickupNutrient,
                object: nil,
                userInfo: ["agentId": aid.uuidString]
            )
        }
    }

    private func applyVitalsPhase() {
        for i in agents.indices {
            let metabolism = agents[i].personality.metabolismRate
            if agents[i].position == agents[i].homeRefuge {
                // Recuperación un poco más lenta que el default puro → sale a buscar recursos con más frecuencia.
                agents[i].vitals.applyRefugeRest(
                    deltaTime: tickDelta,
                    energyRecovery: 0.092,
                    hungerRelief: 0.076,
                    recoveryMultiplier: agents[i].refugeImprovements.restRecoveryMultiplier
                )
            } else {
                // Paso 2 — presión afuera: ~+15% drenaje vs antes; metabolismo sigue diferenciando arquetipos.
                agents[i].vitals.applyExplorationDrain(
                    deltaTime: tickDelta,
                    energyRate: 0.037 * metabolism,
                    hungerRate: 0.028 * metabolism
                )
            }
        }
    }

    private func runMovementPhase() {
        var order = Array(agents.indices)
        order.shuffle(using: &rng)
        for i in order {
            let agent = agents[i]
            guard shouldRunAI(for: agent) else { continue }
            let directive = directiveForAI(for: agent)
            let posBefore = agents[i].position
            let plan = aiMovementPlan(for: agent, index: i, directive: directive)
            greedyStep(agentIndex: i, target: plan.target, exploreRandom: plan.exploreRandom)
            agents[i].memory.recordDecision(directive, at: worldTick)
            let posAfter = agents[i].position
            let aid = agents[i].id
            if posAfter != posBefore {
                let home = agents[i].homeRefuge
                appendActivityLog(
                    agentId: aid,
                    line: Self.semanticAIMoveLine(
                        directive: directive,
                        from: posBefore,
                        to: posAfter,
                        homeRefuge: home,
                        gridMap: gridMap
                    )
                )
            }
            // Comer / recolectar / manual se registran en otros puntos; evitamos una línea por tick si está bloqueado.
        }
    }

    private func directiveForAI(for agent: V2GridAgent) -> UtilityDirective {
        let ctx = makeContext(for: agent)
        if let forced = UtilitySafetyRules.forcedDirective(for: ctx) {
            return forced
        }
        // Paso 1 — tope de holgura por personalidad: más `caution` = más ticks permitidos en casa.
        let leisureCap = maxLeisureRefugeTicks(for: agent)
        if agent.position == agent.homeRefuge,
           !ctx.vitals.needsRefugeSoon,
           agent.leisureRefugeTicks >= leisureCap
        {
            return .explore
        }
        return UtilitySafetyRules.chooseDirective(context: ctx)
    }

    /// Ticks máximos de holgura en refugio (base 10): cautelosos hasta ~18, intrépidos ~5.
    private func maxLeisureRefugeTicks(for agent: V2GridAgent) -> UInt16 {
        let base = 10.0
        let delta = (agent.personality.caution - 1.0) * 4.0
        let v = Int((base + delta).rounded(.toNearestOrAwayFromZero))
        return UInt16(clamping: min(22, max(4, v)))
    }

    private func updateLeisureRefugeTicksAfterMovement() {
        for i in agents.indices {
            let atHome = agents[i].position == agents[i].homeRefuge
            let safe = !agents[i].vitals.needsRefugeSoon
            let cap = maxLeisureRefugeTicks(for: agents[i])
            if atHome && safe {
                agents[i].leisureRefugeTicks = min(agents[i].leisureRefugeTicks &+ 1, cap)
            } else if !atHome {
                agents[i].leisureRefugeTicks = 0
            } else {
                // En casa pero aún en emergencia: no acumula holgura (puede recuperarse el tiempo que haga falta).
                agents[i].leisureRefugeTicks = 0
            }
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

    // ✨ NUEVO: Método público para UI (antes era private)
    public func makeContext(for agent: V2GridAgent) -> UtilityContext {
        let dist = nearestOtherAgentDistance(from: agent)
        let presence: PresenceState = agent.position == agent.homeRefuge
            ? .insideRefuge
            : .exploring(zone: encounterZoneID)
        return UtilityContext(
            vitals: agent.vitals,
            presence: presence,
            nearestHostileDistance: dist.map { Double($0) },
            inventory: agent.inventory,
            memory: agent.memory,
            personality: agent.personality
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

    private func aiMovementPlan(for agent: V2GridAgent, index: Int, directive: UtilityDirective) -> (target: GridCoord?, exploreRandom: Bool) {
        switch directive {
        case .returnToRefuge, .rest:
            let t = agent.position == agent.homeRefuge ? nil : agent.homeRefuge
            return (t, false)
        case .captureNearest:
            return (nearestEnemyPosition(from: agent), false)
        case .explore:
            return (nil, true)
        case .consumeNutrient:
            if agent.position == agent.homeRefuge {
                tryAIConsumeNutrient(agentIndex: index)
            }
            return (nil, false)
        }
    }

    private func tryAIConsumeNutrient(agentIndex: Int) {
        var agent = agents[agentIndex]
        let aid = agent.id
        guard agent.inventory.nutrientPackets > 0 else {
            appendActivityLog(agentId: aid, line: String(localized: "session.log.eat_no_nutrients"))
            return
        }
        let ok = NutrientConsumeRules.consumeNutrient(
            inventory: &agent.inventory,
            vitals: &agent.vitals
        )
        if ok {
            agents[agentIndex] = agent
            appendActivityLog(agentId: aid, line: String(localized: "session.log.ate_nutrient"))
        }
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
        // Sin objetivo y sin explorar aleatoria → no mover (descanso, comer, ya en refugio).
        // Antes se elegía el primer vecino libre y los agentes **salían solos** del refugio cada tick.
        if target == nil, !exploreRandom {
            return
        }
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

    private static func scatterAgents<R: RandomNumberGenerator>(homes: [GridCoord], rng: inout R) -> [V2GridAgent] {
        let count = homes.count
        var list: [V2GridAgent] = []
        let names = ["Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron"]
        for i in 0 ..< count {
            let home = homes[i]
            let hue = Double(i) / Double(max(count, 1))
            let personality: AgentPersonality
            if i < AgentPersonality.archetypes.count {
                personality = .archetype(index: i, using: &rng)
            } else {
                personality = .random(using: &rng)
            }
            list.append(
                V2GridAgent(
                    id: UUID(),
                    displayName: i < names.count
                        ? names[i]
                        : String(
                            format: String(localized: "session.agent.default_name_fmt"),
                            locale: .current,
                            i + 1
                        ),
                    position: home,
                    homeRefuge: home,
                    refugeImprovements: RefugeImprovements(),
                    vitals: SurvivalVitals(
                        energy: Double.random(in: 0.7...1.0, using: &rng),
                        hunger: Double.random(in: 0.0...0.25, using: &rng)
                    ),
                    inventory: InventoryState(fiberScraps: 0, nutrientPackets: 0),
                    memory: AgentMemory(),
                    hue: hue,
                    personality: personality,
                    leisureRefugeTicks: 0
                )
            )
        }
        return list
    }
}

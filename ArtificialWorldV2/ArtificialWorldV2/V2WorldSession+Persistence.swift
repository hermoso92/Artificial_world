import AWAgent
import AWDomain
import Foundation

enum WorldSessionRestorationError: Error, Sendable {
    case emptyAgents
    case controlledAgentMissing
}

extension V2WorldSession {
    func makeSaveData() -> WorldSaveData {
        WorldSaveData(
            schemaVersion: WorldSaveData.currentSchemaVersion,
            worldTick: worldTick,
            gridSide: side,
            worldSeed: worldSeed,
            terrainBiomeZoneID: terrainProfile.zoneID.raw,
            terrainCellRawValues: gridMap.flattenedTerrainRawValues,
            agents: agents.map { agent in
                AgentSnapshot(
                    id: agent.id,
                    displayName: agent.displayName,
                    positionX: agent.position.x,
                    positionY: agent.position.y,
                    homeRefugeX: agent.homeRefuge.x,
                    homeRefugeY: agent.homeRefuge.y,
                    refugeImprovements: agent.refugeImprovements,
                    vitals: agent.vitals,
                    inventory: agent.inventory,
                    hue: agent.hue,
                    memory: agent.memory,
                    personality: agent.personality,
                    leisureRefugeTicks: agent.leisureRefugeTicks
                )
            },
            controlledAgentID: controlledId,
            controlMode: controlMode,
            refugeImprovements: RefugeImprovements(),
            savedAt: Date(),
            rngState: currentPersistedRngState()
        )
    }

    /// Reconstruye sesión desde disco; debe ejecutarse en el actor principal.
    static func restored(from data: WorldSaveData) throws -> V2WorldSession {
        let s = max(8, min(128, data.gridSide))
        let seed = data.worldSeed == 0 ? GameWorldBlueprint.defaultWorldSeed : data.worldSeed
        let terrainProfile =
            TerrainBiomeCatalog.definition(forZoneIDRaw: data.terrainBiomeZoneID) ?? TerrainBiomeCatalog.wildEdge
        var map: GridMap
        if let flat = data.terrainCellRawValues, flat.count == s * s {
            map = try GridMap.fromFlattened(side: s, rawValues: flat)
        } else {
            map = MapGenerator.generate(side: s, seed: seed, profile: terrainProfile)
        }
        var builtAgents = data.agents.map { snap in
            V2GridAgent(
                id: snap.id,
                displayName: snap.displayName,
                position: GridCoord(x: snap.positionX, y: snap.positionY),
                homeRefuge: GridCoord(x: snap.homeRefugeX, y: snap.homeRefugeY),
                refugeImprovements: snap.refugeImprovements,
                vitals: snap.vitals,
                inventory: snap.inventory,
                memory: snap.memory,
                hue: snap.hue,
                personality: snap.personality,
                leisureRefugeTicks: snap.leisureRefugeTicks
            )
        }
        guard !builtAgents.isEmpty else {
            throw WorldSessionRestorationError.emptyAgents
        }
        guard builtAgents.contains(where: { $0.id == data.controlledAgentID }) else {
            throw WorldSessionRestorationError.controlledAgentMissing
        }

        // Guardados v1–v3: varios agentes compartían (0,0). Repartimos refugios y copiamos mejoras globales.
        let origin = GridCoord.refugeOrigin
        if builtAgents.count > 1, builtAgents.allSatisfy({ $0.homeRefuge == origin }) {
            let homes = MapGenerator.uniqueRefugeCoordinates(side: s, count: builtAgents.count, seed: seed)
            let legacy = data.refugeImprovements
            for i in builtAgents.indices {
                builtAgents[i].homeRefuge = homes[i]
                builtAgents[i].refugeImprovements = legacy
            }
        }
        for a in builtAgents {
            map.set(.refuge, at: a.homeRefuge)
        }
        let homeSet = Set(builtAgents.map(\.homeRefuge))
        for y in 0 ..< s {
            for x in 0 ..< s {
                let c = GridCoord(x: x, y: y)
                if map[c] == .refuge, !homeSet.contains(c) {
                    map.set(.wildGrass, at: c)
                }
            }
        }

        return V2WorldSession(
            side: s,
            agentCount: builtAgents.count,
            worldSeed: seed,
            terrainProfile: terrainProfile,
            gridMap: map,
            presetAgents: builtAgents,
            presetControlledId: data.controlledAgentID,
            restoredWorldTick: data.worldTick,
            restoredControlMode: data.controlMode,
            restoredRngState: data.rngState
        )
    }
}

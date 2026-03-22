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
            terrainCellRawValues: gridMap.flattenedTerrainRawValues,
            agents: agents.map { agent in
                AgentSnapshot(
                    id: agent.id,
                    displayName: agent.displayName,
                    positionX: agent.position.x,
                    positionY: agent.position.y,
                    vitals: agent.vitals,
                    inventory: agent.inventory,
                    hue: agent.hue
                )
            },
            controlledAgentID: controlledId,
            controlMode: controlMode,
            refugeImprovements: refugeImprovements,
            savedAt: Date(),
            rngState: currentPersistedRngState()
        )
    }

    /// Reconstruye sesión desde disco; debe ejecutarse en el actor principal.
    static func restored(from data: WorldSaveData) throws -> V2WorldSession {
        let s = max(8, min(128, data.gridSide))
        let seed = data.worldSeed == 0 ? GameWorldBlueprint.defaultWorldSeed : data.worldSeed
        let map: GridMap
        if let flat = data.terrainCellRawValues, flat.count == s * s {
            map = try GridMap.fromFlattened(side: s, rawValues: flat)
        } else {
            map = MapGenerator.generate(side: s, seed: seed, profile: TerrainBiomeCatalog.wildEdge)
        }
        let builtAgents = data.agents.map { snap in
            V2GridAgent(
                id: snap.id,
                displayName: snap.displayName,
                position: GridCoord(x: snap.positionX, y: snap.positionY),
                vitals: snap.vitals,
                inventory: snap.inventory,
                hue: snap.hue
            )
        }
        guard !builtAgents.isEmpty else {
            throw WorldSessionRestorationError.emptyAgents
        }
        guard builtAgents.contains(where: { $0.id == data.controlledAgentID }) else {
            throw WorldSessionRestorationError.controlledAgentMissing
        }
        return V2WorldSession(
            side: s,
            agentCount: builtAgents.count,
            worldSeed: seed,
            gridMap: map,
            refugeImprovements: data.refugeImprovements,
            presetAgents: builtAgents,
            presetControlledId: data.controlledAgentID,
            restoredWorldTick: data.worldTick,
            restoredControlMode: data.controlMode,
            restoredRngState: data.rngState
        )
    }
}

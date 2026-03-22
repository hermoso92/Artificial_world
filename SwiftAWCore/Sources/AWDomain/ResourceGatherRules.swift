import Foundation

/// Reglas puras: intento de recolección al entrar en una celda de terreno.
public enum ResourceGatherRules {
    /// Si el RNG supera la probabilidad del terreno, no hay botín.
    public static func tryGatherOnEnter<G: RandomNumberGenerator>(
        terrain: TerrainSquareKind,
        inventory: inout InventoryState,
        rng: inout G
    ) {
        guard terrain.resourceDropChance > 0 else { return }
        if Double.random(in: 0 ... 1, using: &rng) >= terrain.resourceDropChance {
            return
        }
        if Bool.random(using: &rng) {
            inventory.fiberScraps += 1
        } else {
            inventory.nutrientPackets += 1
        }
    }
}

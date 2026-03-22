import Foundation

/// Recetas de crafting puro: fibra → rangos de `RefugeImprovements` (tope 3).
public enum CraftingRules {
    public static let fiberCostRestRank: Int = 4
    public static let fiberCostStorageRank: Int = 3

    /// Coste del siguiente escalón para UI / `canCraft`. En rango máximo devuelve `(Int.max, Int.max)`.
    /// Nutrientes: 0 (el slice actual solo gasta fibra por mejora).
    public static func restEfficiencyUpgradeCost(currentRank: Int) -> (fiber: Int, nutrient: Int) {
        let r = min(3, max(0, currentRank))
        guard r < 3 else { return (Int.max, Int.max) }
        return (fiber: fiberCostRestRank, nutrient: 0)
    }

    public static func storageUpgradeCost(currentRank: Int) -> (fiber: Int, nutrient: Int) {
        let r = min(3, max(0, currentRank))
        guard r < 3 else { return (Int.max, Int.max) }
        return (fiber: fiberCostStorageRank, nutrient: 0)
    }

    /// Sube `restEfficiencyRank` en 1 si hay fibra suficiente y no está en tope.
    @discardableResult
    public static func tryUpgradeRestEfficiency(
        inventory: inout InventoryState,
        improvements: inout RefugeImprovements,
        fiberCost: Int = fiberCostRestRank
    ) -> Bool {
        guard improvements.restEfficiencyRank < 3, inventory.fiberScraps >= fiberCost else { return false }
        inventory.fiberScraps -= fiberCost
        improvements.restEfficiencyRank = min(3, improvements.restEfficiencyRank + 1)
        return true
    }

    /// Sube `storageRank` en 1 si hay fibra suficiente y no está en tope.
    @discardableResult
    public static func tryUpgradeStorage(
        inventory: inout InventoryState,
        improvements: inout RefugeImprovements,
        fiberCost: Int = fiberCostStorageRank
    ) -> Bool {
        guard improvements.storageRank < 3, inventory.fiberScraps >= fiberCost else { return false }
        inventory.fiberScraps -= fiberCost
        improvements.storageRank = min(3, improvements.storageRank + 1)
        return true
    }
}

import Foundation

/// Reglas puras: gastar `nutrientPackets` y actualizar `SurvivalVitals` (sin UI).
public enum NutrientConsumeRules {
    @discardableResult
    public static func consumeNutrient(
        inventory: inout InventoryState,
        vitals: inout SurvivalVitals,
        hungerRelief: Double = 0.28,
        energyBoost: Double = 0.04
    ) -> Bool {
        guard inventory.nutrientPackets >= 1 else { return false }
        inventory.nutrientPackets -= 1
        let relief = max(0, min(1, hungerRelief))
        let boost = max(0, energyBoost)
        vitals.hunger = max(0, vitals.hunger - relief)
        vitals.energy = min(1, vitals.energy + boost)
        return true
    }
}

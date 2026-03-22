import AWDomain
import Testing

@Suite("Crafting y consumo de inventario")
struct CraftingAndConsumeTests {
    @Test("consumeNutrient requiere stock")
    func consumeRequiresStock() {
        var inv = InventoryState(fiberScraps: 0, nutrientPackets: 0)
        var vitals = SurvivalVitals(energy: 0.5, hunger: 0.9)
        let ok = NutrientConsumeRules.consumeNutrient(inventory: &inv, vitals: &vitals)
        #expect(ok == false)
        #expect(inv.nutrientPackets == 0)
        #expect(vitals.hunger == 0.9)
    }

    @Test("consumeNutrient alivia hambre y gasta paquete")
    func consumeOk() {
        var inv = InventoryState(nutrientPackets: 2)
        var vitals = SurvivalVitals(energy: 0.5, hunger: 0.8)
        let ok = NutrientConsumeRules.consumeNutrient(inventory: &inv, vitals: &vitals)
        #expect(ok == true)
        #expect(inv.nutrientPackets == 1)
        #expect(vitals.hunger < 0.8)
        #expect(vitals.energy > 0.5)
    }

    @Test("upgrade rest eficiencia descuenta y sube rango")
    func restUpgrade() {
        var inv = InventoryState(fiberScraps: 10, nutrientPackets: 10)
        var refuge = RefugeImprovements()
        let ok = CraftingRules.tryUpgradeRestEfficiency(inventory: &inv, improvements: &refuge)
        #expect(ok == true)
        #expect(refuge.restEfficiencyRank == 1)
        #expect(inv.fiberScraps == 6)
        #expect(inv.nutrientPackets == 10)
    }

    @Test("upgrade storage con coste distinto")
    func storageUpgrade() {
        var inv = InventoryState(fiberScraps: 10, nutrientPackets: 10)
        var refuge = RefugeImprovements()
        let ok = CraftingRules.tryUpgradeStorage(inventory: &inv, improvements: &refuge)
        #expect(ok == true)
        #expect(refuge.storageRank == 1)
        #expect(inv.fiberScraps == 7)
        #expect(inv.nutrientPackets == 10)
    }

    @Test("no upgrade rest cuando ya está en rango 3")
    func maxRankNoUpgrade() {
        var inv = InventoryState(fiberScraps: 100, nutrientPackets: 0)
        var imp = RefugeImprovements(restEfficiencyRank: 3, storageRank: 0)
        let ok = CraftingRules.tryUpgradeRestEfficiency(inventory: &inv, improvements: &imp)
        #expect(ok == false)
        #expect(imp.restEfficiencyRank == 3)
        #expect(inv.fiberScraps == 100)
    }
}

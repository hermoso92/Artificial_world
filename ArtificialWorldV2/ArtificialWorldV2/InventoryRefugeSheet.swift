import AWDomain
import SwiftUI

/// Inventario del controlado + craft de refugio vía `V2WorldSession` (reglas en AWDomain).
struct InventoryRefugeSheet: View {
    @Bindable var session: V2WorldSession
    @Environment(\.dismiss) private var dismiss

    /// Mejoras del refugio del agente controlado (cada personaje tiene el suyo).
    private var controlledRefugeImprovements: RefugeImprovements {
        session.controlledAgent?.refugeImprovements ?? RefugeImprovements()
    }

    private var restUpgradeCostLabel: String {
        Self.costLine(CraftingRules.restEfficiencyUpgradeCost(currentRank: controlledRefugeImprovements.restEfficiencyRank))
    }

    private var storageUpgradeCostLabel: String {
        Self.costLine(CraftingRules.storageUpgradeCost(currentRank: controlledRefugeImprovements.storageRank))
    }

    /// Texto a partir de tuplas públicas de `CraftingRules` (sin duplicar costes en la vista).
    private static func costLine(_ cost: (fiber: Int, nutrient: Int)) -> String {
        if cost.fiber == Int.max || cost.nutrient == Int.max { return String(localized: "inv.cost.max") }
        if cost.fiber == 0, cost.nutrient == 0 { return String(localized: "inv.cost.free") }
        var parts: [String] = []
        if cost.fiber > 0 {
            parts.append(
                String(format: String(localized: "inv.cost.fiber_fmt"), locale: .current, cost.fiber)
            )
        }
        if cost.nutrient > 0 {
            parts.append(
                String(format: String(localized: "inv.cost.nut_short_fmt"), locale: .current, cost.nutrient)
            )
        }
        return parts.joined(separator: ", ")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if let agent = session.controlledAgent {
                        LabeledContent(String(localized: "inv.field.controlled")) {
                            Text(agent.displayName)
                        }
                        LabeledContent(String(localized: "inv.field.position")) {
                            Text("(\(agent.position.x), \(agent.position.y))")
                                .monospacedDigit()
                        }
                        LabeledContent(String(localized: "inv.field.their_refuge")) {
                            Text("(\(agent.homeRefuge.x), \(agent.homeRefuge.y))")
                                .monospacedDigit()
                        }
                        LabeledContent(String(localized: "inv.field.fiber")) {
                            Text("\(agent.inventory.fiberScraps)")
                                .monospacedDigit()
                        }
                        LabeledContent(String(localized: "inv.field.nutrients")) {
                            Text("\(agent.inventory.nutrientPackets)")
                                .monospacedDigit()
                        }
                        LabeledContent(String(localized: "inv.field.energy")) {
                            Text(agent.vitals.energy, format: .percent.precision(.fractionLength(0)))
                        }
                        LabeledContent(String(localized: "inv.field.hunger")) {
                            Text(agent.vitals.hunger, format: .percent.precision(.fractionLength(0)))
                        }
                    } else {
                        ContentUnavailableView(
                            String(localized: "inv.no_agent_title"),
                            systemImage: "person.slash",
                            description: Text(String(localized: "inv.no_agent_desc"))
                        )
                    }
                } header: {
                    Text(String(localized: "inv.section.inventory"))
                }

                Section {
                    LabeledContent(String(localized: "inv.field.rest_rank")) {
                        Text("\(controlledRefugeImprovements.restEfficiencyRank) / 3")
                            .monospacedDigit()
                    }
                    LabeledContent(String(localized: "inv.field.refuge_recovery")) {
                        Text(controlledRefugeImprovements.restRecoveryMultiplier, format: .number.precision(.fractionLength(2)))
                            .monospacedDigit()
                    }
                    LabeledContent(String(localized: "inv.field.storage_rank")) {
                        Text("\(controlledRefugeImprovements.storageRank) / 3")
                            .monospacedDigit()
                    }
                } header: {
                    Text(String(localized: "inv.section.refuge_upgrades"))
                } footer: {
                    Text(String(localized: "inv.footer.craft_rule"))
                }

                Section {
                    Button(String(localized: "inv.action.use_nutrient")) {
                        _ = session.tryConsumeNutrientForControlled()
                    }
                    .disabled(session.controlledAgent?.inventory.nutrientPackets ?? 0 == 0)
                    .buttonStyle(.borderedProminent)
                    .accessibilityHint(String(localized: "inv.action.use_nutrient_a11y"))

                    Button(
                        String(
                            format: String(localized: "inv.action.craft_rest_fmt"),
                            locale: .current,
                            restUpgradeCostLabel
                        )
                    ) {
                        _ = session.tryCraftRestEfficiencyAtRefugeForControlled()
                    }
                    .disabled(!session.canCraftRestEfficiencyAtRefuge)

                    Button(
                        String(
                            format: String(localized: "inv.action.craft_storage_fmt"),
                            locale: .current,
                            storageUpgradeCostLabel
                        )
                    ) {
                        _ = session.tryCraftStorageAtRefugeForControlled()
                    }
                    .disabled(!session.canCraftStorageAtRefuge)
                } header: {
                    Text(String(localized: "inv.section.actions"))
                } footer: {
                    Text(String(localized: "inv.footer.costs"))
                }

                if !session.statusMessage.isEmpty {
                    Section {
                        Text(session.statusMessage)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } header: {
                        Text(String(localized: "inv.section.status"))
                    }
                }
            }
            .navigationTitle(String(localized: "inv.nav_title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Cerrar")) { dismiss() }
                }
            }
        }
    }
}

import AWDomain
import SwiftUI

/// Inventario del controlado + craft de refugio vía `V2WorldSession` (reglas en AWDomain).
struct InventoryRefugeSheet: View {
    @Bindable var session: V2WorldSession
    @Environment(\.dismiss) private var dismiss

    private var restUpgradeCostLabel: String {
        Self.costLine(CraftingRules.restEfficiencyUpgradeCost(currentRank: session.refugeImprovements.restEfficiencyRank))
    }

    private var storageUpgradeCostLabel: String {
        Self.costLine(CraftingRules.storageUpgradeCost(currentRank: session.refugeImprovements.storageRank))
    }

    /// Texto a partir de tuplas públicas de `CraftingRules` (sin duplicar costes en la vista).
    private static func costLine(_ cost: (fiber: Int, nutrient: Int)) -> String {
        if cost.fiber == Int.max || cost.nutrient == Int.max { return "máx." }
        if cost.fiber == 0, cost.nutrient == 0 { return "gratis" }
        var parts: [String] = []
        if cost.fiber > 0 { parts.append("\(cost.fiber) fibra") }
        if cost.nutrient > 0 { parts.append("\(cost.nutrient) nut.") }
        return parts.joined(separator: ", ")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if let agent = session.controlledAgent {
                        LabeledContent("Controlado") {
                            Text(agent.displayName)
                        }
                        LabeledContent("Posición") {
                            Text("(\(agent.position.x), \(agent.position.y))")
                                .monospacedDigit()
                        }
                        LabeledContent("Fibra") {
                            Text("\(agent.inventory.fiberScraps)")
                                .monospacedDigit()
                        }
                        LabeledContent("Nutrientes") {
                            Text("\(agent.inventory.nutrientPackets)")
                                .monospacedDigit()
                        }
                        LabeledContent("Energía") {
                            Text(agent.vitals.energy, format: .percent.precision(.fractionLength(0)))
                        }
                        LabeledContent("Hambre") {
                            Text(agent.vitals.hunger, format: .percent.precision(.fractionLength(0)))
                        }
                    } else {
                        ContentUnavailableView(
                            "Sin agente",
                            systemImage: "person.slash",
                            description: Text("Elegí un agente en el mapa.")
                        )
                    }
                } header: {
                    Text("Inventario")
                }

                Section {
                    LabeledContent("Descanso (rango)") {
                        Text("\(session.refugeImprovements.restEfficiencyRank) / 3")
                            .monospacedDigit()
                    }
                    LabeledContent("Recuperación en refugio") {
                        Text(session.refugeImprovements.restRecoveryMultiplier, format: .number.precision(.fractionLength(2)))
                            .monospacedDigit()
                    }
                    LabeledContent("Almacén (rango)") {
                        Text("\(session.refugeImprovements.storageRank) / 3")
                            .monospacedDigit()
                    }
                } header: {
                    Text("Mejoras del refugio")
                } footer: {
                    Text("El craft usa el inventario del agente controlado y solo en la celda del refugio (0, 0).")
                }

                Section {
                    Button("Usar 1 nutriente") {
                        _ = session.tryConsumeNutrientForControlled()
                    }
                    .disabled(session.controlledAgent?.inventory.nutrientPackets ?? 0 == 0)
                    .accessibilityHint("Reduce hambre y gasta un paquete del inventario del controlado.")

                    Button("Mejorar eficiencia de descanso (\(restUpgradeCostLabel))") {
                        _ = session.tryCraftRestEfficiencyAtRefugeForControlled()
                    }
                    .disabled(!session.canCraftRestEfficiencyAtRefuge)

                    Button("Mejorar almacén (\(storageUpgradeCostLabel))") {
                        _ = session.tryCraftStorageAtRefugeForControlled()
                    }
                    .disabled(!session.canCraftStorageAtRefuge)
                } header: {
                    Text("Acciones")
                } footer: {
                    if session.controlledAgent?.position != .refugeOrigin {
                        Text("Acercá al controlado al refugio (0, 0) para craftear.")
                    }
                }

                if !session.statusMessage.isEmpty {
                    Section {
                        Text(session.statusMessage)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } header: {
                        Text("Estado")
                    }
                }
            }
            .navigationTitle("Inventario y refugio")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }
}

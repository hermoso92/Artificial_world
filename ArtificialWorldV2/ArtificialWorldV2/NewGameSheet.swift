import AWDomain
import SwiftUI

/// Elige bioma de terreno y reemplaza la sesión por un mundo nuevo (misma semilla y tamaño por defecto del blueprint).
struct NewGameSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onStart: (TerrainBiomeDefinition) -> Void

    @State private var selectedBiome: TerrainBiomeDefinition = TerrainBiomeCatalog.wildEdge

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker(String(localized: "newgame.biome_picker"), selection: $selectedBiome) {
                        ForEach(TerrainBiomeCatalog.allBiomes, id: \.zoneID) { biome in
                            Text(biome.localizedDisplayName).tag(biome)
                        }
                    }
                    .accessibilityHint(String(localized: "newgame.biome_a11y"))
                } footer: {
                    Text(String(localized: "newgame.footer"))
                    .font(.caption)
                }
            }
            .navigationTitle(String(localized: "newgame.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Cancelar")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(localized: "newgame.create")) {
                        onStart(selectedBiome)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

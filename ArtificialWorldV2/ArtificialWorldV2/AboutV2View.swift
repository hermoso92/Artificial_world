import AWDomain
import SwiftUI

struct AboutV2View: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Artificial World V2")
                        .font(.title.bold())
                    Text(GameWorldBlueprint.pitch)
                        .font(.body)
                        .foregroundStyle(.secondary)
                    LabeledContent("Grid en este dispositivo") {
                        Text("\(GameWorldBlueprint.resolvedGridSideCells())×\(GameWorldBlueprint.resolvedGridSideCells())")
                            .monospacedDigit()
                    }
                    Text("iPhone \(GameWorldBlueprint.gridSideCellsPhone)×\(GameWorldBlueprint.gridSideCellsPhone) · iPad \(GameWorldBlueprint.gridSideCellsPad)×\(GameWorldBlueprint.gridSideCellsPad)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    LabeledContent("Agentes") {
                        Text("\(GameWorldBlueprint.agentCount)")
                            .monospacedDigit()
                    }
                    Divider()
                    Text("Dominio SPM")
                        .font(.headline)
                    Text("Encuentros (`SquareArchetype`): \(AWDomain.SquareArchetype.allCases.map(\.rawValue).joined(separator: ", "))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("Terreno (`TerrainSquareKind`): \(TerrainSquareKind.allCases.map(\.rawValue).joined(separator: ", "))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
            .navigationTitle("Acerca")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

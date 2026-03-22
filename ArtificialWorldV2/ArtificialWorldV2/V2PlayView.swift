import AWAgent
import AWDomain
import Combine
import SwiftUI

/// Partida: mapa + modo de control + D-pad + lista de agentes.
struct V2PlayView: View {
    @Bindable var session: V2WorldSession
    let makeSaveData: () -> WorldSaveData
    let onLoadSession: (V2WorldSession) -> Void

    @State private var worldAutoAdvance = true
    @State private var showSaveLoad = false
    @State private var showInventoryRefuge = false
    private let pulse = Timer.publish(every: 1.8, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: 12) {
            // Título con tick counter
            Text("Tick \(session.worldTick) · modo \(session.controlMode.rawValue)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            if let warn = session.autosaveWarning {
                Text(warn)
                    .font(.caption)
                    .foregroundStyle(.orange)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityLabel(warn)
            }

            GridMapCanvas(session: session)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("Mapa del mundo")
                .accessibilityHint("Tocá una celda con agente para elegir quién controlás. Los colores de terreno coinciden con la leyenda debajo.")

            terrainLegend

            Picker("Modo de control", selection: $session.controlMode) {
                ForEach(PlayerControlMode.allCases, id: \.self) { mode in
                    Text(label(for: mode)).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityHint("Elegí manual, autónomo o híbrido para quién decide el movimiento en cada tick.")

            Toggle("Tiempo corre (tick auto ~1,8 s)", isOn: $worldAutoAdvance)
                .font(.caption)
                .accessibilityHint("Si está activado, el mundo avanza solo cada pocos segundos.")

            HStack(spacing: 10) {
                Text("Mover")
                    .font(.caption.weight(.semibold))
                    .accessibilityHidden(true)
                dPad
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Cruceta de movimiento")

            Button("Avanzar 1 tick") {
                session.advanceTick()
            }
            .buttonStyle(.bordered)
            .accessibilityHint("Avanza la simulación un paso sin esperar el temporizador.")

            agentList
        }
        .padding()
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Inventario") {
                    showInventoryRefuge = true
                }
                .accessibilityLabel("Inventario y refugio")
                .accessibilityHint("Nutrientes, fibra y craft en el refugio.")
            }
            ToolbarItem(placement: .primaryAction) {
                Button("Guardar / Cargar") {
                    showSaveLoad = true
                }
                .accessibilityLabel("Guardar o cargar partida")
                .accessibilityHint("Abrí la lista de archivos guardados en el dispositivo.")
            }
        }
        .sheet(isPresented: $showInventoryRefuge) {
            InventoryRefugeSheet(session: session)
        }
        .sheet(isPresented: $showSaveLoad) {
            SaveLoadView(
                makeSaveData: makeSaveData,
                onLoadSession: onLoadSession
            )
        }
        .onReceive(pulse) { _ in
            if worldAutoAdvance {
                session.advanceTick()
            }
        }
    }

    private func label(for mode: PlayerControlMode) -> String {
        switch mode {
        case .manual: "Manual"
        case .autonomous: "Autónomo"
        case .hybrid: "Híbrido"
        }
    }

    private var terrainLegend: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Leyenda de terreno")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: 118), spacing: 8, alignment: .leading)],
                alignment: .leading,
                spacing: 8
            ) {
                ForEach(TerrainSquareKind.allCases, id: \.self) { kind in
                    HStack(spacing: 8) {
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .fill(kind.mapSwiftUIColor)
                            .frame(width: 20, height: 20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 4, style: .continuous)
                                    .strokeBorder(.secondary.opacity(0.35), lineWidth: 0.5)
                            )
                            .accessibilityHidden(true)
                        Text(kind.mapLegendTitle)
                            .font(.caption)
                            .foregroundStyle(.primary)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Terreno: \(kind.mapLegendTitle)")
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(.quaternary.opacity(0.35), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Leyenda de terreno")
    }

    private var dPad: some View {
        VStack(spacing: 4) {
            Button {
                session.moveControlled(dx: 0, dy: -1)
            } label: {
                Image(systemName: "arrow.up.circle.fill").font(.title2)
            }
            .disabled(!manualPadEnabled)
            .accessibilityLabel("Mover arriba")
            HStack(spacing: 24) {
                Button {
                    session.moveControlled(dx: -1, dy: 0)
                } label: {
                    Image(systemName: "arrow.left.circle.fill").font(.title2)
                }
                .disabled(!manualPadEnabled)
                .accessibilityLabel("Mover a la izquierda")
                Button {
                    session.moveControlled(dx: 1, dy: 0)
                } label: {
                    Image(systemName: "arrow.right.circle.fill").font(.title2)
                }
                .disabled(!manualPadEnabled)
                .accessibilityLabel("Mover a la derecha")
            }
            Button {
                session.moveControlled(dx: 0, dy: 1)
            } label: {
                Image(systemName: "arrow.down.circle.fill").font(.title2)
            }
            .disabled(!manualPadEnabled)
            .accessibilityLabel("Mover abajo")
        }
    }

    private var manualPadEnabled: Bool {
        session.controlMode == .manual || session.controlMode == .hybrid
    }

    private var agentList: some View {
        List {
            Section {
                if session.agents.isEmpty {
                    ContentUnavailableView(
                        "Sin agentes en pantalla",
                        systemImage: "person.3.sequence",
                        description: Text("Si acabás de cargar un mundo, revisá el mapa; tocá un círculo de agente para asignar control.")
                    )
                    .frame(minHeight: 120)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Lista de agentes vacía. Tocá un agente en el mapa para asignar control.")
                } else {
                    ForEach(session.agents) { agent in
                        HStack(alignment: .center, spacing: 10) {
                            Circle()
                                .fill(Color(hue: agent.hue, saturation: 0.78, brightness: 0.92))
                                .frame(width: 10, height: 10)
                                .accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(agent.displayName)
                                    .font(.subheadline.weight(agent.id == session.controlledId ? .bold : .regular))
                                Text("(\(agent.position.x), \(agent.position.y)) · E \(agent.vitals.energy, format: .number.precision(.fractionLength(2))) · H \(agent.vitals.hunger, format: .number.precision(.fractionLength(2)))")
                                    .font(.caption2.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel(agentAccessibilitySummary(agent))
                    }
                }
            } header: {
                Text("Agentes (tocá el mapa para controlar)")
            }
        }
        .listStyle(.plain)
        .frame(minHeight: 160, maxHeight: 220)
    }

    private func agentAccessibilitySummary(_ agent: V2GridAgent) -> String {
        let role = agent.id == session.controlledId ? "Agente bajo control: " : "Agente: "
        let e = agent.vitals.energy.formatted(.number.precision(.fractionLength(2)))
        let h = agent.vitals.hunger.formatted(.number.precision(.fractionLength(2)))
        return "\(role)\(agent.displayName). Posición \(agent.position.x) coma \(agent.position.y). Energía \(e). Hambre \(h)."
    }
}

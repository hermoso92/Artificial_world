import AWAgent
import AWDomain
import SwiftUI

/// Pantalla principal de juego: refugio / exploración, encuentro y captura (SwiftUI; sin SpriteKit en esta fase).
struct WorldSceneView: View {
    @Bindable var session: WorldSessionModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    gameHeader
                    statusBanner
                    sceneCanvas
                        .frame(height: 240)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    vitalsStrip
                    explorationControls
                    primaryButtons
                    if !session.lastCaptureMessage.isEmpty {
                        Text(session.lastCaptureMessage)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                            .padding(.vertical, 4)
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Artificial World")
            .navigationBarTitleDisplayMode(.inline)
            .sensoryFeedback(.success, trigger: session.sensoryCaptureSuccessCount)
            .sensoryFeedback(.error, trigger: session.sensoryCaptureRejectCount)
            .sensoryFeedback(.impact(weight: .light, intensity: 0.85), trigger: session.sensoryCaptureMissCount)
        }
    }

    private var gameHeader: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text(session.presence == .insideRefuge ? "En casa" : "En expedición")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text("\(session.activeZone.raw)")
                    .font(.title3.weight(.bold))
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("Puntos")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text("\(session.score)")
                    .font(.title2.weight(.heavy).monospacedDigit())
                    .foregroundStyle(.primary)
            }
        }
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private var statusBanner: some View {
        if !session.statusBanner.isEmpty {
            Text(session.statusBanner)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    @ViewBuilder
    private var sceneCanvas: some View {
        switch session.presence {
        case .insideRefuge:
            refugeScene
        case let .exploring(zone):
            exploringScene(zone: zone)
        }
    }

    private var refugeScene: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.35, green: 0.22, blue: 0.12), Color(red: 0.55, green: 0.38, blue: 0.22)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            VStack(spacing: 12) {
                Image(systemName: "house.fill")
                    .font(.system(size: 56))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(.white.opacity(0.95))
                Text("Refugio")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(.white)
                Text("Descanso · inventario · mejoras")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Dentro del refugio")
    }

    private func exploringScene(zone: ZoneID) -> some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                colors: [Color(red: 0.45, green: 0.65, blue: 0.92), Color(red: 0.2, green: 0.45, blue: 0.35)],
                startPoint: .top,
                endPoint: .bottom
            )
            VStack(alignment: .leading, spacing: 16) {
                Text(zone.raw)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .shadow(radius: 2)
                if let arch = session.pendingEncounter {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(archetypeColor(arch).opacity(0.4))
                                .frame(width: 72, height: 72)
                            Image(systemName: "square.fill")
                                .font(.system(size: 28))
                                .foregroundStyle(.white)
                                .symbolEffect(.pulse, options: .repeating, value: arch)
                        }
                        .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Cuadrado")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.white.opacity(0.9))
                            Text(arch.rawValue.capitalized)
                                .font(.title3.weight(.bold))
                                .foregroundStyle(.white)
                        }
                    }
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Sin encuentro")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.85))
                        Button("Generar encuentro") {
                            session.rollSpawnEncounter()
                            session.persistNow()
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.white.opacity(0.35))
                    }
                }
                Spacer(minLength: 0)
                distanceTrack
            }
            .padding(16)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Explorando \(zone.raw)")
    }

    private var distanceTrack: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let maxD: CGFloat = 30
            let p = CGFloat(session.proximityToTarget / maxD).clamped(to: 0 ... 1)
            // Cerca del objetivo = p bajo → jugador a la derecha
            let playerX = w * (1 - p) * 0.85 + w * 0.075

            ZStack(alignment: .leading) {
                Capsule()
                    .fill(.white.opacity(0.35))
                    .frame(height: 10)
                Circle()
                    .fill(.white)
                    .frame(width: 22, height: 22)
                    .shadow(radius: 2)
                    .offset(x: playerX - 11, y: -6)
                if let arch = session.pendingEncounter {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(archetypeColor(arch).opacity(0.95))
                        .frame(width: 28, height: 28)
                        .overlay {
                            Image(systemName: "square.fill")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.9))
                        }
                        .offset(x: w - 44, y: -9)
                }
            }
            .frame(height: 36)
        }
        .frame(height: 40)
        .accessibilityLabel("Distancia al encuentro, \(session.proximityToTarget, format: .number.precision(.fractionLength(1)))")
    }

    private var vitalsStrip: some View {
        HStack(spacing: 16) {
            vitalChip(title: "Energía", value: session.vitals.energy, tint: .green)
            vitalChip(title: "Hambre", value: session.vitals.hunger, tint: .orange)
            VStack(alignment: .leading, spacing: 4) {
                Text("Instinto")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(session.lastDirective.rawValue)
                    .font(.caption.weight(.medium))
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func vitalChip(title: String, value: Double, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
            ProgressView(value: value)
                .tint(tint)
            Text(value, format: .number.precision(.fractionLength(2)))
                .font(.caption.monospacedDigit())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var explorationControls: some View {
        if case .exploring = session.presence {
            VStack(alignment: .leading, spacing: 8) {
                Text("Acercate al cuadrado: deslizá a la derecha para estar más cerca.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Slider(
                    value: $session.proximityToTarget,
                    in: 0 ... 30,
                    step: 0.5
                ) {
                    Text("Distancia")
                }
                .onChange(of: session.proximityToTarget) { _, _ in
                    session.persistNow()
                }
            }
        }
    }

    private var primaryButtons: some View {
        VStack(spacing: 12) {
            switch session.presence {
            case .insideRefuge:
                Button {
                    session.leaveRefuge()
                } label: {
                    Label("Salir de expedición", systemImage: "figure.walk")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            case .exploring:
                HStack(spacing: 12) {
                    Button {
                        session.enterRefuge()
                    } label: {
                        Label("Volver", systemImage: "house.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    Button {
                        session.attemptCapturePending()
                    } label: {
                        Label("¡Capturar!", systemImage: "hand.draw.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(session.pendingEncounter == nil)
                }
            }
            HStack {
                Text("Ciclo \(session.worldTick)")
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.tertiary)
                Spacer()
                if session.controlMode != .manual {
                    Text(session.controlMode == .autonomous ? "Autónomo" : "Híbrido")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.tertiary)
                }
            }
        }
    }

    private func archetypeColor(_ arch: SquareArchetype) -> Color {
        switch arch {
        case .common: .gray
        case .fast: .cyan
        case .rare: .purple
        case .hostile: .red
        case .nourishing: .green
        }
    }
}

private extension CGFloat {
    func clamped(to range: ClosedRange<CGFloat>) -> CGFloat {
        Swift.min(Swift.max(self, range.lowerBound), range.upperBound)
    }
}

#Preview {
    WorldSceneView(session: WorldSessionModel(enableSQLite: false))
}

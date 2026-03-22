import AWAgent
import AWDomain
import Combine
import SwiftUI
import UIKit

struct ContentView: View {
    @State private var session = WorldSessionModel()
    @State private var jwtBootstrapSecret = ""
    private let autonomousTimer = Timer.publish(every: 2, on: .main, in: .common).autoconnect()

    var body: some View {
        TabView {
            WorldSceneView(session: session)
                .tabItem { Label("Aventura", systemImage: "leaf.fill") }

            SimulationPanelView(session: session, jwtBootstrapSecret: $jwtBootstrapSecret)
                .tabItem { Label("Diario", systemImage: "book.pages.fill") }
        }
        .onAppear {
            session.recomputeDirective()
        }
        .onReceive(autonomousTimer) { _ in
            session.autonomousPulse()
        }
    }
}

/// Listado detallado: bioma, sync, JWT, memoria, etc.
private struct SimulationPanelView: View {
    @Bindable var session: WorldSessionModel
    @Binding var jwtBootstrapSecret: String

    var body: some View {
        NavigationStack {
            List {
                Section("Flujo") {
                    Text(flowHint)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if !session.statusBanner.isEmpty {
                        Text(session.statusBanner)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Estado") {
                    LabeledContent("Energía") {
                        Text(session.vitals.energy, format: .number.precision(.fractionLength(2)))
                    }
                    LabeledContent("Hambre") {
                        Text(session.vitals.hunger, format: .number.precision(.fractionLength(2)))
                    }
                    if session.vitals.needsRefugeSoon {
                        Text("Necesitas refugio pronto")
                            .foregroundStyle(.orange)
                    }
                }

                Section("Presencia") {
                    switch session.presence {
                    case .insideRefuge:
                        Text("Dentro del refugio")
                    case let .exploring(zone):
                        Text("Explorando: \(zone.raw)")
                    }
                    Picker("Control", selection: $session.controlMode) {
                        ForEach(PlayerControlMode.allCases, id: \.self) { mode in
                            Text(mode.rawValue.capitalized).tag(mode)
                        }
                    }
                    .onChange(of: session.controlMode) { _, _ in
                        session.onControlModeChanged()
                    }
                    if session.controlMode == .autonomous {
                        Text("Modo autónomo: la simulación avanza sola cada 2 s.")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if session.controlMode == .hybrid {
                        Text("Híbrido: la IA solo fuerza refugio si hay peligro o vitales críticos.")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Bioma \(session.activeZone.raw)") {
                    Text("Tabla de spawn (pesos)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    ForEach(session.spawnProfile.weightedArchetypes, id: \.archetype) { row in
                        HStack {
                            Text(row.archetype.rawValue.capitalized)
                            Spacer()
                            Text("\(row.weight)")
                                .foregroundStyle(.secondary)
                        }
                        .font(.caption)
                    }
                    if let pending = session.pendingEncounter {
                        LabeledContent("Encuentro pendiente") {
                            Text(pending.rawValue.capitalized)
                        }
                    }
                    Button("Re-lanzar encuentro") {
                        session.rollSpawnEncounter()
                        session.statusBanner = "Nuevo encuentro: \(session.pendingEncounter?.rawValue ?? "?")"
                        session.persistNow()
                    }
                    .disabled(session.presence == .insideRefuge)
                }

                Section("Instinto") {
                    Text("Impulso: \(session.lastDirective.rawValue)")
                    Button("Recalcular impulso") {
                        session.recomputeDirective()
                        session.persistNow()
                    }
                }

                Section("Exploración") {
                    Slider(
                        value: $session.proximityToTarget,
                        in: 0 ... 30,
                        step: 0.5
                    ) {
                        Text("Proximidad al objetivo")
                    }
                    .onChange(of: session.proximityToTarget) { _, _ in
                        session.persistNow()
                    }
                    Text("Distancia simulada: \(session.proximityToTarget, format: .number.precision(.fractionLength(1)))")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Button("Tick de simulación") {
                        session.tickSimulation()
                    }

                    Button("Salir a explorar") {
                        session.leaveRefuge()
                    }
                    .disabled(session.presence != .insideRefuge)

                    Button("Volver al refugio") {
                        session.enterRefuge()
                    }
                    .disabled(session.presence == .insideRefuge)
                }

                Section("Interacción (dominio)") {
                    Text(session.lastCaptureMessage)
                        .font(.caption)
                    Button("Capturar encuentro pendiente") {
                        session.attemptCapturePending()
                    }
                    .disabled(session.pendingEncounter == nil || session.presence == .insideRefuge)
                    Menu("Capturar arquetipo…") {
                        ForEach(SquareArchetype.allCases, id: \.self) { arch in
                            Button(arch.rawValue.capitalized) {
                                session.attemptCapture(archetype: arch)
                            }
                        }
                    }
                    .disabled(session.presence == .insideRefuge)
                }

                Section("Inventario y refugio") {
                    LabeledContent("Fibras") {
                        Text("\(session.inventory.fiberScraps)")
                    }
                    LabeledContent("Nutrientes") {
                        Text("\(session.inventory.nutrientPackets)")
                    }
                    LabeledContent("Descanso refugio") {
                        Text("×\(session.refugeImprovements.restRecoveryMultiplier, format: .number.precision(.fractionLength(2)))")
                    }
                    Button("Recoger fibra (+1)") {
                        session.gatherFiberScrap()
                    }
                    Button("Mejorar descanso (3 fibras)") {
                        session.upgradeRestIfPossible()
                    }
                    .disabled(session.inventory.fiberScraps < 3 || session.refugeImprovements.restEfficiencyRank >= 3)
                }

                Section("Memoria (agente)") {
                    LabeledContent("Última salida refugio (tick)") {
                        Text("\(session.agentMemorySummary.lastRefugeExitTick)")
                    }
                    if session.agentMemorySummary.notableEvents.isEmpty {
                        Text("Sin eventos aún")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(
                            Array(session.agentMemorySummary.notableEvents.suffix(5).enumerated()),
                            id: \.offset
                        ) { _, line in
                            Text(line)
                                .font(.caption2)
                        }
                    }
                }

                Section("Plataforma (sync / Fase 4)") {
                    LabeledContent("Eventos pendientes") {
                        Text("\(session.pendingTelemetryCount)")
                    }
                    LabeledContent("JWT en dispositivo") {
                        Text(session.hasNativeJwtStored ? "Sí" : "No")
                    }
                    SecureField("Bootstrap (opcional, x-aw-bootstrap-secret)", text: $jwtBootstrapSecret)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                    Button("Obtener JWT (login)") {
                        let secret = jwtBootstrapSecret.trimmingCharacters(in: .whitespacesAndNewlines)
                        Task {
                            await session.loginForNativeJwt(
                                bootstrapSecret: secret.isEmpty ? nil : secret
                            )
                        }
                    }
                    .disabled(session.nativeJwtLoginInProgress)
                    Button("Cerrar sesión (servidor + local)") {
                        Task { await session.logoutNativeJwtFully() }
                    }
                    .disabled(!session.hasNativeJwtStored || session.nativeJwtLogoutInProgress)
                    Button("Borrar JWT local") {
                        session.clearNativeJwtToken()
                    }
                    .disabled(!session.hasNativeJwtStored)
                    if let jwterr = session.lastNativeJwtLoginError, !jwterr.isEmpty {
                        Text(jwterr)
                            .font(.caption2)
                            .foregroundStyle(.red)
                    }
                    if let jwout = session.lastNativeJwtLogoutError, !jwout.isEmpty {
                        Text(jwout)
                            .font(.caption2)
                            .foregroundStyle(.red)
                    }
                    Text("Sobre JSON `SyncEnvelopeV1` con `organizationId` / `worldId` opcionales (DobackSoft-ready).")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    if let err = session.lastSyncUploadError, !err.isEmpty {
                        Text(err)
                            .font(.caption2)
                            .foregroundStyle(.red)
                    }
                    Button("Enviar lote al backend") {
                        Task { await session.uploadPendingSyncBatch() }
                    }
                    .disabled(session.pendingTelemetryCount == 0 || session.syncUploadInProgress)
                    Button("Copiar lote JSON al portapapeles") {
                        if let json = session.exportPendingSyncEnvelopeJSON() {
                            UIPasteboard.general.string = json
                            session.statusBanner = "JSON copiado (\(json.count) caracteres)"
                        }
                    }
                    .disabled(session.pendingTelemetryCount == 0)
                    Button("Marcar lote como enviado (simulación)") {
                        session.markTelemetryBatchSent()
                        session.statusBanner = "Cola: lote marcado enviado"
                    }
                    .disabled(session.pendingTelemetryCount == 0)
                }

                Section("Progreso") {
                    LabeledContent("Tick mundo") {
                        Text("\(session.worldTick)")
                    }
                    LabeledContent("Puntuación") {
                        Text("\(session.score)")
                    }
                    Button("Reiniciar sesión (borra guardado)") {
                        session.resetSession()
                    }
                    .foregroundStyle(.red)
                }
            }
            .navigationTitle("Diario")
        }
    }

    private var flowHint: String {
        switch session.presence {
        case .insideRefuge:
            return "Tu refugio es seguro: descansá, mejorá el descanso con fibras y salí cuando quieras explorar el borde salvaje."
        case .exploring:
            return "Acechá el cuadrado: acercate con el deslizador, capturá para sumar puntos y fibras, y volvé antes de que te agoten energía y hambre."
        }
    }
}

#Preview {
    ContentView()
}

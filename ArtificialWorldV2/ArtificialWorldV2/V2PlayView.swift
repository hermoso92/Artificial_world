import AWAgent
import AWDomain
import Combine
import SwiftUI
import UIKit

/// Partida: mapa dominante con controles flotantes, tap en agente abre perfil.
struct V2PlayView: View {
    @Bindable var session: V2WorldSession
    let makeSaveData: () -> WorldSaveData
    let onLoadSession: (V2WorldSession) -> Void
    let onStartNewGame: (TerrainBiomeDefinition) -> Void

    @State private var music = GameMusicController()
    @State private var sfx = GameSFXController()
    @StateObject private var autoTick = AutoTickDriver()

    private let hapticMoveOK = UIImpactFeedbackGenerator(style: .light)
    private let hapticMoveBlocked = UIImpactFeedbackGenerator(style: .rigid)
    private let hapticTickStep = UIImpactFeedbackGenerator(style: .medium)
    private let hapticPauseToggle = UIImpactFeedbackGenerator(style: .soft)
    private let hapticSuccess = UIImpactFeedbackGenerator(style: .medium)
    private let hapticActionFailed = UIImpactFeedbackGenerator(style: .heavy)
    @State private var showSaveLoad = false
    @State private var showNewGame = false
    @State private var confirmNewGameDiscard = false
    @State private var showInventoryRefuge = false
    @State private var showTerrainLegend = false
    @State private var showQuickHelp = false

    var body: some View {
        ZStack(alignment: .bottom) {
            // Main map (dominates the screen)
            VStack(spacing: 0) {
                statusBar
                    .padding(.horizontal)
                    .padding(.top, 4)

                GridMapCanvas(session: session)
                    .padding(.horizontal, 4)
                    .padding(.top, 4)
            }

            // Floating controls at bottom
            floatingControls
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    showQuickHelp = true
                } label: {
                    Image(systemName: "questionmark.circle")
                }
                .accessibilityLabel(String(localized: "help.toolbar.a11y"))
            }
            ToolbarItem(placement: .automatic) {
                Button(String(localized: "play.toolbar.new_game")) {
                    if session.worldTick > 0 {
                        confirmNewGameDiscard = true
                    } else {
                        showNewGame = true
                    }
                }
            }
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showQuickHelp = true
                    } label: {
                        Label(String(localized: "help.menu.quick"), systemImage: "questionmark.circle")
                    }
                    Divider()
                    Button {
                        showInventoryRefuge = true
                    } label: {
                        Label(String(localized: "play.menu.inventory"), systemImage: "bag.fill")
                    }
                    Button {
                        showSaveLoad = true
                    } label: {
                        Label(String(localized: "play.menu.save_load"), systemImage: "square.and.arrow.down")
                    }
                    Button {
                        showTerrainLegend.toggle()
                    } label: {
                        Label(String(localized: "play.menu.terrain_legend"), systemImage: "map")
                    }
                    Divider()
                    Toggle(
                        isOn: Binding(
                            get: { music.isEnabled },
                            set: { music.setMusicEnabled($0) }
                        )
                    ) {
                        Text(String(localized: "play.menu.music_toggle"))
                    }
                    .disabled(!music.canPlayAmbient)
                    .help(
                        music.canPlayAmbient
                            ? String(localized: "play.menu.music_help_available")
                            : String(localized: "play.menu.music_help_missing")
                    )
                    if music.canPlayAmbient {
                        HStack {
                            Text(String(localized: "play.menu.volume"))
                            Slider(
                                value: Binding(
                                    get: { Double(music.volume) },
                                    set: { music.setVolume(Float($0)) }
                                ),
                                in: 0...1
                            )
                            .frame(maxWidth: 180)
                        }
                    }
                    Toggle(
                        isOn: Binding(
                            get: { sfx.isEnabled },
                            set: { sfx.setSFXEnabled($0) }
                        )
                    ) {
                        Text(String(localized: "play.menu.sfx_toggle"))
                    }
                    .help(String(localized: "play.menu.sfx_help"))
                    Picker(selection: $session.controlMode) {
                        ForEach(PlayerControlMode.allCases, id: \.self) { mode in
                            Text(label(for: mode)).tag(mode)
                        }
                    } label: {
                        Text(String(localized: "play.menu.control_mode_picker"))
                    }
                    Picker(
                        selection: Binding(
                            get: { autoTick.intervalSeconds },
                            set: { autoTick.setIntervalSeconds($0) }
                        )
                    ) {
                        ForEach(AutoTickDriver.intervalPresets, id: \.self) { sec in
                            Text(Self.tickSpeedLabel(for: sec)).tag(sec)
                        }
                    } label: {
                        Text(String(localized: "play.menu.autotick_speed_picker"))
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showQuickHelp) {
            QuickControlsHelpSheet()
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
        .sheet(isPresented: $showTerrainLegend) {
            terrainLegendSheet
        }
        .sheet(item: $session.profileSheetRoute) { route in
            AgentProfileSheet(
                session: session,
                agentId: route.id,
                onTakeControl: {
                    session.selectAgent(id: route.id)
                    session.profileSheetRoute = nil
                },
                onDismiss: {
                    session.profileSheetRoute = nil
                }
            )
        }
        .confirmationDialog(
            String(localized: "play.newgame.confirm_title"),
            isPresented: $confirmNewGameDiscard,
            titleVisibility: .visible
        ) {
            Button(String(localized: "play.newgame.discard_confirm"), role: .destructive) {
                showNewGame = true
            }
            Button(String(localized: "Cancelar"), role: .cancel) {}
        } message: {
            Text(
                String(
                    format: String(localized: "play.newgame.discard_message_fmt"),
                    locale: .current,
                    session.worldTick
                )
            )
        }
        .sheet(isPresented: $showNewGame) {
            NewGameSheet { profile in
                onStartNewGame(profile)
            }
        }
        .onAppear {
            music.prepareForPlay()
            hapticMoveOK.prepare()
            hapticMoveBlocked.prepare()
            hapticTickStep.prepare()
            hapticPauseToggle.prepare()
            hapticSuccess.prepare()
            hapticActionFailed.prepare()
            autoTick.configure(advance: { session.advanceTick() })
        }
        .onChange(of: ObjectIdentifier(session)) { _, _ in
            autoTick.configure(advance: { session.advanceTick() })
        }
        .onReceive(NotificationCenter.default.publisher(for: .awGamePickupFiber)) { note in
            guard pickupNoteMatchesControlled(note) else { return }
            sfx.playFiberPickup()
        }
        .onReceive(NotificationCenter.default.publisher(for: .awGamePickupNutrient)) { note in
            guard pickupNoteMatchesControlled(note) else { return }
            sfx.playNutrientPickup()
        }
        .onReceive(NotificationCenter.default.publisher(for: .awGameControlledSuccess)) { _ in
            hapticSuccess.prepare()
            hapticSuccess.impactOccurred()
            sfx.playControlledSuccess()
        }
        .onReceive(NotificationCenter.default.publisher(for: .awGameControlledFailure)) { _ in
            hapticActionFailed.prepare()
            hapticActionFailed.impactOccurred()
            sfx.playControlledFailure()
        }
    }

    private var autoTickStatusLine: String {
        if autoTick.isAutoEnabled {
            let s = autoTick.intervalSeconds
            let intervalLabel = Self.formattedTickSeconds(s)
            return String(
                format: String(localized: "play.autotick.status_active_fmt"),
                locale: .current,
                intervalLabel
            )
        }
        return String(localized: "play.autotick.status_paused")
    }

    private static func formattedTickSeconds(_ s: Double) -> String {
        switch s {
        case 0.9: return "0.9s"
        case 1.8: return "1.8s"
        case 3.0: return "3s"
        default: return String(format: "%.1fs", s)
        }
    }

    private static func tickSpeedLabel(for seconds: Double) -> String {
        switch seconds {
        case 0.9: String(localized: "play.autotick.preset_fast")
        case 1.8: String(localized: "play.autotick.preset_normal")
        case 3.0: String(localized: "play.autotick.preset_slow")
        default: String(format: "%.1fs", seconds)
        }
    }

    private func pickupNoteMatchesControlled(_ note: Notification) -> Bool {
        guard let s = note.userInfo?["agentId"] as? String else { return false }
        return s == session.controlledId.uuidString
    }

    // MARK: - Status Bar (compact)

    private var statusBar: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 3) {
                Text(
                    String(
                        format: String(localized: "play.tick_fmt"),
                        locale: .current,
                        session.worldTick
                    )
                )
                    .font(.subheadline.monospacedDigit().bold())
                Text(
                    String(
                        format: String(localized: "play.status.terrain_mode_fmt"),
                        locale: .current,
                        session.terrainProfile.localizedDisplayName,
                        label(for: session.controlMode)
                    )
                )
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(autoTickStatusLine)
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(autoTick.isAutoEnabled ? .secondary : .tertiary)
                Text(session.statusMessage)
                    .font(.caption2)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)
                if let hint = session.controlledProximityHint {
                    Text(hint)
                        .font(.caption2)
                        .foregroundStyle(
                            hint.hasPrefix(String(localized: "session.proximity.high_prefix"))
                                ? .orange
                                : .secondary
                        )
                }
                if let c = session.controlledAgent {
                    let fiberTarget = session.softFiberGoalTarget
                    let fib = c.inventory.fiberScraps
                    Text(
                        String(
                            format: String(localized: "play.status.goal_fiber_fmt"),
                            locale: .current,
                            fib,
                            fiberTarget
                        )
                    )
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(fib >= fiberTarget ? .green : .secondary)
                    let nutTarget = session.softNutrientGoalTarget
                    let nut = c.inventory.nutrientPackets
                    Text(
                        String(
                            format: String(localized: "play.status.goal_nutrient_fmt"),
                            locale: .current,
                            nut,
                            nutTarget
                        )
                    )
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(nut >= nutTarget ? .green : .secondary)
                }
                if let line = session.controlledLatestNotableActivityLine {
                    Text(
                        String(
                            format: String(localized: "play.status.last_notable_fmt"),
                            locale: .current,
                            line
                        )
                    )
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                }
            }

            Spacer()

            if let warn = session.autosaveWarning {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                    .help(warn)
            }
        }
    }

    // MARK: - Floating Controls

    private var floatingControls: some View {
        HStack(spacing: 12) {
            // Auto-advance toggle
            Button {
                hapticPauseToggle.prepare()
                autoTick.toggleAutoEnabled()
                hapticPauseToggle.impactOccurred()
            } label: {
                Image(systemName: autoTick.isAutoEnabled ? "pause.circle.fill" : "play.circle.fill")
                    .font(.title)
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(autoTick.isAutoEnabled ? .green : .secondary)
            }
            .accessibilityLabel(
                autoTick.isAutoEnabled
                    ? String(localized: "play.a11y.pause_autotick")
                    : String(localized: "play.a11y.resume_autotick")
            )

            // Advance 1 tick
            Button {
                hapticTickStep.prepare()
                session.advanceTick()
                hapticTickStep.impactOccurred()
            } label: {
                Image(systemName: "forward.frame.fill")
                    .font(.title2)
                    .symbolRenderingMode(.hierarchical)
            }
            .accessibilityLabel(String(localized: "play.a11y.advance_one_tick"))

            Spacer()

            // D-pad (compact)
            if manualPadEnabled {
                compactDPad
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 8)
        .padding(.bottom, 4)
    }

    private var compactDPad: some View {
        HStack(spacing: 6) {
            dpadButton(dx: -1, dy: 0, systemName: "arrow.left.circle.fill", accessibilityLabel: String(localized: "play.a11y.move_west"))
            VStack(spacing: 6) {
                dpadButton(dx: 0, dy: -1, systemName: "arrow.up.circle.fill", accessibilityLabel: String(localized: "play.a11y.move_north"))
                dpadButton(dx: 0, dy: 1, systemName: "arrow.down.circle.fill", accessibilityLabel: String(localized: "play.a11y.move_south"))
            }
            dpadButton(dx: 1, dy: 0, systemName: "arrow.right.circle.fill", accessibilityLabel: String(localized: "play.a11y.move_east"))
        }
        .symbolRenderingMode(.hierarchical)
    }

    private func dpadButton(dx: Int, dy: Int, systemName: String, accessibilityLabel: String) -> some View {
        Button {
            hapticMoveOK.prepare()
            hapticMoveBlocked.prepare()
            if session.moveControlled(dx: dx, dy: dy) {
                hapticMoveOK.impactOccurred()
            } else {
                hapticMoveBlocked.impactOccurred()
            }
        } label: {
            Image(systemName: systemName)
                .font(.system(size: 34, weight: .semibold))
                .frame(minWidth: 48, minHeight: 48)
                .contentShape(Rectangle())
        }
        .buttonStyle(.bordered)
        .tint(.primary)
        .accessibilityLabel(accessibilityLabel)
    }

    // MARK: - Terrain Legend Sheet

    private var terrainLegendSheet: some View {
        NavigationStack {
            List {
                ForEach(TerrainSquareKind.allCases, id: \.self) { kind in
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .fill(kind.mapSwiftUIColor)
                            .frame(width: 28, height: 28)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6, style: .continuous)
                                    .strokeBorder(.secondary.opacity(0.3), lineWidth: 0.5)
                            )
                        Text(kind.mapLegendTitle)
                            .font(.body)
                    }
                }
            }
            .navigationTitle(String(localized: "play.terrain_legend.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Cerrar")) { showTerrainLegend = false }
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - Helpers

    private var manualPadEnabled: Bool {
        session.controlMode == .manual || session.controlMode == .hybrid
    }

    private func label(for mode: PlayerControlMode) -> String {
        switch mode {
        case .manual: String(localized: "play.control_mode.manual")
        case .autonomous: String(localized: "play.control_mode.autonomous")
        case .hybrid: String(localized: "play.control_mode.hybrid")
        }
    }
}

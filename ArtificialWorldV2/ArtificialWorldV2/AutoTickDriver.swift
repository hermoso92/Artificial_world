import Combine
import Foundation

/// Temporizador del avance automático de ticks. Intervalo siempre en presets **0.9 / 1.8 / 3.0** (persistido normalizado).
@MainActor
final class AutoTickDriver: ObservableObject {
    private static var intervalKey: String { GamePreferences.Keys.autoTickSeconds }
    private static var autoEnabledKey: String { GamePreferences.Keys.autoTickEnabled }

    /// Valores oficiales del picker (cualquier valor guardado viejo se redondea al más cercano).
    static let intervalPresets: [Double] = [0.9, 1.8, 3.0]

    /// Si el mundo avanza solo al ritmo del temporizador.
    @Published var isAutoEnabled: Bool

    /// Segundos entre ticks automáticos (siempre uno de `intervalPresets`).
    @Published private(set) var intervalSeconds: Double

    private var cancellable: AnyCancellable?
    private var onAdvance: () -> Void = {}

    init() {
        if UserDefaults.standard.object(forKey: Self.autoEnabledKey) != nil {
            isAutoEnabled = UserDefaults.standard.bool(forKey: Self.autoEnabledKey)
        } else {
            isAutoEnabled = true
        }

        let stored = UserDefaults.standard.object(forKey: Self.intervalKey) as? Double
        let normalized = Self.nearestPreset(to: Self.clampInterval(stored ?? 1.8))
        intervalSeconds = normalized
        if abs((stored ?? -1) - normalized) > 0.001 {
            UserDefaults.standard.set(normalized, forKey: Self.intervalKey)
        }
    }

    func configure(advance: @escaping () -> Void) {
        onAdvance = advance
        reschedule()
    }

    func setIntervalSeconds(_ raw: Double) {
        let v = Self.nearestPreset(to: Self.clampInterval(raw))
        guard abs(v - intervalSeconds) > 0.001 else { return }
        intervalSeconds = v
        UserDefaults.standard.set(v, forKey: Self.intervalKey)
        reschedule()
    }

    func toggleAutoEnabled() {
        isAutoEnabled.toggle()
        UserDefaults.standard.set(isAutoEnabled, forKey: Self.autoEnabledKey)
    }

    private func reschedule() {
        cancellable?.cancel()
        cancellable = Timer.publish(
            every: intervalSeconds,
            tolerance: min(intervalSeconds * 0.1, 0.35),
            on: .main,
            in: .common
        )
        .autoconnect()
        .sink { [weak self] _ in
            guard let self, self.isAutoEnabled else { return }
            self.onAdvance()
        }
    }

    private static func clampInterval(_ v: Double) -> Double {
        min(4, max(0.6, v))
    }

    private static func nearestPreset(to v: Double) -> Double {
        intervalPresets.min(by: { abs($0 - v) < abs($1 - v) })!
    }
}

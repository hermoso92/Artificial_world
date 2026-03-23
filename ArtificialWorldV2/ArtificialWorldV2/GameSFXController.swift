import AVFoundation
import Foundation
import Observation

/// Efectos cortos opcionales. Bundle: `SFX_Fiber`, `SFX_Nutrient`, `SFX_Confirm`, `SFX_Fail` (fallos suaves).
@Observable
@MainActor
final class GameSFXController {
    private static var enabledKey: String { GamePreferences.Keys.sfxEnabled }

    private var fiberPlayer: AVAudioPlayer?
    private var nutrientPlayer: AVAudioPlayer?
    private var confirmPlayer: AVAudioPlayer?
    private var failPlayer: AVAudioPlayer?

    var isEnabled: Bool

    init() {
        if UserDefaults.standard.object(forKey: Self.enabledKey) != nil {
            isEnabled = UserDefaults.standard.bool(forKey: Self.enabledKey)
        } else {
            isEnabled = true
        }
        fiberPlayer = Self.loadPlayer(baseNames: ["SFX_Fiber", "pickup_fiber", "fiber"])
        nutrientPlayer = Self.loadPlayer(baseNames: ["SFX_Nutrient", "pickup_nutrient", "nutrient"])
        confirmPlayer = Self.loadPlayer(baseNames: ["SFX_Confirm", "SFX_Success", "SFX_Craft", "success", "confirm"])
        failPlayer = Self.loadPlayer(baseNames: ["SFX_Fail", "SFX_Error", "error", "fail", "deny"])
        failPlayer?.volume = min(0.4, failPlayer?.volume ?? 1)
    }

    func setSFXEnabled(_ value: Bool) {
        isEnabled = value
        UserDefaults.standard.set(value, forKey: Self.enabledKey)
    }

    func playFiberPickup() {
        play(fiberPlayer)
    }

    func playNutrientPickup() {
        play(nutrientPlayer)
    }

    /// Craft en refugio o comer nutriente manual (misma pista si no tenés una aparte).
    func playControlledSuccess() {
        play(confirmPlayer)
    }

    /// Craft/consumo fallido (pista cargada con volumen bajo).
    func playControlledFailure() {
        play(failPlayer)
    }

    private func play(_ player: AVAudioPlayer?) {
        guard isEnabled, let player else { return }
        player.stop()
        player.currentTime = 0
        player.play()
    }

    private static func loadPlayer(baseNames: [String]) -> AVAudioPlayer? {
        let exts = ["m4a", "caf", "wav", "mp3"]
        for base in baseNames {
            for ext in exts {
                guard let url = Bundle.main.url(forResource: base, withExtension: ext) else { continue }
                if let p = try? AVAudioPlayer(contentsOf: url) {
                    p.prepareToPlay()
                    return p
                }
            }
        }
        return nil
    }
}

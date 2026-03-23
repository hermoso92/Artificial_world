import AVFoundation
import Foundation
import Observation

/// Música ambiental opcional. Añadí al target un archivo `AWAmbient.m4a` (o `.mp3`) en el bundle; si no existe, el toggle queda deshabilitado.
@Observable
@MainActor
final class GameMusicController {
    private static var userDefaultsKey: String { GamePreferences.Keys.musicEnabled }
    private static var volumeKey: String { GamePreferences.Keys.musicVolume }

    private var player: AVAudioPlayer?

    /// `true` si hay pista en el bundle y se pudo cargar el reproductor.
    private(set) var canPlayAmbient: Bool = false

    var isEnabled: Bool

    /// Volumen 0…1 del loop ambiental (persistido).
    private(set) var volume: Float

    init() {
        if UserDefaults.standard.object(forKey: Self.userDefaultsKey) == nil {
            UserDefaults.standard.set(true, forKey: Self.userDefaultsKey)
        }
        isEnabled = UserDefaults.standard.bool(forKey: Self.userDefaultsKey)
        let storedVol = UserDefaults.standard.object(forKey: Self.volumeKey) as? Double
        volume = Float(min(1, max(0, storedVol ?? 0.55)))
        configureSession()
        loadAmbientTrack()
        syncPlayback()
    }

    func setMusicEnabled(_ enabled: Bool) {
        isEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: Self.userDefaultsKey)
        syncPlayback()
    }

    func setVolume(_ v: Float) {
        let c = min(1, max(0, v))
        volume = c
        UserDefaults.standard.set(Double(c), forKey: Self.volumeKey)
        player?.volume = c
    }

    func prepareForPlay() {
        player?.volume = volume
        syncPlayback()
    }

    private func configureSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            canPlayAmbient = false
        }
    }

    private func loadAmbientTrack() {
        let names = ["AWAmbient", "ambient", "bgm"]
        let exts = ["m4a", "mp3", "aac"]
        var url: URL?
        for name in names {
            for ext in exts {
                if let u = Bundle.main.url(forResource: name, withExtension: ext) {
                    url = u
                    break
                }
            }
            if url != nil { break }
        }
        guard let url else {
            player = nil
            canPlayAmbient = false
            return
        }
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = -1
            p.volume = volume
            p.prepareToPlay()
            player = p
            canPlayAmbient = true
        } catch {
            player = nil
            canPlayAmbient = false
        }
    }

    private func syncPlayback() {
        guard canPlayAmbient, let player else { return }
        player.volume = volume
        if isEnabled {
            if !player.isPlaying {
                player.play()
            }
        } else {
            player.pause()
        }
    }
}

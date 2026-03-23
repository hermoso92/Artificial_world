import Foundation

/// Claves `UserDefaults` del juego (un solo lugar para migraciones y documentación).
enum GamePreferences {
    enum Keys {
        static let autoTickSeconds = "aw.game.autoTickSeconds"
        static let autoTickEnabled = "aw.game.autoTickEnabled"
        static let sfxEnabled = "aw.game.sfx.enabled"
        static let musicEnabled = "aw.game.music.enabled"
        static let musicVolume = "aw.game.music.volume"
    }
}

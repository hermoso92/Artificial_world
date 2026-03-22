import Foundation
import UIKit

/// Constantes de diseño del mundo V2 (documentación viva en código).
enum GameWorldBlueprint {
    /// iPhone y similares: celdas más grandes a la vista.
    static let gridSideCellsPhone: Int = 32
    /// iPad: más territorio sin obligar zoom todavía.
    static let gridSideCellsPad: Int = 64

    /// Lado del grid según el dispositivo actual (main thread recomendado; solo lee `UIDevice`).
    static func resolvedGridSideCells() -> Int {
        #if targetEnvironment(macCatalyst)
        return gridSideCellsPad
        #elseif os(iOS)
        switch UIDevice.current.userInterfaceIdiom {
        case .pad:
            return gridSideCellsPad
        case .phone, .unspecified:
            return gridSideCellsPhone
        case .tv, .carPlay, .mac, .vision:
            return gridSideCellsPad
        @unknown default:
            return gridSideCellsPhone
        }
        #else
        return gridSideCellsPhone
        #endif
    }

    /// Agentes con motor de utilidad en el mismo mapa.
    static let agentCount: Int = 6

    /// Semilla por defecto para `MapGenerator` (persistible en partidas).
    static let defaultWorldSeed: UInt64 = 0xC0FFEE_BAD_F00D

    /// Texto corto para onboarding / debug.
    static let pitch: String = """
    Un mapa compartido, \(agentCount) mentes por utilidad, vos elegís a cuál manejar en tiempo real. \
    El resto sigue autónomo en el mismo tick.
    """
}

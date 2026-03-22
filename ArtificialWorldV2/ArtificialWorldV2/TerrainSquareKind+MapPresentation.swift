import AWDomain
import Foundation
import SwiftUI

/// Estilo visual del terreno en mapa y leyenda (única fuente de verdad para colores).
extension TerrainSquareKind {
    /// Relleno de celda en `Canvas` y muestras de leyenda.
    var mapSwiftUIColor: Color {
        switch self {
        case .refuge:
            return .green.opacity(0.32)
        case .wildGrass:
            return .mint.opacity(0.28)
        case .denseForest:
            return .brown.opacity(0.38)
        case .rockOutcrop:
            return .gray.opacity(0.42)
        case .empty:
            return .gray.opacity(0.12)
        }
    }

    /// Título corto para la leyenda en partida (`Localizable.xcstrings`, tabla `Localizable`).
    var mapLegendTitle: String {
        switch self {
        case .refuge:
            String(localized: "terrain.legend.refuge", table: "Localizable", bundle: .main, locale: .current)
        case .wildGrass:
            String(localized: "terrain.legend.wild_grass", table: "Localizable", bundle: .main, locale: .current)
        case .denseForest:
            String(localized: "terrain.legend.dense_forest", table: "Localizable", bundle: .main, locale: .current)
        case .rockOutcrop:
            String(localized: "terrain.legend.rock_outcrop", table: "Localizable", bundle: .main, locale: .current)
        case .empty:
            String(localized: "terrain.legend.empty", table: "Localizable", bundle: .main, locale: .current)
        }
    }
}

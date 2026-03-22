import Foundation

/// Tipos de entidad “cuadrado” en dominio (presentación y spawn viven en la app).
public enum SquareArchetype: String, Sendable, Codable, CaseIterable {
    case common
    case fast
    case rare
    case hostile
    case nourishing

    public var scoreValue: Int {
        switch self {
        case .common: 10
        case .fast: 14
        case .rare: 22
        case .hostile: 24
        case .nourishing: 12
        }
    }

    /// Efecto al capturar (MVP).
    public var hungerDeltaOnCapture: Double {
        switch self {
        case .nourishing: -0.35
        case .common, .fast, .rare: -0.02
        case .hostile: 0
        }
    }
}

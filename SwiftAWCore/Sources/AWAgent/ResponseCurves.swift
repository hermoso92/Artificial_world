import Foundation

/// Curva de respuesta 1D en \([0, 1]\) → \([0, 1]\) para modular señales de utilidad (hambre, energía, etc.).
public enum ResponseCurve: Sendable, Equatable, Codable {
    case identity
    case smoothstep
    case power(exponent: Double)

    /// Evalúa la curva con entrada acotada a \([0, 1]\).
    public func evaluate(_ x: Double) -> Double {
        let t = min(1, max(0, x))
        switch self {
        case .identity:
            return t
        case .smoothstep:
            return t * t * (3 - 2 * t)
        case .power(let exponent):
            let e = max(0.000_001, exponent)
            return pow(t, e)
        }
    }
}

/// Pareja de curvas aplicadas al hambre y la energía al puntuar exploración vs captura.
public struct ExploringUtilityCurves: Sendable, Equatable, Codable {
    public var hunger: ResponseCurve
    public var energy: ResponseCurve

    public init(hunger: ResponseCurve, energy: ResponseCurve) {
        self.hunger = hunger
        self.energy = energy
    }

    public static let `default`: ExploringUtilityCurves = ExploringUtilityCurves(
        hunger: .identity,
        energy: .identity
    )
}

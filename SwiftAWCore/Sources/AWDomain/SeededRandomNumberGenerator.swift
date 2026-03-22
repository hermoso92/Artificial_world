import Foundation

/// Generador determinista (para mapas y pruebas). No criptográfico.
public struct SeededRandomNumberGenerator: RandomNumberGenerator, Sendable {
    private var state: UInt64

    public init(seed: UInt64) {
        self.state = seed == 0 ? 0xDEADBEEF_CAFEBABE : seed
    }

    public mutating func next() -> UInt64 {
        state &*= 636_413_622_384_679_3005
        state &+= 1_442_695_040_888_963_407
        return state
    }
}

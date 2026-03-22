import Foundation

/// Celda en el mundo discreto (origen arriba-izquierda, +y hacia abajo).
public struct GridCoord: Hashable, Sendable, Codable {
    public var x: Int
    public var y: Int

    public init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }

    public func manhattan(to other: GridCoord) -> Int {
        abs(x - other.x) + abs(y - other.y)
    }

    public func offset(dx: Int, dy: Int) -> GridCoord {
        GridCoord(x: x + dx, y: y + dy)
    }

    public static let refugeOrigin = GridCoord(x: 0, y: 0)

    public static let cardinalOffsets: [(Int, Int)] = [(1, 0), (-1, 0), (0, 1), (0, -1)]
}

import Foundation

/// Matriz `side × side` de terreno (fila mayor = y, columna = x).
public struct GridMap: Equatable, Sendable, Codable {
    public let side: Int
    private var cells: [TerrainSquareKind]

    public init(side: Int, cells: [TerrainSquareKind]) {
        precondition(side > 0)
        precondition(cells.count == side * side)
        self.side = side
        self.cells = cells
    }

    public subscript(coord: GridCoord) -> TerrainSquareKind? {
        guard coord.x >= 0, coord.y >= 0, coord.x < side, coord.y < side else { return nil }
        return cells[coord.y * side + coord.x]
    }

    /// Reemplaza una celda (útil para refugio garantizado).
    public mutating func set(_ kind: TerrainSquareKind, at coord: GridCoord) {
        guard coord.x >= 0, coord.y >= 0, coord.x < side, coord.y < side else { return }
        cells[coord.y * side + coord.x] = kind
    }

    /// Fila mayor: y0, y1, … — para persistencia estable.
    public var flattenedTerrainRawValues: [String] {
        cells.map(\.rawValue)
    }

    public static func fromFlattened(side: Int, rawValues: [String]) throws -> GridMap {
        guard rawValues.count == side * side else {
            throw GridMapDecodeError.countMismatch
        }
        var kinds: [TerrainSquareKind] = []
        kinds.reserveCapacity(rawValues.count)
        for s in rawValues {
            guard let k = TerrainSquareKind(rawValue: s) else {
                throw GridMapDecodeError.unknownTerrain(s)
            }
            kinds.append(k)
        }
        return GridMap(side: side, cells: kinds)
    }
}

public enum GridMapDecodeError: Error, Sendable {
    case countMismatch
    case unknownTerrain(String)
}

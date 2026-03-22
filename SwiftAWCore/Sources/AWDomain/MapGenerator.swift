import Foundation

/// Generación procedural de terreno por semilla y perfil de bioma.
public enum MapGenerator {
    /// Rellena el mapa con mezcla centrada en `profile.dominantTerrain`; `(0,0)` queda refugio.
    public static func generate(side: Int, seed: UInt64, profile: TerrainBiomeDefinition) -> GridMap {
        let s = max(8, min(128, side))
        var gen = SeededRandomNumberGenerator(seed: seed)
        var cells: [TerrainSquareKind] = []
        cells.reserveCapacity(s * s)

        let dominant = profile.dominantTerrain
        let mix: [TerrainSquareKind] = [.wildGrass, .denseForest, .rockOutcrop, .empty]

        for y in 0 ..< s {
            for x in 0 ..< s {
                let coord = GridCoord(x: x, y: y)
                if coord == .refugeOrigin {
                    cells.append(.refuge)
                    continue
                }
                let roll = Double.random(in: 0 ... 1, using: &gen)
                if roll < 0.62 {
                    cells.append(dominant)
                } else if roll < 0.78 {
                    cells.append(mix.randomElement(using: &gen) ?? .empty)
                } else if roll < 0.9 {
                    cells.append(mix.filter { $0 != dominant }.randomElement(using: &gen) ?? .empty)
                } else {
                    cells.append(.empty)
                }
            }
        }

        var map = GridMap(side: s, cells: cells)
        map.set(.refuge, at: .refugeOrigin)
        return map
    }
}

import Foundation

/// Generación procedural de terreno por semilla y perfil de bioma.
public enum MapGenerator {
    /// Celdas refugio repartidas sin solaparse (determinista por semilla).
    public static func uniqueRefugeCoordinates(side: Int, count: Int, seed: UInt64) -> [GridCoord] {
        let s = max(8, min(128, side))
        let n = max(1, count)
        let margin = max(2, min(5, s / 12))
        var gen = SeededRandomNumberGenerator(seed: seed &+ UInt64(n) &* 0x9E37_79B9)
        var used = Set<GridCoord>()
        var result: [GridCoord] = []
        var attempts = 0
        let maxAttempts = n * 500
        while result.count < n, attempts < maxAttempts {
            attempts += 1
            let x = Int.random(in: margin ... (s - 1 - margin), using: &gen)
            let y = Int.random(in: margin ... (s - 1 - margin), using: &gen)
            let p = GridCoord(x: x, y: y)
            if used.insert(p).inserted {
                result.append(p)
            }
        }
        // Rejilla de respaldo si el azar no alcanzó (mapas chicos / muchos agentes).
        var gx = margin
        var gy = margin
        while result.count < n {
            let p = GridCoord(x: gx, y: gy)
            if used.insert(p).inserted {
                result.append(p)
            }
            gx += 3
            if gx > s - 1 - margin {
                gx = margin
                gy += 3
            }
            if gy > s - 1 - margin {
                break
            }
        }
        return result
    }

    /// Rellena el mapa; cada coordenada en `refugeCoordinates` queda como `.refuge`.
    public static func generate(
        side: Int,
        seed: UInt64,
        profile: TerrainBiomeDefinition,
        refugeCoordinates: Set<GridCoord>
    ) -> GridMap {
        let s = max(8, min(128, side))
        var gen = SeededRandomNumberGenerator(seed: seed)
        var cells: [TerrainSquareKind] = []
        cells.reserveCapacity(s * s)

        let dominant = profile.dominantTerrain
        let mix: [TerrainSquareKind] = [.wildGrass, .denseForest, .rockOutcrop, .empty]

        for y in 0 ..< s {
            for x in 0 ..< s {
                let coord = GridCoord(x: x, y: y)
                if refugeCoordinates.contains(coord) {
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
        for c in refugeCoordinates where c.x >= 0 && c.y >= 0 && c.x < s && c.y < s {
            map.set(.refuge, at: c)
        }
        return map
    }

    /// Compatibilidad: un solo refugio en `(0,0)`.
    public static func generate(side: Int, seed: UInt64, profile: TerrainBiomeDefinition) -> GridMap {
        generate(side: side, seed: seed, profile: profile, refugeCoordinates: Set(arrayLiteral: GridCoord.refugeOrigin))
    }
}

import AWAgent
import AWDomain
import Foundation

// MARK: - RNG serializable (sesión; no reemplaza CSPRNG del sistema para cripto)

/// Generador determinista de 64 bits con estado único persistible (SplitMix64).
public struct PersistableSplitMix64: RandomNumberGenerator, Sendable {
    public private(set) var state: UInt64

    public init(state: UInt64) {
        self.state = state == 0 ? 0xD1CE_04D0_D1CE_04D0 : state
    }

    public init(seed: UInt64) {
        let s = seed == 0 ? GameWorldBlueprint.defaultWorldSeed : seed
        self.state = s
    }

    public mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

/// Snapshot serializable de una partida completa.
public struct WorldSaveData: Codable, Sendable {
    /// Esquema actual al guardar (v2: `rngState` opcional en JSON).
    public static let currentSchemaVersion: Int = 2

    public var schemaVersion: Int
    public var worldTick: UInt64
    public var gridSide: Int
    public var worldSeed: UInt64
    /// Terreno en orden fila mayor (y, x); `nil` en guardados v1 → se regenera con `worldSeed`.
    public var terrainCellRawValues: [String]?
    public var agents: [AgentSnapshot]
    public var controlledAgentID: UUID
    public var controlMode: PlayerControlMode
    public var refugeImprovements: RefugeImprovements
    public var savedAt: Date
    /// Estado del RNG de sesión; ausente en guardados antiguos → se deriva de `worldSeed` + `worldTick` al cargar.
    public var rngState: UInt64?

    enum CodingKeys: String, CodingKey {
        case schemaVersion, worldTick, gridSide, worldSeed, terrainCellRawValues
        case agents, controlledAgentID, controlMode, refugeImprovements, savedAt
        case rngState
    }

    public init(
        schemaVersion: Int = WorldSaveData.currentSchemaVersion,
        worldTick: UInt64,
        gridSide: Int,
        worldSeed: UInt64,
        terrainCellRawValues: [String]?,
        agents: [AgentSnapshot],
        controlledAgentID: UUID,
        controlMode: PlayerControlMode,
        refugeImprovements: RefugeImprovements = RefugeImprovements(),
        savedAt: Date = Date(),
        rngState: UInt64? = nil
    ) {
        self.schemaVersion = schemaVersion
        self.worldTick = worldTick
        self.gridSide = gridSide
        self.worldSeed = worldSeed
        self.terrainCellRawValues = terrainCellRawValues
        self.agents = agents
        self.controlledAgentID = controlledAgentID
        self.controlMode = controlMode
        self.refugeImprovements = refugeImprovements
        self.savedAt = savedAt
        self.rngState = rngState
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        schemaVersion = try c.decodeIfPresent(Int.self, forKey: .schemaVersion) ?? 1
        worldTick = try c.decode(UInt64.self, forKey: .worldTick)
        gridSide = try c.decode(Int.self, forKey: .gridSide)
        worldSeed = try c.decodeIfPresent(UInt64.self, forKey: .worldSeed) ?? GameWorldBlueprint.defaultWorldSeed
        terrainCellRawValues = try c.decodeIfPresent([String].self, forKey: .terrainCellRawValues)
        agents = try c.decode([AgentSnapshot].self, forKey: .agents)
        controlledAgentID = try c.decode(UUID.self, forKey: .controlledAgentID)
        controlMode = try c.decode(PlayerControlMode.self, forKey: .controlMode)
        refugeImprovements = try c.decodeIfPresent(RefugeImprovements.self, forKey: .refugeImprovements) ?? RefugeImprovements()
        savedAt = try c.decodeIfPresent(Date.self, forKey: .savedAt) ?? Date()
        rngState = try c.decodeIfPresent(UInt64.self, forKey: .rngState)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(schemaVersion, forKey: .schemaVersion)
        try c.encode(worldTick, forKey: .worldTick)
        try c.encode(gridSide, forKey: .gridSide)
        try c.encode(worldSeed, forKey: .worldSeed)
        try c.encodeIfPresent(terrainCellRawValues, forKey: .terrainCellRawValues)
        try c.encode(agents, forKey: .agents)
        try c.encode(controlledAgentID, forKey: .controlledAgentID)
        try c.encode(controlMode, forKey: .controlMode)
        try c.encode(refugeImprovements, forKey: .refugeImprovements)
        try c.encode(savedAt, forKey: .savedAt)
        try c.encodeIfPresent(rngState, forKey: .rngState)
    }

    /// Estado RNG de sesión cuando el archivo no incluye `rngState` (p. ej. schema 1).
    public static func inferredSessionRngState(worldSeed: UInt64, worldTick: UInt64) -> UInt64 {
        let seed = worldSeed == 0 ? GameWorldBlueprint.defaultWorldSeed : worldSeed
        var x = seed ^ (worldTick &* 0x5851_F42F_4C95_7F7D | 1)
        if x == 0 { x = 0xDEAD_BEEF_CAFE_BABE }
        return x
    }
}

/// Snapshot de un agente individual.
public struct AgentSnapshot: Codable, Sendable, Identifiable {
    public var id: UUID
    public var displayName: String
    public var positionX: Int
    public var positionY: Int
    public var vitals: SurvivalVitals
    public var inventory: InventoryState
    public var hue: Double

    public init(
        id: UUID,
        displayName: String,
        positionX: Int,
        positionY: Int,
        vitals: SurvivalVitals,
        inventory: InventoryState,
        hue: Double
    ) {
        self.id = id
        self.displayName = displayName
        self.positionX = positionX
        self.positionY = positionY
        self.vitals = vitals
        self.inventory = inventory
        self.hue = hue
    }
}

/// Motor de guardado/carga de partidas (JSON en disco).
public enum WorldPersistenceEngine {

    /// Si se asigna (p. ej. directorio temporal en tests), sustituye el directorio por defecto en sandbox.
    public static var savesDirectoryOverride: URL?

    /// Directorio de guardados.
    private static var savesDirectory: URL {
        if let override = savesDirectoryOverride {
            return override
        }
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("ArtificialWorldSaves", isDirectory: true)
    }

    /// Asegura que existe el directorio de guardados.
    private static func ensureSavesDirectory() throws {
        let fm = FileManager.default
        if !fm.fileExists(atPath: savesDirectory.path) {
            try fm.createDirectory(at: savesDirectory, withIntermediateDirectories: true)
        }
    }

    /// Guarda una partida con un nombre específico.
    public static func save(_ data: WorldSaveData, name: String) throws {
        try ensureSavesDirectory()
        let filename = "\(name).awsave"
        let fileURL = savesDirectory.appendingPathComponent(filename)

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        let jsonData = try encoder.encode(data)
        try jsonData.write(to: fileURL, options: [.atomic])
    }

    /// Carga una partida por nombre.
    public static func load(name: String) throws -> WorldSaveData {
        try ensureSavesDirectory()
        let filename = "\(name).awsave"
        let fileURL = savesDirectory.appendingPathComponent(filename)

        let jsonData = try Data(contentsOf: fileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        return try decoder.decode(WorldSaveData.self, from: jsonData)
    }

    /// Lista todos los guardados disponibles.
    public static func listSaves() throws -> [String] {
        try ensureSavesDirectory()
        let fm = FileManager.default
        let files = try fm.contentsOfDirectory(at: savesDirectory, includingPropertiesForKeys: nil)
        return files
            .filter { $0.pathExtension == "awsave" }
            .map { $0.deletingPathExtension().lastPathComponent }
            .sorted()
    }

    /// Elimina un guardado.
    public static func delete(name: String) throws {
        let filename = "\(name).awsave"
        let fileURL = savesDirectory.appendingPathComponent(filename)
        try FileManager.default.removeItem(at: fileURL)
    }

    /// Guardado rápido por defecto (autosave).
    public static func quickSave(_ data: WorldSaveData) throws {
        try save(data, name: "autosave")
    }

    /// Carga rápida por defecto.
    public static func quickLoad() throws -> WorldSaveData {
        try load(name: "autosave")
    }
}

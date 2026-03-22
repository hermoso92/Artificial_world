import Foundation

/// Identidad multi-tenant futura (filtro servidor); hoy opcional en el cliente.
public struct TenantContext: Equatable, Sendable, Codable {
    public var organizationId: String?
    public var worldId: String?

    public init(organizationId: String? = nil, worldId: String? = nil) {
        self.organizationId = organizationId
        self.worldId = worldId
    }
}

/// Tipos de evento locales (extensibles sin romper columnas: se guarda `rawValue`).
public enum TelemetryKind: String, Sendable, Codable, CaseIterable {
    case captureSuccess
    case refugeEnter
    case refugeExit
    case sessionReset
    case unknown
}

/// Evento serializable dentro de un lote de sync.
public struct TelemetryEventDTO: Equatable, Sendable, Codable {
    public var localRowId: String
    public var kind: String
    public var metadata: [String: String]
    public var createdAt: Date

    public init(localRowId: String, kind: String, metadata: [String: String], createdAt: Date) {
        self.localRowId = localRowId
        self.kind = kind
        self.metadata = metadata
        self.createdAt = createdAt
    }
}

/// Sobre versionado para POST futuro (`Content-Type: application/json`). `schemaVersion` rompe compatibilidad a propósito.
public struct SyncEnvelopeV1: Equatable, Sendable, Codable {
    public static let currentSchemaVersion = 1

    public var schemaVersion: Int
    public var organizationId: String?
    public var worldId: String?
    public var worldSeed: UInt64
    public var deviceInstallationId: String
    public var emittedAt: Date
    public var events: [TelemetryEventDTO]

    public init(
        schemaVersion: Int = Self.currentSchemaVersion,
        organizationId: String?,
        worldId: String?,
        worldSeed: UInt64,
        deviceInstallationId: String,
        emittedAt: Date = .now,
        events: [TelemetryEventDTO]
    ) {
        self.schemaVersion = schemaVersion
        self.organizationId = organizationId
        self.worldId = worldId
        self.worldSeed = worldSeed
        self.deviceInstallationId = deviceInstallationId
        self.emittedAt = emittedAt
        self.events = events
    }

    /// Codifica JSON estable para depuración o cuerpo HTTP.
    public func encodedJSON() throws -> Data {
        let enc = JSONEncoder()
        enc.dateEncodingStrategy = .iso8601
        enc.outputFormatting = [.sortedKeys]
        return try enc.encode(self)
    }
}

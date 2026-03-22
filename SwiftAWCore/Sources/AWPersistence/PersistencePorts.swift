import AWDomain
import Foundation

/// Contratos de repositorio (implementaciones SQLite/Core Data en Fase 3).
public protocol WorldSnapshotStoring: Sendable {
    func loadMetadata() throws -> WorldSnapshotMetadata?
    func save(metadata: WorldSnapshotMetadata) throws
}

public protocol PlayerProfileStoring: Sendable {
    func loadVitals() throws -> SurvivalVitals?
    func save(vitals: SurvivalVitals) throws
}

public protocol AgentMemoryStoring: Sendable {
    func loadSummary() throws -> AgentMemorySummary?
    func save(summary: AgentMemorySummary) throws
}

public protocol InventoryStoring: Sendable {
    func loadInventory() throws -> InventoryState?
    func save(inventory: InventoryState) throws
}

public protocol RefugeImprovementsStoring: Sendable {
    func loadImprovements() throws -> RefugeImprovements?
    func save(improvements: RefugeImprovements) throws
}

/// Cola append-only; el envío HTTP es responsabilidad de la app (Fase 4+).
public protocol TelemetryOutboxStoring: Sendable {
    func appendTelemetry(kind: TelemetryKind, metadata: [String: String], createdAt: Date) throws -> Int64
    func loadPendingTelemetry(limit: Int) throws -> [TelemetryOutboxRow]
    func markTelemetrySent(rowIds: [Int64]) throws
    func pendingTelemetryCount() throws -> Int
}

public struct TelemetryOutboxRow: Equatable, Sendable {
    public var id: Int64
    public var kind: TelemetryKind
    public var metadata: [String: String]
    public var createdAt: Date

    public init(id: Int64, kind: TelemetryKind, metadata: [String: String], createdAt: Date) {
        self.id = id
        self.kind = kind
        self.metadata = metadata
        self.createdAt = createdAt
    }
}

import AWDomain
import Foundation
import SQLite3

/// Error genérico de la capa SQLite local (sin dependencias externas).
public enum SQLiteStoreError: Error, Sendable, Equatable {
    case openFailed(String)
    case execFailed(String)
    case prepareFailed(String)
    case stepFailed(String)
}

/// Implementación concreta de los repositorios del vertical slice (un solo fichero `.sqlite`).
public final class SQLiteArtificialWorldStore: @unchecked Sendable {
    private let lock = NSLock()
    private var db: OpaquePointer?

    public init(path: String) throws {
        try open(path: path)
        try migrate()
    }

    deinit {
        lock.lock()
        if let handle = db {
            sqlite3_close(handle)
            db = nil
        }
        lock.unlock()
    }

    private func open(path: String) throws {
        var handle: OpaquePointer?
        let flags = SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX
        let rc = sqlite3_open_v2(path, &handle, flags, nil)
        guard rc == SQLITE_OK, let h = handle else {
            let msg = handle.map { String(cString: sqlite3_errmsg($0)) } ?? "sqlite3_open_v2 failed"
            if let failed = handle { sqlite3_close(failed) }
            throw SQLiteStoreError.openFailed(msg)
        }
        db = h
        sqlite3_busy_timeout(h, 5_000)
    }

    private func migrate() throws {
        try exec(
            """
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS world_metadata (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              schema_version INTEGER NOT NULL,
              world_seed TEXT NOT NULL,
              saved_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS player_vitals (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              energy REAL NOT NULL,
              hunger REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS agent_memory (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              last_refuge_exit_tick INTEGER NOT NULL,
              notable_events_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS inventory_state (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              fiber_scraps INTEGER NOT NULL,
              nutrient_packets INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS refuge_improvements (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              rest_efficiency_rank INTEGER NOT NULL,
              storage_rank INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS telemetry_outbox (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              kind TEXT NOT NULL,
              metadata_json TEXT NOT NULL,
              created_at REAL NOT NULL,
              send_state INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_telemetry_outbox_pending ON telemetry_outbox (send_state, id);
            """
        )
    }

    private func exec(_ sql: String) throws {
        lock.lock()
        defer { lock.unlock() }
        guard let db else { throw SQLiteStoreError.execFailed("closed") }
        var err: UnsafeMutablePointer<CChar>?
        let rc = sqlite3_exec(db, sql, nil, nil, &err)
        if rc != SQLITE_OK {
            let msg = err.map { String(cString: $0) } ?? String(cString: sqlite3_errmsg(db))
            sqlite3_free(err)
            throw SQLiteStoreError.execFailed(msg)
        }
    }

    private func withStatement<T>(_ sql: String, _ body: (OpaquePointer, OpaquePointer?) throws -> T) throws -> T {
        lock.lock()
        defer { lock.unlock() }
        guard let db else { throw SQLiteStoreError.prepareFailed("closed") }
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK, let s = stmt else {
            throw SQLiteStoreError.prepareFailed(String(cString: sqlite3_errmsg(db)))
        }
        defer { sqlite3_finalize(s) }
        return try body(db, s)
    }
}

// MARK: - WorldSnapshotStoring

extension SQLiteArtificialWorldStore: WorldSnapshotStoring {
    public func loadMetadata() throws -> WorldSnapshotMetadata? {
        try withStatement("SELECT schema_version, world_seed, saved_at FROM world_metadata WHERE id = 1;") { _, stmt in
            guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
            let version = Int(sqlite3_column_int(stmt, 0))
            let seedStr = String(cString: sqlite3_column_text(stmt, 1))
            let savedAt = Date(timeIntervalSince1970: sqlite3_column_double(stmt, 2))
            guard let seed = UInt64(seedStr) else { return nil }
            return WorldSnapshotMetadata(schemaVersion: version, worldSeed: seed, savedAt: savedAt)
        }
    }

    public func save(metadata: WorldSnapshotMetadata) throws {
        try withStatement(
            """
            INSERT INTO world_metadata (id, schema_version, world_seed, saved_at)
            VALUES (1, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              schema_version = excluded.schema_version,
              world_seed = excluded.world_seed,
              saved_at = excluded.saved_at;
            """
        ) { db, stmt in
            sqlite3_bind_int(stmt, 1, Int32(metadata.schemaVersion))
            let seedStr = String(metadata.worldSeed)
            sqlite3_bind_text(stmt, 2, seedStr, -1, SQLITE_TRANSIENT)
            sqlite3_bind_double(stmt, 3, metadata.savedAt.timeIntervalSince1970)
            guard sqlite3_step(stmt) == SQLITE_DONE else {
                throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
            }
        }
    }
}

// MARK: - PlayerProfileStoring

extension SQLiteArtificialWorldStore: PlayerProfileStoring {
    public func loadVitals() throws -> SurvivalVitals? {
        try withStatement("SELECT energy, hunger FROM player_vitals WHERE id = 1;") { _, stmt in
            guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
            let e = sqlite3_column_double(stmt, 0)
            let h = sqlite3_column_double(stmt, 1)
            return SurvivalVitals(energy: e, hunger: h)
        }
    }

    public func save(vitals: SurvivalVitals) throws {
        try withStatement(
            """
            INSERT INTO player_vitals (id, energy, hunger) VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET energy = excluded.energy, hunger = excluded.hunger;
            """
        ) { db, stmt in
            sqlite3_bind_double(stmt, 1, vitals.energy)
            sqlite3_bind_double(stmt, 2, vitals.hunger)
            guard sqlite3_step(stmt) == SQLITE_DONE else {
                throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
            }
        }
    }
}

// MARK: - AgentMemoryStoring

extension SQLiteArtificialWorldStore: AgentMemoryStoring {
    public func loadSummary() throws -> AgentMemorySummary? {
        try withStatement(
            "SELECT last_refuge_exit_tick, notable_events_json FROM agent_memory WHERE id = 1;"
        ) { _, stmt in
            guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
            let tick = UInt64(sqlite3_column_int64(stmt, 0))
            let jsonData = String(cString: sqlite3_column_text(stmt, 1)).data(using: .utf8) ?? Data()
            let events = (try? JSONDecoder().decode([String].self, from: jsonData)) ?? []
            return AgentMemorySummary(lastRefugeExitTick: tick, notableEvents: events)
        }
    }

    public func save(summary: AgentMemorySummary) throws {
        let json = try JSONEncoder().encode(summary.notableEvents)
        let jsonStr = String(data: json, encoding: .utf8) ?? "[]"
        try withStatement(
            """
            INSERT INTO agent_memory (id, last_refuge_exit_tick, notable_events_json)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              last_refuge_exit_tick = excluded.last_refuge_exit_tick,
              notable_events_json = excluded.notable_events_json;
            """
        ) { db, stmt in
            sqlite3_bind_int64(stmt, 1, Int64(summary.lastRefugeExitTick))
            sqlite3_bind_text(stmt, 2, jsonStr, -1, SQLITE_TRANSIENT)
            guard sqlite3_step(stmt) == SQLITE_DONE else {
                throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
            }
        }
    }
}

// MARK: - InventoryStoring

extension SQLiteArtificialWorldStore: InventoryStoring {
    public func loadInventory() throws -> InventoryState? {
        try withStatement("SELECT fiber_scraps, nutrient_packets FROM inventory_state WHERE id = 1;") { _, stmt in
            guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
            let f = Int(sqlite3_column_int(stmt, 0))
            let n = Int(sqlite3_column_int(stmt, 1))
            return InventoryState(fiberScraps: f, nutrientPackets: n)
        }
    }

    public func save(inventory: InventoryState) throws {
        try withStatement(
            """
            INSERT INTO inventory_state (id, fiber_scraps, nutrient_packets) VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              fiber_scraps = excluded.fiber_scraps,
              nutrient_packets = excluded.nutrient_packets;
            """
        ) { db, stmt in
            sqlite3_bind_int(stmt, 1, Int32(inventory.fiberScraps))
            sqlite3_bind_int(stmt, 2, Int32(inventory.nutrientPackets))
            guard sqlite3_step(stmt) == SQLITE_DONE else {
                throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
            }
        }
    }
}

// MARK: - RefugeImprovementsStoring

extension SQLiteArtificialWorldStore: RefugeImprovementsStoring {
    public func loadImprovements() throws -> RefugeImprovements? {
        try withStatement(
            "SELECT rest_efficiency_rank, storage_rank FROM refuge_improvements WHERE id = 1;"
        ) { _, stmt in
            guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
            let r = Int(sqlite3_column_int(stmt, 0))
            let s = Int(sqlite3_column_int(stmt, 1))
            return RefugeImprovements(restEfficiencyRank: r, storageRank: s)
        }
    }

    public func save(improvements: RefugeImprovements) throws {
        try withStatement(
            """
            INSERT INTO refuge_improvements (id, rest_efficiency_rank, storage_rank) VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              rest_efficiency_rank = excluded.rest_efficiency_rank,
              storage_rank = excluded.storage_rank;
            """
        ) { db, stmt in
            sqlite3_bind_int(stmt, 1, Int32(improvements.restEfficiencyRank))
            sqlite3_bind_int(stmt, 2, Int32(improvements.storageRank))
            guard sqlite3_step(stmt) == SQLITE_DONE else {
                throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
            }
        }
    }
}

// MARK: - TelemetryOutboxStoring

extension SQLiteArtificialWorldStore: TelemetryOutboxStoring {
    public func appendTelemetry(kind: TelemetryKind, metadata: [String: String], createdAt: Date) throws -> Int64 {
        let jsonStr: String
        if metadata.isEmpty {
            jsonStr = "{}"
        } else {
            let data = try JSONEncoder().encode(metadata)
            jsonStr = String(data: data, encoding: .utf8) ?? "{}"
        }
        return try withStatement(
            """
            INSERT INTO telemetry_outbox (kind, metadata_json, created_at, send_state)
            VALUES (?, ?, ?, 0);
            """
        ) { db, stmt in
            sqlite3_bind_text(stmt, 1, kind.rawValue, -1, SQLITE_TRANSIENT)
            sqlite3_bind_text(stmt, 2, jsonStr, -1, SQLITE_TRANSIENT)
            sqlite3_bind_double(stmt, 3, createdAt.timeIntervalSince1970)
            guard sqlite3_step(stmt) == SQLITE_DONE else {
                throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
            }
            return sqlite3_last_insert_rowid(db)
        }
    }

    public func loadPendingTelemetry(limit: Int) throws -> [TelemetryOutboxRow] {
        let cap = max(1, min(limit, 500))
        return try withStatement(
            """
            SELECT id, kind, metadata_json, created_at FROM telemetry_outbox
            WHERE send_state = 0 ORDER BY id ASC LIMIT ?;
            """
        ) { _, stmt in
            sqlite3_bind_int(stmt, 1, Int32(cap))
            var rows: [TelemetryOutboxRow] = []
            while sqlite3_step(stmt) == SQLITE_ROW {
                let id = sqlite3_column_int64(stmt, 0)
                let kindStr = String(cString: sqlite3_column_text(stmt, 1))
                let metaJson = String(cString: sqlite3_column_text(stmt, 2))
                let createdAt = Date(timeIntervalSince1970: sqlite3_column_double(stmt, 3))
                let metaData = metaJson.data(using: .utf8) ?? Data()
                let meta = (try? JSONDecoder().decode([String: String].self, from: metaData)) ?? [:]
                let k = TelemetryKind(rawValue: kindStr) ?? .unknown
                rows.append(TelemetryOutboxRow(id: id, kind: k, metadata: meta, createdAt: createdAt))
            }
            return rows
        }
    }

    public func markTelemetrySent(rowIds: [Int64]) throws {
        for rid in rowIds {
            try withStatement("UPDATE telemetry_outbox SET send_state = 1 WHERE id = ?;") { db, stmt in
                sqlite3_bind_int64(stmt, 1, rid)
                guard sqlite3_step(stmt) == SQLITE_DONE else {
                    throw SQLiteStoreError.stepFailed(String(cString: sqlite3_errmsg(db)))
                }
            }
        }
    }

    public func pendingTelemetryCount() throws -> Int {
        try withStatement("SELECT COUNT(*) FROM telemetry_outbox WHERE send_state = 0;") { _, stmt in
            guard sqlite3_step(stmt) == SQLITE_ROW else { return 0 }
            return Int(sqlite3_column_int(stmt, 0))
        }
    }

    /// Construye un lote listo para `POST` futuro (no marca enviado).
    public func buildSyncEnvelopeV1(
        pendingLimit: Int,
        worldSeed: UInt64,
        tenant: TenantContext,
        deviceInstallationId: String,
        emittedAt: Date = .now
    ) throws -> SyncEnvelopeV1 {
        let rows = try loadPendingTelemetry(limit: pendingLimit)
        let events = rows.map { row in
            TelemetryEventDTO(
                localRowId: String(row.id),
                kind: row.kind.rawValue,
                metadata: row.metadata,
                createdAt: row.createdAt
            )
        }
        return SyncEnvelopeV1(
            organizationId: tenant.organizationId,
            worldId: tenant.worldId,
            worldSeed: worldSeed,
            deviceInstallationId: deviceInstallationId,
            emittedAt: emittedAt,
            events: events
        )
    }
}

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
